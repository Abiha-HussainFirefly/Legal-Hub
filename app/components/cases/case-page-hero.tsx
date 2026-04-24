'use client';

import type { LucideIcon } from 'lucide-react';

interface HeroMetric {
  label: string;
  value: string;
  detail?: string;
  icon?: LucideIcon;
}

export default function CasePageHero({
  kicker,
  title,
  description,
  badges,
  actions,
  aside,
  metrics,
}: {
  kicker: string;
  title: string;
  description: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  metrics?: HeroMetric[];
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[#4C2F5E]/10 bg-white shadow-[0_16px_40px_rgba(76,47,94,0.07)]">
      <div className="bg-[linear-gradient(135deg,#4C2F5E_0%,#735092_100%)] px-6 py-7 text-white md:px-8 md:py-8">
        <div className={`grid gap-6 ${aside ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
          <div>
            {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
            <p className="mt-4 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
              {kicker}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-4xl text-sm leading-8 text-white/80 md:text-base">{description}</p>
            {actions ? <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>

          {aside ? <div className="rounded-[26px] border border-white/12 bg-white/10 p-5 backdrop-blur">{aside}</div> : null}
        </div>
      </div>

      {metrics?.length ? (
        <div className="grid gap-3 border-t border-[#4C2F5E]/10 bg-[#FBF9FD] px-6 py-4 md:grid-cols-2 xl:grid-cols-4 md:px-8">
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <div key={label} className="rounded-[20px] border border-[#4C2F5E]/8 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-[#2F1D3B]">{value}</p>
                </div>
                {Icon ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F1EAF6] text-[#4C2F5E]">
                    <Icon className="h-4 w-4" />
                  </div>
                ) : null}
              </div>
              {detail ? <p className="mt-2 text-xs leading-6 text-[#706181]">{detail}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
