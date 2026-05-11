import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type PublicProfile = {
  displayName: string;
  headline: string;
  bio: string;
};

type PublicProfilePageProps = {
  profile?: PublicProfile;
  trackProfileView?: (profileId: string) => Promise<void>;
};

const defaultTrackProfileView = async () => {};

const PublicProfilePage = ({
  profile = {
    displayName: 'Lawyer User',
    headline: 'Public lawyer profile',
    bio: 'This profile is visible to lawyers who are allowed to view public profiles.',
  },
  trackProfileView = defaultTrackProfileView,
}: PublicProfilePageProps) => {
  const { id: profileId } = useParams<{ id: string }>();
  const { can } = usePermissions();

  useEffect(() => {
    if (!profileId) {
      return;
    }

    if (can(PERMISSIONS.PROFILE_VIEW_TRACK)) {
      void trackProfileView(profileId);
    }
  }, [can, profileId, trackProfileView]);

  if (!can(PERMISSIONS.PROFILE_PUBLIC_VIEW)) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{profile.displayName}</h1>
      <p className="mt-2 text-sm text-slate-600">{profile.headline}</p>
      <p className="mt-4 text-sm leading-6 text-slate-700">{profile.bio}</p>
    </section>
  );
};

export default PublicProfilePage;
