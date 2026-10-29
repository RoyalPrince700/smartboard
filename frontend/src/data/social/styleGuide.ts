/**

 * Voice & style standard for all social posts in this project.

 *

 * RAW VOICE SAMPLES = how the author talks (tone, honesty, first person).

 * PRIMARY_OBJECTIVES = why posts exist (hiring, collaboration, accessible + technical).

 * They are NOT length limits or topic limits.

 *

 * CONTENT = explore the codebase, session history, architecture, features, benefits,

 * unique angles, iteration stories. Go as deep as the platform allows.

 */



import {

  AUDIENCE_LAYERING,

  CONTENT_ANGLES,

  CONTENT_GOALS,

  PLATFORM_LENGTH_GUIDANCE,

  PRIMARY_OBJECTIVES,

  SERIAL_POSTING_STRATEGY,

} from './contentPlaybook';



/** Original unedited write-ups — TONE REFERENCE ONLY, not content length or scope */

export const RAW_VOICE_SAMPLES: readonly string[] = [

  `I built and simulated a touchscreen whiteboard for PC and TV that lets you write with your hand. It's for teachers. I started by using Gemini AI to solve any equation written on it, but it got too expensive. So I built my own math agent from scratch that runs on my website to cut costs. The hardest and most interesting part was converting handwritten equations into text that can actually be solved.`,



  `😭 the toughest code i had to generate and i haven't even gotten it right.... rendering a hand writen geometric and trigonometry has been the toughest challenge... ive done a lot of research and tried so many methods but it keeps failing.... this one you saw took me 5 hours to be able to get it to this level.... ill continue tomorrow again ...`,

];



export const SOCIAL_VOICE_RULES = {

  always: [

    'Write in first person: "I built", "I started", "I haven\'t gotten it right yet".',

    'Serve PRIMARY_OBJECTIVES: global hiring/clients, accessible story + technical depth, build-with-AI transparency, collaboration signal.',

    'Lead with outcomes in plain language — non-technical readers should follow the first 3 lines.',

    'Layer technical depth after the story is clear — define terms inline (e.g. "OCR — turning handwriting into text").',

    'Be transparent: AI helps you build (Cursor, AI-assisted coding) AND AI runs in the product (Gemini, math agent). Show judgment in both.',

    'Raw voice samples set TONE only — posts can and should be much longer and richer than the samples.',

    'Explore the codebase: architecture, features, iteration, benefits, what makes Smart Board unique.',

    'Explain how you think and how you solved challenges — hiring managers and engineers both care about this.',

    'Cover features, benefits, and business impact — not only implementation details.',

    'End with a soft CTA when natural: open to work, collaboration, feedback, DMs. Confident, not desperate.',

    'Same core story across platforms — expand on LinkedIn/Instagram, compress on Twitter/WhatsApp.',

  ],

  avoid: [

    'Leading with jargon that loses non-technical readers (they might hire you too).',

    'Hiding that you use AI tools to build — be honest about AI-assisted development.',

    'Pretending you built everything alone with zero AI help — that is not the story.',

    'Treating raw voice samples as a word-count cap — they are style reference only.',

    'Marketing buzzwords: "excited to announce", "game-changer", "leveraging", "revolutionary".',

    'Polished LinkedIn influencer tone — no fake humility or engagement bait.',

    'Third person ("the team built", "our platform enables").',

    'Hiding failures or pretending everything works.',

    'Generic posts that could apply to any app — ground in THIS project\'s code and decisions.',

    'Long em dashes (—). Use commas or full stops instead.',

    'Emoji spam. One emoji for real emotion on casual platforms is enough.',

  ],

  platformNotes: {

    linkedin: `Long-form (${PLATFORM_LENGTH_GUIDANCE.linkedin.minChars}–${PLATFORM_LENGTH_GUIDANCE.linkedin.maxChars} chars). Best for mixed audience: outcome hook → story → technical depth → soft CTA for work/collab.`,

    twitter: `~${PLATFORM_LENGTH_GUIDANCE.twitter.maxChars} chars. Lead with outcome. Thread in notes for technical depth.`,

    facebook: 'Accessible story for broader audience — founders, educators, friends who might refer you.',

    instagram: 'Visual demo caption. Outcome first, then what you learned. Hashtags for discovery.',

    tiktok: 'Hook = struggle or surprise. Mention building with AI if relevant to the clip.',

    whatsapp: `Rich status (200–500 chars). Use series[] for multiple slides. Attach video — high views.`,

  },

} as const;



/**

 * Full prompt for AI generation.

 * AI MUST explore the codebase — not only paraphrase user input.

 */

export const SOCIAL_GENERATION_INSTRUCTIONS = `You are writing social media posts for Smart Board — a touchscreen whiteboard for teachers (PC/TV, hand writing, NERDC curriculum, custom math agent).



Author: solo builder positioning for a GLOBAL audience — clients, hiring managers, AND technical collaborators.



TARGET: ${CONTENT_GOALS.postsPerDayTarget} posts/day. Each post = ONE angle, fully developed.



═══════════════════════════════════════

PRIMARY OBJECTIVES (every post should serve at least one)

═══════════════════════════════════════

${PRIMARY_OBJECTIVES.map((o) => `• ${o.label}: ${o.description}`).join('\n')}



AUDIENCE LAYERING (mixed audience in one post):

• Hook: ${AUDIENCE_LAYERING.hook}

• Story: ${AUDIENCE_LAYERING.story}

• Depth: ${AUDIENCE_LAYERING.depth}

• AI transparency: ${AUDIENCE_LAYERING.aiTransparency}

• CTA: ${AUDIENCE_LAYERING.cta}



═══════════════════════════════════════

VOICE (how to write — non-negotiable)

═══════════════════════════════════════

Match the author's tone. Samples show HOW they talk — NOT length limits:



"${RAW_VOICE_SAMPLES[0]}"



"${RAW_VOICE_SAMPLES[1]}"



- First person. Direct. Honest about failures, cost, time spent.

- Plain language first, technical depth second.

- Do NOT sound like marketing or generic AI copy.



═══════════════════════════════════════

AI TRANSPARENCY (do not hide)

═══════════════════════════════════════

Two distinct truths — mention when relevant:

1. BUILDING WITH AI: Author uses AI tools (Cursor, AI pair programming, AI-assisted debugging) to ship faster. They still architect, decide, debug, and own the hard problems.

2. AI IN THE PRODUCT: Gemini for some features, custom math agent to cut API cost, local ONNX OCR in browser. Show judgment about when to use AI vs code.



═══════════════════════════════════════

CONTENT (what to write — go deep)

═══════════════════════════════════════

Before writing, EXPLORE THE CODEBASE. Read README, components, agent/, engine/, services/, recent changes.



Content angles (pick one per post):

${CONTENT_ANGLES.map((a) => `- ${a.label}: ${a.description}`).join('\n')}



Cover what fits the angle:

- What you built and who it helps (accessible)

- How you think and iterate (hiring signal)

- Architecture & trade-offs (collaboration signal)

- Features, benefits, what makes Smart Board unique

- Building with AI — honestly

- Soft CTA: open to work, collaboration, feedback



═══════════════════════════════════════
PLATFORM FORMAT (all rich — LinkedIn richest)
═══════════════════════════════════════
Serial posting: ${SERIAL_POSTING_STRATEGY.postsPerDay} complete posts per day. series[] = 2 finished LinkedIn/WhatsApp posts. thread[] = 2 separate tweets. Never cliffhanger "Part 1 of 10".

- LinkedIn: ${PLATFORM_LENGTH_GUIDANCE.linkedin.note}
- Twitter/X: ${PLATFORM_LENGTH_GUIDANCE.twitter.note}
- Facebook: ${PLATFORM_LENGTH_GUIDANCE.facebook.note}
- Instagram: ${PLATFORM_LENGTH_GUIDANCE.instagram.note}
- TikTok: ${PLATFORM_LENGTH_GUIDANCE.tiktok.note}
- WhatsApp: ${PLATFORM_LENGTH_GUIDANCE.whatsapp.note}

Always include media[] — screen recording, video, image, or carousel with shots to capture.

═══════════════════════════════════════
OUTPUT
═══════════════════════════════════════
JSON for SocialPost:
- id, title, topic, summary, tags, createdAt, status
- sourceWriteUp (if raw input provided)
- platforms: { linkedin, twitter, facebook, instagram, tiktok, whatsapp }
  Each: {
    content,           // rich main text (all platforms)
    hook?,
    hashtags?,
    series?,           // LinkedIn + WhatsApp: exactly 2 complete daily posts
    thread?,           // Twitter: 2 separate tweets (not a cliffhanger thread)
    media?: [{ type, description, shots? }],
    notes?
  }



═══════════════════════════════════════

INPUT

═══════════════════════════════════════



CONTENT ANGLE:

[e.g. architecture | build-with-ai | hiring-signal | collaboration | ...]



RAW THOUGHTS (optional — voice anchor):

[paste here]



SESSION / UPDATE CONTEXT (optional):

[paste here]

`;



export const STYLE_GUIDE_PATH = 'frontend/src/data/social/styleGuide.ts';



export {

  AUDIENCE_LAYERING,

  CONTENT_ANGLES,

  CONTENT_GOALS,

  PLATFORM_LENGTH_GUIDANCE,

  PRIMARY_OBJECTIVES,

  SERIAL_POSTING_STRATEGY,

} from './contentPlaybook';

