import { useState } from 'react';
import PermissionGate from '../../components/PermissionGate';
import DiscussionCard from '../../components/discussions/DiscussionCard';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type DiscussionRecord = {
  id: string | number;
  authorId: string | number | null;
  title: string;
  body: string;
  category: string;
  hasAiSummary?: boolean;
};

type DiscussionsPageProps = {
  discussions?: DiscussionRecord[];
  currentUserId?: string | number | null;
};

const DEFAULT_DISCUSSIONS: DiscussionRecord[] = [];

const DiscussionsPage = ({
  discussions = DEFAULT_DISCUSSIONS,
  currentUserId = null,
}: DiscussionsPageProps) => {
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'saved'>('all');

  if (!can(PERMISSIONS.DISCUSSIONS_VIEW)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Discussions</h1>

          {/* Controls whether the lawyer can create a new discussion. */}
          <PermissionGate permission={PERMISSIONS.DISCUSSIONS_CREATE}>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              New discussion
            </button>
          </PermissionGate>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 text-slate-700'
            }`}
          >
            All discussions
          </button>

          {/* Controls whether the lawyer can view the My Discussions tab. */}
          <PermissionGate permission={PERMISSIONS.DISCUSSIONS_VIEW_OWN}>
            <button
              type="button"
              onClick={() => setActiveTab('mine')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'mine'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 text-slate-700'
              }`}
            >
              My Discussions
            </button>
          </PermissionGate>

          {/* Controls whether the lawyer can view the Saved discussions tab. */}
          <PermissionGate permission={PERMISSIONS.DISCUSSIONS_VIEW_SAVED_OWN}>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'saved'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 text-slate-700'
              }`}
            >
              Saved
            </button>
          </PermissionGate>
        </div>
      </section>

      <div className="grid gap-4">
        {discussions.map((discussion) => (
          <DiscussionCard
            key={discussion.id}
            discussion={discussion}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
};

export default DiscussionsPage;
