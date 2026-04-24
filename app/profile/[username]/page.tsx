import ProfessionalProfileView from "@/app/components/profile/ProfessionalProfileView";
import ProfileViewTracker from "@/app/components/profile/ProfileViewTracker";
import { auth } from "@/auth";
import { getPublicProfile } from "@/lib/services/profile.server";
import { notFound } from "next/navigation";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();

  const profile = await getPublicProfile(username, {
    id: session?.user?.id ?? null,
    roles: (session?.user as { roles?: string[] } | undefined)?.roles ?? [],
  });

  if (!profile) notFound();

  return (
    <>
      <ProfileViewTracker profileUserId={profile.userId} />
      <ProfessionalProfileView
        profile={profile}
        mode="public"
        contextLink={{ href: "/discussions", label: "Discussions" }}
      />
    </>
  );
}
