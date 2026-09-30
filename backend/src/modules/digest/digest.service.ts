import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/AppError.js";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "../../utils/unsubscribeToken.js";
import { sendEmail } from "../mail/mail.service.js";
import { followUpDueWhere } from "../applications/application.filters.js";
import { buildDigestEmail } from "./digest.email.js";

// Weekly, with a day of slack so a scheduler that fires a little early or late
// one week doesn't make a user skip a whole cycle.
const DIGEST_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000;
// Upper bound on emails per invocation so one request can't run for minutes;
// the scheduler simply calls again while `hasMore` is true.
const MAX_USERS_PER_RUN = 100;
const MAX_ITEMS_PER_EMAIL = 10;

export type DigestRunResult = {
  considered: number;
  sent: number;
  skipped: number;
  failed: number;
  hasMore: boolean;
};

export async function runWeeklyDigest(now = new Date()): Promise<DigestRunResult> {
  const cutoff = new Date(now.getTime() - DIGEST_INTERVAL_MS);
  const notRecentlySent: Prisma.UserWhereInput = {
    OR: [{ lastDigestSentAt: null }, { lastDigestSentAt: { lt: cutoff } }],
  };
  const due = followUpDueWhere(now);

  // Verified, opted in, not mailed this week, and with something actually
  // overdue. Terminal statuses (OFFER/REJECTED) are excluded by `due`.
  const candidates = await prisma.user.findMany({
    where: {
      emailVerifiedAt: { not: null },
      emailDigestEnabled: true,
      ...notRecentlySent,
      applications: { some: due },
    },
    select: { id: true, email: true, lastDigestSentAt: true },
    orderBy: { id: "asc" },
    take: MAX_USERS_PER_RUN + 1,
  });

  const batch = candidates.slice(0, MAX_USERS_PER_RUN);
  const result: DigestRunResult = {
    considered: batch.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    hasMore: candidates.length > MAX_USERS_PER_RUN,
  };

  for (const user of batch) {
    // Claim the user before sending. The conditional update is atomic, so if
    // two runs overlap only one wins and the other skips: no double emails.
    const claim = await prisma.user.updateMany({
      where: { id: user.id, emailDigestEnabled: true, ...notRecentlySent },
      data: { lastDigestSentAt: now },
    });
    if (claim.count === 0) {
      result.skipped++;
      continue;
    }

    const release = () =>
      prisma.user.updateMany({
        where: { id: user.id, lastDigestSentAt: now },
        data: { lastDigestSentAt: user.lastDigestSentAt },
      });

    try {
      const where = { userId: user.id, ...due };
      const [total, items] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.findMany({
          where,
          orderBy: [{ followUpDate: "asc" }, { id: "asc" }],
          take: MAX_ITEMS_PER_EMAIL,
          select: { id: true, companyName: true, role: true, followUpDate: true },
        }),
      ]);

      if (total === 0) {
        // Resolved between the candidate query and now; nothing to send.
        await release();
        result.skipped++;
        continue;
      }

      const token = createUnsubscribeToken(user.id);
      const unsubscribeUrl = `${env.FRONTEND_URL}/unsubscribe?token=${token}`;
      const { subject, html } = buildDigestEmail({
        items: items.map((i) => ({ ...i, followUpDate: i.followUpDate! })),
        total,
        unsubscribeUrl,
        now,
      });

      await sendEmail({
        to: user.email,
        subject,
        html,
        ...(env.API_URL && {
          headers: {
            "List-Unsubscribe": `<${env.API_URL}/api/v1/digest/unsubscribe?token=${token}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
      result.sent++;

      // The email is already out, so a failure here must not undo the claim
      // (that would re-send next run); it only costs a timeline entry.
      try {
        await prisma.applicationActivity.createMany({
          data: items.map((i) => ({ applicationId: i.id, userId: user.id, type: "FOLLOW_UP_REMINDER_SENT" as const })),
        });
      } catch (err) {
        logger.warn({ err, userId: user.id }, "Digest sent but timeline entries failed");
      }
    } catch (err) {
      // Send (or read) failed: hand the claim back so the next run retries.
      logger.warn({ err, userId: user.id }, "Digest failed for user, will retry next run");
      await release().catch((releaseErr) => logger.error({ err: releaseErr, userId: user.id }, "Could not release digest claim"));
      result.failed++;
    }
  }

  logger.info(result, "Weekly digest run finished");
  return result;
}

export async function unsubscribeWithToken(token: string) {
  const userId = verifyUnsubscribeToken(token);
  if (!userId) throw new AppError("Invalid unsubscribe link", 400, "INVALID_UNSUBSCRIBE_TOKEN");

  // updateMany: idempotent, and a valid token for a since-deleted user is a no-op.
  await prisma.user.updateMany({ where: { id: userId }, data: { emailDigestEnabled: false } });
  return { success: true };
}

export async function getPreferences(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailDigestEnabled: true } });
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  return user;
}

export async function setPreferences(userId: string, emailDigestEnabled: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { emailDigestEnabled }, select: { emailDigestEnabled: true } });
}
