import { getPublicContactEmail } from "./contactEmail";
import { describe, expect, it } from "vitest";

describe("getPublicContactEmail", () => {
  it("returns undefined when unset or blank", () => {
    expect(getPublicContactEmail(undefined)).toBeUndefined();
    expect(getPublicContactEmail("")).toBeUndefined();
    expect(getPublicContactEmail("   ")).toBeUndefined();
  });

  it("returns undefined for a value that is not an email", () => {
    expect(getPublicContactEmail("ora")).toBeUndefined();
    expect(getPublicContactEmail("not-an-email")).toBeUndefined();
  });

  it("returns a trimmed address when one is configured", () => {
    expect(getPublicContactEmail("  hello@ora.nz  ")).toBe("hello@ora.nz");
  });
});
