import LawyerShell from "@/app/components/lawyer/LawyerShell";
import OwnerProfileOverview from "@/app/components/profile/OwnerProfileOverview";
import ProfileWorkspaceShell from "@/app/components/profile/ProfileWorkspaceShell";
import { auth } from "@/auth";
import { LAWYER_PERMISSION_KEYS, canAccessLawyerPermission } from "@/lib/auth/roles";
import { getMyProfile } from "@/lib/services/profile.server";
import { redirect } from "next/navigation";

export default async function LawyerProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/lawyerlogin");

  const profile = await getMyProfile(session.user.id);
  if (!profile) redirect("/lawyerlogin");
  const roles = session.user.roles ?? [];
  const permissions = session.user.permissions ?? [];

  return (
      <LawyerShell activeTab="profile">
      <ProfileWorkspaceShell
        profile={profile}
        activeTab="profile"
        roles={roles}
        permissions={permissions}
      >
        <OwnerProfileOverview
          profile={profile}
          canEditProfile={canAccessLawyerPermission(roles, permissions, LAWYER_PERMISSION_KEYS.PROFILE_EDIT_SELF)}
        />
      </ProfileWorkspaceShell>
    </LawyerShell>
  );
}
