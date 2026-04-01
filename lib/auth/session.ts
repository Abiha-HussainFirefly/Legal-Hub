import { generateToken } from "./token";

const SESSION_TTL_DAYS = 7;

interface CreateSessionInput {
  userId:      string;
  ip?:         string | null;
  userAgent?:  string | null;
  deviceLabel?: string;
}

export async function createSession(
  db: any,
  input: CreateSessionInput
) {
  const { userId, ip = null, userAgent = null, deviceLabel } = input;

  const rawToken  = generateToken(32);
  const now       = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await db.session.create({
    data: {
      userId,
      sessionToken: rawToken,
      ip,
      userAgent,
      deviceLabel:  deviceLabel ?? null,
      createdAt:    now,
      lastSeenAt:   now,
      expiresAt,
    },
  });

  return session;
}
