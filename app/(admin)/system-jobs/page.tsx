import AdminPagination from "@/app/components/admin/AdminPagination";
import { getAdminSystemJobsData } from "@/lib/services/admin.server";
import { Activity, ArrowUpRight, Bot, FileClock, Gavel, Mail, SearchCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";

const TABLE_PAGE_SIZE = 5;

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePageParam(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildPageHref(
  searchParams: Record<string, string | string[] | undefined>,
  overrides: Record<string, number>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const firstValue = getFirstParam(value);
    if (firstValue) params.set(key, firstValue);
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value <= 1) {
      params.delete(key);
      continue;
    }

    params.set(key, `${value}`);
  }

  const query = params.toString();
  return query ? `/system-jobs?${query}` : "/system-jobs";
}

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedRows = rows.slice(startIndex, startIndex + pageSize);

  return {
    rows: pagedRows,
    currentPage,
    total,
    totalPages,
    start: total === 0 ? 0 : startIndex + 1,
    end: total === 0 ? 0 : startIndex + pagedRows.length,
  };
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const adjustedStart = Math.max(1, endPage - 4);

  return Array.from({ length: endPage - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminSystemJobsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminSystemJobsData();
  const dbQueueTable = paginateRows(data.dbQueues, parsePageParam(getFirstParam(resolvedSearchParams.dbQueuePage)), TABLE_PAGE_SIZE);
  const throughputTable = paginateRows(data.throughput, parsePageParam(getFirstParam(resolvedSearchParams.throughputPage)), TABLE_PAGE_SIZE);
  const monitoringTable = paginateRows(
    data.unsupportedSurfaces,
    parsePageParam(getFirstParam(resolvedSearchParams.monitoringPage)),
    TABLE_PAGE_SIZE,
  );

  const dbQueuePages = buildVisiblePages(dbQueueTable.currentPage, dbQueueTable.totalPages);
  const throughputPages = buildVisiblePages(throughputTable.currentPage, throughputTable.totalPages);
  const monitoringPages = buildVisiblePages(monitoringTable.currentPage, monitoringTable.totalPages);

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

          <div className="legal-soft-panel px-5 py-4 text-sm text-slate-600">
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
                <div className="workspace-pill p-3">
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

            <div className="legal-table-wrap mt-5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="legal-table min-w-full table-auto">
                  <thead>
                    <tr>
                      <th className="min-w-[200px] px-6 py-4 text-left text-sm font-semibold">Queue</th>
                      <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Open Items</th>
                      <th className="min-w-[140px] px-6 py-4 text-left text-sm font-semibold">Oldest Item</th>
                      <th className="min-w-[320px] px-6 py-4 text-left text-sm font-semibold">Detail</th>
                      <th className="min-w-[140px] px-6 py-4 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dbQueueTable.rows.map((queue) => (
                      <tr key={queue.key}>
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm font-semibold text-[#2F1D3B]">{queue.title}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              queue.status === "attention" ? "bg-[#FCE8E6] text-[#A33A31]" : "bg-[#E8F4EF] text-[#1B7A5A]"
                            }`}
                          >
                            {queue.status === "attention" ? "Attention" : "Healthy"}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{queue.count}</td>
                        <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{queue.oldestAge}</td>
                        <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{queue.detail}</td>
                        <td className="px-6 py-4 align-top">
                          <Link href={queue.href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#4C2F5E] hover:text-[#2F1D3B]">
                            Open queue
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <AdminPagination
                start={dbQueueTable.start}
                end={dbQueueTable.end}
                total={dbQueueTable.total}
                currentPage={dbQueueTable.currentPage}
                pageLinks={dbQueuePages.map((pageNumber) => ({
                  pageNumber,
                  href: buildPageHref(resolvedSearchParams, { dbQueuePage: pageNumber }),
                }))}
                previousHref={buildPageHref(resolvedSearchParams, {
                  dbQueuePage: Math.max(1, dbQueueTable.currentPage - 1),
                })}
                nextHref={buildPageHref(resolvedSearchParams, {
                  dbQueuePage: Math.min(dbQueueTable.totalPages, dbQueueTable.currentPage + 1),
                })}
                isFirstPage={dbQueueTable.currentPage === 1}
                isLastPage={dbQueueTable.currentPage === dbQueueTable.totalPages}
              />
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

            <div className="legal-table-wrap mt-5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="legal-table min-w-full table-auto">
                  <thead>
                    <tr>
                      <th className="min-w-[220px] px-6 py-4 text-left text-sm font-semibold">Metric</th>
                      <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Value</th>
                      <th className="min-w-[320px] px-6 py-4 text-left text-sm font-semibold">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {throughputTable.rows.map((item) => (
                      <tr key={item.label}>
                        <td className="px-6 py-4 align-top text-sm font-semibold leading-6 text-[#2F1D3B]">{item.label}</td>
                        <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{item.value}</td>
                        <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{item.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <AdminPagination
                start={throughputTable.start}
                end={throughputTable.end}
                total={throughputTable.total}
                currentPage={throughputTable.currentPage}
                pageLinks={throughputPages.map((pageNumber) => ({
                  pageNumber,
                  href: buildPageHref(resolvedSearchParams, { throughputPage: pageNumber }),
                }))}
                previousHref={buildPageHref(resolvedSearchParams, {
                  throughputPage: Math.max(1, throughputTable.currentPage - 1),
                })}
                nextHref={buildPageHref(resolvedSearchParams, {
                  throughputPage: Math.min(throughputTable.totalPages, throughputTable.currentPage + 1),
                })}
                isFirstPage={throughputTable.currentPage === 1}
                isLastPage={throughputTable.currentPage === throughputTable.totalPages}
              />
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

          <div className="legal-table-wrap mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="legal-table min-w-full table-auto">
                <thead>
                  <tr>
                    <th className="min-w-[220px] px-6 py-4 text-left text-sm font-semibold">Surface</th>
                    <th className="min-w-[150px] px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="min-w-[340px] px-6 py-4 text-left text-sm font-semibold">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monitoringTable.rows.map((item) => (
                    <tr key={item.title}>
                      <td className="px-6 py-4 align-top text-sm font-semibold leading-6 text-[#2F1D3B]">{item.title}</td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "external" ? "bg-[#EEF2F7] text-[#36506E]" : "bg-[#F6EBD6] text-[#8B642A]"
                          }`}
                        >
                          {item.status === "external" ? "External telemetry" : "Not modeled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{item.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              start={monitoringTable.start}
              end={monitoringTable.end}
              total={monitoringTable.total}
              currentPage={monitoringTable.currentPage}
              pageLinks={monitoringPages.map((pageNumber) => ({
                pageNumber,
                href: buildPageHref(resolvedSearchParams, { monitoringPage: pageNumber }),
              }))}
              previousHref={buildPageHref(resolvedSearchParams, {
                monitoringPage: Math.max(1, monitoringTable.currentPage - 1),
              })}
              nextHref={buildPageHref(resolvedSearchParams, {
                monitoringPage: Math.min(monitoringTable.totalPages, monitoringTable.currentPage + 1),
              })}
              isFirstPage={monitoringTable.currentPage === 1}
              isLastPage={monitoringTable.currentPage === monitoringTable.totalPages}
            />
          </div>
        </section>
      </section>
    </div>
  );
}
