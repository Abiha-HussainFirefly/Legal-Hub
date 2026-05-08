import { getAdminSystemJobsData } from "@/lib/services/admin.server";
import { Activity, ArrowUpRight, Bot, FileClock, Gavel, Mail, SearchCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminSystemJobsPage() {
  const data = await getAdminSystemJobsData();

  const summaryCards = [
    {
      title: "Pending File Scans",
      value: data.summary.pendingFileScans,
      detail: `${data.summary.failedFileScans} failed scans`,
      icon: FileClock,
    },
    {
      title: "Pending AI Summaries",
      value: data.summary.pendingAiSummaries,
      detail: `${data.summary.failedAiSummaries} failed summaries`,
      icon: Bot,
    },
    {
      title: "Pending Verification",
      value: data.summary.pendingVerification,
      detail: "Open and under-review requests",
      icon: ShieldAlert,
    },
    {
      title: "Pending Case Review",
      value: data.summary.pendingCaseReview,
      detail: "Repository items awaiting reviewer action",
      icon: Gavel,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">System Jobs & Monitoring</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Queue health where the schema has truth, explicit gaps where it does not.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This page is intentionally read-only. It surfaces database-backed operational backlogs for file scanning,
              AI summaries, verification review, case review, and moderation, while clearly separating the external
              monitoring surfaces that still need provider or worker telemetry outside Prisma.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 text-sm text-slate-600">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Generated</p>
            <p className="mt-2 text-base font-semibold text-[#2F1D3B]">{formatDateTime(data.generatedAt)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} className="legal-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{card.title}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{card.value}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{card.detail}</p>
                </div>
                <div className="rounded-[18px] bg-[#F4EFF8] p-3 text-[#4C2F5E]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="legal-panel p-5 md:p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-[#4C2F5E]" />
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Schema-Backed Queue Health</h2>
                <p className="mt-1 text-sm leading-7 text-slate-600">
                  These counts come directly from runtime tables and can be triaged from the linked admin queues.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {data.dbQueues.map((queue) => (
                <div key={queue.key} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            queue.status === "attention" ? "bg-[#FCE8E6] text-[#A33A31]" : "bg-[#E8F4EF] text-[#1B7A5A]"
                          }`}
                        >
                          {queue.status === "attention" ? "Attention" : "Healthy"}
                        </span>
                        <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-1 text-xs font-semibold text-[#4C2F5E]">
                          {queue.count} open
                        </span>
                        <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-1 text-xs font-semibold text-[#4C2F5E]">
                          Oldest {queue.oldestAge}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-[#2F1D3B]">{queue.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{queue.detail}</p>
                    </div>

                    <Link href={queue.href} className="legal-button-secondary text-sm">
                      Open Queue
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="legal-panel p-5 md:p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#4C2F5E]" />
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Recent Throughput</h2>
                <p className="mt-1 text-sm leading-7 text-slate-600">
                  Lightweight production signals that help separate backlog from actual output.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {data.throughput.map((item) => (
                <div key={item.label} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{item.value}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="legal-panel p-5 md:p-6">
          <div className="flex items-center gap-3">
            <SearchCheck className="h-5 w-5 text-[#4C2F5E]" />
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">External Monitoring Still Required</h2>
              <p className="mt-1 text-sm leading-7 text-slate-600">
                These areas should not be faked in the admin portal until a real job or telemetry subsystem exists.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {data.unsupportedSurfaces.map((item) => (
              <div key={item.title} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "external" ? "bg-[#EEF2F7] text-[#36506E]" : "bg-[#F6EBD6] text-[#8B642A]"
                    }`}
                  >
                    {item.status === "external" ? "External telemetry" : "Not modeled"}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-[#2F1D3B]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
