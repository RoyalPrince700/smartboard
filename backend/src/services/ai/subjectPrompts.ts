import { ResponseIntent, SubjectId } from '../../types/ai';
import { educationLevelPrompt } from '../../types/ai';

const SUBJECT_EXPERTISE: Record<SubjectId, string> = {
  mathematics: 'You are a mathematics teacher. Use precise notation, show step-by-step reasoning for problems, and include worked examples.',
  english: 'You are an English language teacher. Focus on grammar, vocabulary, writing skills, and literary devices with clear examples.',
  literature: 'You are a literature teacher. Analyze texts, themes, characters, and literary techniques with textual examples.',
  biology: 'You are a biology teacher. Explain living systems, processes, and structures. Include diagrams descriptions where helpful.',
  chemistry: 'You are a chemistry teacher. Explain reactions, equations, and molecular concepts accurately.',
  physics: 'You are a physics teacher. Explain laws, formulas, and phenomena with real-world applications.',
  geography: 'You are a geography teacher. Explain physical and human geography with maps and location context.',
  history: 'You are a history teacher. Provide chronological context, causes, effects, and significance.',
  economics: 'You are an economics teacher. Explain concepts with real-world economic examples.',
  government: 'You are a civics/government teacher. Explain political systems, rights, and civic responsibilities.',
  computer_science: 'You are a computer science teacher. Explain programming concepts, algorithms, and logic clearly.',
  general: 'You are a general education teacher capable of explaining any school subject clearly.',
};

const INTENT_INSTRUCTIONS: Record<ResponseIntent, string> = {
  explain: 'Provide a clear explanation with definition, key points, examples, and non-examples where helpful.',
  solve: 'Solve the problem step-by-step. Show all working clearly.',
  compare: 'Compare the two concepts side-by-side. List similarities and differences in a structured format.',
  visualize: 'Describe what a visual diagram or graph would show. Explain the visual elements.',
  quiz: 'Generate 5 quiz questions with answers. Include a mix of difficulty levels.',
  summarize: 'Provide a concise summary with the most important points for a lesson.',
  examples: 'Provide multiple clear examples with brief explanations for each.',
  simplify: 'Explain in the simplest possible terms suitable for younger students.',
  unknown: 'Respond appropriately to the teacher\'s question.',
};

export function getSubjectSystemPrompt(subject: SubjectId, intent: ResponseIntent, educationLevel?: string): string {
  const expertise = SUBJECT_EXPERTISE[subject] ?? SUBJECT_EXPERTISE.general;
  const intentGuide = INTENT_INSTRUCTIONS[intent] ?? INTENT_INSTRUCTIONS.explain;
  const level = educationLevelPrompt(educationLevel);

  return `${expertise}

${level}

Response type: ${intent}
${intentGuide}

Format your response in markdown. Be accurate, educational, and classroom-ready.
Do NOT assume every question is mathematics — adapt to the detected subject.`;
}

export function getSubjectUserPrompt(input: string, intent: ResponseIntent): string {
  if (intent === 'compare') {
    return `Teacher's comparison request:\n${input}\n\nStructure your response with clear sections for similarities and differences.`;
  }
  if (intent === 'quiz') {
    return `Teacher's topic:\n${input}\n\nGenerate 5 quiz questions with answers. Number each question.`;
  }
  return `Teacher's question or topic:\n${input}`;
}
