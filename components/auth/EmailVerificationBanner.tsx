import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type EmailVerificationBannerProps = {
  isVerified?: boolean;
  onVerify?: () => void;
};

const EmailVerificationBanner = ({
  isVerified = false,
  onVerify,
}: EmailVerificationBannerProps) => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.AUTH_EMAIL_VERIFY) || isVerified) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>Verify your email to unlock the full lawyer experience.</p>
        <button
          type="button"
          onClick={onVerify}
          className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-800"
        >
          Verify email
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
