'use client';

import LawyerShell from '@/app/components/lawyer/LawyerShell';
import { apiRequest, getErrorMessage } from '@/lib/api-client';
import { CheckCheck, Bell, MessageSquare, UserCheck, AlertCircle, Award, ThumbsUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  discussion?: {
    slug: string;
    title: string;
  } | null;
}

function timeAgo(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationIcon({ type }: { type: string }) {
  const className = 'h-4 w-4 shrink-0';
  if (type === 'NEW_ANSWER') return <MessageSquare className={`${className} text-blue-500`} />;
  if (type === 'ANSWER_ACCEPTED') return <CheckCheck className={`${className} text-emerald-500`} />;
  if (type === 'COMMENT_REPLIED') return <MessageSquare className={`${className} text-[#4C2F5E]`} />;
  if (type === 'DISCUSSION_FOLLOWED') return <ThumbsUp className={`${className} text-[#4C2F5E]`} />;
  if (type === 'BADGE_AWARDED') return <Award className={`${className} text-amber-500`} />;
  if (type.startsWith('VERIFICATION')) return <UserCheck className={`${className} text-emerald-500`} />;
  return <AlertCircle className={`${className} text-slate-400`} />;
}

export default function LawyerNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        setLoading(true);
        setError('');
        const payload = await apiRequest<{ data?: NotificationItem[] }>('/api/notifications?limit=50', {
          cache: 'no-store',
        });

        if (!cancelled) {
          setItems(payload.data ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setItems([]);
          setError(getErrorMessage(loadError, 'Unable to load notifications.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  async function markAllRead() {
    if (!unreadCount || markingAll) return;

    const previousItems = items;
    setMarkingAll(true);
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));

    try {
      await apiRequest('/api/notifications', { method: 'PATCH' });
    } catch (markError) {
      setItems(previousItems);
      setError(getErrorMessage(markError, 'Unable to mark notifications as read.'));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <LawyerShell activeTab="profile">
      <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 lg:px-8 lh-page-enter">
        <section className="workspace-header p-6 md:p-7 lh-page-enter lh-delay-1">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#4C2F5E] text-white">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Inbox</p>
                  <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">Notifications</h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#736683] md:text-base">
                Review answers, follows, verification updates, and other events tied to your lawyer workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="workspace-pill border-[#4C2F5E]/8 bg-white text-[#736683]">
                {unreadCount} unread
              </span>
              {unreadCount ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="legal-button-primary text-sm disabled:opacity-60"
                >
                  <CheckCheck className="h-4 w-4" />
                  {markingAll ? 'Marking...' : 'Mark all read'}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 workspace-sidebar overflow-hidden p-0 lh-page-enter lh-delay-2">
          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="lh-skeleton h-20 rounded-[18px]" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#F1EAF6] text-[#4C2F5E]">
                <Bell className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-[#2F1D3B]">No notifications yet</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[#736683]">
                New discussion activity, accepted answers, and verification updates will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#4C2F5E]/8">
              {items.map((item) => (
                <article
                  key={item.id}
                  className={`flex gap-3 px-5 py-4 transition ${item.isRead ? 'bg-white' : 'bg-[#FBF7FE]'}`}
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F8F4FB]">
                    <NotificationIcon type={item.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#2F1D3B]">{item.title}</h2>
                      {!item.isRead ? (
                        <span className="rounded-full bg-[#4C2F5E] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    {item.message ? <p className="mt-1 text-sm leading-6 text-[#6E607D]">{item.message}</p> : null}
                    {item.discussion?.title ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8B7D99]">
                        Discussion: {item.discussion.title}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-[#8B7D99]">{timeAgo(item.createdAt)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </LawyerShell>
  );
}
