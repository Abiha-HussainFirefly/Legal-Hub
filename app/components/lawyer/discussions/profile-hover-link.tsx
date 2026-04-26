'use client';

import { Building2, MapPin, Scale, ShieldCheck, UserRound } from 'lucide-react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { type CSSProperties, type FocusEvent, type ReactNode, useEffect, useRef, useState } from 'react';

interface ProfileHoverLinkProps {
  href?: string | null;
  displayName: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  isLawyer?: boolean;
  headline?: string | null;
  practiceArea?: string | null;
  firmName?: string | null;
  barCouncil?: string | null;
  region?: string | null;
  children: ReactNode;
  className?: string;
  panelPosition?: 'top' | 'bottom';
  panelAlign?: 'left' | 'right';
}

const PANEL_WIDTH = 280;
const VIEWPORT_GAP = 16;
const PANEL_GAP = 10;
const CLOSE_DELAY_MS = 180;

function initials(name: string | null) {
  if (!name) return 'LH';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function ProfileHoverLink({
  href,
  displayName,
  username,
  avatarUrl,
  isVerified = false,
  isLawyer = false,
  headline,
  practiceArea,
  firmName,
  barCouncil,
  region,
  children,
  className,
  panelPosition = 'bottom',
  panelAlign = 'left',
}: ProfileHoverLinkProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

  const summary = headline || practiceArea || (isLawyer ? 'Legal Hub lawyer profile' : 'Legal Hub member profile');
  const triggerClassName = className ?? 'inline-flex';

  function clearCloseTimer() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function updatePanelPosition() {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_GAP * 2);
    const rawLeft = panelAlign === 'right' ? rect.right - width : rect.left;
    const left = Math.min(Math.max(VIEWPORT_GAP, rawLeft), window.innerWidth - width - VIEWPORT_GAP);
    const top = panelPosition === 'top' ? rect.top - PANEL_GAP : rect.bottom + PANEL_GAP;

    setPanelStyle({
      position: 'fixed',
      top,
      left,
      width,
      zIndex: 9999,
      transform: panelPosition === 'top' ? 'translateY(-100%)' : undefined,
    });
  }

  function openPanel() {
    clearCloseTimer();
    updatePanelPosition();
    setIsOpen(true);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, CLOSE_DELAY_MS);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget as Node | null;

    if (
      nextTarget &&
      (wrapperRef.current?.contains(nextTarget) || panelRef.current?.contains(nextTarget))
    ) {
      return;
    }

    scheduleClose();
  }

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;

    const update = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_GAP * 2);
      const rawLeft = panelAlign === 'right' ? rect.right - width : rect.left;
      const left = Math.min(Math.max(VIEWPORT_GAP, rawLeft), window.innerWidth - width - VIEWPORT_GAP);
      const top = panelPosition === 'top' ? rect.top - PANEL_GAP : rect.bottom + PANEL_GAP;

      setPanelStyle({
        position: 'fixed',
        top,
        left,
        width,
        zIndex: 9999,
        transform: panelPosition === 'top' ? 'translateY(-100%)' : undefined,
      });
    };
    const animationFrame = window.requestAnimationFrame(update);

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, panelAlign, panelPosition]);

  const panel = typeof document !== 'undefined' && isOpen && panelStyle
    ? createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="pointer-events-auto rounded-[22px] border border-[#4C2F5E]/12 bg-white p-4 text-left shadow-[0_20px_45px_rgba(26,14,33,0.16)]"
          onMouseEnter={openPanel}
          onMouseLeave={scheduleClose}
          onFocusCapture={openPanel}
          onBlurCapture={handleBlur}
        >
          <div className="flex items-start gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName ?? 'Profile'}
                className="h-12 w-12 rounded-full border border-[#4C2F5E]/10 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4C2F5E] text-sm font-semibold text-white">
                {initials(displayName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-[#2F1D3B]">{displayName ?? 'Anonymous'}</p>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EAF6] px-2 py-0.5 text-[10px] font-semibold text-[#4C2F5E]">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                ) : null}
              </div>
              {username ? <p className="mt-1 text-xs font-medium text-[#7A6C88]">@{username}</p> : null}
              <p className="mt-1.5 text-xs leading-5 text-[#6E607D]">{summary}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs text-[#6E607D]">
            <div className="flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5 text-[#8B7D99]" />
              <span>{isLawyer ? 'Lawyer profile' : 'Community member'}</span>
            </div>
            {firmName ? (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-[#8B7D99]" />
                <span className="truncate">{firmName}</span>
              </div>
            ) : null}
            {barCouncil ? (
              <div className="flex items-center gap-2">
                <Scale className="h-3.5 w-3.5 text-[#8B7D99]" />
                <span className="truncate">{barCouncil}</span>
              </div>
            ) : null}
            {region ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#8B7D99]" />
                <span className="truncate">{region}</span>
              </div>
            ) : null}
          </div>

          {href ? (
            <div className="mt-4 border-t border-[#4C2F5E]/8 pt-3">
              <Link
                href={href}
                className="inline-flex w-full items-center justify-center rounded-[12px] border border-[#4C2F5E]/12 bg-[#F7F3FA] px-3 py-2.5 text-sm font-semibold text-[#4C2F5E] transition hover:bg-white hover:border-[#4C2F5E]/22"
                onClick={() => setIsOpen(false)}
              >
                Open profile
              </Link>
            </div>
          ) : null}
        </div>,
        document.body,
      )
    : null;

  const trigger = href ? (
    <Link href={href} className={triggerClassName}>
      {children}
    </Link>
  ) : (
    <div className={triggerClassName}>{children}</div>
  );

  return (
    <>
      <div
        ref={wrapperRef}
        className="relative max-w-full"
        onMouseEnter={openPanel}
        onMouseLeave={scheduleClose}
        onFocusCapture={openPanel}
        onBlurCapture={handleBlur}
      >
        {trigger}
      </div>
      {panel}
    </>
  );
}
