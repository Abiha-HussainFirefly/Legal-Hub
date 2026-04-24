'use client';

import CaseEditor from '@/app/components/cases/case-editor';
import CaseEmptyState from '@/app/components/cases/case-empty-state';
import { useToast } from '@/app/components/ui/toast/toast-context';
import type { CaseRepositoryRecord } from '@/types/case';
import { BriefcaseBusiness } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Option {
  id: string;
  name: string;
}

interface CourtOption extends Option {
  level: string;
  regionId?: string | null;
}

interface MetaResponse {
  categories: Option[];
  tags: Option[];
  regions: Option[];
  courts: CourtOption[];
}

export default function EditCasePage() {
  const params = useParams<{ slug: string }>();
  const { addToast } = useToast();
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [record, setRecord] = useState<CaseRepositoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/cases/meta'),
      fetch(`/api/cases/${params.slug}`),
    ])
      .then(async ([metaResponse, recordResponse]) => {
        const metaPayload = await metaResponse.json();
        const recordPayload = await recordResponse.json();

        if (!metaResponse.ok) {
          throw new Error(metaPayload.error || 'Failed to load case metadata.');
        }

        if (!recordResponse.ok) {
          if (recordResponse.status === 404) {
            if (!cancelled) setNotFound(true);
            return;
          }

          throw new Error(recordPayload.error || 'Failed to load case record.');
        }

        if (cancelled) return;
        setMeta(metaPayload);
        setRecord(recordPayload.data ?? null);
      })
      .catch((error) => {
        if (!cancelled) {
          addToast('error', 'Case editor unavailable', error instanceof Error ? error.message : 'Unable to load the case editor.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [addToast, params.slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1EAF6] text-[#4C2F5E]">
            <BriefcaseBusiness className="h-7 w-7" />
          </div>
          <p className="mt-5 text-lg font-semibold text-[#2F1D3B]">Loading case editor...</p>
        </div>
      </div>
    );
  }

  if (notFound || !meta || !record) {
    return (
      <div className="mx-auto max-w-[980px] px-4 py-12 md:px-6 lg:px-8">
        <CaseEmptyState
          icon={BriefcaseBusiness}
          title="Case record not found"
          description="The case may have been moved, archived, or is not available to edit with the current account."
        />
      </div>
    );
  }

  return (
    <CaseEditor
      mode="edit"
      initialCase={record}
      categories={meta.categories}
      tags={meta.tags}
      regions={meta.regions}
      courts={meta.courts}
    />
  );
}
