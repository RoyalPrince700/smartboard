/**
 * Content playbook — what to write about and how to source material.
 *
 * Raw voice samples = HOW you talk. This file = WHAT to talk about and HOW DEEP to go.
 * Goal: 2 posts per day for 3 months. Each post = one angle, fully explored — not chopped into fragments.
 */

/** One post = one angle. Rotate through these when mining the codebase or a session. */
export const CONTENT_ANGLES = [
  {
    id: 'architecture',
    label: 'Architecture',
    description:
      'System design choices — frontend/backend split, data flow, why MongoDB, agent structure, stroke storage, API shape.',
  },
  {
    id: 'approach',
    label: 'My approach / how I think',
    description:
      'How you reason through a problem, what you tried first, what failed, how you iterated until something worked.',
  },
  {
    id: 'challenge-solved',
    label: 'Challenge & resolution',
    description:
      'A specific bug or blocker (OCR, geometry rendering, Gemini cost) — the journey from stuck to shipped or partial win.',
  },
  {
    id: 'feature',
    label: 'Feature spotlight',
    description:
      'One capability: curriculum browser, whiteboard, math agent, equation overlay, voice, split board, etc. What it does and how it works.',
  },
  {
    id: 'benefit',
    label: 'Benefit / who it helps',
    description:
      'Why teachers care, what problem this removes, time saved, cost saved, classroom impact. Grounded in real use cases.',
  },
  {
    id: 'unique',
    label: 'What makes it unique',
    description:
      'NERDC curriculum built in, hand-writing first, own math agent vs API dependency, stroke replay vs screenshots, Nigeria-first edtech.',
  },
  {
    id: 'build-log',
    label: 'Build log / session update',
    description:
      'What you shipped or attempted today. Honest progress, time spent, what is still broken.',
  },
  {
    id: 'tech-stack',
    label: 'Tech stack deep dive',
    description:
      'React, Express, MongoDB, KaTeX, canvas, OCR pipeline — one layer per post, with trade-offs.',
  },
  {
    id: 'iteration',
    label: 'Iteration story',
    description:
      'Version 1 → version 2. Methods you abandoned. Research rabbit holes. Why the current approach stuck.',
  },
  {
    id: 'hiring-signal',
    label: 'Hiring / craft signal',
    description:
      'Shows how you work: cost awareness, knowing when not to use AI, persistence on hard problems, shipping for real users. Soft CTA for clients and hiring managers.',
  },
  {
    id: 'build-with-ai',
    label: 'Building with AI',
    description:
      'How AI tools (Cursor, AI pair programming) accelerate your workflow. What you still decide, debug, and own. Honest about AI-assisted development.',
  },
  {
    id: 'collaboration',
    label: 'Collaboration invite',
    description:
      'Technical depth that makes engineers want to engage, ask questions, recommend you, or explore working together.',
  },
] as const;

export type ContentAngleId = (typeof CONTENT_ANGLES)[number]['id'];

/**
 * Directories and files worth reading before writing a post.
 * AI with repo access should explore these — do not limit posts to user raw text length.
 */
export const CODEBASE_RESEARCH_PATHS = [
  'README.md',
  'frontend/src/pages/',
  'frontend/src/components/',
  'frontend/src/data/curriculum/',
  'frontend/src/engine/',
  'frontend/src/services/',
  'frontend/src/hooks/',
  'backend/src/agent/',
  'backend/src/models/',
  'backend/src/routes/',
  'backend/src/services/',
] as const;

/** Platform length guidance — LinkedIn richest; all platforms get substantive content */
export const PLATFORM_LENGTH_GUIDANCE = {
  linkedin: {
    minChars: 800,
    maxChars: 3000,
    note: 'Richest. Use series[] with exactly 2 complete posts — morning + evening. Each reads finished on its own.',
  },
  twitter: {
    minChars: 280,
    maxChars: 280,
    note: 'Use thread[] with 2 complete tweets — post separately, not a cliffhanger thread.',
  },
  facebook: {
    minChars: 500,
    maxChars: 2000,
    note: 'Rich conversational post. Attach screen recording. Less than LinkedIn, more than a one-liner.',
  },
  instagram: {
    minChars: 400,
    maxChars: 2200,
    note: 'Rich caption + reel/carousel. Attach demo video or screenshot slides.',
  },
  tiktok: {
    minChars: 200,
    maxChars: 2200,
    note: 'Hook + full caption. Always attach screen recording. Film notes in media[].',
  },
  whatsapp: {
    minChars: 200,
    maxChars: 500,
    note: '2 complete status updates in series[] — personal, visual, each stands alone.',
  },
} as const;

/** 2 posts per day — each platform gets 2 complete posts, not fragments of one story */
export const SERIAL_POSTING_STRATEGY = {
  postsPerDay: 2,
  principle:
    'Two finished posts per day (e.g. morning + evening). Same topic, different angles — or two topics. Never "Part 1, wait for Part 2".',
  mediaDefault:
    'Attach screen recordings or screenshots to each post. Specify in media[] what to capture.',
} as const;

export const CONTENT_GOALS = {
  postsPerDayTarget: 2,
  durationMonths: 3,
  principle:
    'Each post is one angle, fully developed. Raw user thoughts set voice only — never cap depth or scope to sample length.',
} as const;

/**
 * Why these posts exist — every post should serve at least one objective.
 * Layer content so non-technical readers follow the story AND technical readers see depth.
 */
export const PRIMARY_OBJECTIVES = [
  {
    id: 'global-hiring',
    label: 'Global audience & clients',
    description:
      'Position for international visibility. Attract founders, product owners, and hiring managers who see what you are building and want to hire or engage you. Lead with outcomes and impact — not jargon first.',
  },
  {
    id: 'accessible-depth',
    label: 'Readable by everyone, respected by engineers',
    description:
      'Non-technical readers should follow the story (problem → what you built → why it matters). Technical readers should see real architecture, trade-offs, and craft. Explain terms inline when needed. No gatekeeping, no dumbing down.',
  },
  {
    id: 'build-with-ai',
    label: 'Transparent about building with AI',
    description:
      'Do not hide that AI tools help you build (Cursor, AI pair programming, AI-assisted debugging/iteration). Also be clear where the product uses AI (Gemini, math agent, OCR). Show judgment: AI as accelerator, you as the engineer who decides.',
  },
  {
    id: 'technical-collaboration',
    label: 'Technical collaboration & referrals',
    description:
      'Attract developers who want to collaborate, ask questions, recommend you, or engage deeply. Include enough technical substance for engineers to respect the work and start a conversation.',
  },
] as const;

/** How to layer a single post for mixed audiences */
export const AUDIENCE_LAYERING = {
  hook: 'Plain outcome first — what you built and who it helps. No acronyms in the opening line.',
  story: 'How you thought, what failed, what you tried. Accessible language; define technical terms in parentheses when needed.',
  depth: 'Architecture, stack, trade-offs — for technical readers. OK to use precise terms here because context was set above.',
  aiTransparency: 'Mention where AI helped you build OR where AI runs in the product — honestly, without overselling.',
  cta: 'Soft close: open to work, collaboration, feedback, or DMs. Not desperate — confident builder inviting connection.',
} as const;
