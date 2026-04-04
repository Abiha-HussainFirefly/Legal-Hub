// app/(lawyer)/profile/page.tsx
import ProfilePage from "@/app/components/profile/ProfilePage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LawyerProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/lawyerlogin");

  return (
    <ProfilePage
      variant="lawyer"
      user={{
        name:       session.user.name  ?? "",
        email:      session.user.email ?? "",
        occupation: (session.user as any).occupation ?? "Other",
        avatarUrl:  session.user.image ?? undefined,
      }}
      onSave={async (data) => {
        "use server";
        // await fetch("/api/user/update", { method: "PUT", body: JSON.stringify(data) });
      }}
    />
  );
}