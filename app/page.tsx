'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  Sparkles,
  SquareUserRound,
  Scale,
} from 'lucide-react';

const accessPoints = [
  {
    href: '/adminlogin',
    label: 'Admin Console',
    description: 'Oversee verification, moderation, reporting, and platform trust operations.',
    icon: ShieldCheck,
    accent: 'from-[#0f1c2a] to-[#203a58]',
    meta: 'Operations',
  },
  {
    href: '/lawyerlogin',
    label: 'Lawyer Workspace',
    description: 'Manage professional discussions, answer community questions, and grow legal authority.',
    icon: Scale,
    accent: 'from-[#1d3149] to-[#b08c54]',
    meta: 'Professional',
  },
  {
    href: '/clientlogin',
    label: 'Client Access',
    description: 'Enter a calmer, easier legal experience for asking questions and following advice.',
    icon: SquareUserRound,
    accent: 'from-[#2b4567] to-[#8aa0b8]',
    meta: 'Public',
  },
];

export default function StartPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(176,140,84,0.18),_transparent_22%),linear-gradient(180deg,#f8f4ee_0%,#efe7dc_100%)] px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-[36px] border border-[rgba(12,26,42,0.10)] bg-white/70 shadow-[0_36px_100px_rgba(15,23,42,0.12)] backdrop-blur">
        <section className="relative overflow-hidden bg-[linear-gradient(160deg,#0d1b2a_0%,#12263b_55%,#1e3956_100%)] px-6 py-8 text-white md:px-10 md:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(176,140,84,0.30),_transparent_24%),radial-gradient(circle_at_left,_rgba(255,255,255,0.08),_transparent_32%)]" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl">
              <div className="legal-kicker border-white/15 bg-white/8 text-[#f1ddba]">
                <Sparkles className="h-3.5 w-3.5" />
                Legal Hub
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white md:text-6xl">
                Modern legal collaboration with a calmer, more credible interface.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
                Legal Hub now presents every major entry point with a cleaner trust layer, stronger information hierarchy, and
                a design language suitable for law firms, administrators, and everyday people seeking legal guidance.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['Trust-first styling', 'Built for serious legal workflows without feeling cold or outdated.'],
                ['Unified product language', 'Reusable theme foundations for upcoming modules and platform expansion.'],
                ['Accessible interaction flow', 'Clearer calls to action, lighter cognitive load, stronger visual rhythm.'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex-1 px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="legal-kicker">Choose access</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#102033]">
                Enter the workspace that matches your role.
              </h2>
            </div>
            <div className="max-w-xl text-sm leading-7 text-slate-600">
              Each entry point now shares the same professional core: structured cards, stronger visual depth, more deliberate motion,
              and reusable styling decisions for future modules.
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {accessPoints.map(({ href, label, description, icon: Icon, accent, meta }) => (
              <Link
                key={href}
                href={href}
                className="group legal-panel flex h-full flex-col overflow-hidden rounded-[30px] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(15,23,42,0.16)]"
              >
                <div className={`relative bg-gradient-to-br ${accent} p-6 text-white`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_34%)]" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/20 bg-white/10">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                      {meta}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#102033]">{label}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{description}</p>
                  <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#8A6C3F]">
                    Continue
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 rounded-[28px] border border-[rgba(12,26,42,0.08)] bg-[linear-gradient(180deg,#fff_0%,#f8f4ee_100%)] px-6 py-5 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex items-center gap-3 font-medium text-[#102033]">
              <Building2 className="h-5 w-5 text-[#8A6C3F]" />
              Designed for legal trust, public clarity, and future product scale.
            </div>
            <div>Role-specific workspaces share one reusable visual system for the rest of the platform.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
