import { updateUserDetails } from "@/app/actions/user";
import ProfilePage from "@/app/components/profile/ProfilePage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/adminlogin");
  const sessionUser = session.user as typeof session.user & { occupation?: string };

  return (
    <ProfilePage
      variant="admin"
      user={{
        name:       sessionUser.name  ?? "",
        email:      sessionUser.email ?? "",
        occupation: sessionUser.occupation ?? "Other",
      }}
      onSave={updateUserDetails}
    />
  );
}
