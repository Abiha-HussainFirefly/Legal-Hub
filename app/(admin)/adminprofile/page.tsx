import { updateUserDetails } from "@/app/actions/user";
import ProfilePage from "@/app/components/profile/ProfilePage";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/adminlogin");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      displayName: true,
      avatarUrl: true,
      profile: {
        select: {
          linkedInUrl: true,
          headline: true,
        },
      },
      identifiers: {
        where: {
          type: "EMAIL",
          isPrimary: true,
        },
        select: {
          value: true,
        },
        take: 1,
      },
    },
  });

  return (
    <ProfilePage
      variant="admin"
      user={{
        name: currentUser?.displayName ?? session.user.name ?? "",
        email: currentUser?.identifiers[0]?.value ?? session.user.email ?? "",
        avatarUrl: currentUser?.avatarUrl ?? session.user.image ?? undefined,
        linkedInUrl: currentUser?.profile?.linkedInUrl ?? undefined,
        occupation: currentUser?.profile?.headline ?? "Other",
      }}
      onSave={updateUserDetails}
    />
  );
}
