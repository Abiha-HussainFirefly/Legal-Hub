'use client';

import Tooltip from '@/app/components/ui/tooltip';
import { AlertCircle, CheckCircle2, Sparkles, X } from 'lucide-react';

interface AISummaryData {
  summaryText: string | null;
  mainIssue: string | null;
  keyPoints: unknown;
  expertConsensus: string | null;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  summaryData: AISummaryData | null;
  discussionTitle: string;
}

function parseKeyPoints(kp: unknown): string[] {
  if (!kp) return [];
  if (Array.isArray(kp)) return kp.filter(Boolean).map(String);
  if (typeof kp === 'string') {
    try { const p = JSON.parse(kp); return Array.isArray(p) ? p.map(String) : [kp]; }
    catch { return [kp]; }
  }
  return [];
}

export default function AISummaryModal({ isOpen, onClose, summaryData, discussionTitle }: Props) {
  if (!isOpen) return null;

  const keyPoints = parseKeyPoints(summaryData?.keyPoints);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a0a2e]/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header  */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7B3FA0 0%, #9F63C4 100%)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[16px] font-bold text-gray-900">AI Summary</h2>
          </div>
          <Tooltip content="Close">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Discussion title card */}
          <div className="rounded-xl px-4 py-3.5" style={{ background: '#F8F3FF', border: '1px solid #E8D9F5' }}>
            <p className="text-[13px] font-bold text-[#4C2F5E] leading-snug mb-1">{discussionTitle}</p>
            <p className="text-[11px] text-[#9F63C4]">AI-generated summary based on discussion content and expert replies</p>
          </div>

          {!summaryData || summaryData.status !== 'GENERATED' ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-[#F8F3FF] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-[#9F63C4]" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Summary not available yet</p>
              <p className="text-xs text-gray-400">Our AI is still analyzing this discussion.</p>
            </div>
          ) : (
            <>
              {/* Main Issue  */}
              {summaryData.mainIssue && (
                <section>
                  <div className="flex items-center gap-2 mb-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#9F63C4] flex-shrink-0" style={{ width: 18, height: 18 }} />
                    <h3 className="text-[14px] font-bold text-gray-900">Main Issue</h3>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed pl-[26px]">
                    {summaryData.mainIssue}
                  </p>
                </section>
              )}

              {/*  Key Points */}
              {keyPoints.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#9F63C4] flex-shrink-0" style={{ width: 18, height: 18 }} />
                    <h3 className="text-[14px] font-bold text-gray-900">Key Points</h3>
                  </div>
                  <ul className="space-y-1.5 pl-[26px]">
                    {keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9F63C4] mt-[6px] flex-shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Expert Consensus */}
              {summaryData.expertConsensus && (
                <section>
                  <div className="flex items-center gap-2 mb-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#9F63C4] flex-shrink-0" style={{ width: 18, height: 18 }} />
                    <h3 className="text-[14px] font-bold text-gray-900">Expert Consensus</h3>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed pl-[26px]">
                    {summaryData.expertConsensus}
                  </p>
                </section>
              )}

            
              {summaryData.summaryText && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5">
                  <p className="text-[12px] text-gray-600 leading-relaxed">{summaryData.summaryText}</p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="rounded-xl px-4 py-3 flex items-start gap-2.5"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  <span className="font-bold">Disclaimer:</span> This AI summary is for informational purposes only and does not constitute legal advice. Consult a qualified lawyer for specific guidance.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Footer button ── */}
        <div className="px-6 pb-5 pt-2">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[13px] font-bold transition hover:opacity-90 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #5B2D8E 0%, #9F63C4 100%)' }}>
            <Sparkles className="w-4 h-4" />
            Generated by Legal Hub AI
          </button>
        </div>
      </div>
    </div>
  );
}
