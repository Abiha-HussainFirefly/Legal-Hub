import { createHash } from "crypto";
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

  // 1. Generate the raw token (This goes to the user/cookie)
  const rawToken  = generateToken(32);
  
  // 2. Create the hash (This goes to the Database)
  const sessionTokenHash = createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const now       = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  // 3. Create the session record
  const session = await db.session.create({
    data: {
      userId,
      // sessionToken: rawToken, <--- ❌ REMOVE THIS LINE (It doesn't exist in your DB)
      sessionTokenHash: sessionTokenHash, // ✅ KEEP THIS (It is required)
      ip,
      userAgent,
      deviceLabel:  deviceLabel ?? null,
      createdAt:    now,
      lastSeenAt:   now,
      expiresAt,
    },
  });

  // 4. Return the session but attach the rawToken manually 
  // so your login command can still send it to the client.
  return {
    ...session,
    sessionToken: rawToken 
  };
}