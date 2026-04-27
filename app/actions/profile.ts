"use server";

import { auth } from "@/auth";
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
