import { adminFileSecurityAction } from "@/app/actions/admin-files";
import AdminPagination from "@/app/components/admin/AdminPagination";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminFilesPageData } from "@/lib/services/admin.server";
import { AlertTriangle, FileClock, FolderSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: Date | null) {
  if (!value) return "Not completed";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatBytes(value: number | null) {
  if (!value) return "Unknown size";
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

function prettyText(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildQueryString(
  filters: {
    q: string;
    scanStatus: string;
    parentType: string;
    page: number;
  },
  overrides: Partial<{
    q: string;
    scanStatus: string;
    parentType: string;
    page: number;
  }> = {},
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...overrides };

  if (next.q) params.set("q", next.q);
  if (next.scanStatus) params.set("scanStatus", next.scanStatus);
  if (next.parentType) params.set("parentType", next.parentType);
  if (next.page > 1) params.set("page", `${next.page}`);

  const query = params.toString();
  return query ? `/files?${query}` : "/files";
}

function scanStatusClasses(value: string) {
  if (value === "CLEAN") return "bg-[#E6F5EF] text-[#0E7A55]";
  if (value === "INFECTED" || value === "FAILED") return "bg-[#FCE8E6] text-[#A33A31]";
  return "bg-[#F6EBD6] text-[#8B642A]";
}

export default async function FilesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminFilesPageData({
    q: getFirstParam(resolvedSearchParams.q),
    scanStatus: getFirstParam(resolvedSearchParams.scanStatus),
    parentType: getFirstParam(resolvedSearchParams.parentType),
    page: Number.parseInt(getFirstParam(resolvedSearchParams.page) ?? "1", 10),
  });

  const currentFilters = data.filters;
  const visiblePages = Array.from({ length: data.pagination.totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentFilters.page - 3),
    currentFilters.page + 2,
  );

  const summaryCards = [
    {
      title: "Pending Scan",
      value: formatNumber(data.summary.pendingScan),
      detail: "Uploads still waiting on malware scan completion",
      icon: FileClock,
    },
    {
      title: "Infected Files",
      value: formatNumber(data.summary.infected),
      detail: "Files that must stay quarantined from public surfaces",
      icon: AlertTriangle,
    },
    {
      title: "Failed Scans",
      value: formatNumber(data.summary.failed),
      detail: "Uploads requiring retry or manual investigation",
      icon: ShieldCheck,
    },
    {
      title: "Orphaned Assets",
      value: formatNumber(data.summary.orphaned),
      detail: "Stored files without any current attachment or linkage row",
      icon: FolderSearch,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Files & Storage Security</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Review uploaded assets, scan posture, and attachment reachability.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This page reads `FileAsset`, attachment linkage rows, verification documents, and case source files
              directly so admins can audit where a file is exposed before taking action elsewhere.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 text-sm text-slate-600">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Current result window</p>
            <p className="mt-2 text-base font-semibold text-[#2F1D3B]">
              {data.pagination.start} to {data.pagination.end} of {formatNumber(data.pagination.total)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <section className="legal-panel p-4 md:p-6">
        <form className="grid gap-4 xl:grid-cols-4">
          <AdminSearchField
            defaultValue={currentFilters.q}
            placeholder="Search filename, MIME, checksum, or uploader"
            wrapperClassName="xl:col-span-2"
          />

          <select name="scanStatus" defaultValue={currentFilters.scanStatus} className="legal-field">
            <option value="">All scan states</option>
            <option value="PENDING">Pending</option>
            <option value="CLEAN">Clean</option>
            <option value="INFECTED">Infected</option>
            <option value="FAILED">Failed</option>
          </select>

          <select name="parentType" defaultValue={currentFilters.parentType} className="legal-field">
            <option value="">All parent types</option>
            <option value="discussion">Discussion attachment</option>
            <option value="answer">Answer attachment</option>
            <option value="comment">Comment attachment</option>
            <option value="case">Case-linked file</option>
            <option value="verification">Verification document</option>
            <option value="orphaned">Orphaned asset</option>
          </select>

          <div className="flex items-center gap-3 xl:col-span-4">
            <button type="submit" className="legal-button-primary w-full xl:w-auto">
              Apply Filters
            </button>
            <Link href="/files" className="legal-button-secondary w-full xl:w-auto">
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="legal-panel px-5 py-4 text-sm leading-7 text-slate-600">
        <p>
          `Mark for Re-scan` resets the scanner workflow and removes direct public reachability. `Quarantine Asset`
          keeps linkage rows intact but forces the asset out of public reach. `Detach Public Linkages` removes
          discussion, answer, comment, and case-source linkage rows only; secure verification-document rows are not
          deleted by that action.
        </p>
      </section>

      <section className="legal-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="legal-table w-full min-w-[1040px]">
            <thead>
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Asset</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Uploader</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Scan Status</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Exposure</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Linked Parents</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Created</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE7F2]">
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm font-semibold text-[#2F1D3B]">{row.originalFileName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.mimeType ?? "Unknown MIME"} / {formatBytes(row.fileSize)}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{row.uploaderName}</td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${scanStatusClasses(row.scanStatus)}`}>
                        {prettyText(row.scanStatus)}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(row.scanCompletedAt)}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      <p>{row.isPublic ? "Publicly reachable" : "Not directly public"}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.parentCount} linkage record{row.parentCount === 1 ? "" : "s"}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      {row.parentSummaries.length ? (
                        <div className="space-y-1">
                          {row.parentSummaries.map((parent, index) => (
                            <div key={`${row.id}-${parent.type}-${index}`}>
                              <Link href={parent.href} className="font-medium text-[#4C2F5E] hover:text-[#2F1D3B]">
                                {parent.label}
                              </Link>
                              <p className="text-xs text-slate-500">{prettyText(parent.type)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">No linked parent rows</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-3">
                        <form action={adminFileSecurityAction} className="space-y-2">
                          <input type="hidden" name="assetId" value={row.id} />
                          <input type="hidden" name="intent" value="mark_for_rescan" />
                          <input
                            name="reason"
                            placeholder="Reason for re-scan"
                            className="legal-field w-full min-w-[220px] text-sm"
                            required
                          />
                          <button type="submit" className="legal-button-primary w-full text-xs">
                            Mark for Re-scan
                          </button>
                        </form>

                        <form action={adminFileSecurityAction} className="space-y-2">
                          <input type="hidden" name="assetId" value={row.id} />
                          <input type="hidden" name="intent" value="quarantine" />
                          <input
                            name="reason"
                            placeholder="Reason for quarantine"
                            className="legal-field w-full text-sm"
                            required
                          />
                          <button type="submit" className="legal-button-secondary w-full text-xs">
                            Quarantine Asset
                          </button>
                        </form>

                        <form action={adminFileSecurityAction} className="space-y-2">
                          <input type="hidden" name="assetId" value={row.id} />
                          <input type="hidden" name="intent" value="detach_public_linkages" />
                          <input
                            name="reason"
                            placeholder="Reason for detaching linkages"
                            className="legal-field w-full text-sm"
                            required
                          />
                          <button type="submit" className="legal-button-secondary w-full text-xs">
                            Detach Public Linkages
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No file assets match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          start={data.pagination.start}
          end={data.pagination.end}
          total={data.pagination.total}
          currentPage={currentFilters.page}
          pageLinks={visiblePages.map((pageNumber) => ({
            pageNumber,
            href: buildQueryString(currentFilters, { page: pageNumber }),
          }))}
          previousHref={buildQueryString(currentFilters, { page: Math.max(1, currentFilters.page - 1) })}
          nextHref={buildQueryString(currentFilters, { page: Math.min(data.pagination.totalPages, currentFilters.page + 1) })}
          isFirstPage={currentFilters.page === 1}
          isLastPage={currentFilters.page === data.pagination.totalPages}
        />
      </section>
    </div>
  );
}
