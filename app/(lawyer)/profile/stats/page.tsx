import LawyerShell from "@/app/components/lawyer/LawyerShell";
import OwnerProfileStatsView from "@/app/components/profile/OwnerProfileStatsView";
import ProfileWorkspaceShell from "@/app/components/profile/ProfileWorkspaceShell";
import { auth } from "@/auth";
import { getMyProfile } from "@/lib/services/profile.server";
import { redirect } from "next/navigation";

export default async function LawyerProfileStatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/lawyerlogin");

  const profile = await getMyProfile(session.user.id);
  if (!profile) redirect("/lawyerlogin");

  return (
    <LawyerShell activeTab="profile">
      <ProfileWorkspaceShell profile={profile} activeTab="stats">
        <OwnerProfileStatsView profile={profile} />
      </ProfileWorkspaceShell>
    </LawyerShell>
  );
}
