import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changePasswordSchema, deleteAccountSchema, updateProfileSchema } from "./profile.schema.js";

describe("updateProfileSchema", () => {
  it("accepts a name, a zone, or both", () => {
    assert.equal(updateProfileSchema.safeParse({ displayName: "Dharmik" }).success, true);
    assert.equal(updateProfileSchema.safeParse({ timezone: "Asia/Kolkata" }).success, true);
    assert.equal(updateProfileSchema.safeParse({ displayName: "D", timezone: "UTC" }).success, true);
  });
  it("trims the name and lets null or empty clear it", () => {
    const r = updateProfileSchema.safeParse({ displayName: "  Dharmik  " });
    assert.equal(r.success && r.data.displayName, "Dharmik");
    assert.equal(updateProfileSchema.safeParse({ displayName: null }).success, true);
    assert.equal(updateProfileSchema.safeParse({ displayName: "   " }).success, true);
  });
  it("rejects an empty update, a long name, control characters and unknown zones", () => {
    assert.equal(updateProfileSchema.safeParse({}).success, false);
    assert.equal(updateProfileSchema.safeParse({ displayName: "x".repeat(51) }).success, false);
    assert.equal(updateProfileSchema.safeParse({ displayName: "bad\u0007name" }).success, false);
    assert.equal(updateProfileSchema.safeParse({ timezone: "Mars/Olympus" }).success, false);
  });
});

describe("changePasswordSchema", () => {
  it("needs the current password and an 8+ character new one", () => {
    assert.equal(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "longenough" }).success, true);
    assert.equal(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "short" }).success, false);
    assert.equal(changePasswordSchema.safeParse({ currentPassword: "", newPassword: "longenough" }).success, false);
  });
});

describe("deleteAccountSchema", () => {
  it("needs both the password and the typed email", () => {
    assert.equal(deleteAccountSchema.safeParse({ password: "pw", confirmEmail: "me@example.com" }).success, true);
    assert.equal(deleteAccountSchema.safeParse({ password: "pw" }).success, false);
    assert.equal(deleteAccountSchema.safeParse({ confirmEmail: "me@example.com" }).success, false);
  });
});
