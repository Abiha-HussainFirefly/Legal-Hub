import LoginForm from "@/app/components/ui/auth/login";

export default function LawyerLoginPage() {
  return (
    <LoginForm
      loginType="LAWYER"
      rememberMeKey="lawyer_remembered_email"
      redirectPath="/discussions"
      registerPath="/lawyerregister"
      forgotPasswordPortal="lawyer"
      showSocialLogin={true}
    />
  );
}