'use client';

import {
  X,
  Loader2,
  HelpCircle,
  MessageSquare,
  Megaphone,
  FileText,
  Search,
  ChevronDown,
  Check,
  MapPin,
  Shapes,
  Tag,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StartDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MetaOption {
  id: string;
  name: string;
}

interface Meta {
  categories: MetaOption[];
  regions: MetaOption[];
  tags: { id: string; name: string; type: string }[];
}

const KINDS = [
  {
    value: 'QUESTION',
    label: 'Question',
    desc: 'Ask for legal guidance',
    icon: HelpCircle,
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    value: 'DISCUSSION',
    label: 'Discussion',
    desc: 'Open conversation on a topic',
    icon: MessageSquare,
    color: '#7B3FA0',
    bg: '#F8F3FF',
    border: '#E8D9F5',
  },
  {
    value: 'ANNOUNCEMENT',
    label: 'Announcement',
    desc: 'Share legal news or updates',
    icon: Megaphone,
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  {
    value: 'LEGAL_UPDATE',
    label: 'Legal Update',
    desc: 'Inform about law changes',
    icon: FileText,
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
] as const;

const TAG_PREVIEW_COUNT = 12;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function SearchableSelect({
  label,
  placeholder,
  emptyLabel,
  options,
  selectedValue,
  onSelect,
  icon,
}: {
  label: string;
  placeholder: string;
  emptyLabel: string;
  options: MetaOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  icon: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find((option) => option.id === selectedValue) ?? null;
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.name.toLowerCase().includes(normalized));
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;
    searchInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setQuery('');
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef}>
      <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-gray-700">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setIsOpen((current) => {
              const next = !current;
              if (!next) setQuery('');
              return next;
            })
          }
          className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left text-[13px] transition ${
            isOpen
              ? 'border-[#9F63C4] bg-[#FBF7FE] shadow-[0_0_0_4px_rgba(159,99,196,0.10)]'
              : 'border-gray-200 bg-white hover:border-[#D8C5EA]'
          }`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F6F0FA] text-[#7B3FA0]">
              {icon}
            </span>
            <span className="min-w-0">
              <span className={`block truncate font-medium ${selectedOption ? 'text-gray-800' : 'text-gray-400'}`}>
                {selectedOption?.name ?? emptyLabel}
              </span>
              <span className="block truncate text-[11px] text-gray-400">{placeholder}</span>
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#E7D9F3] bg-white shadow-[0_24px_50px_rgba(39,18,61,0.14)]">
            <div className="border-b border-gray-100 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-[#FAFAFC] px-3">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${label.toLowerCase()}`}
                  className="w-full border-0 bg-transparent py-2.5 text-[13px] text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => {
                  onSelect('');
                  setQuery('');
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                  !selectedValue ? 'bg-[#F7F1FB] font-semibold text-[#7B3FA0]' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{emptyLabel}</span>
                {!selectedValue ? <Check className="h-4 w-4" /> : null}
              </button>

              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const selected = selectedValue === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        onSelect(option.id);
                        setQuery('');
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                        selected
                          ? 'bg-[#F7F1FB] font-semibold text-[#7B3FA0]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{option.name}</span>
                      {selected ? <Check className="h-4 w-4" /> : null}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-center text-[13px] text-gray-400">
                  No matching {label.toLowerCase()} found
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function StartDiscussionModal({ isOpen, onClose }: StartDiscussionModalProps) {
  const router = useRouter();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    kind: 'QUESTION' as typeof KINDS[number]['value'],
    categoryId: '',
    regionId: '',
    tagIds: [] as string[],
    visibility: 'PUBLIC' as 'PUBLIC' | 'UNLISTED' | 'PRIVATE',
  });

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/discussions/meta')
      .then((response) => response.json())
      .then(setMeta)
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setShowAllTags(false);
      setFormData({
        title: '',
        body: '',
        kind: 'QUESTION',
        categoryId: '',
        regionId: '',
        tagIds: [],
        visibility: 'PUBLIC',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function toggleTag(id: string) {
    setFormData((current) => ({
      ...current,
      tagIds: current.tagIds.includes(id)
        ? current.tagIds.filter((tagId) => tagId !== id)
        : [...current.tagIds, id],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!formData.title.trim()) return setError('Title is required');
    if (!formData.body.trim()) return setError('Description is required');
    if (!formData.categoryId) return setError('Please select a category');

    setLoading(true);
    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          body: formData.body.trim(),
          kind: formData.kind,
          categoryId: formData.categoryId,
          regionId: formData.regionId || undefined,
          tagIds: formData.tagIds.length ? formData.tagIds : undefined,
          visibility: formData.visibility,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to post discussion');

      onClose();
      router.push(`/discussions/${data.slug}`);
    } catch (submissionError: unknown) {
      setError(getErrorMessage(submissionError, 'Failed to post discussion'));
    } finally {
      setLoading(false);
    }
  }

  const selectedKind = KINDS.find((kind) => kind.value === formData.kind)!;
  const visibleTags = showAllTags ? meta?.tags ?? [] : meta?.tags.slice(0, TAG_PREVIEW_COUNT) ?? [];
  const remainingTags = Math.max(0, (meta?.tags.length ?? 0) - TAG_PREVIEW_COUNT);
  const selectedCategoryName = meta?.categories.find((item) => item.id === formData.categoryId)?.name ?? 'Select category';
  const selectedRegionName = meta?.regions.find((item) => item.id === formData.regionId)?.name ?? 'All of Pakistan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-[#1a0a2e]/72 backdrop-blur-sm" onClick={onClose} />

      <div className="relative my-auto w-full max-w-[720px] overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_35px_90px_rgba(20,8,35,0.3)]">
        <div className="bg-[linear-gradient(135deg,#40215A_0%,#6A3A8D_55%,#A05CCC_100%)] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              
              <h2 className="mt-3 text-[22px] font-bold tracking-[-0.03em]">
                Start a New Legal Discussion
              </h2>
              <p className="mt-1 text-[12px] text-white/75">
                Frame the issue clearly so the right lawyers can find and answer it.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/16 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[calc(90vh-164px)] space-y-6 overflow-y-auto bg-[linear-gradient(180deg,#FBF8FD_0%,#FFFFFF_18%)] px-6 py-6">
            <section className="rounded-[22px] border border-[#E9DFF2] bg-white p-5 shadow-[0_10px_30px_rgba(76,47,94,0.06)]">
              <label className="mb-3 block text-[12px] font-bold uppercase tracking-wider text-gray-700">
                Discussion Type <span className="font-normal normal-case tracking-normal text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {KINDS.map((kind) => {
                  const Icon = kind.icon;
                  const isSelected = formData.kind === kind.value;
                  return (
                    <button
                      key={kind.value}
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, kind: kind.value }))}
                      className="relative rounded-2xl border-2 px-4 py-3 text-left transition-all duration-150"
                      style={{
                        borderColor: isSelected ? kind.color : '#E5E7EB',
                        background: isSelected ? kind.bg : 'white',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: isSelected ? kind.color : '#9CA3AF' }}
                        />
                        <span
                          className="text-[13px] font-bold"
                          style={{ color: isSelected ? kind.color : '#374151' }}
                        >
                          {kind.label}
                        </span>
                      </div>
                      <p className="mt-1 pl-6 text-[11px] text-gray-400">{kind.desc}</p>
                      {isSelected ? (
                        <div
                          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ background: kind.color }}
                        >
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[22px] border border-[#E9DFF2] bg-white p-5 shadow-[0_10px_30px_rgba(76,47,94,0.06)]">
              <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-gray-700">
                Discussion Title <span className="font-normal normal-case tracking-normal text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter a clear, descriptive title for your legal question"
                value={formData.title}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, title: event.target.value }))
                }
                maxLength={200}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 transition placeholder:text-gray-300 focus:border-[#9F63C4] focus:outline-none focus:ring-4 focus:ring-[#9F63C4]/10"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                <span>{selectedKind.label} posts perform best with a specific legal context</span>
                <span>{formData.title.length}/200</span>
              </div>
            </section>

            <section className="rounded-[22px] border border-[#E9DFF2] bg-white p-5 shadow-[0_10px_30px_rgba(76,47,94,0.06)]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SearchableSelect
                  label="Category"
                  placeholder={selectedCategoryName}
                  emptyLabel="Select category"
                  options={meta?.categories ?? []}
                  selectedValue={formData.categoryId}
                  onSelect={(value) =>
                    setFormData((current) => ({ ...current, categoryId: value }))
                  }
                  icon={<Shapes className="h-4 w-4" />}
                />

                <SearchableSelect
                  label="Region"
                  placeholder={selectedRegionName}
                  emptyLabel="All of Pakistan"
                  options={meta?.regions ?? []}
                  selectedValue={formData.regionId}
                  onSelect={(value) =>
                    setFormData((current) => ({ ...current, regionId: value }))
                  }
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>
            </section>

            {meta?.tags && meta.tags.length > 0 ? (
              <section className="rounded-[22px] border border-[#E9DFF2] bg-white p-5 shadow-[0_10px_30px_rgba(76,47,94,0.06)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-700">
                      Tags <span className="font-normal normal-case tracking-normal text-gray-400">(optional)</span>
                    </label>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Pick tags so the right specialists can find your discussion faster.
                    </p>
                  </div>
                  {remainingTags > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowAllTags((current) => !current)}
                      className="rounded-full border border-[#E7D9F3] bg-[#FAF6FD] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7B3FA0] transition hover:bg-[#F4ECFA]"
                    >
                      {showAllTags ? 'Show Less' : `+${remainingTags} More`}
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {visibleTags.map((tag) => {
                    const selected = formData.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all ${
                          selected
                            ? 'border-[#7B3FA0] bg-[#7B3FA0] text-white shadow-[0_10px_22px_rgba(123,63,160,0.18)]'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-[#D8C5EA] hover:bg-[#FBF8FD]'
                        }`}
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="rounded-[22px] border border-[#E9DFF2] bg-white p-5 shadow-[0_10px_30px_rgba(76,47,94,0.06)]">
              <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-gray-700">
                Description <span className="font-normal normal-case tracking-normal text-red-400">*</span>
              </label>
              <textarea
                placeholder="Describe your legal question or topic in detail. Include relevant facts, dates, and any specific concerns."
                value={formData.body}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, body: event.target.value }))
                }
                rows={7}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 transition placeholder:text-gray-300 focus:border-[#9F63C4] focus:outline-none focus:ring-4 focus:ring-[#9F63C4]/10"
              />
              <div className="mt-2 text-[11px] text-gray-400">
                Add enough detail for lawyers to understand the legal context quickly.
              </div>
            </section>

            {error ? (
              <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <p className="text-[12px] font-medium text-red-600">{error}</p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#5B2D8E_0%,#9F63C4_100%)] px-6 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Discussion'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
