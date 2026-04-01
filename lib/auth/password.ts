import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;


export async function hashPassword(
  plaintext: string
): Promise<{ hash: string; algo: string }> {
  const hash = await bcrypt.hash(plaintext, SALT_ROUNDS);
  return { hash, algo: "bcrypt" };
}


export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
