'use client';

import type { CaseDraftPayload, CaseRepositoryRecord, CaseSourceType, CaseVisibility } from '@/types/case';
import { ChevronRight, Eye, FileUp, Plus, Save, Send, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
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
    initialCase?.sourceLinks.map((item) => ({ label: item.label, url: item.url, sourceName: item.sourceName })) ?? [{ label: '', url: '', sourceName: '' }],
  );
  const [citations, setCitations] = useState(initialCase?.citationsMade.map((item) => item.canonicalCitation) ?? ['']);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState(false);
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
    readiness >= 85 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
    readiness >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-[#4C2F5E] bg-[#F6F1FA] border-[#4C2F5E]/12';

  const availableCourts = useMemo(
    () =>
      selectedRegion
        ? courts.filter((court) => !court.regionId || court.regionId === selectedRegion)
        : courts,
    [courts, selectedRegion],
  );
  const breadcrumbItems = mode === 'create'
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

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-2 text-sm">
          {breadcrumbItems.map((item, index) => {
            const isCurrent = index === breadcrumbItems.length - 1;

            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <ChevronRight className="h-4 w-4 text-[#A294B1]" /> : null}
                {item.href && !isCurrent ? (
                  <Link
                    href={item.href}
                    className="font-medium text-[#7C6B8E] transition hover:text-[#4C2F5E]"
                  >
                    {item.label}
                  </Link>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[30px] border border-[#4C2F5E]/10 bg-white">
            <div className="bg-[linear-gradient(135deg,#4C2F5E_0%,#745191_100%)] px-6 py-6 text-white md:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {mode === 'create' ? 'New repository entry' : 'Editing case record'}
                  </p>
                  <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                    {mode === 'create' ? 'Create case draft' : 'Edit case record'}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                    Structure the legal metadata, narrative sections, and provenance in the same format reviewers and researchers will later consume.
                  </p>
                </div>
                <button
                  onClick={() => setPreview((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/16"
                >
                  <Eye className="h-4 w-4" />
                  {preview ? 'Hide preview' : 'Preview mode'}
                </button>
              </div>
            </div>

            <div className="grid gap-4 border-t border-[#4C2F5E]/10 bg-[#FBF9FD] px-6 py-5 md:grid-cols-3 md:px-8">
              {[
                ['Record status', mode === 'create' ? 'Draft in progress' : 'Existing repository record'],
                ['Sources attached', `${sourceLinks.filter((item) => item.url.trim()).length} linked source${sourceLinks.filter((item) => item.url.trim()).length === 1 ? '' : 's'}`],
                ['Citation references', `${citations.map((item) => item.trim()).filter(Boolean).length} cited case${citations.map((item) => item.trim()).filter(Boolean).length === 1 ? '' : 's'}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[22px] border border-[#4C2F5E]/8 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-6 md:p-7">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-[#2F1D3B]">Case title</label>
                <input className="legal-field mt-3" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter a concise case title" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Canonical citation</label>
                <input className="legal-field mt-3" value={citation} onChange={(event) => setCitation(event.target.value)} placeholder="2026 SC 101" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Docket number</label>
                <input className="legal-field mt-3" value={docketNumber} onChange={(event) => setDocketNumber(event.target.value)} placeholder="Reference number" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Category</label>
                <select className="legal-field mt-3" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-6 md:p-7">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Region</label>
                <select className="legal-field mt-3" value={selectedRegion} onChange={(event) => handleRegionChange(event.target.value)}>
                  <option value="">Select region</option>
                  {regions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Court</label>
                <select className="legal-field mt-3" value={selectedCourt} onChange={(event) => setSelectedCourt(event.target.value)}>
                  <option value="">Select court</option>
                  {availableCourts.map((item) => <option key={item.id} value={item.id}>{item.name} / {item.level}</option>)}
                </select>
                
              </div>
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Source type</label>
                <select className="legal-field mt-3" value={sourceType} onChange={(event) => setSourceType(event.target.value as CaseSourceType)}>
                  {['USER_SUBMITTED', 'OFFICIAL_COURT', 'IMPORTED_EDITORIAL', 'COMMUNITY_CURATED'].map((item) => (
                    <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#2F1D3B]">Visibility</label>
                <select className="legal-field mt-3" value={visibility} onChange={(event) => setVisibility(event.target.value as CaseVisibility)}>
                  {['PUBLIC', 'UNLISTED', 'PRIVATE', 'ORGANIZATION'].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-6 md:p-7">
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
                    className="legal-field mt-3 min-h-[140px] resize-y"
                    value={value as string}
                    onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                    placeholder={placeholder as string}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-6 md:p-7">
            <div>
              <label className="text-sm font-semibold text-[#2F1D3B]">Tags</label>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTags((current) =>
                          current.includes(tag.id) ? current.filter((item) => item !== tag.id) : [...current, tag.id],
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

            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-[#2F1D3B]">Source links</label>
                <button
                  type="button"
                  onClick={() => setSourceLinks((current) => [...current, { label: '', url: '', sourceName: '' }])}
                  className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E]"
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
                        onChange={(event) => setSourceLinks((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))}
                        placeholder="Label"
                      />
                      <input
                        className="legal-field"
                        value={item.sourceName}
                        onChange={(event) => setSourceLinks((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, sourceName: event.target.value } : entry))}
                        placeholder="Source name"
                      />
                      <div className="flex gap-3">
                        <input
                          className="legal-field flex-1"
                          value={item.url}
                          onChange={(event) => setSourceLinks((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, url: event.target.value } : entry))}
                          placeholder="https://"
                        />
                        {sourceLinks.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setSourceLinks((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                            className="inline-flex h-[56px] w-[56px] items-center justify-center rounded-[18px] border border-[#4C2F5E]/10 bg-white text-[#4C2F5E]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-[#2F1D3B]">Citations</label>
                <button
                  type="button"
                  onClick={() => setCitations((current) => [...current, ''])}
                  className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E]"
                >
                  <Plus className="h-4 w-4" />
                  Add cited case
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {citations.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex gap-3">
                    <input
                      className="legal-field"
                      value={item}
                      onChange={(event) => setCitations((current) => current.map((entry, entryIndex) => entryIndex === index ? event.target.value : entry))}
                      placeholder="Add citation or repository slug"
                    />
                    {citations.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setCitations((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                        className="inline-flex h-[56px] w-[56px] items-center justify-center rounded-[18px] border border-[#4C2F5E]/10 bg-white text-[#4C2F5E]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-dashed border-[#4C2F5E]/18 bg-[#FBF9FD] p-5">
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
                  <p className="text-sm font-semibold text-[#2F1D3B]">Source files & attachments</p>
                  <p className="mt-1 text-sm leading-7 text-[#6F5E7F]">
                    Choose files now to keep them in the draft workspace. Backend upload persistence still needs the repository file endpoint.
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
                        <p className="mt-1 text-xs text-[#8C7A9B]">{file.type || 'Unknown type'} / {fileSizeLabel(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(file)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#4C2F5E]/10 text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5 shadow-[0_12px_30px_rgba(76,47,94,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Review readiness</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-4xl font-semibold tracking-[-0.05em] text-[#2F1D3B]">{readiness}%</p>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${readinessTone}`}>
                {readiness >= 85 ? 'Ready' : readiness >= 60 ? 'Needs review' : 'Incomplete'}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-[#6F5E7F]">
              Progress is based on complete narrative sections, citation coverage, tags, and at least one source link.
            </p>
            <div className="mt-5 h-3 rounded-full bg-[#F1EAF6]">
              <div className="h-full rounded-full bg-[linear-gradient(135deg,#4C2F5E_0%,#8B68B2_100%)]" style={{ width: `${readiness}%` }} />
            </div>
          </div>

          <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5 shadow-[0_12px_30px_rgba(76,47,94,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Actions</p>
            {formError ? (
              <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {formError}
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              <button className="legal-button-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-60" onClick={() => handlePersist('draft')} disabled={submitting !== null}>
                <Save className="h-4 w-4" />
                {submitting === 'draft' ? 'Saving draft...' : 'Save draft'}
              </button>
              <button className="legal-button-secondary w-full text-sm disabled:cursor-not-allowed disabled:opacity-60" onClick={() => handlePersist('submit')} disabled={submitting !== null}>
                <Send className="h-4 w-4" />
                {submitting === 'submit' ? 'Submitting...' : 'Submit for review'}
              </button>
            </div>
          </div>

          {preview ? (
            <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-[linear-gradient(180deg,#ffffff_0%,#fcf9fe_100%)] p-5 shadow-[0_12px_30px_rgba(76,47,94,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Preview</p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{citation || 'Citation pending'}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{title || 'Untitled case draft'}</h2>
              <p className="mt-4 text-sm leading-7 text-[#6F5E7F]">{summary || 'Summary preview will appear here once provided.'}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
