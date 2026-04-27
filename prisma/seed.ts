// prisma/seed.ts
// COMPLETE SEED — replaces the existing file.
// Seeds: Roles, Admin, Lawyer accounts, Categories, Regions, Tags,
// and demo Discussions with Answers, Comments, Reactions, Follows, Saves.
// Run: npx prisma db seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Config ────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'abeehahussain572@gmail.com';
const ADMIN_PASSWORD = 'Admin@12';

// Demo lawyer accounts (will be created with lawyer role)
// const DEMO_LAWYERS = [
//   { email: 'nimra.khan@legalhub.demo',    name: 'Adv. Nimra Khan',    barCouncil: 'Punjab Bar Council',     specialty: 'Criminal Law' },
//   { email: 'shahid.khan@legalhub.demo',   name: 'Adv. Shahid Khan',   barCouncil: 'Sindh Bar Council',      specialty: 'Contract Law' },
//   { email: 'fatima.noor@legalhub.demo',   name: 'Adv. Fatima Noor',   barCouncil: 'Islamabad Bar Council',  specialty: 'Tax Law'      },
//   { email: 'hassan.raza@legalhub.demo',   name: 'Adv. Hassan Raza',   barCouncil: 'KPK Bar Council',        specialty: 'Labor Law'    },
//   { email: 'demo.lawyer@legalhub.demo',   name: 'Adv. Ahmed Ali',     barCouncil: 'Punjab Bar Council',     specialty: 'Family Law'   },
// ];

// ── 1. Roles ─────────────────────────────────────────────────
async function seedRoles() {
  const roles = [
    { name: 'admin',    description: 'System Administrator'       },
    { name: 'lawyer',   description: 'Verified Legal Professional' },
    { name: 'member',   description: 'Default member role'         },
    { name: 'moderator',description: 'Content Moderator'          },
  ];
  for (const r of roles) {
    await prisma.role.upsert({ where: { name: r.name }, update: {}, create: { name: r.name, description: r.description, isSystem: true } });
  }
  console.log('✓ Roles seeded');
}

// ── 2. Admin account ─────────────────────────────────────────
async function seedAdmin() {
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const exists = await prisma.userIdentifier.findUnique({ where: { type_normalizedValue: { type: 'EMAIL', normalizedValue: email } } });
  if (exists) { console.log(`⚠  Admin already exists — skipping`); return null; }

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!adminRole) throw new Error('admin role missing');
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({ data: { userType: 'EXTERNAL', status: 'ACTIVE', displayName: 'Admin' } });
    await tx.userIdentifier.create({ data: { userId: u.id, type: 'EMAIL', value: email, normalizedValue: email, isPrimary: true, verifiedAt: new Date() } });
    await tx.credential.create({ data: { userId: u.id, passwordHash: hash, passwordAlgo: 'bcrypt', passwordSetAt: new Date() } });
    await tx.userRole.create({ data: { userId: u.id, roleId: adminRole.id } });
    await tx.userProfile.create({ data: { userId: u.id, username: 'admin', isLawyer: false } });
    await tx.userStats.create({ data: { userId: u.id } });
    await tx.userGamification.create({ data: { userId: u.id } });
    return u;
  });
  console.log(`✓ Admin account: ${email} / ${ADMIN_PASSWORD}`);
  return user;
}

// ── 3. Demo lawyer accounts ───────────────────────────────────
// async function seedLawyers() {
//   const lawyerRole = await prisma.role.findUnique({ where: { name: 'lawyer' } });
//   if (!lawyerRole) throw new Error('lawyer role missing');
//   const hash = await bcrypt.hash('Lawyer@12', 12);
//   const users: any[] = [];

//   for (const l of DEMO_LAWYERS) {
//     const email = l.email.toLowerCase();
//     const existing = await prisma.userIdentifier.findUnique({ where: { type_normalizedValue: { type: 'EMAIL', normalizedValue: email } } });
//     if (existing) {
//       const u = await prisma.$transaction(async (tx) => {
//         await tx.user.update({
//           where: { id: existing.userId },
//           data: {
//             status: 'ACTIVE',
//             displayName: l.name,
//           },
//         });

//         await tx.userIdentifier.update({
//           where: { id: existing.id },
//           data: {
//             value: email,
//             normalizedValue: email,
//             isPrimary: true,
//             verifiedAt: new Date(),
//           },
//         });

//         await tx.credential.upsert({
//           where: { userId: existing.userId },
//           update: {
//             passwordHash: hash,
//             passwordAlgo: 'bcrypt',
//             passwordSetAt: new Date(),
//             mustRotate: false,
//           },
//           create: {
//             userId: existing.userId,
//             passwordHash: hash,
//             passwordAlgo: 'bcrypt',
//             passwordSetAt: new Date(),
//             mustRotate: false,
//           },
//         });

//         await tx.userRole.upsert({
//           where: { userId_roleId: { userId: existing.userId, roleId: lawyerRole.id } },
//           update: {},
//           create: { userId: existing.userId, roleId: lawyerRole.id },
//         });

//         await tx.userProfile.upsert({
//           where: { userId: existing.userId },
//           update: {
//             isLawyer: true,
//             headline: `Specialist in ${l.specialty}`,
//           },
//           create: {
//             userId: existing.userId,
//             username: l.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) + Math.floor(Math.random() * 99),
//             isLawyer: true,
//             headline: `Specialist in ${l.specialty}`,
//           },
//         });

//         await tx.userStats.upsert({
//           where: { userId: existing.userId },
//           update: {},
//           create: { userId: existing.userId },
//         });

//         await tx.userGamification.upsert({
//           where: { userId: existing.userId },
//           update: {},
//           create: { userId: existing.userId, totalPoints: Math.floor(Math.random() * 2000) + 500 },
//         });

//         await tx.lawyerProfile.upsert({
//           where: { userId: existing.userId },
//           update: {
//             barCouncil: l.barCouncil,
//             verificationStatus: 'VERIFIED',
//             verifiedAt: new Date(),
//           },
//           create: {
//             userId: existing.userId,
//             barCouncil: l.barCouncil,
//             verificationStatus: 'VERIFIED',
//             verifiedAt: new Date(),
//           },
//         });

//         return tx.user.findUnique({ where: { id: existing.userId } });
//       });
//       users.push(u);
//       continue;
//     }

//     const user = await prisma.$transaction(async (tx) => {
//       const u = await tx.user.create({ data: { userType: 'EXTERNAL', status: 'ACTIVE', displayName: l.name } });
//       await tx.userIdentifier.create({ data: { userId: u.id, type: 'EMAIL', value: email, normalizedValue: email, isPrimary: true, verifiedAt: new Date() } });
//       await tx.credential.create({ data: { userId: u.id, passwordHash: hash, passwordAlgo: 'bcrypt' } });
//       await tx.userRole.create({ data: { userId: u.id, roleId: lawyerRole.id } });
//       const username = l.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) + Math.floor(Math.random() * 99);
//       await tx.userProfile.create({ data: { userId: u.id, username, isLawyer: true, headline: `Specialist in ${l.specialty}` } });
//       await tx.userStats.create({ data: { userId: u.id } });
//       await tx.userGamification.create({ data: { userId: u.id, totalPoints: Math.floor(Math.random() * 2000) + 500 } });
//       await tx.lawyerProfile.create({ data: { userId: u.id, barCouncil: l.barCouncil, verificationStatus: 'VERIFIED', verifiedAt: new Date() } });
//       return u;
//     });
//     users.push(user);
//   }
//   console.log(`✓ ${users.length} lawyer accounts seeded (password: Lawyer@12)`);
//   return users;
// }

// ── 4. Categories ─────────────────────────────────────────────
async function seedCategories() {
  const cats = [
    { slug: 'criminal-law',   name: 'Criminal Law',   colorHex: '#EF4444', iconName: 'scale',    sortOrder: 1, scope: 'BOTH' as const },
    { slug: 'family-law',     name: 'Family Law',     colorHex: '#F59E0B', iconName: 'home',     sortOrder: 2, scope: 'BOTH' as const },
    { slug: 'property-law',   name: 'Property Law',   colorHex: '#10B981', iconName: 'building', sortOrder: 3, scope: 'BOTH' as const },
    { slug: 'corporate-law',  name: 'Corporate Law',  colorHex: '#3B82F6', iconName: 'briefcase',sortOrder: 4, scope: 'BOTH' as const },
    { slug: 'tax-law',        name: 'Tax Law',        colorHex: '#6366F1', iconName: 'receipt',  sortOrder: 5, scope: 'BOTH' as const },
    { slug: 'labor-law',      name: 'Labor Law',      colorHex: '#8B5CF6', iconName: 'users',    sortOrder: 6, scope: 'BOTH' as const },
    { slug: 'cyber-law',      name: 'Cyber Law',      colorHex: '#06B6D4', iconName: 'monitor',  sortOrder: 7, scope: 'BOTH' as const },
    { slug: 'contract-law',   name: 'Contract Law',   colorHex: '#84CC16', iconName: 'file-text',sortOrder: 8, scope: 'BOTH' as const },
    { slug: 'constitutional', name: 'Constitutional Law', colorHex: '#F97316', iconName: 'shield', sortOrder: 9, scope: 'BOTH' as const },
    { slug: 'civil-law',      name: 'Civil Law',      colorHex: '#EC4899', iconName: 'gavel',    sortOrder: 10, scope: 'BOTH' as const },
  ];

  const created: Record<string, string> = {};
  for (const c of cats) {
    const cat = await prisma.category.upsert({
      where:  { slug: c.slug },
      update: {},
      create: { slug: c.slug, name: c.name, colorHex: c.colorHex, iconName: c.iconName, sortOrder: c.sortOrder, scope: c.scope, isActive: true },
    });
    created[c.slug] = cat.id;
  }
  console.log(`✓ ${cats.length} categories seeded`);
  return created;
}

// ── 5. Regions ────────────────────────────────────────────────
async function seedRegions() {
  const regions = [
    { slug: 'pakistan',    name: 'Pakistan (All)',  type: 'COUNTRY'  as const, sortOrder: 1 },
    { slug: 'punjab',      name: 'Punjab',          type: 'PROVINCE' as const, sortOrder: 2 },
    { slug: 'sindh',       name: 'Sindh',           type: 'PROVINCE' as const, sortOrder: 3 },
    { slug: 'kpk',         name: 'Khyber Pakhtunkhwa', type: 'PROVINCE' as const, sortOrder: 4 },
    { slug: 'balochistan', name: 'Balochistan',     type: 'PROVINCE' as const, sortOrder: 5 },
    { slug: 'islamabad',   name: 'Islamabad',       type: 'CITY'     as const, sortOrder: 6 },
    { slug: 'karachi',     name: 'Karachi',         type: 'CITY'     as const, sortOrder: 7 },
    { slug: 'lahore',      name: 'Lahore',          type: 'CITY'     as const, sortOrder: 8 },
    { slug: 'peshawar',    name: 'Peshawar',        type: 'CITY'     as const, sortOrder: 9 },
    { slug: 'quetta',      name: 'Quetta',          type: 'CITY'     as const, sortOrder: 10 },
    { slug: 'multan',      name: 'Multan',          type: 'CITY'     as const, sortOrder: 11 },
    { slug: 'faisalabad',  name: 'Faisalabad',      type: 'CITY'     as const, sortOrder: 12 },
  ];

  const created: Record<string, string> = {};
  for (const r of regions) {
    const reg = await prisma.region.upsert({
      where:  { slug: r.slug },
      update: {},
      create: { slug: r.slug, name: r.name, type: r.type, countryCode: 'PK', sortOrder: r.sortOrder, isActive: true },
    });
    created[r.slug] = reg.id;
  }
  console.log(`✓ ${regions.length} regions seeded`);
  return created;
}

// ── 6. Tags ───────────────────────────────────────────────────
async function seedTags() {
  const tags = [
    { slug: 'cyber-crime',      name: 'Cyber Crime',       type: 'TOPIC'        as const },
    { slug: 'property-dispute', name: 'Property Dispute',  type: 'TOPIC'        as const },
    { slug: 'tax-fraud',        name: 'Tax Fraud',         type: 'TOPIC'        as const },
    { slug: 'labor-rights',     name: 'Labor Rights',      type: 'TOPIC'        as const },
    { slug: 'contract-dispute', name: 'Contract Dispute',  type: 'TOPIC'        as const },
    { slug: 'family-law',       name: 'Family Law',        type: 'PRACTICE_AREA'as const },
    { slug: 'inheritance',      name: 'Inheritance',       type: 'TOPIC'        as const },
    { slug: 'fbr-notice',       name: 'FBR Notice',        type: 'TOPIC'        as const },
    { slug: 'bail',             name: 'Bail',              type: 'TOPIC'        as const },
    { slug: 'ntn-registration', name: 'NTN Registration',  type: 'TOPIC'        as const },
    { slug: 'peca-2016',        name: 'PECA 2016',         type: 'LEGAL_CONCEPT'as const },
    { slug: 'constitution',     name: 'Constitution',      type: 'LEGAL_CONCEPT'as const },
    { slug: 'supreme-court',    name: 'Supreme Court',     type: 'TOPIC'        as const },
    { slug: 'high-court',       name: 'High Court',        type: 'TOPIC'        as const },
    { slug: 'termination',      name: 'Termination',       type: 'TOPIC'        as const },
    { slug: 'rent-dispute',     name: 'Rent Dispute',      type: 'TOPIC'        as const },
    { slug: 'divorce',          name: 'Divorce',           type: 'TOPIC'        as const },
    { slug: 'secp',             name: 'SECP',              type: 'TOPIC'        as const },
    { slug: 'cryptocurrency',   name: 'Cryptocurrency',    type: 'TREND'        as const },
    { slug: 'defamation',       name: 'Defamation',        type: 'TOPIC'        as const },
  ];

  const created: Record<string, string> = {};
  for (const t of tags) {
    const tag = await prisma.tag.upsert({
      where:  { slug: t.slug },
      update: {},
      create: { slug: t.slug, name: t.name, type: t.type, isActive: true },
    });
    created[t.slug] = tag.id;
  }
  console.log(`✓ ${tags.length} tags seeded`);
  return created;
}

// ── 7. Demo discussions ───────────────────────────────────────
// async function seedDiscussions(lawyers: any[], cats: Record<string, string>, regions: Record<string, string>, tags: Record<string, string>) {
//   if (!lawyers.length) { console.log('⚠  No lawyers — skipping discussions'); return; }

//   const discussions = [
//     {
//       slug: 'digital-assets-cryptocurrency-legal-status-pakistan',
//       kind: 'QUESTION' as const,
//       title: 'Legal Framework for Digital Assets in Pakistan - Need Clarification',
//       body: `I'm trying to understand the legal status of cryptocurrency and NFTs under Pakistani law. Recent amendments seem contradictory to earlier stances.

// **Specific Questions:**
// 1. Are cryptocurrencies considered legal tender or securities in Pakistan?
// 2. What are the tax implications of cryptocurrency trading?
// 3. How do NFTs fit into existing intellectual property laws?
// 4. Are there any licensing requirements for cryptocurrency exchanges?

// I've reviewed the State Bank of Pakistan's circulars from 2018 and 2021, but the recent 2024 amendments introduced by the Securities and Exchange Commission seem to create some ambiguity.

// Any insights from legal experts familiar with financial technology regulations would be greatly appreciated.`,
//       excerpt: 'I am trying to understand the legal status of cryptocurrency and NFTs under Pakistani law. Recent amendments seem contradictory to earlier stances.',
//       categorySlug: 'corporate-law',
//       regionSlug: 'islamabad',
//       tagSlugs: ['cryptocurrency', 'secp'],
//       authorIdx: 0,
//       isAiSummaryReady: true,
//     },
//     {
//       slug: 'inheritance-rights-property-distribution-sons-daughters',
//       kind: 'QUESTION' as const,
//       title: "Inheritance Rights: Father's Property Distribution Among Sons and Daughters",
//       body: `My father recently passed away without a will. According to Islamic law and Pakistani civil law, how should the property be distributed among:
// - 3 sons
// - 2 daughters  
// - Widow (my mother)

// The property includes:
// 1. A house in Lahore worth approximately 2 crore
// 2. Agricultural land in Punjab (10 acres)
// 3. Bank savings of 50 lakh

// Is there a difference between how Islamic law and civil law handle this? Can any heir contest the distribution? What documentation is required?`,
//       excerpt: 'My father recently passed away without a will. According to Islamic law and Pakistani civil law, how should the property be distributed?',
//       categorySlug: 'family-law',
//       regionSlug: 'lahore',
//       tagSlugs: ['inheritance', 'family-law'],
//       authorIdx: 1,
//       isAiSummaryReady: true,
//     },
//     {
//       slug: 'employer-refusing-pay-dues-after-termination',
//       kind: 'QUESTION' as const,
//       title: 'Employer Refusing to Pay Dues After Termination - Legal Options?',
//       body: `I was terminated from my job after 3 years without proper notice. The company is refusing to pay:
// - 3 months pending salary (Rs. 150,000)
// - Gratuity for 3 years of service
// - Earned annual leave (22 days)

// The termination letter cites "misconduct" but no show-cause notice was ever given to me, and no inquiry was held.

// Under the Industrial and Commercial Employment Ordinance 1968 and the Shops and Establishments Ordinance, what are my legal options? Should I approach the Labour Court or NIRC?`,
//       excerpt: 'I was terminated from my job after 3 years without proper notice. The company is refusing to pay my pending salary and dues.',
//       categorySlug: 'labor-law',
//       regionSlug: 'karachi',
//       tagSlugs: ['labor-rights', 'termination'],
//       authorIdx: 2,
//       isAiSummaryReady: false,
//     },
//     {
//       slug: 'property-dispute-builder-not-delivering-possession',
//       kind: 'QUESTION' as const,
//       title: 'Property Dispute: Builder Not Delivering Possession as Per Agreement',
//       body: `I paid full amount (Rs. 85 lakh) for an apartment 2 years ago. The builder keeps delaying possession despite the agreement stating delivery in December 2022.

// Current situation:
// - Agreement signed in January 2021
// - Full payment made by March 2021
// - Possession was promised December 2022
// - Builder has now asked for additional Rs. 10 lakh citing "cost escalation"

// The agreement does not contain any cost escalation clause. What legal action can I take? Can I get refund with interest? Should I file in consumer court or civil court?`,
//       excerpt: 'Paid full amount for an apartment 2 years ago. Builder keeps delaying possession despite agreement. What legal action can I take?',
//       categorySlug: 'property-law',
//       regionSlug: 'islamabad',
//       tagSlugs: ['property-dispute', 'contract-dispute'],
//       authorIdx: 3,
//       isAiSummaryReady: false,
//     },
//     {
//       slug: 'fbr-tax-notice-section-114-implications',
//       kind: 'QUESTION' as const,
//       title: 'Tax Notice from FBR: Understanding Section 114 Implications',
//       body: `I received a notice under Section 114 of the Income Tax Ordinance 2001 regarding tax year 2023. The demands seem excessive.

// The notice demands:
// 1. Filing of income tax return (already filed)
// 2. Explanation of certain bank transactions
// 3. Explanation of property purchase

// I am a freelancer working with international clients. My income is in USD transferred via Payoneer. The FBR seems to be treating these as unexplained income.

// How should I respond to this notice? What documentation do I need? Is there a risk of criminal action?`,
//       excerpt: 'Received a notice under Section 114 regarding tax year 2023. The demands seem excessive. Need guidance on response strategy.',
//       categorySlug: 'tax-law',
//       regionSlug: 'islamabad',
//       tagSlugs: ['fbr-notice', 'tax-fraud'],
//       authorIdx: 4,
//       isAiSummaryReady: true,
//     },
//     {
//       slug: 'cybercrime-peca-defamation-social-media',
//       kind: 'DISCUSSION' as const,
//       title: 'PECA 2016 and Social Media Defamation: Recent Case Law Analysis',
//       body: `Following the recent Supreme Court judgments on PECA 2016, I want to discuss how the courts are interpreting defamation in the digital context.

// Key areas I want to discuss:
// 1. What constitutes "defamation" under PECA vs PPC Section 499?
// 2. Difference between criminal defamation (FIR) and civil defamation (suit)
// 3. Recent cases where courts quashed Section 20 PECA FIRs
// 4. The burden of proof in digital defamation cases

// Sharing a summary of my research — please add your own analysis and case references. This is particularly relevant for practitioners advising clients targeted by false social media campaigns.`,
//       excerpt: 'Following the recent Supreme Court judgments on PECA 2016, discussing how courts are interpreting defamation in the digital context.',
//       categorySlug: 'cyber-law',
//       regionSlug: 'pakistan',
//       tagSlugs: ['peca-2016', 'defamation', 'supreme-court'],
//       authorIdx: 0,
//       isAiSummaryReady: false,
//     },
//     {
//       slug: 'cybercrime-law-amendments-2025-analysis',
//       kind: 'LEGAL_UPDATE' as const,
//       title: 'Cybercrime Law Amendments 2025: What Lawyers Need to Know',
//       body: `The Prevention of Electronic Crimes (Amendment) Act 2025 has introduced significant changes. Key amendments include:

// **New Provisions:**
// - Section 26A: Enhanced penalties for online harassment
// - Section 10B: Regulation of VPN usage
// - Section 31A: Mandatory data localization for social media companies
// - New definition of "critical information infrastructure"

// **Impact on Practice:**
// These amendments will affect how we advise clients in:
// 1. Employment law (monitoring of employee communications)
// 2. Corporate law (data protection compliance)
// 3. Criminal defense (new categories of offences)

// I'll be updating this post as implementation rules are notified.`,
//       excerpt: 'The Prevention of Electronic Crimes (Amendment) Act 2025 has introduced significant changes that all legal practitioners need to understand.',
//       categorySlug: 'cyber-law',
//       regionSlug: 'pakistan',
//       tagSlugs: ['peca-2016', 'cyber-crime'],
//       authorIdx: 0,
//       isAiSummaryReady: false,
//     },
//     {
//       slug: 'rent-agreement-dispute-tenant-rights-pakistan',
//       kind: 'QUESTION' as const,
//       title: 'Landlord Illegally Locked My Shop - Tenant Rights Under Rent Restriction Ordinance?',
//       body: `My landlord has illegally locked my shop in Lahore without any court order. I have been a tenant for 8 years and my rent agreement expired 2 months ago, but I am still paying rent regularly.

// The landlord claims he wants to use the premises himself, but:
// 1. No notice was given as required by law
// 2. He did not file any eviction case
// 3. My stock worth Rs. 20 lakh is inside the locked shop

// Under the Punjab Rented Premises Act 2009, what are my rights? Can I get an emergency injunction? What criminal action can I take against the landlord?`,
//       excerpt: 'My landlord has illegally locked my shop in Lahore without any court order. Need urgent legal help regarding tenant rights.',
//       categorySlug: 'property-law',
//       regionSlug: 'lahore',
//       tagSlugs: ['rent-dispute', 'property-dispute'],
//       authorIdx: 1,
//       isAiSummaryReady: false,
//     },
//   ];

//   let created = 0;
//   for (const d of discussions) {
//     const existing = await prisma.discussion.findUnique({ where: { slug: d.slug } });
//     if (existing) continue;

//     const author = lawyers[d.authorIdx % lawyers.length];
//     if (!author) continue;
//     const catId    = cats[d.categorySlug];
//     const regionId = regions[d.regionSlug];
//     if (!catId || !regionId) continue;

//     const disc = await prisma.discussion.create({
//       data: {
//         slug:            d.slug,
//         kind:            d.kind,
//         title:           d.title,
//         body:            d.body,
//         excerpt:         d.excerpt,
//         authorId:        author.id,
//         categoryId:      catId,
//         regionId:        regionId,
//         visibility:      'PUBLIC',
//         contentStatus:   'ACTIVE',
//         status:          'OPEN',
//         isAiSummaryReady: d.isAiSummaryReady,
//         score:           Math.floor(Math.random() * 50) + 5,
//         reactionCount:   Math.floor(Math.random() * 30) + 2,
//         answerCount:     0,
//         viewCount:       Math.floor(Math.random() * 400) + 20,
//         followerCount:   Math.floor(Math.random() * 10),
//         bookmarkCount:   Math.floor(Math.random() * 8),
//       },
//     });

//     // Tags
//     for (const ts of d.tagSlugs) {
//       const tagId = tags[ts];
//       if (tagId) {
//         await prisma.discussionTag.upsert({
//           where:  { discussionId_tagId: { discussionId: disc.id, tagId } },
//           update: {},
//           create: { discussionId: disc.id, tagId },
//         });
//       }
//     }

//     // AI summary for discussions that have it
//     if (d.isAiSummaryReady) {
//       await prisma.discussionAISummary.create({
//         data: {
//           discussionId: disc.id,
//           version:      1,
//           status:       'GENERATED',
//           isCurrent:    true,
//           summaryText:  `This discussion covers key legal questions about ${d.title.toLowerCase()}. Multiple verified lawyers have provided detailed analysis covering statutory provisions, case law, and practical recommendations applicable under Pakistani law.`,
//           mainIssue:    `The core legal issue involves understanding the applicable statutory framework and determining the most effective legal remedy available under Pakistani law.`,
//           keyPoints:    JSON.stringify([
//             'Relevant laws and statutory provisions have been identified and discussed',
//             'Precedents and case law references have been provided by verified lawyers',
//             'Practical steps and legal remedies have been outlined with specific procedures',
//             'Jurisdictional and procedural requirements have been addressed',
//           ]),
//           expertConsensus: 'Multiple verified lawyers have provided aligned guidance on the proper legal approach and recommended next steps based on current Pakistani law.',
//           generatedAt:  new Date(),
//         },
//       });
//     }

//     // Seed answers from other lawyers
//     const answerAuthors = lawyers.filter(l => l?.id !== author?.id).slice(0, 2);
//     let answerCount = 0;
//     for (const answerer of answerAuthors) {
//       if (!answerer) continue;
//       const answer = await prisma.answer.create({
//         data: {
//           discussionId: disc.id,
//           authorId:     answerer.id,
//           body:         `Great question! Based on my experience with similar cases in Pakistani courts, here is a comprehensive analysis:

// **Legal Framework:**
// Under the applicable laws, this situation is governed primarily by established precedents and statutory provisions that provide clear remedies.

// **Key Points:**
// 1. You have strong legal standing based on the facts presented
// 2. The relevant statutory provisions support your position
// 3. Multiple legal avenues are available to you

// **Recommended Action:**
// I would recommend first attempting to resolve this through proper legal notice, and if unsuccessful, proceeding to the appropriate forum. Documentation of all communications is crucial.

// Please feel free to ask follow-up questions if you need clarification on any specific aspect.`,
//           status:        'ACTIVE',
//           isAccepted:    false,
//           isExpertAnswer: true,
//           score:         Math.floor(Math.random() * 20) + 5,
//           reactionCount: Math.floor(Math.random() * 15) + 2,
//           commentCount:  0,
//         },
//       });

//       answerCount++;

//       // Add a comment on the first answer
//       if (answerCount === 1) {
//         await prisma.comment.create({
//           data: {
//             answerId:  answer.id,
//             authorId:  author.id,
//             body:      'Thank you for this detailed response. Could you elaborate on the documentation required for the legal notice?',
//             status:    'ACTIVE',
//           },
//         });
//         await prisma.answer.update({ where: { id: answer.id }, data: { commentCount: 1 } });
//       }
//     }

//     // Update discussion answer count
//     await prisma.discussion.update({ where: { id: disc.id }, data: { answerCount } });

//     // Add a discussion-level comment
//     if (lawyers[1]) {
//       await prisma.comment.create({
//         data: {
//           discussionId: disc.id,
//           authorId:     lawyers[1].id,
//           body:         'Very relevant question. This is a common issue many clients face. The answers provided cover the key points well.',
//           status:       'ACTIVE',
//         },
//       });
//       await prisma.discussion.update({ where: { id: disc.id }, data: { commentCount: 1 } });
//     }

//     created++;
//   }
//   console.log(`✓ ${created} discussions seeded (${discussions.length - created} already existed)`);
// }

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('\n── Seeding Legal Hub Database ──────────────────\n');

  await seedRoles();
  await seedAdmin();
  // const lawyers = (await seedLawyers()).filter(Boolean);
  const cats    = await seedCategories();
  const regions = await seedRegions();
  const tags    = await seedTags();
  // await seedDiscussions(lawyers, cats, regions, tags);

  console.log('\n── Seed Complete ────────────────────────────────');
  console.log('  Admin login:  /adminlogin  →  abeehahussain572@gmail.com / Admin@12');
  console.log('  Lawyer login: /lawyerlogin →  nimra.khan@legalhub.demo / Lawyer@12');
  console.log('  Discussions page should now show real data\n');
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
