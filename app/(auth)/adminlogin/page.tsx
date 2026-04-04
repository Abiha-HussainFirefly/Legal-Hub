import LoginForm from "@/app/components/ui/auth/login";

export default function AdminLoginPage() {
  return (
    <LoginForm
      loginType="ADMIN"
      rememberMeKey="admin_remembered_email"
      redirectPath="/dashboard"
      forgotPasswordPortal="admin"
      showSocialLogin={false}  
    />
  );
}