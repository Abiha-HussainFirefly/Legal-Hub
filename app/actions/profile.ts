"use server";

import { auth } from "@/auth";
import { LAWYER_PERMISSION_KEYS, canAccessLawyerPermission } from "@/lib/auth/roles";
import { saveProfessionalProfile } from "@/lib/services/profile.server";
import type { ProfileEditorSection, ProfileFormInput } from "@/types/profile";
import { revalidatePath } from "next/cache";

export async function saveProfileAction(
  input: ProfileFormInput,
  section?: ProfileEditorSection,
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const roles = session.user.roles ?? [];
  const permissions = session.user.permissions ?? [];
  const canEditProfile = canAccessLawyerPermission(roles, permissions, LAWYER_PERMISSION_KEYS.PROFILE_EDIT_SELF);
  const canSetupProfile = canAccessLawyerPermission(roles, permissions, LAWYER_PERMISSION_KEYS.PROFILE_SETUP_SELF);

  if (!canEditProfile && !canSetupProfile) {
    throw new Error("You do not have permission to update this profile.");
  }

  const result = await saveProfessionalProfile(session.user.id, input, {
    section,
  });

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/profile/setup");
  if (result.previousUsername) {
    revalidatePath(`/profile/${result.previousUsername}`);
  }
  revalidatePath(`/profile/${result.username}`);

  return {
    success: true,
    username: result.username,
    completionPercentage: result.completionPercentage,
    completionState: result.completionState,
  };
}
