import LawyerShell from "@/app/components/lawyer/LawyerShell";
import ProfileEditForm from "@/app/components/profile/ProfileEditForm";
import { auth } from "@/auth";
import { LAWYER_PERMISSION_KEYS, canAccessLawyerPermission } from "@/lib/auth/roles";
import { getMyProfile, getProfileEditMeta } from "@/lib/services/profile.server";
import { redirect } from "next/navigation";

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ step?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/lawyerlogin");
  const resolvedSearchParams = (await searchParams) ?? {};

  const [profile, meta] = await Promise.all([
    getMyProfile(session.user.id),
    getProfileEditMeta(),
  ]);

  if (!profile) redirect("/lawyerlogin");
  const roles = session.user.roles ?? [];
  const permissions = session.user.permissions ?? [];

  return (
    <LawyerShell activeTab="profile">
      <ProfileEditForm
        profile={profile}
        meta={meta}
        mode="edit"
        initialStep={resolvedSearchParams.step}
        canManageVisibility={canAccessLawyerPermission(roles, permissions, LAWYER_PERMISSION_KEYS.PROFILE_VISIBILITY_MANAGE_SELF)}
        canChangePassword={canAccessLawyerPermission(roles, permissions, LAWYER_PERMISSION_KEYS.ACCOUNT_PASSWORD_CHANGE_SELF)}
        canViewPublicProfile={canAccessLawyerPermission(roles, permissions, LAWYER_PERMISSION_KEYS.PROFILE_PUBLIC_VIEW)}
      />
    </LawyerShell>
  );
}
