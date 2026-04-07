"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateUserDetails(formData: any) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized: No session found");
  }

  try {
    const identifier = await prisma.userIdentifier.findUnique({
      where: {
        type_value: {
          type: "EMAIL",
          value: session.user.email,
        },
      },
      select: { userId: true },
    });

    if (!identifier) throw new Error("User identifier not found");
    const userId = identifier.userId;

    const operations: any[] = [];

    // Handle name update
    if (formData.name && formData.name.trim() !== "") {
      operations.push(
        prisma.user.update({
          where: { id: userId },
          data: { displayName: formData.name },
        })
      );
    }

    // Handle password update
    if (formData.newPassword && formData.currentPassword) {
      const credential = await prisma.credential.findUnique({
        where: { userId },
        select: { passwordHash: true },
      });

      if (!credential) {
        throw new Error("No password credential found for this account");
      }

      const isValid = await compare(formData.currentPassword, credential.passwordHash);
      if (!isValid) {
        throw new Error("Current password is incorrect");
      }

      const newHash = await hash(formData.newPassword, 10);
      operations.push(
        prisma.credential.update({
          where: { userId },
          data: { passwordHash: newHash },
        })
      );
    }

    if (operations.length === 0) {
      throw new Error("No valid fields to update");
    }

    await prisma.$transaction(operations);
    revalidatePath("/", "layout");
    return { success: true };

  } catch (error: any) {
    console.error("--- UPDATE ERROR ---", error);
    throw new Error(error.message || "Failed to update profile");
  }
}