import {
  AIContext,
  ComparisonData,
  QuizQuestion,
  ResponseIntent,
  SubjectClassification,
  SubjectId,
  TeachingResponse,
} from '../../types/ai';
import { classifyInput, extractComparisonItems } from './SubjectClassifier';

function levelNote(context?: AIContext): string {
  return context?.educationLevel
    ? `\n\n*Adapted for: ${context.educationLevel.replace('_', ' ')}*`
    : '';
}

const MOCK_CONTENT: Partial<
  Record<SubjectId, Partial<Record<ResponseIntent, (input: string, ctx?: AIContext) => Partial<TeachingResponse>>>>
> = {
  biology: {
    explain: (input) => ({
      text: `## Photosynthesis

**Definition:** Photosynthesis is the process by which green plants convert light energy into chemical energy (glucose), using carbon dioxide and water.

**Equation:** 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂

**Key stages:**
1. **Light-dependent reactions** — occur in thylakoids; produce ATP and NADPH
2. **Calvin cycle** — occurs in stroma; fixes CO₂ into glucose

**Why it matters:** Produces oxygen for respiration and forms the base of most food chains.${levelNote()}`,
      keyPoints: ['Occurs in chloroplasts', 'Requires sunlight, CO₂, and water', 'Produces glucose and oxygen'],
      examples: ['Leaves of green plants', 'Algae in ponds', 'Phytoplankton in oceans'],
      nonExamples: ['Fungi (no chlorophyll)', 'Animals (heterotrophs)', 'Deep-sea vent bacteria'],
    }),
  },
  english: {
    compare: () => ({
      text: 'See comparison section below.',
      comparison: {
        itemA: 'Simile',
        itemB: 'Metaphor',
        similarities: [
          'Both are figures of speech comparing two things',
          'Both make writing more vivid and expressive',
          'Both help readers understand ideas through comparison',
        ],
        differences: [
          'Simile uses "like" or "as" (indirect comparison)',
          'Metaphor states one thing IS another (direct comparison)',
          'Simile: "She is like a rose" vs Metaphor: "She is a rose"',
        ],
      },
    }),
    explain: (input) => ({
      text: `## Metaphor

**Definition:** A metaphor is a figure of speech that directly compares two unlike things by stating one *is* the other — without using "like" or "as."

**Structure:** X **is** Y

**Examples:**
- "Time **is** a thief." (time steals moments)
- "The classroom **was** a zoo." (chaotic)
- "Her voice **is** music." (pleasant)

**Non-examples (these are similes, not metaphors):**
- "Time **is like** a thief." ← simile
- "She runs **as fast as** a cheetah." ← simile${levelNote()}`,
      examples: ['The world is a stage', 'He has a heart of stone'],
      nonExamples: ['Brave as a lion (simile)', 'Runs like the wind (simile)'],
    }),
  },
  chemistry: {
    explain: (input) => ({
      text: `## Water (H₂O)

**Molecular structure:** Two hydrogen atoms bonded to one oxygen atom via covalent bonds.

**Key properties:**
- Polar molecule (oxygen is slightly negative, hydrogen slightly positive)
- High specific heat capacity
- Universal solvent
- Boiling point: 100°C

**In the classroom:** Demonstrate polarity with a water molecule model.${levelNote()}`,
      keyPoints: ['Formula: H₂O', 'Polar covalent bonds', 'Essential for all life'],
    }),
  },
  physics: {
    explain: (input) => ({
      text: `## Gravity

**Definition:** Gravity is a fundamental force of attraction between objects with mass.

**Newton's Law:** F = G(m₁m₂)/r²

**On Earth:** Acceleration due to gravity ≈ **9.8 m/s²**

**Key ideas:**
- All masses attract each other
- Weight = mass × gravitational acceleration
- Gravity keeps planets in orbit${levelNote()}`,
      keyPoints: ['Force of attraction between masses', 'g ≈ 9.8 m/s² on Earth', 'Described by Newton and Einstein'],
      examples: ['An apple falling from a tree', 'Planets orbiting the Sun', 'Tides caused by the Moon'],
    }),
  },
  history: {
    explain: (input) => ({
      text: `## Historical Analysis Framework

When teaching history, guide students through:

1. **Context** — What was happening at the time?
2. **Causes** — Why did this event occur?
3. **Events** — What happened? (chronology)
4. **Consequences** — Short and long-term effects
5. **Significance** — Why does it matter today?${levelNote()}`,
      keyPoints: ['Use primary and secondary sources', 'Consider multiple perspectives', 'Connect past to present'],
    }),
  },
  computer_science: {
    explain: (input) => ({
      text: `## Variables in Programming

**Definition:** A variable is a named storage location in memory that holds a value which can change during program execution.

**Example (Python):**
\`\`\`
name = "Ada"
age = 17
\`\`\`

**Key concepts:**
- Declaration and assignment
- Data types (int, float, string, boolean)
- Variable scope${levelNote()}`,
      examples: ['score = 100', 'is_active = True', 'price = 19.99'],
    }),
  },
};

function generateQuiz(input: string, subject: SubjectId): QuizQuestion[] {
  return [
    { question: `What is the main concept related to "${input.slice(0, 40)}"?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 'Option A' },
    { question: 'Which statement is correct?', options: ['Statement 1', 'Statement 2', 'Statement 3', 'Statement 4'], answer: 'Statement 2' },
    { question: 'True or False: This concept is important in the curriculum.', options: ['True', 'False'], answer: 'True' },
    { question: 'Give an example of this concept in everyday life.', answer: 'Student answers will vary — accept reasonable examples.' },
    { question: 'Explain this concept in one sentence.', answer: 'Accept concise accurate definitions.' },
  ];
}

function generateCompare(input: string): ComparisonData | undefined {
  const items = extractComparisonItems(input);
  if (!items) return undefined;
  return {
    itemA: items.itemA,
    itemB: items.itemB,
    similarities: [
      `Both ${items.itemA} and ${items.itemB} are related concepts in this subject area`,
      'Both appear in curriculum standards',
      'Both can be taught with examples and non-examples',
    ],
    differences: [
      `${items.itemA} has distinct characteristics worth defining separately`,
      `${items.itemB} differs in application and usage`,
      'Students often confuse these — highlight the key distinction clearly',
    ],
  };
}

export function generateMockResponse(
  input: string,
  classification: SubjectClassification,
  context?: AIContext
): TeachingResponse {
  const { subject, intent } = classification;

  const subjectContent = MOCK_CONTENT[subject]?.[intent] ?? MOCK_CONTENT[subject]?.['explain'];
  if (subjectContent) {
    const partial = subjectContent(input, context);
    return {
      text: partial.text ?? '',
      responseType: intent,
      subject,
      examples: partial.examples,
      nonExamples: partial.nonExamples,
      keyPoints: partial.keyPoints,
      comparison: partial.comparison,
      classification,
      provider: 'mock',
    };
  }

  if (intent === 'compare') {
    const comparison = generateCompare(input);
    return {
      text: comparison
        ? `## Comparison: ${comparison.itemA} vs ${comparison.itemB}\n\nSee structured comparison below.`
        : `## Comparison\n\nConfigure OPENAI_API_KEY for detailed comparisons of: ${input}`,
      responseType: 'compare',
      subject,
      comparison,
      classification,
      provider: 'mock',
    };
  }

  if (intent === 'quiz') {
    const quizQuestions = generateQuiz(input, subject);
    return {
      text: `## Quiz: ${input.slice(0, 60)}\n\n${quizQuestions.map((q, i) => `**Q${i + 1}.** ${q.question}`).join('\n\n')}`,
      responseType: 'quiz',
      subject,
      quizQuestions,
      classification,
      provider: 'mock',
    };
  }

  return {
    text: `## ${input.trim()}

**Subject:** ${subject} | **Intent:** ${intent}

This is a demo response from the mock AI provider. Configure \`OPENAI_API_KEY\` and \`AI_PROVIDER=openai\` for full subject-specialized responses.

**Overview:** ${input.trim()} is an important ${subject.replace('_', ' ')} topic for classroom discussion.${levelNote(context)}

**Tip:** Select a subject manually or let auto-detection classify your question.`,
    responseType: intent,
    subject,
    examples: ['Example relevant to this topic'],
    nonExamples: ['Common misconception to avoid'],
    keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
    classification,
    provider: 'mock',
  };
}

export function classifyForTeaching(input: string, context?: AIContext): SubjectClassification {
  return classifyInput(input, context?.subject);
}
