"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

type UpdateUserDetailsInput =
  | { name: string }
  | { currentPassword: string; newPassword: string };

function isNameUpdate(formData: UpdateUserDetailsInput): formData is { name: string } {
  return "name" in formData;
}

function isPasswordUpdate(formData: UpdateUserDetailsInput): formData is { currentPassword: string; newPassword: string } {
  return "currentPassword" in formData && "newPassword" in formData;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function updateUserDetails(formData: UpdateUserDetailsInput) {
  const session = await auth();

  // 1. Basic Auth Check
  if (!session?.user?.email) {
    throw new Error("Unauthorized: No session found");
  }

  try {
    // 2. Find the User ID via the UserIdentifier model
    // FIX: Using normalizedValue property name inside type_normalizedValue
    const identifier = await prisma.userIdentifier.findUnique({
      where: {
        type_normalizedValue: {
          type: "EMAIL",
          normalizedValue: session.user.email.toLowerCase().trim(),
        },
      },
      select: { userId: true },
    });

    if (!identifier) {
      throw new Error("User identifier not found");
    }

    const userId = identifier.userId;
    const operations: Prisma.PrismaPromise<unknown>[] = [];

    // 3. Handle Display Name update
    if (isNameUpdate(formData) && formData.name.trim() !== "") {
      operations.push(
        prisma.user.update({
          where: { id: userId },
          data: { displayName: formData.name.trim() },
        })
      );
    }

    // 4. Handle Password update
    if (isPasswordUpdate(formData)) {
      // Fetch existing hash to verify identity
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

    // 5. Finalize Transactions
    if (operations.length === 0) {
      throw new Error("No valid fields to update");
    }

    await prisma.$transaction(operations);

    // Refresh the data for the profile page
    revalidatePath("/", "layout");

    return { success: true };

  } catch (error: unknown) {
    console.error("--- UPDATE ERROR ---", error);
    // Return a user-friendly error message
    throw new Error(getErrorMessage(error, "Failed to update profile"));
  }
}
