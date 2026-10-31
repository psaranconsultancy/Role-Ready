// Small, shared checks for the site's forms. Kept deliberately forgiving:
// they catch typos, not every edge case the email and URL specs allow.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

export const isValidEmail = (value: string) => EMAIL_RE.test(value.trim());

export const emailProblem = (value: string): string | null => {
  const v = value.trim();
  if (!v) return 'Please enter your email address.';
  if (!isValidEmail(v)) return 'That email address doesn’t look right. Check for a typo, like name@example.com.';
  return null;
};

/**
 * Turns what someone typed into a usable web link, adding https:// when they
 * left it off. Returns null when it can't be a web address.
 */
export const normaliseLink = (value: string): string | null => {
  const v = value.trim();
  if (!v || /\s/.test(v)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!/^[^.]+(\.[^.]+)+$/.test(url.hostname) || /\.$/.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
};
