import { getPublicContactEmail } from "./contactEmail";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("getPublicContactEmail", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("publishes no address when unset or blank", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", undefined);
    expect(getPublicContactEmail()).toBeUndefined();
    expect(getPublicContactEmail("")).toBeUndefined();
    expect(getPublicContactEmail("   ")).toBeUndefined();
  });

  it("uses the configured environment address", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "hello@ora.nz");
    expect(getPublicContactEmail()).toBe("hello@ora.nz");
  });

  it("returns undefined for a value that is not an email", () => {
    expect(getPublicContactEmail("ora")).toBeUndefined();
    expect(getPublicContactEmail("not-an-email")).toBeUndefined();
  });

  it("returns a trimmed address when one is configured", () => {
    expect(getPublicContactEmail("  hello@ora.nz  ")).toBe("hello@ora.nz");
  });
});
