import ProfessionalProfileView from "@/app/components/profile/ProfessionalProfileView";
import ProfileViewTracker from "@/app/components/profile/ProfileViewTracker";
import { auth } from "@/auth";
import { getPublicProfileByUserId } from "@/lib/services/profile.server";
import { notFound, redirect } from "next/navigation";

export default async function PublicProfileByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const profile = await getPublicProfileByUserId(id, {
    id: session?.user?.id ?? null,
    roles: (session?.user as { roles?: string[] } | undefined)?.roles ?? [],
  });

  if (!profile) notFound();
  if (profile.username) redirect(`/profile/${profile.username}`);

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
