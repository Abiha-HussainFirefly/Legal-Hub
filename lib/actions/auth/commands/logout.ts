import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { AuthResult } from "../types";

export async function logoutCommand(sessionToken?: string): Promise<AuthResult> {
  if (sessionToken) {
    try {
      const sessionTokenHash = createHash("sha256")
        .update(sessionToken)
        .digest("hex");

      await prisma.session.deleteMany({
        where: { sessionTokenHash },
      });
    } catch (err) {
      console.error("[LogoutCommand] Error:", err);
    }
  }
  return { success: true, message: "Logged out successfully." };
}
