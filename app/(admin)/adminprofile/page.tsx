import ProfilePage from "@/app/components/profile/ProfilePage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { updateUserDetails } from "@/app/actions/user";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/adminlogin");

  return (
    <ProfilePage
      variant="admin"
      user={{
        name:       session.user.name  ?? "",
        email:      session.user.email ?? "",
        occupation: (session.user as any).occupation ?? "Other",
      }}
      onSave={updateUserDetails} 
    />
  );
}