import { DEFAULT_PUBLIC_CONTACT_EMAIL, getPublicContactEmail } from "./contactEmail";
import { describe, expect, it } from "vitest";

describe("getPublicContactEmail", () => {
  it("publishes the founders address when unset or blank", () => {
    expect(getPublicContactEmail(undefined)).toBe(DEFAULT_PUBLIC_CONTACT_EMAIL);
    expect(getPublicContactEmail("")).toBe(DEFAULT_PUBLIC_CONTACT_EMAIL);
    expect(getPublicContactEmail("   ")).toBe(DEFAULT_PUBLIC_CONTACT_EMAIL);
  });

  it("returns undefined for a value that is not an email", () => {
    expect(getPublicContactEmail("ora")).toBeUndefined();
    expect(getPublicContactEmail("not-an-email")).toBeUndefined();
  });

  it("returns a trimmed address when one is configured", () => {
    expect(getPublicContactEmail("  hello@ora.nz  ")).toBe("hello@ora.nz");
  });
});
