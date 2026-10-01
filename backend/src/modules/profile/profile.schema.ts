import { z } from "zod";
import { isValidTimeZone } from "../../utils/timezone.js";

// No control characters; the app shows this text as-is.
const hasNoControlChars = (s: string) => ![...s].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127);

export const updateProfileSchema = z
  .object({
    // null or "" clears it (the app falls back to the email address).
    displayName: z
      .string()
      .trim()
      .max(50)
      .refine(hasNoControlChars, "Name contains invalid characters")
      .nullable()
      .optional(),
    timezone: z
      .string()
      .refine(isValidTimeZone, "Unknown timezone")
      .optional(),
  })
  .refine((v) => v.displayName !== undefined || v.timezone !== undefined, "Nothing to update");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

// Deleting an account is irreversible, so it needs the password and the email
// typed out, not just a click.
export const deleteAccountSchema = z.object({
  password: z.string().min(1),
  confirmEmail: z.string().min(1),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
