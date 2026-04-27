export const SESSION_COOKIE_NAMES = [
  "session_token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

interface CookieValue {
  value: string;
}

interface CookieStoreLike {
  get(name: string): CookieValue | undefined;
}

interface CookieSourceLike {
  cookies: CookieStoreLike;
}

export function readSessionToken(source: CookieSourceLike): string | undefined {
  for (const name of SESSION_COOKIE_NAMES) {
    const value = source.cookies.get(name)?.value;
    if (value) return value;
  }

  return undefined;
}
