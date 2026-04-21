'use client';

import CaseEditor from '@/app/components/cases/case-editor';
import { useCaseWorkspace } from '@/app/components/cases/case-workspace';
import { getCaseBySlug, getCaseRepositoryFilterOptions } from '@/lib/services/case-repository.mock';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

const options = getCaseRepositoryFilterOptions();

export default function EditCasePage() {
  const { user } = useCaseWorkspace();
  const params = useParams<{ slug: string }>();
  const record = useMemo(() => getCaseBySlug(params.slug, user), [params.slug, user]);

  return (
    <CaseEditor
      mode="edit"
      initialCase={record}
      categories={options.categories}
      tags={options.tags}
      regions={options.regions}
      courts={options.courts}
      organizations={options.organizations}
    />
  );
}

