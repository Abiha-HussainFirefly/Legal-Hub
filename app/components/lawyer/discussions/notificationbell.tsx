'use client';

import { Bell, CheckCheck, MessageSquare, UserCheck, AlertCircle, Award, ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface NotifItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  discussion?: {
    id: string;
    slug: string;
    title: string;
  } | null;
}

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Icon({ type }: { type: string }) {
  const c = 'w-4 h-4 shrink-0 mt-0.5';
  if (type === 'NEW_ANSWER')           return <MessageSquare className={`${c} text-blue-500`}   />;
  if (type === 'ANSWER_ACCEPTED')      return <CheckCheck    className={`${c} text-green-500`}  />;
  if (type === 'COMMENT_REPLIED')      return <MessageSquare className={`${c} text-[#9F63C4]`}  />;
  if (type === 'DISCUSSION_FOLLOWED') return <ThumbsUp      className={`${c} text-[#9F63C4]`}  />;
  if (type === 'BADGE_AWARDED')       return <Award         className={`${c} text-yellow-500`} />;
  if (type.startsWith('VERIFICATION'))return <UserCheck     className={`${c} text-green-500`}  />;
  return                                     <AlertCircle   className={`${c} text-gray-400`}   />;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open,   setOpen]   = useState(false);
  const [items,  setItems]  = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [busy,   setBusy]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    // Only show loading spinner on initial load or manual refresh
    if (items.length === 0) setBusy(true);
    try {
      const r = await fetch('/api/notifications?limit=15');
      if (!r.ok) return;
      const d = await r.json();
      setItems(d.data ?? []);
      setUnread(d.unreadCount ?? 0);
    } finally { setBusy(false); }
  }, [items.length]);

  async function markAll() {
    // Optimistic UI update
    const previousItems = [...items];
    const previousUnread = unread;
    
    setItems(p => p.map(n => ({ ...n, isRead: true })));
    setUnread(0);

    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback on failure
      setItems(previousItems);
      setUnread(previousUnread);
    }
  }

  async function openNotification(item: NotifItem) {
    if (!item.isRead) {
      const previousItems = [...items];
      const previousUnread = unread;

      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
      setUnread((current) => Math.max(0, current - 1));

      try {
        const res = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [item.id] }),
        });

        if (!res.ok) throw new Error();
      } catch {
        setItems(previousItems);
        setUnread(previousUnread);
      }
    }

    setOpen(false);

    if (item.discussion?.slug) {
      router.push(`/discussions/${item.discussion.slug}`);
      return;
    }

    router.push('/notifications');
  }

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { if (!open) load(); setOpen(o => !o); }}
        aria-label="Notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#4C2F5E]/10 bg-[#F8F4FB] text-[#4C2F5E] transition hover:bg-[#F1EAF6] cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none border-2 border-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-2xl z-50">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
            <span className="text-sm font-bold text-[#4C2F5E]">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll}
                className="text-[11px] font-semibold text-[#9F63C4] hover:opacity-70 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto">
            {busy ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-purple-100 border-t-[#9F63C4] rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">No notifications yet</p>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 cursor-pointer ${!n.isRead ? 'bg-[#FAF5FF]' : ''}`}
                >
                  <Icon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] leading-snug ${!n.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{n.title}</p>
                    {n.message && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>}
                    {n.discussion?.title ? (
                      <p className="mt-1 line-clamp-1 text-[11px] font-medium text-[#6B5C79]">
                        {n.discussion.title}
                      </p>
                    ) : null}
                    <p className="text-[10px] text-gray-400 mt-0.5">{ago(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-[#9F63C4] rounded-full shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
