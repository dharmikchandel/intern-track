import type { ActivityType, Application, Prisma } from "@prisma/client";

export type ActivityDraft = {
  type: ActivityType;
  metadata?: Prisma.InputJsonValue;
};

const iso = (d: Date | null) => (d ? d.toISOString() : null);

// Compares the stored application with an incoming PATCH body and returns one
// event per field that actually changed. Sending an unchanged value (the edit
// form always submits every field) must not create noise in the feed.
export function diffActivities(
  existing: Application,
  data: { status?: string; notes?: string | null; followUpDate?: string | null }
): ActivityDraft[] {
  const events: ActivityDraft[] = [];

  if (data.status !== undefined && data.status !== existing.status) {
    events.push({
      type: "STATUS_CHANGED",
      metadata: { from: existing.status, to: data.status },
    });
  }

  // Empty string and null both mean "no notes". The note text itself is never
  // copied into the feed: it can be long and private.
  if (data.notes !== undefined && (data.notes ?? "") !== (existing.notes ?? "")) {
    events.push({ type: "NOTES_CHANGED" });
  }

  if (data.followUpDate !== undefined) {
    const next = data.followUpDate === null ? null : new Date(data.followUpDate);
    if (iso(next) !== iso(existing.followUpDate)) {
      events.push({
        type: "FOLLOW_UP_CHANGED",
        metadata: { from: iso(existing.followUpDate), to: iso(next) },
      });
    }
  }

  return events;
}
