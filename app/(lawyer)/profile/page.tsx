import ProfessionalProfileView from "@/app/components/profile/ProfessionalProfileView";
import LawyerShell from "@/app/components/lawyer/LawyerShell";
import { auth } from "@/auth";
import { getMyProfile } from "@/lib/services/profile.server";
import { redirect } from "next/navigation";

export default async function LawyerProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/lawyerlogin");

  const profile = await getMyProfile(session.user.id);
  if (!profile) redirect("/lawyerlogin");

  return (
    <LawyerShell activeTab="profile">
      <ProfessionalProfileView profile={profile} mode="owner" />
    </LawyerShell>
  );
}
