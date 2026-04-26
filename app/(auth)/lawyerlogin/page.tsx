import LoginForm from "@/app/components/ui/auth/login";
import { Suspense } from "react";

export default function LawyerLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm
        loginType="LAWYER"
        rememberMeKey="lawyer_remembered_email"
        redirectPath="/discussions"
        registerPath="/lawyerregister"
        forgotPasswordPortal="lawyer"
        showSocialLogin={true}
      />
    </Suspense>
  );
}
