import { prisma } from "@/lib/prisma";
import { AuthResult } from "../types";

export async function logoutCommand(sessionToken?: string): Promise<AuthResult> {
  if (sessionToken) {
    try {
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
    } catch (err) {
      console.error("[LogoutCommand] Error:", err);
    }
  }
  return { success: true, message: "Logged out successfully." };
}
