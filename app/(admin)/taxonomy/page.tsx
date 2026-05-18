import { adminReferenceDataAction } from "@/app/actions/admin-platform";
import AdminPagination from "@/app/components/admin/AdminPagination";
import { getAdminTaxonomyPageData } from "@/lib/services/admin.server";
import { FileSpreadsheet, MapPinned, Scale, Tags } from "lucide-react";

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
  return query ? `/taxonomy?${query}` : "/taxonomy";
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

function prettyText(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusBadge(isActive: boolean) {
  return isActive ? "bg-[#E6F5EF] text-[#0E7A55]" : "bg-[#FCE8E6] text-[#A33A31]";
}

function TaxonomyCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-panel p-5 md:p-6">
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function TaxonomyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminTaxonomyPageData();

  const categoryTable = paginateRows(data.categories, parsePageParam(getFirstParam(resolvedSearchParams.categoriesPage)), TABLE_PAGE_SIZE);
  const tagTable      = paginateRows(data.tags,       parsePageParam(getFirstParam(resolvedSearchParams.tagsPage)),       TABLE_PAGE_SIZE);
  const regionTable   = paginateRows(data.regions,    parsePageParam(getFirstParam(resolvedSearchParams.regionsPage)),    TABLE_PAGE_SIZE);
  const courtTable    = paginateRows(data.courts,     parsePageParam(getFirstParam(resolvedSearchParams.courtsPage)),     TABLE_PAGE_SIZE);

  const categoryPages = buildVisiblePages(categoryTable.currentPage, categoryTable.totalPages);
  const tagPages      = buildVisiblePages(tagTable.currentPage,      tagTable.totalPages);
  const regionPages   = buildVisiblePages(regionTable.currentPage,   regionTable.totalPages);
  const courtPages    = buildVisiblePages(courtTable.currentPage,     courtTable.totalPages);

  
  const allRegions = data.regions;

  const summaryCards = [
    { title: "Categories", value: data.summary.categories, detail: `${data.summary.inactiveCategories} inactive`, icon: Scale },
    { title: "Tags",       value: data.summary.tags,       detail: `${data.summary.inactiveTags} inactive`,       icon: Tags },
    { title: "Regions",    value: data.summary.regions,    detail: `${data.summary.inactiveRegions} inactive`,    icon: MapPinned },
    { title: "Courts",     value: data.summary.courts,     detail: `${data.summary.inactiveCourts} inactive`,     icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <section className="legal-panel px-6 py-7 md:px-8">
        <p className="legal-kicker">Taxonomy & Seed Data</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
          Reference data governance with clear dependency posture.
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
          Categories, tags, regions, courts, and other stable reference entities should be curated here through
          controlled create and deactivate workflows. Runtime rows such as sessions, audit logs, reports, alerts, and
          view telemetry stay visible elsewhere but are intentionally not editable from this surface.
        </p>
      </section>

      {/* ── Summary cards ── */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="legal-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{card.title}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#102033]">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
                </div>
                <div className="workspace-pill p-3">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Create forms ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Create Category */}
        <TaxonomyCard
          title="Create Category"
          description="Use this for new legal content lanes or practice-area references. Prefer deactivation over deletion once referenced."
        >
          <form action={adminReferenceDataAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="entity" value="category" />
            <input type="hidden" name="intent" value="create" />
            <input name="name" placeholder="Category name" className="legal-field" required />
            <input name="slug" placeholder="category-slug (auto-generated)" className="legal-field" />
            <select name="scope" className="legal-field">
              <option value="BOTH">Discussion and case</option>
              <option value="DISCUSSION">Discussion only</option>
              <option value="CASE">Case only</option>
              <option value="LAWYER_PRACTICE">Lawyer practice</option>
            </select>
            <input name="reason" placeholder="Reason for creation" className="legal-field" required />
            <button type="submit" className="legal-button-primary md:col-span-2 md:w-fit">
              Create Category
            </button>
          </form>
        </TaxonomyCard>

        {/* Create Tag */}
        <TaxonomyCard
          title="Create Tag"
          description="Curate topic coverage carefully to avoid synonym sprawl. Use consistent tag types for ranking and discovery quality."
        >
          <form action={adminReferenceDataAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="entity" value="tag" />
            <input type="hidden" name="intent" value="create" />
            <input name="name" placeholder="Tag name" className="legal-field" required />
            <input name="slug" placeholder="tag-slug (auto-generated)" className="legal-field" />
            <select name="tagType" className="legal-field">
              <option value="TOPIC">Topic</option>
              <option value="PRACTICE_AREA">Practice area</option>
              <option value="TREND">Trend</option>
              <option value="SPECIALTY">Specialty</option>
              <option value="LEGAL_CONCEPT">Legal concept</option>
            </select>
            <input name="reason" placeholder="Reason for creation" className="legal-field" required />
            <button type="submit" className="legal-button-primary md:col-span-2 md:w-fit">
              Create Tag
            </button>
          </form>
        </TaxonomyCard>

        {/* Create Region */}
        <TaxonomyCard
          title="Create Region"
          description="Region hierarchy affects lawyer trust, case routing, and court mapping. Keep structure consistent."
        >
          <form action={adminReferenceDataAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="entity" value="region" />
            <input type="hidden" name="intent" value="create" />
            <input name="name" placeholder="Region name" className="legal-field" required />
            <input name="slug" placeholder="region-slug (auto-generated)" className="legal-field" />
            <select name="regionType" className="legal-field">
              <option value="STATE">State</option>
              <option value="COUNTRY">Country</option>
              <option value="FEDERAL">Federal</option>
              <option value="PROVINCE">Province</option>
              <option value="CITY">City</option>
              <option value="DISTRICT">District</option>
            </select>
            <input name="countryCode" placeholder="Country code e.g. PK" className="legal-field" />
            <input name="reason" placeholder="Reason for creation" className="legal-field md:col-span-2" required />
            <button type="submit" className="legal-button-primary md:col-span-2 md:w-fit">
              Create Region
            </button>
          </form>
        </TaxonomyCard>

        
        <TaxonomyCard
          title="Create Court"
          description="Court-to-region integrity matters for repository classification and legal navigation."
        >
          <form action={adminReferenceDataAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="entity" value="court" />
            <input type="hidden" name="intent" value="create" />
            <input name="name" placeholder="Court name" className="legal-field" required />
            <input name="slug" placeholder="court-slug (auto-generated)" className="legal-field" />
            <select name="courtLevel" className="legal-field">
              <option value="OTHER">Other</option>
              <option value="LOCAL">Local</option>
              <option value="DISTRICT">District</option>
              <option value="HIGH">High</option>
              <option value="APPELLATE">Appellate</option>
              <option value="SUPREME">Supreme</option>
              <option value="TRIBUNAL">Tribunal</option>
            </select>

            
            <select name="regionId" className="legal-field">
              <option value="">No region (national)</option>
              {allRegions
                .filter((r) => r.isActive)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name} ({prettyText(region.type)})
                  </option>
                ))}
            </select>

            <input name="websiteUrl" placeholder="Official website URL" className="legal-field md:col-span-2" />
            <input name="reason" placeholder="Reason for creation" className="legal-field md:col-span-2" required />
            <button type="submit" className="legal-button-primary md:col-span-2 md:w-fit">
              Create Court
            </button>
          </form>
        </TaxonomyCard>
      </div>

      {/* ── Tables ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Categories table */}
        <TaxonomyCard
          title="Categories"
          description="Dependency-aware deactivation is safer than deletion once discussions, cases, or lawyer-practice references exist."
        >
          <div className="legal-table-wrap overflow-hidden">
            <div className="overflow-x-auto">
              <table className="legal-table min-w-full table-auto">
                <thead>
                  <tr>
                    <th className="min-w-[180px] px-6 py-4 text-left text-sm font-semibold">Category</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Scope</th>
                    <th className="min-w-[170px] px-6 py-4 text-left text-sm font-semibold">Slug</th>
                    <th className="min-w-[130px] px-6 py-4 text-left text-sm font-semibold">Parent</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Usage</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="min-w-[280px] px-6 py-4 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categoryTable.rows.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 align-top">
                        <p className="text-sm font-semibold text-[#2F1D3B]">{category.name}</p>
                        <p className="mt-1 text-xs text-slate-500">Sort order {category.sortOrder}</p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="workspace-pill">{prettyText(category.scope)}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">`{category.slug}`</td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{category.parentName ?? "None"}</td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{category.usageCount}</td>
                      <td className="px-6 py-4 align-top">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(category.isActive)}`}>
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <form action={adminReferenceDataAction} className="space-y-3">
                          <input type="hidden" name="entity" value="category" />
                          <input type="hidden" name="intent" value="toggle_active" />
                          <input type="hidden" name="recordId" value={category.id} />
                          <input type="hidden" name="nextActive" value={category.isActive ? "false" : "true"} />
                          <input name="reason" placeholder="Reason for status change" className="legal-field w-full min-w-[220px]" required />
                          <button type="submit" className="legal-button-secondary text-sm">
                            {category.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              start={categoryTable.start}
              end={categoryTable.end}
              total={categoryTable.total}
              currentPage={categoryTable.currentPage}
              pageLinks={categoryPages.map((pageNumber) => ({
                pageNumber,
                href: buildPageHref(resolvedSearchParams, { categoriesPage: pageNumber }),
              }))}
              previousHref={buildPageHref(resolvedSearchParams, { categoriesPage: Math.max(1, categoryTable.currentPage - 1) })}
              nextHref={buildPageHref(resolvedSearchParams, { categoriesPage: Math.min(categoryTable.totalPages, categoryTable.currentPage + 1) })}
              isFirstPage={categoryTable.currentPage === 1}
              isLastPage={categoryTable.currentPage === categoryTable.totalPages}
            />
          </div>
        </TaxonomyCard>

        {/* Tags table */}
        <TaxonomyCard
          title="Tags"
          description="Use deactivation to retire noisy labels. Merge and bulk-curation workflows remain a recommended next step."
        >
          <div className="legal-table-wrap overflow-hidden">
            <div className="overflow-x-auto">
              <table className="legal-table min-w-full table-auto">
                <thead>
                  <tr>
                    <th className="min-w-[180px] px-6 py-4 text-left text-sm font-semibold">Tag</th>
                    <th className="min-w-[130px] px-6 py-4 text-left text-sm font-semibold">Type</th>
                    <th className="min-w-[170px] px-6 py-4 text-left text-sm font-semibold">Slug</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Discussions</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Cases</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="min-w-[280px] px-6 py-4 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tagTable.rows.map((tag) => (
                    <tr key={tag.id}>
                      <td className="px-6 py-4 align-top text-sm font-semibold leading-6 text-[#2F1D3B]">{tag.name}</td>
                      <td className="px-6 py-4 align-top">
                        <span className="workspace-pill">{prettyText(tag.type)}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">`{tag.slug}`</td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{tag.discussionCount}</td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{tag.caseCount}</td>
                      <td className="px-6 py-4 align-top">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(tag.isActive)}`}>
                          {tag.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <form action={adminReferenceDataAction} className="space-y-3">
                          <input type="hidden" name="entity" value="tag" />
                          <input type="hidden" name="intent" value="toggle_active" />
                          <input type="hidden" name="recordId" value={tag.id} />
                          <input type="hidden" name="nextActive" value={tag.isActive ? "false" : "true"} />
                          <input name="reason" placeholder="Reason for status change" className="legal-field w-full min-w-[220px]" required />
                          <button type="submit" className="legal-button-secondary text-sm">
                            {tag.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              start={tagTable.start}
              end={tagTable.end}
              total={tagTable.total}
              currentPage={tagTable.currentPage}
              pageLinks={tagPages.map((pageNumber) => ({
                pageNumber,
                href: buildPageHref(resolvedSearchParams, { tagsPage: pageNumber }),
              }))}
              previousHref={buildPageHref(resolvedSearchParams, { tagsPage: Math.max(1, tagTable.currentPage - 1) })}
              nextHref={buildPageHref(resolvedSearchParams, { tagsPage: Math.min(tagTable.totalPages, tagTable.currentPage + 1) })}
              isFirstPage={tagTable.currentPage === 1}
              isLastPage={tagTable.currentPage === tagTable.totalPages}
            />
          </div>
        </TaxonomyCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Regions table */}
        <TaxonomyCard
          title="Regions"
          description="Region hierarchy influences courts, practice areas, and legal trust views."
        >
          <div className="legal-table-wrap overflow-hidden">
            <div className="overflow-x-auto">
              <table className="legal-table min-w-full table-auto">
                <thead>
                  <tr>
                    <th className="min-w-[180px] px-6 py-4 text-left text-sm font-semibold">Region</th>
                    <th className="min-w-[140px] px-6 py-4 text-left text-sm font-semibold">Type</th>
                    <th className="min-w-[110px] px-6 py-4 text-left text-sm font-semibold">Country</th>
                    <th className="min-w-[130px] px-6 py-4 text-left text-sm font-semibold">Parent</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Linked Courts</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="min-w-[280px] px-6 py-4 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {regionTable.rows.map((region) => (
                    <tr key={region.id}>
                      <td className="px-6 py-4 align-top">
                        <p className="text-sm font-semibold text-[#2F1D3B]">{region.name}</p>
                        <p className="mt-1 text-xs text-slate-500">`{region.slug}`</p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="workspace-pill">{prettyText(region.type)}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{region.countryCode}</td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{region.parentName ?? "None"}</td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{region.courtCount}</td>
                      <td className="px-6 py-4 align-top">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(region.isActive)}`}>
                          {region.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <form action={adminReferenceDataAction} className="space-y-3">
                          <input type="hidden" name="entity" value="region" />
                          <input type="hidden" name="intent" value="toggle_active" />
                          <input type="hidden" name="recordId" value={region.id} />
                          <input type="hidden" name="nextActive" value={region.isActive ? "false" : "true"} />
                          <input name="reason" placeholder="Reason for status change" className="legal-field w-full min-w-[220px]" required />
                          <button type="submit" className="legal-button-secondary text-sm">
                            {region.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              start={regionTable.start}
              end={regionTable.end}
              total={regionTable.total}
              currentPage={regionTable.currentPage}
              pageLinks={regionPages.map((pageNumber) => ({
                pageNumber,
                href: buildPageHref(resolvedSearchParams, { regionsPage: pageNumber }),
              }))}
              previousHref={buildPageHref(resolvedSearchParams, { regionsPage: Math.max(1, regionTable.currentPage - 1) })}
              nextHref={buildPageHref(resolvedSearchParams, { regionsPage: Math.min(regionTable.totalPages, regionTable.currentPage + 1) })}
              isFirstPage={regionTable.currentPage === 1}
              isLastPage={regionTable.currentPage === regionTable.totalPages}
            />
          </div>
        </TaxonomyCard>

        {/* Courts table */}
        <TaxonomyCard
          title="Courts"
          description="Keep courts mapped carefully so case routing and reporting remain jurisdictionally accurate."
        >
          <div className="legal-table-wrap overflow-hidden">
            <div className="overflow-x-auto">
              <table className="legal-table min-w-full table-auto">
                <thead>
                  <tr>
                    <th className="min-w-[190px] px-6 py-4 text-left text-sm font-semibold">Court</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Level</th>
                    <th className="min-w-[170px] px-6 py-4 text-left text-sm font-semibold">Region</th>
                    <th className="min-w-[180px] px-6 py-4 text-left text-sm font-semibold">Website</th>
                    <th className="min-w-[100px] px-6 py-4 text-left text-sm font-semibold">Cases</th>
                    <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="min-w-[280px] px-6 py-4 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courtTable.rows.map((court) => (
                    <tr key={court.id}>
                      <td className="px-6 py-4 align-top">
                        <p className="text-sm font-semibold text-[#2F1D3B]">{court.name}</p>
                        <p className="mt-1 text-xs text-slate-500">`{court.slug}`</p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="workspace-pill">{prettyText(court.level)}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{court.regionName ?? "No region mapped"}</td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">
                        {court.websiteUrl ? (
                          <a href={court.websiteUrl} target="_blank" rel="noreferrer" className="break-all text-[#4C2F5E] hover:text-[#2F1D3B]">
                            {court.websiteUrl}
                          </a>
                        ) : (
                          "No website"
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">{court.caseCount}</td>
                      <td className="px-6 py-4 align-top">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(court.isActive)}`}>
                          {court.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <form action={adminReferenceDataAction} className="space-y-3">
                          <input type="hidden" name="entity" value="court" />
                          <input type="hidden" name="intent" value="toggle_active" />
                          <input type="hidden" name="recordId" value={court.id} />
                          <input type="hidden" name="nextActive" value={court.isActive ? "false" : "true"} />
                          <input name="reason" placeholder="Reason for status change" className="legal-field w-full min-w-[220px]" required />
                          <button type="submit" className="legal-button-secondary text-sm">
                            {court.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              start={courtTable.start}
              end={courtTable.end}
              total={courtTable.total}
              currentPage={courtTable.currentPage}
              pageLinks={courtPages.map((pageNumber) => ({
                pageNumber,
                href: buildPageHref(resolvedSearchParams, { courtsPage: pageNumber }),
              }))}
              previousHref={buildPageHref(resolvedSearchParams, { courtsPage: Math.max(1, courtTable.currentPage - 1) })}
              nextHref={buildPageHref(resolvedSearchParams, { courtsPage: Math.min(courtTable.totalPages, courtTable.currentPage + 1) })}
              isFirstPage={courtTable.currentPage === 1}
              isLastPage={courtTable.currentPage === courtTable.totalPages}
            />
          </div>
        </TaxonomyCard>
      </div>
    </div>
  );
}