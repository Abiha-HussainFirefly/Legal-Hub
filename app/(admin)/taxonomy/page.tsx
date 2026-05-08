import { adminReferenceDataAction } from "@/app/actions/admin-platform";
import { getAdminTaxonomyPageData } from "@/lib/services/admin.server";
import { FileSpreadsheet, MapPinned, Scale, Tags } from "lucide-react";

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

export default async function TaxonomyPage() {
  const data = await getAdminTaxonomyPageData();

  const summaryCards = [
    {
      title: "Categories",
      value: data.summary.categories,
      detail: `${data.summary.inactiveCategories} inactive`,
      icon: Scale,
    },
    {
      title: "Tags",
      value: data.summary.tags,
      detail: `${data.summary.inactiveTags} inactive`,
      icon: Tags,
    },
    {
      title: "Regions",
      value: data.summary.regions,
      detail: `${data.summary.inactiveRegions} inactive`,
      icon: MapPinned,
    },
    {
      title: "Courts",
      value: data.summary.courts,
      detail: `${data.summary.inactiveCourts} inactive`,
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="space-y-6">
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
                <div className="rounded-[18px] bg-[#F4EFF8] p-3 text-[#4C2F5E]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <TaxonomyCard
          title="Create Category"
          description="Use this for new legal content lanes or practice-area references. Prefer deactivation over deletion once referenced."
        >
          <form action={adminReferenceDataAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="entity" value="category" />
            <input type="hidden" name="intent" value="create" />
            <input name="name" placeholder="Category name" className="legal-field" required />
            <input name="slug" placeholder="category-slug" className="legal-field" />
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

        <TaxonomyCard
          title="Create Tag"
          description="Curate topic coverage carefully to avoid synonym sprawl. Use consistent tag types for ranking and discovery quality."
        >
          <form action={adminReferenceDataAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="entity" value="tag" />
            <input type="hidden" name="intent" value="create" />
            <input name="name" placeholder="Tag name" className="legal-field" required />
            <input name="slug" placeholder="tag-slug" className="legal-field" />
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

        <TaxonomyCard
          title="Create Region"
          description="Region hierarchy affects lawyer trust, case routing, and court mapping. Keep structure consistent."
        >
          <form action={adminReferenceDataAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="entity" value="region" />
            <input type="hidden" name="intent" value="create" />
            <input name="name" placeholder="Region name" className="legal-field" required />
            <input name="slug" placeholder="region-slug" className="legal-field" />
            <select name="regionType" className="legal-field">
              <option value="STATE">State</option>
              <option value="COUNTRY">Country</option>
              <option value="FEDERAL">Federal</option>
              <option value="PROVINCE">Province</option>
              <option value="CITY">City</option>
              <option value="DISTRICT">District</option>
            </select>
            <input name="countryCode" placeholder="Country code" className="legal-field" />
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
            <input name="slug" placeholder="court-slug" className="legal-field" />
            <select name="courtLevel" className="legal-field">
              <option value="OTHER">Other</option>
              <option value="LOCAL">Local</option>
              <option value="DISTRICT">District</option>
              <option value="HIGH">High</option>
              <option value="APPELLATE">Appellate</option>
              <option value="SUPREME">Supreme</option>
              <option value="TRIBUNAL">Tribunal</option>
            </select>
            <input name="regionId" placeholder="Linked region ID" className="legal-field" />
            <input name="websiteUrl" placeholder="Official website URL" className="legal-field" />
            <input name="reason" placeholder="Reason for creation" className="legal-field md:col-span-2" required />
            <button type="submit" className="legal-button-primary md:col-span-2 md:w-fit">
              Create Court
            </button>
          </form>
        </TaxonomyCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TaxonomyCard
          title="Categories"
          description="Dependency-aware deactivation is safer than deletion once discussions, cases, or lawyer-practice references exist."
        >
          <div className="space-y-3">
            {data.categories.map((category) => (
              <div key={category.id} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(category.isActive)}`}>
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="workspace-pill">{prettyText(category.scope)}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-[#2F1D3B]">{category.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      `{category.slug}` / Sort {category.sortOrder} / Parent {category.parentName ?? "None"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{category.usageCount} linked records depend on this category.</p>
                  </div>

                  <form action={adminReferenceDataAction} className="grid gap-3 xl:w-[280px]">
                    <input type="hidden" name="entity" value="category" />
                    <input type="hidden" name="intent" value="toggle_active" />
                    <input type="hidden" name="recordId" value={category.id} />
                    <input type="hidden" name="nextActive" value={category.isActive ? "false" : "true"} />
                    <input name="reason" placeholder="Reason for status change" className="legal-field" required />
                    <button type="submit" className="legal-button-secondary text-sm">
                      {category.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </TaxonomyCard>

        <TaxonomyCard
          title="Tags"
          description="Use deactivation to retire noisy labels. Merge and bulk-curation workflows remain a recommended next step."
        >
          <div className="space-y-3">
            {data.tags.map((tag) => (
              <div key={tag.id} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(tag.isActive)}`}>
                        {tag.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="workspace-pill">{prettyText(tag.type)}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-[#2F1D3B]">{tag.name}</p>
                    <p className="mt-1 text-xs text-slate-500">`{tag.slug}`</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {tag.discussionCount} discussions / {tag.caseCount} cases
                    </p>
                  </div>

                  <form action={adminReferenceDataAction} className="grid gap-3 xl:w-[280px]">
                    <input type="hidden" name="entity" value="tag" />
                    <input type="hidden" name="intent" value="toggle_active" />
                    <input type="hidden" name="recordId" value={tag.id} />
                    <input type="hidden" name="nextActive" value={tag.isActive ? "false" : "true"} />
                    <input name="reason" placeholder="Reason for status change" className="legal-field" required />
                    <button type="submit" className="legal-button-secondary text-sm">
                      {tag.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </TaxonomyCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TaxonomyCard
          title="Regions"
          description="Region hierarchy influences courts, practice areas, and legal trust views."
        >
          <div className="space-y-3">
            {data.regions.map((region) => (
              <div key={region.id} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(region.isActive)}`}>
                        {region.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="workspace-pill">
                        {prettyText(region.type)} / {region.countryCode}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-[#2F1D3B]">{region.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      `{region.slug}` / Parent {region.parentName ?? "None"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{region.courtCount} linked courts.</p>
                  </div>

                  <form action={adminReferenceDataAction} className="grid gap-3 xl:w-[280px]">
                    <input type="hidden" name="entity" value="region" />
                    <input type="hidden" name="intent" value="toggle_active" />
                    <input type="hidden" name="recordId" value={region.id} />
                    <input type="hidden" name="nextActive" value={region.isActive ? "false" : "true"} />
                    <input name="reason" placeholder="Reason for status change" className="legal-field" required />
                    <button type="submit" className="legal-button-secondary text-sm">
                      {region.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </TaxonomyCard>

        <TaxonomyCard
          title="Courts"
          description="Keep courts mapped carefully so case routing and reporting remain jurisdictionally accurate."
        >
          <div className="space-y-3">
            {data.courts.map((court) => (
              <div key={court.id} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(court.isActive)}`}>
                        {court.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="workspace-pill">{prettyText(court.level)}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-[#2F1D3B]">{court.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      `{court.slug}` / {court.regionName ?? "No region mapped"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{court.caseCount} linked case records.</p>
                  </div>

                  <form action={adminReferenceDataAction} className="grid gap-3 xl:w-[280px]">
                    <input type="hidden" name="entity" value="court" />
                    <input type="hidden" name="intent" value="toggle_active" />
                    <input type="hidden" name="recordId" value={court.id} />
                    <input type="hidden" name="nextActive" value={court.isActive ? "false" : "true"} />
                    <input name="reason" placeholder="Reason for status change" className="legal-field" required />
                    <button type="submit" className="legal-button-secondary text-sm">
                      {court.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </TaxonomyCard>
      </div>

      <section className="legal-panel p-5 md:p-6">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Seed Pack Guardrails</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            "Bulk CSV/XLSX import with dry-run validation and rollback should be added before production-scale taxonomy maintenance.",
            "Roles and permissions stay in restricted workflows with impact preview, two-step confirmation, and full audit logging.",
            "Runtime tables such as sessions, audit logs, reports, alerts, notifications, and views remain visible elsewhere but not directly mutable here.",
          ].map((note) => (
            <div key={note} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4 text-sm leading-7 text-slate-600">
              {note}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
