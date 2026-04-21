import { updateUserDetails } from "@/app/actions/user";
import ProfilePage from "@/app/components/profile/ProfilePage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LawyerProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/lawyerlogin");
  const sessionUser = session.user as typeof session.user & { occupation?: string };

  return (
    <ProfilePage
      variant="lawyer"
      user={{
        name:       sessionUser.name  ?? "",
        email:      sessionUser.email ?? "",
        occupation: sessionUser.occupation ?? "Other",
        avatarUrl:  sessionUser.image ?? undefined,
      }}
      onSave={updateUserDetails}
    />
  );
}
