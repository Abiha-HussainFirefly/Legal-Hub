'use client';

import CaseEditor from '@/app/components/cases/case-editor';
import { useToast } from '@/app/components/ui/toast/toast-context';
import type { CaseDraftPayload } from '@/types/case';
import { BriefcaseBusiness } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

function MetaSkeleton() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 lg:px-8">
      <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1EAF6] text-[#4C2F5E]">
          <BriefcaseBusiness className="h-7 w-7" />
        </div>
        <p className="mt-5 text-lg font-semibold text-[#2F1D3B]">Loading case form metadata...</p>
      </div>
    </div>
  );
}

export default function CreateCasePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases/meta')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load case metadata');
        setMeta(payload);
      })
      .catch((error) => {
        addToast('error', 'Case form unavailable', error.message);
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  async function persist(payload: CaseDraftPayload, intent: 'draft' | 'submit') {
    const response = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, intent }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create case draft');
    }

    addToast(
      'success',
      intent === 'draft' ? 'Draft saved' : 'Submitted for review',
      intent === 'draft'
        ? 'The case draft has been created successfully.'
        : 'The case has been submitted into the reviewer queue.',
    );

    router.push(`/cases/${result.data.slug}`);
  }

  if (loading || !meta) {
    return <MetaSkeleton />;
  }

  return (
    <CaseEditor
      mode="create"
      categories={meta.categories}
      tags={meta.tags}
      regions={meta.regions}
      courts={meta.courts}
      onSaveDraft={(payload) => persist(payload, 'draft')}
      onSubmitForReview={(payload) => persist(payload, 'submit')}
    />
  );
}
