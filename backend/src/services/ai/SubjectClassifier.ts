import { ResponseIntent, SubjectClassification, SubjectId } from '../../types/ai';

interface ClassificationRule {
  keywords: string[];
  subject: SubjectId;
  intent: ResponseIntent;
  weight?: number;
}

const RULES: ClassificationRule[] = [
  // Mathematics
  { keywords: ['=', 'x^2', 'x²', 'equation', 'algebra', 'quadratic', 'calculus', 'derivative'], subject: 'mathematics', intent: 'solve', weight: 2 },
  { keywords: ['graph', 'plot', 'function', 'y ='], subject: 'mathematics', intent: 'visualize', weight: 2 },
  { keywords: ['solve', 'calculate', 'find x'], subject: 'mathematics', intent: 'solve' },

  // Chemistry
  { keywords: ['molecule', 'atom', 'element', 'compound', 'reaction', 'chemical', 'periodic', 'acid', 'base', 'ph ', 'h2o', 'co2'], subject: 'chemistry', intent: 'explain' },
  { keywords: ['balance equation', 'chemical equation'], subject: 'chemistry', intent: 'solve' },

  // Physics
  { keywords: ['force', 'velocity', 'acceleration', 'energy', 'momentum', 'newton', 'gravity', 'electric', 'magnetic', 'wave', 'optics'], subject: 'physics', intent: 'explain' },
  { keywords: ['calculate force', 'calculate velocity'], subject: 'physics', intent: 'solve' },

  // Biology
  { keywords: ['photosynthesis', 'cell', 'organism', 'ecosystem', 'dna', 'gene', 'mitosis', 'evolution', 'bacteria', 'plant', 'animal'], subject: 'biology', intent: 'explain' },

  // English / Literature
  { keywords: ['metaphor', 'simile', 'grammar', 'noun', 'verb', 'adjective', 'punctuation', 'essay', 'writing'], subject: 'english', intent: 'explain' },
  { keywords: ['poem', 'poetry', 'novel', 'author', 'literature', 'shakespeare', 'theme', 'character'], subject: 'literature', intent: 'explain' },

  // Geography
  { keywords: ['climate', 'weather', 'continent', 'map', 'population', 'river', 'mountain', 'geography', 'latitude', 'ecosystem'], subject: 'geography', intent: 'explain' },

  // History
  { keywords: ['war', 'revolution', 'empire', 'century', 'historical', 'civilization', 'colonial', 'independence'], subject: 'history', intent: 'explain' },

  // Economics
  { keywords: ['supply', 'demand', 'inflation', 'gdp', 'market', 'economy', 'trade', 'fiscal', 'monetary'], subject: 'economics', intent: 'explain' },

  // Government / Civics
  { keywords: ['democracy', 'constitution', 'parliament', 'election', 'government', 'citizenship', 'law', 'policy', 'rights'], subject: 'government', intent: 'explain' },

  // Computer Science
  { keywords: ['algorithm', 'programming', 'code', 'variable', 'function', 'loop', 'array', 'binary', 'computer', 'software', 'python', 'javascript'], subject: 'computer_science', intent: 'explain' },

  // Intent overrides
  { keywords: ['difference between', 'compare', ' versus ', ' vs ', 'contrast'], subject: 'general', intent: 'compare', weight: 3 },
  { keywords: ['quiz', 'questions from', 'test me', 'create questions', 'mcq'], subject: 'general', intent: 'quiz', weight: 3 },
  { keywords: ['summarize', 'summary of', 'brief overview'], subject: 'general', intent: 'summarize', weight: 3 },
  { keywords: ['give examples', 'examples of', 'list examples'], subject: 'general', intent: 'examples', weight: 3 },
  { keywords: ['simplify', 'easier terms', 'for children', 'for primary'], subject: 'general', intent: 'simplify', weight: 2 },
  { keywords: ['what is', 'explain', 'define', 'describe', 'how does'], subject: 'general', intent: 'explain' },
];

export function classifyInput(input: string, subjectOverride?: string): SubjectClassification {
  const intent = detectIntent(input);

  if (subjectOverride && subjectOverride !== 'general') {
    return {
      subject: subjectOverride as SubjectId,
      confidence: 1,
      intent,
      difficulty: 'unknown',
    };
  }

  const text = input.toLowerCase();
  let bestSubject: SubjectId = 'general';
  let bestScore = 0;

  for (const rule of RULES) {
    if (rule.intent === 'compare' || rule.intent === 'quiz' || rule.intent === 'summarize' || rule.intent === 'examples' || rule.intent === 'simplify') {
      if (rule.intent !== intent) continue;
    }
    const matches = rule.keywords.filter((k) => text.includes(k)).length;
    if (matches === 0) continue;

    const score = matches * (rule.weight ?? 1);
    if (score > bestScore && rule.subject !== 'general') {
      bestScore = score;
      bestSubject = rule.subject;
    }
  }

  if (bestScore === 0) {
    for (const rule of RULES) {
      const matches = rule.keywords.filter((k) => text.includes(k)).length;
      if (matches === 0) continue;
      const score = matches * (rule.weight ?? 1);
      if (score > bestScore) {
        bestScore = score;
        bestSubject = rule.subject;
      }
    }
  }

  return {
    subject: bestSubject,
    confidence: bestScore > 0 ? Math.min(0.95, 0.5 + bestScore * 0.1) : 0.5,
    intent,
    difficulty: 'unknown',
  };
}

function detectIntent(input: string): ResponseIntent {
  const text = input.toLowerCase();
  if (/difference between|compare| versus | vs |contrast/.test(text)) return 'compare';
  if (/quiz|questions from|test me|create.*questions|mcq/.test(text)) return 'quiz';
  if (/summarize|summary of/.test(text)) return 'summarize';
  if (/give examples|examples of|list examples/.test(text)) return 'examples';
  if (/simplify|easier terms|for primary|for children/.test(text)) return 'simplify';
  if (/[=^²]|solve|calculate|equation|graph y/.test(text)) return 'solve';
  if (/graph|plot/.test(text)) return 'visualize';
  return 'explain';
}

export function extractComparisonItems(input: string): { itemA: string; itemB: string } | null {
  const patterns = [
    /difference between (.+?) and (.+?)[\?\.]?$/i,
    /compare (.+?) (?:and|vs\.?|versus) (.+?)[\?\.]?$/i,
    /(.+?) vs\.? (.+?)[\?\.]?$/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1] && match?.[2]) {
      return { itemA: match[1].trim(), itemB: match[2].trim() };
    }
  }
  return null;
}
