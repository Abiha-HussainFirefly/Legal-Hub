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

interface MutableCookieResponseLike {
  cookies: {
    set: (
      name: string,
      value: string,
      options: {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "lax";
        path: string;
        expires: Date;
        maxAge: number;
      },
    ) => void;
  };
}

export function clearSessionCookies(response: MutableCookieResponseLike) {
  for (const name of SESSION_COOKIE_NAMES) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
  }
}
