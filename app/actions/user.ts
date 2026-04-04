"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma"; 
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateUserDetails(formData: any) {
  const session = await auth();
  
  // 1. Safety Check
  if (!session?.user?.email) {
    throw new Error("Unauthorized: No session found");
  }

  try {
    // 2. Find the User ID via the UserIdentifier table
    const identifier = await prisma.userIdentifier.findUnique({
      where: {
        type_value: {
          type: "EMAIL",
          value: session.user.email,
        },
      },
      select: { userId: true },
    });

    if (!identifier) {
      throw new Error("User identifier not found");
    }

    const userId = identifier.userId;

    // 3. Prepare Updates
    // Update Display Name in User table
    const userUpdate = prisma.user.update({
      where: { id: userId },
      data: { displayName: formData.name },
    });

    // Update Occupation in UserProfile table (where it lives in your schema)
    const profileUpdate = prisma.userProfile.upsert({
      where: { userId: userId },
      update: { bio: formData.occupation }, // Or create a new field in schema for occupation
      create: { userId: userId, bio: formData.occupation },
    });

    const operations: any[] = [userUpdate, profileUpdate];

    // 4. Handle Password Update (Credential table)
    if (formData.password && formData.password.trim() !== "") {
      const passwordHash = await hash(formData.password, 10);
      operations.push(
        prisma.credential.upsert({
          where: { userId: userId },
          update: { passwordHash },
          create: { userId: userId, passwordHash },
        })
      );
    }

    // 5. Execute all updates in a transaction
    await prisma.$transaction(operations);

    revalidatePath("/", "layout"); 
    return { success: true };

  } catch (error: any) {
    console.error("--- UPDATE ERROR ---", error);
    throw new Error(error.message || "Failed to update profile");
  }
}