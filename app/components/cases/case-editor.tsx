'use client';

import AnimatedLink from '@/app/components/ui/animated-link';
import Tooltip from '@/app/components/ui/tooltip';
import type { CaseDraftPayload, CaseRepositoryRecord, CaseSourceType, CaseVisibility } from '@/types/case';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eye,
  FileUp,
  Plus,
  Save,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface SelectOption {
  id: string;
  name: string;
}

interface CourtOption extends SelectOption {
  level: string;
  regionId?: string | null;
}

interface CaseEditorProps {
  mode: 'create' | 'edit';
  initialCase?: CaseRepositoryRecord | null;
  categories: SelectOption[];
  tags: SelectOption[];
  regions: SelectOption[];
  courts: CourtOption[];
  onSaveDraft?: (payload: CaseDraftPayload) => Promise<void>;
  onSubmitForReview?: (payload: CaseDraftPayload) => Promise<void>;
}

const sourceTypeOptions: CaseSourceType[] = [
  'USER_SUBMITTED',
  'OFFICIAL_COURT',
  'IMPORTED_EDITORIAL',
  'COMMUNITY_CURATED',
];

const visibilityOptions: CaseVisibility[] = ['PUBLIC', 'UNLISTED', 'PRIVATE', 'ORGANIZATION'];

const editorSteps = [
  {
    id: 'basics',
    title: 'Basics',
    description: 'Title, citation, and the repository identity of the case.',
  },
  {
    id: 'classification',
    title: 'Classification',
    description: 'Court, region, tags, source type, and visibility.',
  },
  {
    id: 'narrative',
    title: 'Narrative',
    description: 'Summary, facts, issues, holding, and outcome.',
  },
  {
    id: 'sources',
    title: 'Sources',
    description: 'Provenance, citations, and attached working files.',
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Final quality check before saving or submitting.',
  },
] as const;

function StatusPill({
  active,
  complete,
}: {
  active: boolean;
  complete: boolean;
}) {
  if (complete) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#4C2F5E] text-white">
        <Check className="h-4 w-4" />
      </span>
    );
  }

  if (active) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#4C2F5E]/20 bg-[#F1EAF6] text-[#4C2F5E]">
        <Circle className="h-3 w-3 fill-current" />
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#4C2F5E]/10 bg-white text-[#A294B1]">
      <Circle className="h-3 w-3" />
    </span>
  );
}

function StepPanel({
  title,
  copy,
  children,
}: {
  title: string;
  copy?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="workspace-sidebar p-6 md:p-7 lh-form-enter">
      <div className="border-b border-[#4C2F5E]/8 pb-4">
        <h2 className="text-xl font-semibold text-[#2F1D3B]">{title}</h2>
        {copy ? <p className="mt-2 text-sm leading-7 text-[#736683]">{copy}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function formatSourceTypeLabel(value: string) {
  return value.replaceAll('_', ' ');
}

export default function CaseEditor({
  mode,
  initialCase,
  categories,
  tags,
  regions,
  courts,
  onSaveDraft,
  onSubmitForReview,
}: CaseEditorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState(initialCase?.title ?? '');
  const [citation, setCitation] = useState(initialCase?.canonicalCitation ?? '');
  const [docketNumber, setDocketNumber] = useState(initialCase?.docketNumber ?? '');
  const [summary, setSummary] = useState(initialCase?.summary ?? '');
  const [facts, setFacts] = useState(initialCase?.facts ?? '');
  const [issues, setIssues] = useState(initialCase?.issues ?? '');
  const [holding, setHolding] = useState(initialCase?.holding ?? '');
  const [outcome, setOutcome] = useState(initialCase?.outcome ?? '');
  const [history, setHistory] = useState(initialCase?.proceduralHistory ?? '');
  const [selectedCategory, setSelectedCategory] = useState(initialCase?.category.id ?? categories[0]?.id ?? '');
  const [selectedTags, setSelectedTags] = useState(initialCase?.tags.map((tag) => tag.id) ?? []);
  const [selectedRegion, setSelectedRegion] = useState(initialCase?.region?.id ?? '');
  const [selectedCourt, setSelectedCourt] = useState(initialCase?.court?.id ?? '');
  const [visibility, setVisibility] = useState<CaseVisibility>(initialCase?.visibility ?? 'PUBLIC');
  const [sourceType, setSourceType] = useState<CaseSourceType>(initialCase?.sourceType ?? 'USER_SUBMITTED');
  const [sourceLinks, setSourceLinks] = useState(
    initialCase?.sourceLinks.map((item) => ({
      label: item.label,
      url: item.url,
      sourceName: item.sourceName,
    })) ?? [{ label: '', url: '', sourceName: '' }],
  );
  const [citations, setCitations] = useState(initialCase?.citationsMade.map((item) => item.canonicalCitation) ?? ['']);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState<'draft' | 'submit' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const readiness = useMemo(() => {
    const checks = [
      title.trim().length > 0,
      summary.trim().length > 0,
      facts.trim().length > 0,
      issues.trim().length > 0,
      holding.trim().length > 0,
      outcome.trim().length > 0,
      sourceLinks.some((item) => item.url.trim().length > 0),
      selectedTags.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [facts, holding, issues, outcome, selectedTags.length, sourceLinks, summary, title]);

  const readinessTone =
    readiness >= 85
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : readiness >= 60
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-[#4C2F5E] bg-[#F6F1FA] border-[#4C2F5E]/12';

  const availableCourts = useMemo(
    () => (selectedRegion ? courts.filter((court) => !court.regionId || court.regionId === selectedRegion) : courts),
    [courts, selectedRegion],
  );

  const progressPercent = Math.round(((currentStep + 1) / editorSteps.length) * 100);
  const currentStepMeta = editorSteps[currentStep];

  const stepChecks = useMemo(
    () => [
      {
        complete: Boolean(title.trim()) && Boolean(summary.trim()) && Boolean(selectedCategory),
        notes: [
          !title.trim() ? 'Add a case title.' : null,
          !summary.trim() ? 'Write a concise repository summary.' : null,
          !selectedCategory ? 'Select a category.' : null,
        ].filter(Boolean) as string[],
      },
      {
        complete: Boolean(selectedRegion || selectedCourt) && selectedTags.length > 0,
        notes: [
          !(selectedRegion || selectedCourt) ? 'Choose a region or court context.' : null,
          selectedTags.length === 0 ? 'Add at least one tag for discovery.' : null,
        ].filter(Boolean) as string[],
      },
      {
        complete:
          Boolean(facts.trim()) &&
          Boolean(issues.trim()) &&
          Boolean(holding.trim()) &&
          Boolean(outcome.trim()),
        notes: [
          !facts.trim() ? 'Add the factual background.' : null,
          !issues.trim() ? 'Add the legal issues.' : null,
          !holding.trim() ? 'Add the holding.' : null,
          !outcome.trim() ? 'Add the outcome.' : null,
        ].filter(Boolean) as string[],
      },
      {
        complete: sourceLinks.some((item) => item.url.trim()) && citations.some((item) => item.trim()),
        notes: [
          !sourceLinks.some((item) => item.url.trim()) ? 'Attach at least one source link.' : null,
          !citations.some((item) => item.trim()) ? 'Add at least one citation reference.' : null,
        ].filter(Boolean) as string[],
      },
      {
        complete: readiness >= 85,
        notes:
          readiness >= 85
            ? ['This draft is ready for repository review.']
            : ['Complete the earlier steps before submitting for review.'],
      },
    ],
    [facts, holding, issues, outcome, readiness, selectedCategory, selectedCourt, selectedRegion, selectedTags.length, sourceLinks, summary, title, citations],
  );

  const breadcrumbItems =
    mode === 'create'
      ? [
          { label: 'Cases', href: '/cases' },
          { label: 'Create case draft', href: null as string | null },
        ]
      : [
          { label: 'Cases', href: '/cases' },
          ...(initialCase?.title ? [{ label: initialCase.title, href: `/cases/${initialCase.slug}` }] : []),
          { label: 'Edit case record', href: null as string | null },
        ];

  function buildPayload(): CaseDraftPayload | null {
    if (!title.trim()) {
      setFormError('Case title is required.');
      return null;
    }

    if (!summary.trim()) {
      setFormError('Summary is required before saving.');
      return null;
    }

    if (!selectedCategory) {
      setFormError('Select a category.');
      return null;
    }

    const cleanLinks = sourceLinks
      .map((item) => ({
        label: item.label?.trim() || undefined,
        sourceName: item.sourceName?.trim() || undefined,
        url: item.url.trim(),
      }))
      .filter((item) => item.url.length > 0);

    setFormError(null);

    return {
      title: title.trim(),
      canonicalCitation: citation.trim() || undefined,
      docketNumber: docketNumber.trim() || undefined,
      summary: summary.trim(),
      facts: facts.trim() || undefined,
      issues: issues.trim() || undefined,
      holding: holding.trim() || undefined,
      outcome: outcome.trim() || undefined,
      proceduralHistory: history.trim() || undefined,
      categorySlug: selectedCategory,
      tagSlugs: selectedTags,
      regionSlug: selectedRegion || undefined,
      courtSlug: selectedCourt || undefined,
      visibility,
      sourceType,
      sourceLinks: cleanLinks,
      citations: citations.map((item) => item.trim()).filter(Boolean),
    };
  }

  async function handlePersist(intent: 'draft' | 'submit') {
    const payload = buildPayload();
    if (!payload) return;

    const handler = intent === 'draft' ? onSaveDraft : onSubmitForReview;
    if (!handler) return;

    try {
      setSubmitting(intent);
      await handler(payload);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save case draft.');
    } finally {
      setSubmitting(null);
    }
  }

  function handleFileSelection(fileList: FileList | null) {
    if (!fileList?.length) return;

    const nextFiles = Array.from(fileList);
    setSelectedFiles((current) => {
      const merged = [...current];

      for (const file of nextFiles) {
        const exists = merged.some(
          (entry) =>
            entry.name === file.name &&
            entry.size === file.size &&
            entry.lastModified === file.lastModified,
        );

        if (!exists) merged.push(file);
      }

      return merged;
    });
  }

  function removeSelectedFile(target: File) {
    setSelectedFiles((current) =>
      current.filter(
        (file) =>
          !(
            file.name === target.name &&
            file.size === target.size &&
            file.lastModified === target.lastModified
          ),
      ),
    );
  }

  function fileSizeLabel(size: number) {
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    if (size >= 1024) return `${Math.round(size / 1024)} KB`;
    return `${size} B`;
  }

  function handleRegionChange(nextRegion: string) {
    setSelectedRegion(nextRegion);

    if (!selectedCourt) return;

    const selectedCourtStillAvailable = courts.some(
      (court) =>
        court.id === selectedCourt && (!nextRegion || !court.regionId || court.regionId === nextRegion),
    );

    if (!selectedCourtStillAvailable) {
      setSelectedCourt('');
    }
  }

  function goToStep(index: number) {
    setCurrentStep(Math.min(Math.max(index, 0), editorSteps.length - 1));
    setFormError(null);
  }

  function renderBasicsStep() {
    return (
      <StepPanel
        title="Case basics"
        copy="Define the repository identity of the case before you move into legal analysis and provenance."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-[#2F1D3B]">Case title</label>
            <input
              className="legal-field mt-3"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter a concise case title"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#2F1D3B]">Canonical citation</label>
            <input
              className="legal-field mt-3"
              value={citation}
              onChange={(event) => setCitation(event.target.value)}
              placeholder="2026 SC 101"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#2F1D3B]">Docket number</label>
            <input
              className="legal-field mt-3"
              value={docketNumber}
              onChange={(event) => setDocketNumber(event.target.value)}
              placeholder="Reference number"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#2F1D3B]">Category</label>
            <select
              className="legal-field mt-3"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Repository record</p>
            <p className="mt-2 text-sm leading-7 text-[#736683]">
              Keep the title and citation standardized. Reviewers and search pages rely on these fields first.
            </p>
          </div>
        </div>
      </StepPanel>
    );
  }

  function renderClassificationStep() {
    return (
      <StepPanel
        title="Classification and discovery"
        copy="Set the repository context so the case is searchable, scannable, and properly scoped."
      >
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-[#2F1D3B]">Region</label>
              <select
                className="legal-field mt-3"
                value={selectedRegion}
                onChange={(event) => handleRegionChange(event.target.value)}
              >
                <option value="">Select region</option>
                {regions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#2F1D3B]">Court</label>
              <select
                className="legal-field mt-3"
                value={selectedCourt}
                onChange={(event) => setSelectedCourt(event.target.value)}
              >
                <option value="">Select court</option>
                {availableCourts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} / {item.level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#2F1D3B]">Source type</label>
              <select
                className="legal-field mt-3"
                value={sourceType}
                onChange={(event) => setSourceType(event.target.value as CaseSourceType)}
              >
                {sourceTypeOptions.map((item) => (
                  <option key={item} value={item}>
                    {formatSourceTypeLabel(item)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#2F1D3B]">Visibility</label>
              <select
                className="legal-field mt-3"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as CaseVisibility)}
              >
                {visibilityOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Tags</label>
                <p className="mt-1 text-sm text-[#736683]">Choose the tags that make this case easier to find and compare.</p>
              </div>
              <span className="rounded-full border border-[#4C2F5E]/10 bg-[#F8F4FB] px-3 py-1 text-xs font-semibold text-[#4C2F5E]">
                {selectedTags.length} selected
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setSelectedTags((current) =>
                        current.includes(tag.id)
                          ? current.filter((item) => item !== tag.id)
                          : [...current, tag.id],
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'border-[#4C2F5E] bg-[#4C2F5E] text-white'
                        : 'border-[#4C2F5E]/12 bg-[#F7F3FA] text-[#4C2F5E] hover:bg-white'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </StepPanel>
    );
  }

  function renderNarrativeStep() {
    return (
      <StepPanel
        title="Case narrative"
        copy="Break the case into structured legal sections so it is easier to review and reuse."
      >
        <div className="space-y-5">
          {[
            ['Summary', summary, setSummary, 'Concise repository overview for search, list views, and reviewers.'],
            ['Facts', facts, setFacts, 'Key factual background and relevant chronology.'],
            ['Issues', issues, setIssues, 'Questions the court had to decide.'],
            ['Holding', holding, setHolding, 'Core legal determination of the court.'],
            ['Outcome', outcome, setOutcome, 'Result for the parties and any remedy or remand.'],
            ['Procedural history', history, setHistory, 'How the matter reached this court or tribunal.'],
          ].map(([label, value, setter, placeholder]) => (
            <div key={label as string}>
              <label className="text-sm font-semibold text-[#2F1D3B]">{label as string}</label>
              <textarea
                className="legal-field mt-3 min-h-[150px] resize-y"
                value={value as string}
                onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                placeholder={placeholder as string}
              />
            </div>
          ))}
        </div>
      </StepPanel>
    );
  }

  function renderSourcesStep() {
    return (
      <StepPanel
        title="Sources and provenance"
        copy="Attach external sources, citations, and working files so the case record stays verifiable."
      >
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Source links</label>
                <p className="mt-1 text-sm text-[#736683]">Use at least one source link to support verification.</p>
              </div>
              <button
                type="button"
                onClick={() => setSourceLinks((current) => [...current, { label: '', url: '', sourceName: '' }])}
                className="legal-button-secondary text-sm"
              >
                <Plus className="h-4 w-4" />
                Add source link
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {sourceLinks.map((item, index) => (
                <div key={`${item.url}-${index}`} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <input
                      className="legal-field"
                      value={item.label}
                      onChange={(event) =>
                        setSourceLinks((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, label: event.target.value } : entry,
                          ),
                        )
                      }
                      placeholder="Label"
                    />
                    <input
                      className="legal-field"
                      value={item.sourceName}
                      onChange={(event) =>
                        setSourceLinks((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, sourceName: event.target.value } : entry,
                          ),
                        )
                      }
                      placeholder="Source name"
                    />
                    <div className="flex gap-3">
                      <input
                        className="legal-field flex-1"
                        value={item.url}
                        onChange={(event) =>
                          setSourceLinks((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, url: event.target.value } : entry,
                            ),
                          )
                        }
                        placeholder="https://"
                      />
                      {sourceLinks.length > 1 ? (
                        <Tooltip content="Remove source link">
                          <button
                            type="button"
                            onClick={() =>
                              setSourceLinks((current) => current.filter((_, entryIndex) => entryIndex !== index))
                            }
                            className="inline-flex h-[56px] w-[56px] items-center justify-center rounded-[18px] border border-[#4C2F5E]/10 bg-white text-[#4C2F5E]"
                            aria-label="Remove source link"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Citations</label>
                <p className="mt-1 text-sm text-[#736683]">Reference related cases, citations, or repository slugs.</p>
              </div>
              <button
                type="button"
                onClick={() => setCitations((current) => [...current, ''])}
                className="legal-button-secondary text-sm"
              >
                <Plus className="h-4 w-4" />
                Add citation
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {citations.map((item, index) => (
                <div key={`${item}-${index}`} className="flex gap-3">
                  <input
                    className="legal-field"
                    value={item}
                    onChange={(event) =>
                      setCitations((current) =>
                        current.map((entry, entryIndex) => (entryIndex === index ? event.target.value : entry)),
                      )
                    }
                    placeholder="Add citation or repository slug"
                  />
                  {citations.length > 1 ? (
                    <Tooltip content="Remove citation">
                      <button
                        type="button"
                        onClick={() => setCitations((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                        className="inline-flex h-[56px] w-[56px] items-center justify-center rounded-[18px] border border-[#4C2F5E]/10 bg-white text-[#4C2F5E]"
                        aria-label="Remove citation"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-dashed border-[#4C2F5E]/18 bg-[#FBF9FD] p-5">
            <input
              id="case-file-upload"
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                handleFileSelection(event.target.files);
                event.target.value = '';
              }}
            />
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#2F1D3B]">Source files and attachments</p>
                <p className="mt-1 text-sm leading-7 text-[#6F5E7F]">
                  Files stay in the draft workspace for now. Persistent upload support still depends on the repository file endpoint.
                </p>
              </div>
              <label
                htmlFor="case-file-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
              >
                <FileUp className="h-4 w-4" />
                {selectedFiles.length ? `Add more files (${selectedFiles.length})` : 'Upload files'}
              </label>
            </div>

            {selectedFiles.length ? (
              <div className="mt-4 space-y-3">
                {selectedFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-[#4C2F5E]/10 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2F1D3B]">{file.name}</p>
                      <p className="mt-1 text-xs text-[#8C7A9B]">
                        {file.type || 'Unknown type'} / {fileSizeLabel(file.size)}
                      </p>
                    </div>
                    <Tooltip content={`Remove ${file.name}`}>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(file)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#4C2F5E]/10 text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </StepPanel>
    );
  }

  function renderReviewStep() {
    return (
      <StepPanel
        title="Review and submit"
        copy="Check the draft the same way a reviewer will: repository identity, legal narrative, and provenance."
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Readiness', value: `${readiness}%`, helper: 'Completion score' },
              { label: 'Sources', value: `${sourceLinks.filter((item) => item.url.trim()).length}`, helper: 'Linked sources' },
              { label: 'Citations', value: `${citations.map((item) => item.trim()).filter(Boolean).length}`, helper: 'Referenced cases' },
              { label: 'Tags', value: `${selectedTags.length}`, helper: 'Discovery tags' },
            ].map((item) => (
              <div key={item.label} className="rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{item.value}</p>
                <p className="mt-2 text-sm text-[#736683]">{item.helper}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Reviewer preview</p>
                <h3 className="mt-2 text-xl font-semibold text-[#2F1D3B]">{title || 'Untitled case draft'}</h3>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">
                  {citation || 'Citation pending'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Hide preview' : 'Show preview'}
              </button>
            </div>

            {showPreview ? (
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lh-form-enter">
                <div className="rounded-[20px] border border-[#4C2F5E]/8 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Summary</p>
                  <p className="mt-3 text-sm leading-7 text-[#736683]">
                    {summary || 'Summary preview will appear here once provided.'}
                  </p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Issues</p>
                      <p className="mt-2 text-sm leading-7 text-[#736683]">{issues || 'Issues pending.'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Holding</p>
                      <p className="mt-2 text-sm leading-7 text-[#736683]">{holding || 'Holding pending.'}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[20px] border border-[#4C2F5E]/8 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Repository metadata</p>
                  <div className="mt-4 space-y-3 text-sm text-[#5F506D]">
                    <div className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">Category: {categories.find((item) => item.id === selectedCategory)?.name || 'Not set'}</div>
                    <div className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">Source type: {formatSourceTypeLabel(sourceType)}</div>
                    <div className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">Visibility: {visibility}</div>
                    <div className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">Region / Court: {[regions.find((item) => item.id === selectedRegion)?.name, courts.find((item) => item.id === selectedCourt)?.name].filter(Boolean).join(' / ') || 'Not set'}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Submission checklist</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {stepChecks.slice(0, 4).map((step, index) => (
                <div key={editorSteps[index].id} className="rounded-[18px] border border-[#4C2F5E]/8 bg-white px-4 py-4">
                  <div className="flex items-center gap-2">
                    {step.complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-[#8D74A3]" />
                    )}
                    <p className="font-semibold text-[#2F1D3B]">{editorSteps[index].title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#736683]">
                    {step.notes[0] || 'This section is ready.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </StepPanel>
    );
  }

  function renderCurrentStep() {
    switch (currentStepMeta.id) {
      case 'basics':
        return renderBasicsStep();
      case 'classification':
        return renderClassificationStep();
      case 'narrative':
        return renderNarrativeStep();
      case 'sources':
        return renderSourcesStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  }

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 md:px-6 lg:px-8 lh-page-enter">
      <nav aria-label="Breadcrumb" className="mb-6 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-2 text-sm">
          {breadcrumbItems.map((item, index) => {
            const isCurrent = index === breadcrumbItems.length - 1;

            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <ChevronRight className="h-4 w-4 text-[#A294B1]" /> : null}
                {item.href && !isCurrent ? (
                  <AnimatedLink
                    href={item.href}
                    className="font-medium text-[#7C6B8E] transition hover:text-[#4C2F5E]"
                  >
                    {item.label}
                  </AnimatedLink>
                ) : (
                  <span
                    className={isCurrent ? 'font-semibold text-[#2F1D3B]' : 'font-medium text-[#7C6B8E]'}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="workspace-header p-6 md:p-7 lh-page-enter lh-delay-1">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <AnimatedLink
              href="/cases"
              className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to cases
            </AnimatedLink>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="legal-kicker">
                <ShieldCheck className="h-3.5 w-3.5" />
                {mode === 'create' ? 'New repository entry' : 'Editing case record'}
              </span>
              <span className="workspace-pill border-[#4C2F5E]/8 bg-white text-[#736683]">
                Step {currentStep + 1} of {editorSteps.length}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#2F1D3B] md:text-[2.8rem]">
              {mode === 'create' ? 'Create case draft' : 'Edit case record'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#736683] md:text-base">
              Submit the case in focused steps so legal metadata, narrative, and provenance stay structured and reviewable.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Readiness', `${readiness}%`],
              ['Sources attached', `${sourceLinks.filter((item) => item.url.trim()).length}`],
              ['Citations', `${citations.map((item) => item.trim()).filter(Boolean).length}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[20px] border border-[#4C2F5E]/8 bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#2F1D3B]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#E9E1F0]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#4C2F5E_0%,#8D74A3_100%)] transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="workspace-sidebar p-4 lh-page-enter lh-delay-2">
            <div className="space-y-2">
              {editorSteps.map((step, index) => {
                const isActive = currentStep === index;
                const isComplete = stepChecks[index]?.complete ?? false;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`flex w-full items-start gap-3 rounded-[18px] px-3 py-3 text-left transition ${
                      isActive ? 'bg-[#F7F1FB]' : 'hover:bg-[#FBF9FD]'
                    }`}
                  >
                    <StatusPill active={isActive} complete={isComplete} />
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${isActive ? 'text-[#2F1D3B]' : 'text-[#5F506D]'}`}>
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-[#8B7D99]">{step.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="workspace-sidebar p-5 lh-page-enter lh-delay-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Step guidance</p>
            <div className="mt-4 space-y-2">
              {stepChecks[currentStep].notes.map((note) => (
                <div key={note} className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-3 py-3 text-sm text-[#736683]">
                  {note}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${readinessTone}`}>
                {readiness >= 85 ? 'Ready' : readiness >= 60 ? 'Needs review' : 'Incomplete'}
              </span>
              <button
                type="button"
                onClick={() => setShowPreview((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-2 text-xs font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
              >
                <Eye className="h-3.5 w-3.5" />
                {showPreview ? 'Hide preview' : 'Preview'}
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          {formError ? (
            <div className="mb-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {formError}
            </div>
          ) : null}

          {renderCurrentStep()}

          <div className="mt-6 flex flex-col gap-3 rounded-[22px] border border-[#4C2F5E]/10 bg-white p-4 shadow-[0_10px_22px_rgba(76,47,94,0.04)] sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#736683]">
              {currentStep === editorSteps.length - 1
                ? 'Final step. Save the draft or submit it into the review queue.'
                : `Next: ${editorSteps[currentStep + 1].title}`}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => goToStep(currentStep - 1)}
                disabled={currentStep === 0}
                className="legal-button-secondary text-sm disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => handlePersist('draft')}
                disabled={submitting !== null}
                className="legal-button-secondary text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {submitting === 'draft' ? 'Saving draft...' : 'Save draft'}
              </button>
              {currentStep === editorSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handlePersist('submit')}
                  disabled={submitting !== null}
                  className="legal-button-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting === 'submit' ? 'Submitting...' : 'Submit for review'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(currentStep + 1)}
                  className="legal-button-primary text-sm"
                >
                  Next step
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {showPreview ? (
            <div className="mt-6 rounded-[28px] border border-[#4C2F5E]/10 bg-[linear-gradient(180deg,#ffffff_0%,#fcf9fe_100%)] p-5 shadow-[0_12px_30px_rgba(76,47,94,0.05)] lh-form-enter">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Live preview</p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">
                {citation || 'Citation pending'}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">
                {title || 'Untitled case draft'}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#6F5E7F]">
                {summary || 'Summary preview will appear here once provided.'}
              </p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
