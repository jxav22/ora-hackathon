const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Published when `NEXT_PUBLIC_CONTACT_EMAIL` is missing or blank. */
export const DEFAULT_PUBLIC_CONTACT_EMAIL = "founders@ora-nz.dev";

/**
 * Public contact address.
 *
 * A blank or missing value publishes {@link DEFAULT_PUBLIC_CONTACT_EMAIL}. A valid
 * `NEXT_PUBLIC_CONTACT_EMAIL` overrides it. A value that is not an email publishes nothing,
 * so a typo never shows a broken address in its place.
 */
export function getPublicContactEmail(value = process.env.NEXT_PUBLIC_CONTACT_EMAIL): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DEFAULT_PUBLIC_CONTACT_EMAIL;
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}
