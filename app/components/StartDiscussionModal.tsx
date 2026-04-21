'use client';

import { X, Loader2, HelpCircle, MessageSquare, Megaphone, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StartDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
}
interface Meta {
  categories: { id: string; name: string }[];
  regions:    { id: string; name: string }[];
  tags:       { id: string; name: string; type: string }[];
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

export default function StartDiscussionModal({ isOpen, onClose }: StartDiscussionModalProps) {
  const router = useRouter();
  const [meta,    setMeta]    = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [formData, setFormData] = useState({
    title:      '',
    body:       '',
    kind:       'QUESTION' as typeof KINDS[number]['value'],
    categoryId: '',
    regionId:   '',
    tagIds:     [] as string[],
    visibility: 'PUBLIC' as 'PUBLIC' | 'UNLISTED' | 'PRIVATE',
  });

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/discussions/meta').then(r => r.json()).then(setMeta).catch(() => {});
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setFormData({ title: '', body: '', kind: 'QUESTION', categoryId: '', regionId: '', tagIds: [], visibility: 'PUBLIC' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function toggleTag(id: string) {
    setFormData(f => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter(t => t !== id) : [...f.tagIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!formData.title.trim())  return setError('Title is required');
    if (!formData.body.trim())   return setError('Description is required');
    if (!formData.categoryId)    return setError('Please select a category');

    setLoading(true);
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:      formData.title.trim(),
          body:       formData.body.trim(),
          kind:       formData.kind,
          categoryId: formData.categoryId,
          regionId:   formData.regionId || undefined,
          tagIds:     formData.tagIds.length ? formData.tagIds : undefined,
          visibility: formData.visibility,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post discussion');
      onClose();
      router.push(`/discussions/${data.slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedKind = KINDS.find(k => k.value === formData.kind)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1a0a2e]/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[580px] bg-white rounded-2xl shadow-2xl overflow-hidden my-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">Start a New Legal Discussion</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Share your question or expertise with the community</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[calc(90vh-140px)] overflow-y-auto">

            {/* Discussion Type */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                Discussion Type <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {KINDS.map(k => {
                  const Icon = k.icon;
                  const isSelected = formData.kind === k.value;
                  return (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, kind: k.value }))}
                      className="relative text-left px-3.5 py-3 rounded-xl border-2 transition-all duration-150 cursor-pointer"
                      style={{
                        borderColor: isSelected ? k.color : '#E5E7EB',
                        background:  isSelected ? k.bg     : 'white',
                      }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: isSelected ? k.color : '#9CA3AF' }}
                        />
                        <span
                          className="text-[12px] font-bold"
                          style={{ color: isSelected ? k.color : '#374151' }}>
                          {k.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 pl-[22px]">{k.desc}</p>
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: k.color }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title  */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                Discussion Title <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter a clear, descriptive title for your legal question..."
                value={formData.title}
                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                maxLength={200}
                className="w-full px-3.5 py-2.5 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#9F63C4] focus:ring-3 focus:ring-[#9F63C4]/10 transition placeholder:text-gray-300"
              />
            </div>

            {/* Category + Region  */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Category <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full appearance-none px-3.5 py-2.5 text-[13px] text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#9F63C4] focus:ring-3 focus:ring-[#9F63C4]/10 transition cursor-pointer pr-8">
                    <option value="">Select category</option>
                    {meta?.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Region
                </label>
                <div className="relative">
                  <select
                    value={formData.regionId}
                    onChange={e => setFormData(f => ({ ...f, regionId: e.target.value }))}
                    className="w-full appearance-none px-3.5 py-2.5 text-[13px] text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#9F63C4] focus:ring-3 focus:ring-[#9F63C4]/10 transition cursor-pointer pr-8">
                    <option value="">All of Pakistan</option>
                    {meta?.regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tags */}
            {meta?.tags && meta.tags.length > 0 && (
              <div>
                <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Tags <span className="text-gray-400 normal-case font-normal tracking-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {meta.tags.slice(0, 24).map(tag => {
                    const selected = formData.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer"
                        style={{
                          background:   selected ? '#7B3FA0' : 'white',
                          borderColor:  selected ? '#7B3FA0' : '#E5E7EB',
                          color:        selected ? 'white'   : '#374151',
                        }}>
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description  */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                Description <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
              </label>
              <textarea
                placeholder="Describe your legal question or topic in detail. Include relevant facts, dates, and any specific concerns..."
                value={formData.body}
                onChange={e => setFormData(f => ({ ...f, body: e.target.value }))}
                rows={6}
                className="w-full px-3.5 py-2.5 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#9F63C4] focus:ring-3 focus:ring-[#9F63C4]/10 transition resize-none placeholder:text-gray-300"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-[12px] text-red-600 font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Footer  */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[13px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-[13px] font-bold text-white rounded-xl transition disabled:opacity-60 cursor-pointer flex items-center gap-2 hover:opacity-90 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #5B2D8E 0%, #9F63C4 100%)' }}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
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