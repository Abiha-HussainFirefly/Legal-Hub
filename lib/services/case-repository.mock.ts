import type {
  CaseCommentItem,
  CaseCourtSummary,
  CaseRepositoryFilterOptions,
  CaseRepositoryFilters,
  CaseRepositoryInsight,
  CaseRepositoryRecord,
  CaseRepositorySort,
  CaseTaxonomy,
  CaseUserSummary,
} from '@/types/case';

interface WorkspaceUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  roles?: string[];
}

const categories: CaseTaxonomy[] = [
  { id: 'cat-constitutional', name: 'Constitutional Law', colorHex: '#4C2F5E' },
  { id: 'cat-corporate', name: 'Corporate Compliance', colorHex: '#6F5484' },
  { id: 'cat-employment', name: 'Employment Law', colorHex: '#8668A1' },
  { id: 'cat-criminal', name: 'Criminal Procedure', colorHex: '#5C3A70' },
];

const tags: CaseTaxonomy[] = [
  { id: 'tag-due-process', name: 'Due Process' },
  { id: 'tag-contracts', name: 'Contracts' },
  { id: 'tag-arbitration', name: 'Arbitration' },
  { id: 'tag-labour', name: 'Labour Rights' },
  { id: 'tag-evidence', name: 'Digital Evidence' },
  { id: 'tag-regulatory', name: 'Regulatory Review' },
];

const regions: CaseTaxonomy[] = [
  { id: 'reg-uae', name: 'United Arab Emirates' },
  { id: 'reg-punjab', name: 'Punjab' },
  { id: 'reg-sindh', name: 'Sindh' },
  { id: 'reg-federal', name: 'Federal' },
];

const courts: CaseCourtSummary[] = [
  { id: 'court-supreme', name: 'Supreme Court', level: 'SUPREME' },
  { id: 'court-high', name: 'High Court', level: 'HIGH' },
  { id: 'court-tribunal', name: 'Commercial Tribunal', level: 'TRIBUNAL' },
  { id: 'court-appellate', name: 'Appellate Bench', level: 'APPELLATE' },
];

const organizations = [
  { id: 'org-aegis', name: 'Aegis Legal Advisory' },
  { id: 'org-verdict', name: 'Verdict Research Collective' },
  { id: 'org-civic', name: 'Civic Rights Forum' },
];

function iso(date: string) {
  return new Date(date).toISOString();
}

function resolveCurrentAuthor(user?: WorkspaceUser | null): CaseUserSummary {
  return {
    id: user?.id ?? 'user-current',
    displayName: user?.name ?? 'AbihaH',
    email: user?.email ?? 'abiha@legalhub.com',
    organizationName: 'Aegis Legal Advisory',
    roleLabel: 'Contributor',
    isVerifiedLawyer: true,
  };
}

function standardReviewer(): CaseUserSummary {
  return {
    id: 'reviewer-1',
    displayName: 'Rafay Malik',
    email: 'rafay@legalhub.com',
    organizationName: 'Legal Hub Editorial Board',
    roleLabel: 'Reviewer',
    isVerifiedLawyer: true,
  };
}

function comment(author: CaseUserSummary, body: string, createdAt: string, replies: CaseCommentItem[] = []): CaseCommentItem {
  return {
    id: `${author.id}-${createdAt}`,
    author,
    body,
    createdAt,
    reactions: [
      { type: 'HELPFUL', count: 4 },
      { type: 'INSIGHTFUL', count: 2 },
    ],
    replies,
  };
}

function buildCases(user?: WorkspaceUser | null): CaseRepositoryRecord[] {
  const currentAuthor = resolveCurrentAuthor(user);
  const reviewer = standardReviewer();
  const secondaryAuthor: CaseUserSummary = {
    id: 'user-2',
    displayName: 'Sarmad Qureshi',
    email: 'sarmad@verdictcollective.com',
    organizationName: 'Verdict Research Collective',
    roleLabel: 'Senior Counsel',
    isVerifiedLawyer: true,
  };
  const communityAuthor: CaseUserSummary = {
    id: 'user-3',
    displayName: 'Hina Talat',
    email: 'hina@civicrights.org',
    organizationName: 'Civic Rights Forum',
    roleLabel: 'Public Interest Counsel',
    isVerifiedLawyer: true,
  };

  return [
    {
      id: 'case-1',
      slug: 'state-v-khan-digital-evidence-admissibility',
      title: 'State v. Khan',
      canonicalCitation: '2025 SC 118',
      summary:
        'A structured ruling on admissibility standards for cloud-hosted digital evidence, chain of custody, and notice obligations in cross-border investigations.',
      facts:
        'Investigators relied on server exports and preserved device snapshots after alleged procurement fraud. The defense challenged the evidentiary chain, jurisdiction over remote records, and the reliability of metadata supplied by a third-party vendor.',
      issues:
        'Whether cloud-hosted logs can satisfy evidentiary foundation requirements, whether notice defects invalidate admission, and how much corroboration is required for third-party digital records.',
      holding:
        'The Court held that digital records may be admitted if provenance, extraction process, and custody continuity are sufficiently documented, even when the records originate from a foreign-hosted environment.',
      outcome:
        'Conviction remanded in part for a narrower evidentiary determination, but the admissibility framework was affirmed.',
      proceduralHistory:
        'Appeal from a High Court evidentiary ruling after interlocutory criminal review.',
      docketNumber: 'CR-24-0198',
      category: categories[3],
      tags: [tags[4], tags[0]],
      region: regions[3],
      court: courts[0],
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      sourceType: 'OFFICIAL_COURT',
      author: currentAuthor,
      organization: organizations[0],
      decisionDate: iso('2025-11-12'),
      filedDate: iso('2025-07-18'),
      createdAt: iso('2025-11-14'),
      updatedAt: iso('2026-03-01'),
      publishedAt: iso('2025-11-20'),
      reviewedAt: iso('2025-11-19'),
      trustLabel: 'Verified from official judgment',
      provenanceLabel: 'Primary source + editorial summary',
      counts: { views: 1830, comments: 14, saves: 81, follows: 44, reactions: 67, outboundCitations: 4, inboundCitations: 12 },
      viewerState: { saved: true, followed: true, reaction: 'HELPFUL' },
      sourceLinks: [
        { id: 'sl-1', label: 'Official judgment', sourceName: 'Supreme Court Portal', url: 'https://example.com/judgment/state-v-khan', publishedAt: iso('2025-11-12'), isPrimary: true },
        { id: 'sl-2', label: 'Bench notes', sourceName: 'Court cause list archive', url: 'https://example.com/archive/state-v-khan-notes', publishedAt: iso('2025-11-13') },
      ],
      sourceFiles: [
        { id: 'sf-1', label: 'Certified PDF', filename: 'state-v-khan-certified.pdf', fileType: 'PDF', fileSizeLabel: '1.8 MB', uploadedAt: iso('2025-11-12') },
        { id: 'sf-2', label: 'Evidence appendix', filename: 'digital-evidence-appendix.pdf', fileType: 'PDF', fileSizeLabel: '940 KB', uploadedAt: iso('2025-11-14') },
      ],
      revisions: [
        { id: 'rev-1', version: 1, status: 'DRAFT', createdAt: iso('2025-11-14'), changeSummary: 'Initial structured summary and metadata capture.', editor: currentAuthor, reviewedBy: null },
        { id: 'rev-2', version: 2, status: 'PUBLISHED', createdAt: iso('2025-11-19'), changeSummary: 'Added digital evidence issue framing and linked certified source file.', editor: currentAuthor, reviewedBy: reviewer },
      ],
      citationsMade: [
        { id: 'cit-1', slug: 'aslam-v-state-notice-and-provenance', title: 'Aslam v. State', canonicalCitation: '2022 HC 45', court: 'High Court', decisionDate: iso('2022-04-06'), relationshipLabel: 'Cites for notice compliance', note: 'Used to clarify notice thresholds before admitting vendor-generated logs.' },
      ],
      citationsReceived: [
        { id: 'cit-2', slug: 're-public-sector-procurement-audit-logs', title: 'Re Public Sector Procurement Audit Logs', canonicalCitation: '2026 AB 14', court: 'Appellate Bench', decisionDate: iso('2026-01-09'), relationshipLabel: 'Cited by for digital provenance', note: 'Later bench applied the same extraction-record standard.' },
      ],
      comments: [
        comment(
          secondaryAuthor,
          'The provenance section is strong. A useful next improvement would be surfacing the notice timeline in a discrete chronology table for faster review.',
          iso('2025-11-22'),
          [
            comment(currentAuthor, 'Agreed. I can add a notice chronology block in the next revision pass.', iso('2025-11-23')),
          ],
        ),
        comment(communityAuthor, 'Helpful repository entry. The custody explanation is readable even for non-specialists.', iso('2025-11-26')),
      ],
      relatedDiscussions: [
        { id: 'disc-1', slug: 'digital-evidence-admissibility-standards', title: 'How should courts assess cross-border digital evidence exports?', answerCount: 7, updatedAt: iso('2026-02-10') },
      ],
      moderation: { openReports: 0, aiAlerts: 0, lastReviewerNote: 'Published after source health review.' },
    },
    {
      id: 'case-2',
      slug: 'union-workers-v-atlas-manufacturing',
      title: 'Union Workers v. Atlas Manufacturing',
      canonicalCitation: '2025 HC 392',
      summary:
        'A labour-rights dispute clarifying documentation standards for mass termination, consultation requirements, and the evidentiary value of internal restructuring memos.',
      facts:
        'An industrial employer terminated 84 workers during a facility restructuring and claimed insolvency-driven urgency.',
      issues:
        'Whether consultation was sufficient, whether internal memoranda can substantiate business necessity, and whether compensation calculations complied with statutory thresholds.',
      holding:
        'The High Court held that restructuring memoranda alone are insufficient absent contemporaneous consultation records and notice compliance.',
      outcome:
        'Employees succeeded in part. Compensation and reinstatement analysis was remitted to the labour tribunal.',
      proceduralHistory:
        'Judicial review following a labour tribunal decision and employer appeal.',
      docketNumber: 'LAB-25-0042',
      category: categories[2],
      tags: [tags[3], tags[5]],
      region: regions[1],
      court: courts[1],
      status: 'PENDING_REVIEW',
      visibility: 'ORGANIZATION',
      sourceType: 'USER_SUBMITTED',
      author: currentAuthor,
      organization: organizations[0],
      decisionDate: iso('2025-09-08'),
      filedDate: iso('2025-04-14'),
      createdAt: iso('2026-03-06'),
      updatedAt: iso('2026-04-18'),
      reviewedAt: null,
      publishedAt: null,
      trustLabel: 'Contributor summary awaiting reviewer sign-off',
      provenanceLabel: 'Primary order + counsel notes',
      counts: { views: 214, comments: 6, saves: 19, follows: 10, reactions: 11, outboundCitations: 2, inboundCitations: 0 },
      viewerState: { saved: false, followed: false, reaction: null },
      sourceLinks: [
        { id: 'sl-3', label: 'Tribunal order', sourceName: 'Labour Tribunal Records', url: 'https://example.com/orders/atlas-workers', publishedAt: iso('2025-09-08'), isPrimary: true },
      ],
      sourceFiles: [
        { id: 'sf-3', label: 'Consultation exhibits', filename: 'consultation-exhibits.pdf', fileType: 'PDF', fileSizeLabel: '2.3 MB', uploadedAt: iso('2026-03-07') },
      ],
      revisions: [
        { id: 'rev-3', version: 1, status: 'DRAFT', createdAt: iso('2026-03-06'), changeSummary: 'Imported contributor notes and labour law framing.', editor: currentAuthor, reviewedBy: null },
        { id: 'rev-4', version: 2, status: 'PENDING_REVIEW', createdAt: iso('2026-04-17'), changeSummary: 'Expanded remedy analysis and attached consultation exhibits.', editor: currentAuthor, reviewedBy: null },
      ],
      citationsMade: [
        { id: 'cit-3', slug: 'federal-cement-v-labour-board', title: 'Federal Cement v. Labour Board', canonicalCitation: '2023 HC 144', court: 'High Court', decisionDate: iso('2023-08-11'), relationshipLabel: 'Cites for consultation threshold' },
      ],
      citationsReceived: [],
      comments: [
        comment(reviewer, 'Needs clearer separation between tribunal fact findings and the High Court holding before publication.', iso('2026-04-18')),
      ],
      relatedDiscussions: [
        { id: 'disc-2', slug: 'mass-termination-consultation-thresholds', title: 'How detailed should consultation records be in workforce reductions?', answerCount: 4, updatedAt: iso('2026-04-12') },
      ],
      moderation: { openReports: 0, aiAlerts: 1, lastReviewerNote: 'Clarify holding language and remove advocacy phrasing.' },
    },
    {
      id: 'case-3',
      slug: 'omega-holdings-v-revenue-authority',
      title: 'Omega Holdings v. Revenue Authority',
      canonicalCitation: '2024 AB 77',
      summary:
        'An appellate tax and corporate governance decision on disclosure sufficiency, remedial deference, and how boards should document compliance controls.',
      facts:
        'Revenue investigators alleged that a multinational holding company under-disclosed beneficial ownership relationships during a licensing cycle.',
      issues:
        'Whether governance records can cure filing gaps and whether the regulator exceeded its remedial powers.',
      holding:
        'The appellate bench partially limited the regulator’s remedy but affirmed broad disclosure obligations.',
      outcome:
        'Penalty recalculated; disclosure and internal control findings affirmed.',
      proceduralHistory:
        'Appeal from a specialist tax tribunal with partial stay proceedings.',
      docketNumber: 'TAX-24-881',
      category: categories[1],
      tags: [tags[1], tags[5]],
      region: regions[0],
      court: courts[3],
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      sourceType: 'IMPORTED_EDITORIAL',
      author: secondaryAuthor,
      organization: organizations[1],
      decisionDate: iso('2024-10-04'),
      filedDate: iso('2024-05-19'),
      createdAt: iso('2025-02-02'),
      updatedAt: iso('2026-02-20'),
      publishedAt: iso('2025-02-07'),
      reviewedAt: iso('2025-02-05'),
      trustLabel: 'Editorially curated with court cross-check',
      provenanceLabel: 'Imported editorial digest + docket verification',
      counts: { views: 2470, comments: 22, saves: 127, follows: 61, reactions: 89, outboundCitations: 6, inboundCitations: 18 },
      viewerState: { saved: false, followed: true, reaction: 'INSIGHTFUL' },
      sourceLinks: [
        { id: 'sl-4', label: 'Appellate ruling', sourceName: 'Bench archive', url: 'https://example.com/rulings/omega-holdings', publishedAt: iso('2024-10-04'), isPrimary: true },
        { id: 'sl-5', label: 'Editorial note', sourceName: 'Verdict Research', url: 'https://example.com/editorial/omega-holdings', publishedAt: iso('2025-02-02') },
      ],
      sourceFiles: [
        { id: 'sf-4', label: 'Ruling PDF', filename: 'omega-holdings-ruling.pdf', fileType: 'PDF', fileSizeLabel: '1.1 MB', uploadedAt: iso('2025-02-03') },
      ],
      revisions: [
        { id: 'rev-5', version: 1, status: 'PUBLISHED', createdAt: iso('2025-02-02'), changeSummary: 'Imported editorial digest and normalized tax metadata.', editor: secondaryAuthor, reviewedBy: reviewer },
      ],
      citationsMade: [
        { id: 'cit-4', slug: 'national-energy-licensing-board-v-spectra', title: 'National Energy Licensing Board v. Spectra', canonicalCitation: '2021 SC 90', court: 'Supreme Court', decisionDate: iso('2021-06-17'), relationshipLabel: 'Cites for remedial deference' },
      ],
      citationsReceived: [
        { id: 'cit-5', slug: 'falcon-ventures-v-revenue-authority', title: 'Falcon Ventures v. Revenue Authority', canonicalCitation: '2025 AB 11', court: 'Appellate Bench', decisionDate: iso('2025-01-14'), relationshipLabel: 'Cited by for board disclosure controls' },
      ],
      comments: [
        comment(communityAuthor, 'Strong overview for corporate teams. The board-control angle makes this more usable than a bare digest.', iso('2025-02-09')),
      ],
      relatedDiscussions: [
        { id: 'disc-3', slug: 'board-disclosure-obligations-in-regulated-entities', title: 'What documentation best supports beneficial ownership disclosure?', answerCount: 11, updatedAt: iso('2026-01-23') },
      ],
      moderation: { openReports: 0, aiAlerts: 0, lastReviewerNote: 'Good precedent mapping and source health.' },
    },
    {
      id: 'case-4',
      slug: 'civic-forum-v-ministry-of-information',
      title: 'Civic Forum v. Ministry of Information',
      canonicalCitation: '2026 HC 14',
      summary:
        'A constitutional and administrative law case on access-to-information timelines, proportional disclosure exemptions, and public-interest balancing.',
      facts:
        'A civic group requested procurement and licensing records linked to a public campaign. The ministry released a limited production and asserted broad confidentiality exemptions.',
      issues:
        'Whether the exemptions were proportionate, whether delay itself created an independent procedural violation, and how public-interest balancing should be articulated.',
      holding:
        'The High Court required a narrower exemption analysis and emphasized decision-makers must record why redaction is insufficient before denying access.',
      outcome:
        'Partial disclosure ordered with a mandatory re-evaluation of withheld records.',
      proceduralHistory:
        'Constitutional petition with interim public-interest orders.',
      docketNumber: 'CON-26-0014',
      category: categories[0],
      tags: [tags[0], tags[5]],
      region: regions[2],
      court: courts[1],
      status: 'DRAFT',
      visibility: 'PRIVATE',
      sourceType: 'COMMUNITY_CURATED',
      author: communityAuthor,
      organization: organizations[2],
      decisionDate: iso('2026-02-28'),
      filedDate: iso('2025-12-08'),
      createdAt: iso('2026-03-11'),
      updatedAt: iso('2026-04-16'),
      trustLabel: 'Draft with source packet attached',
      provenanceLabel: 'Community-curated from petition record',
      counts: { views: 58, comments: 3, saves: 7, follows: 4, reactions: 5, outboundCitations: 1, inboundCitations: 0 },
      viewerState: { saved: false, followed: false, reaction: null },
      sourceLinks: [
        { id: 'sl-6', label: 'Petition order sheet', sourceName: 'High Court filing portal', url: 'https://example.com/filings/civic-forum', publishedAt: iso('2026-03-01'), isPrimary: true },
      ],
      sourceFiles: [
        { id: 'sf-5', label: 'Redaction schedule', filename: 'redaction-schedule.xlsx', fileType: 'XLSX', fileSizeLabel: '220 KB', uploadedAt: iso('2026-03-12') },
      ],
      revisions: [
        { id: 'rev-6', version: 1, status: 'DRAFT', createdAt: iso('2026-03-11'), changeSummary: 'Created draft structure and initial chronology.', editor: communityAuthor, reviewedBy: null },
      ],
      citationsMade: [],
      citationsReceived: [],
      comments: [
        comment(reviewer, 'Good draft foundation. Needs cleaner articulation of the public-interest balancing test before submission.', iso('2026-04-04')),
      ],
      relatedDiscussions: [],
      moderation: { openReports: 0, aiAlerts: 0, lastReviewerNote: 'Complete the holding section before submission.' },
    },
  ];
}

function includesText(source: string | undefined | null, needle: string) {
  return (source ?? '').toLowerCase().includes(needle);
}

function withinDateRange(date: string | null | undefined, range: string) {
  if (!range || !date) return true;
  const value = new Date(date).getTime();
  const now = Date.now();
  if (range === '30d') return value >= now - 1000 * 60 * 60 * 24 * 30;
  if (range === '90d') return value >= now - 1000 * 60 * 60 * 24 * 90;
  if (range === '1y') return value >= now - 1000 * 60 * 60 * 24 * 365;
  return true;
}

function sortCases(cases: CaseRepositoryRecord[], sort: CaseRepositorySort) {
  const next = [...cases];
  next.sort((a, b) => {
    if (sort === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sort === 'decision_date') return new Date(b.decisionDate ?? b.updatedAt).getTime() - new Date(a.decisionDate ?? a.updatedAt).getTime();
    if (sort === 'views') return b.counts.views - a.counts.views;
    if (sort === 'follows') return b.counts.follows - a.counts.follows;
    if (sort === 'helpful') return b.counts.reactions - a.counts.reactions;
    if (sort === 'cited') return (b.counts.inboundCitations + b.counts.outboundCitations) - (a.counts.inboundCitations + a.counts.outboundCitations);
    return (b.counts.reactions + b.counts.views) - (a.counts.reactions + a.counts.views);
  });
  return next;
}

export function getCaseRepositoryFilterOptions(): CaseRepositoryFilterOptions {
  return {
    categories,
    tags,
    regions,
    courts,
    organizations,
    sourceTypes: ['USER_SUBMITTED', 'OFFICIAL_COURT', 'IMPORTED_EDITORIAL', 'COMMUNITY_CURATED'],
    statuses: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'REMOVED'],
    visibilities: ['PUBLIC', 'UNLISTED', 'PRIVATE', 'ORGANIZATION'],
  };
}

export function searchCaseRepository(filters: CaseRepositoryFilters, user?: WorkspaceUser | null): CaseRepositoryRecord[] {
  const collection = buildCases(user);
  const term = filters.search.trim().toLowerCase();
  const filtered = collection.filter((item) => {
    const matchesSearch =
      !term ||
      [
        item.title,
        item.summary,
        item.canonicalCitation,
        item.author.displayName,
        item.organization?.name,
        item.category.name,
        item.region?.name,
        item.court?.name,
        ...item.tags.map((tag) => tag.name),
      ].some((value) => includesText(value, term));

    if (!matchesSearch) return false;
    if (filters.category && item.category.id !== filters.category) return false;
    if (filters.tag && !item.tags.some((tag) => tag.id === filters.tag)) return false;
    if (filters.region && item.region?.id !== filters.region) return false;
    if (filters.court && item.court?.id !== filters.court) return false;
    if (filters.sourceType && item.sourceType !== filters.sourceType) return false;
    if (filters.visibility && item.visibility !== filters.visibility) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.organization && item.organization?.id !== filters.organization) return false;
    if (filters.authorScope === 'mine' && item.author.id !== user?.id) return false;
    if (filters.authorScope === 'verified' && !item.author.isVerifiedLawyer) return false;
    if (!withinDateRange(item.decisionDate ?? null, filters.dateRange)) return false;
    return true;
  });

  return sortCases(filtered, filters.sort);
}

export function getCaseBySlug(slug: string, user?: WorkspaceUser | null) {
  return buildCases(user).find((item) => item.slug === slug) ?? null;
}

export function getCaseRepositoryInsights(user?: WorkspaceUser | null): CaseRepositoryInsight[] {
  const collection = buildCases(user);
  const published = collection.filter((item) => item.status === 'PUBLISHED');
  const pending = collection.filter((item) => item.status === 'PENDING_REVIEW');
  const officialSources = collection.filter((item) => item.sourceType === 'OFFICIAL_COURT');

  return [
    {
      label: 'Published records',
      value: `${published.length}`,
      detail: 'Structured case entries ready for public research and citation tracking.',
    },
    {
      label: 'Pending review',
      value: `${pending.length}`,
      detail: 'Contributor drafts waiting on editorial quality, source, or moderation checks.',
    },
    {
      label: 'Official-source coverage',
      value: `${Math.round((officialSources.length / collection.length) * 100)}%`,
      detail: 'Repository items grounded directly in court-issued material.',
    },
  ];
}

export function getFeaturedCases(user?: WorkspaceUser | null) {
  return sortCases(buildCases(user), 'cited').slice(0, 3);
}

export function getMyCases(user?: WorkspaceUser | null) {
  const currentId = user?.id ?? 'user-current';
  return buildCases(user).filter((item) => item.author.id === currentId);
}

export function getSavedAndFollowedCases(user?: WorkspaceUser | null) {
  const collection = buildCases(user);
  return {
    saved: collection.filter((item) => item.viewerState.saved),
    followed: collection.filter((item) => item.viewerState.followed),
    recent: sortCases(collection, 'recent').slice(0, 3),
  };
}

export function getReviewerQueue(user?: WorkspaceUser | null) {
  return buildCases(user).filter((item) => ['PENDING_REVIEW', 'DRAFT', 'REJECTED'].includes(item.status));
}

