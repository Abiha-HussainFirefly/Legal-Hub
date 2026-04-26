import LoginForm from "@/app/components/ui/auth/login";
import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm
        loginType="ADMIN"
        rememberMeKey="admin_remembered_email"
        redirectPath="/dashboard"
        forgotPasswordPortal="admin"
        showSocialLogin={false}
      />
    </Suspense>
  );
}
