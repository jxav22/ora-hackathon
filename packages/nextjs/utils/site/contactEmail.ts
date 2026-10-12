const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public contact address from `NEXT_PUBLIC_CONTACT_EMAIL`.
 * Returns nothing until a real address is configured, so the site never shows a placeholder.
 */
export function getPublicContactEmail(value = process.env.NEXT_PUBLIC_CONTACT_EMAIL): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !EMAIL_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}
