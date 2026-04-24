"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

type ProfileUpdateInput = {
  name: string;
  avatarUrl?: string;
  linkedInUrl?: string;
  occupation?: string;
};

type PasswordUpdateInput = {
  currentPassword: string;
  newPassword: string;
};

type UpdateUserDetailsInput = ProfileUpdateInput | PasswordUpdateInput;

function isProfileUpdate(formData: UpdateUserDetailsInput): formData is ProfileUpdateInput {
  return "name" in formData;
}

function isPasswordUpdate(formData: UpdateUserDetailsInput): formData is PasswordUpdateInput {
  return "currentPassword" in formData && "newPassword" in formData;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function normalizeOptionalUrl(
  value: string | undefined,
  fieldLabel: string,
  options?: { requireLinkedInHost?: boolean; allowDataImage?: boolean }
) {
  if (value === undefined) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (options?.allowDataImage && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(trimmed)) {
    return trimmed;
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(`${fieldLabel} must be a valid URL`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${fieldLabel} must start with http:// or https://`);
  }

  if (
    options?.requireLinkedInHost &&
    !parsed.hostname.toLowerCase().includes("linkedin.com")
  ) {
    throw new Error("LinkedIn URL must point to linkedin.com");
  }

  return parsed.toString();
}

export async function updateUserDetails(formData: UpdateUserDetailsInput) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized: No session found");
  }

  const userId = session.user.id;

  try {
    if (isProfileUpdate(formData)) {
      const name = formData.name.trim();
      if (!name) {
        throw new Error("Name cannot be empty");
      }

      const avatarUrl = normalizeOptionalUrl(formData.avatarUrl, "Profile picture", {
        allowDataImage: true,
      });
      const linkedInUrl = normalizeOptionalUrl(formData.linkedInUrl, "LinkedIn URL", {
        requireLinkedInHost: true,
      });
      const occupation = formData.occupation?.trim() || null;
      const isLawyer =
        session.user.roles?.some((role) => role.toUpperCase() === "LAWYER") ?? false;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            displayName: name,
            ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          },
        }),
        prisma.userProfile.upsert({
          where: { userId },
          update: {
            linkedInUrl,
            headline: occupation,
          },
          create: {
            userId,
            linkedInUrl,
            headline: occupation,
            isLawyer,
          },
        }),
      ]);
    }

    if (isPasswordUpdate(formData)) {
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

      await prisma.credential.update({
        where: { userId },
        data: { passwordHash: newHash },
      });
    }

    if (!isProfileUpdate(formData) && !isPasswordUpdate(formData)) {
      throw new Error("No valid fields to update");
    }

    revalidatePath("/", "layout");
    revalidatePath("/profile");
    revalidatePath("/adminprofile");

    return { success: true };
  } catch (error: unknown) {
    console.error("--- UPDATE ERROR ---", error);
    throw new Error(getErrorMessage(error, "Failed to update profile"));
  }
}
