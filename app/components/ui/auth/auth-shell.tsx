'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface AuthShellProps {
  portalLabel: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Trusted access',
    description: 'Multi-role entry with auditable identity and secure session flows.',
  },
  {
    icon: Scale,
    title: 'Legal-first workspace',
    description: 'Clear hierarchy for experts, administrators, and everyday users.',
  },
  {
    icon: LockKeyhole,
    title: 'Confidential by default',
    description: 'Professional visual language built for sensitive legal discussions.',
  },
];

export default function AuthShell({
  portalLabel,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(183,145,79,0.16),_transparent_24%),linear-gradient(180deg,#f8f4ee_0%,#efe8de_100%)] px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[32px] border border-[rgba(12,26,42,0.10)] bg-white/75 shadow-[0_30px_100px_rgba(12,26,42,0.12)] backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(160deg,#0d1b2a_0%,#14263c_48%,#203a58_100%)] px-6 py-8 text-white md:px-10 md:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(194,160,92,0.24),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(228,215,196,0.10),_transparent_30%)]" />
          <div className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-white/30 to-transparent md:block" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/88 transition hover:bg-white/10"
              >
                <Image
                  src="/logo-legal-hub.png"
                  alt="Legal Hub"
                  width={132}
                  height={34}
                  className="h-auto w-[110px] brightness-0 invert"
                />
              </Link>

              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(194,160,92,0.4)] bg-[rgba(194,160,92,0.16)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[#f3dfb4]">
                <Building2 className="h-3.5 w-3.5" />
                {portalLabel}
              </div>
            </div>

            <div className="mt-10 max-w-xl md:mt-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs uppercase tracking-[0.28em] text-white/65">
                <Sparkles className="h-3.5 w-3.5 text-[#d1b078]" />
                Legal Hub Workspace
              </div>

              <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.04em] text-white md:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 md:text-lg">
                {description}
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:mt-12">
              {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                <div
                  key={itemTitle}
                  className="rounded-3xl border border-white/10 bg-white/7 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(194,160,92,0.16)] text-[#f3dfb4]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{itemTitle}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{itemDescription}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto hidden items-center justify-between border-t border-white/10 pt-6 text-sm text-slate-300 md:flex">
              <p>Designed for law firms, platform operators, and public legal guidance.</p>
              <div className="inline-flex items-center gap-2 text-[#f3dfb4]">
                Review standards
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,244,238,0.96)_100%)] px-5 py-8 md:px-10 md:py-10">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[28px] border border-[rgba(12,26,42,0.08)] bg-white px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:px-7 md:py-8">
              {children}
            </div>
            {footer ? <div className="mt-4 text-center text-sm text-slate-600">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
