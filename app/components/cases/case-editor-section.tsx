'use client';

export default function CaseEditorSection({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-6 shadow-[0_12px_30px_rgba(76,47,94,0.05)] md:p-7">
      <div className="mb-5 border-b border-[#4C2F5E]/8 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{kicker}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-7 text-[#706181]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
