import { Stroke } from './stroke';

export type EducationLevel =
  | 'primary'
  | 'junior_secondary'
  | 'senior_secondary'
  | 'university'
  | 'general';

export type SubjectId =
  | 'mathematics'
  | 'english'
  | 'literature'
  | 'biology'
  | 'chemistry'
  | 'physics'
  | 'geography'
  | 'history'
  | 'economics'
  | 'government'
  | 'computer_science'
  | 'general';

export type ResponseIntent =
  | 'explain'
  | 'solve'
  | 'compare'
  | 'visualize'
  | 'quiz'
  | 'summarize'
  | 'examples'
  | 'simplify'
  | 'unknown';

export interface AIContext {
  educationLevel?: EducationLevel;
  subject?: SubjectId | string;
}

export interface SubjectClassification {
  subject: SubjectId | string;
  confidence: number;
  intent: ResponseIntent | string;
  difficulty?: string;
}

export interface ComparisonData {
  itemA: string;
  itemB: string;
  similarities: string[];
  differences: string[];
}

export interface QuizQuestion {
  question: string;
  options?: string[];
  answer: string;
}

export interface TeachingResponse {
  text: string;
  responseType?: ResponseIntent | string;
  subject?: SubjectId | string;
  examples?: string[];
  nonExamples?: string[];
  keyPoints?: string[];
  comparison?: ComparisonData;
  quizQuestions?: QuizQuestion[];
  classification?: SubjectClassification;
  provider?: string;
}

export type ExplanationResponse = TeachingResponse;

export interface InterpretResponse {
  recognizedText: string;
  classification: SubjectClassification;
  explanation?: TeachingResponse;
  provider?: string;
}

export interface RecognizeResponse {
  text: string;
  provider?: string;
}

export interface AIHistoryEntry {
  id: string;
  inputType: 'text' | 'handwriting' | 'voice';
  rawInput: string;
  classification?: SubjectClassification;
  responseType: string;
  response: unknown;
  createdAt: string;
}

export interface AIInteraction {
  id: string;
  inputType: 'text' | 'handwriting';
  rawInput: string;
  recognizedText?: string;
  classification?: SubjectClassification;
  response: TeachingResponse;
  timestamp: number;
}

export const EDUCATION_LEVELS: { id: EducationLevel; label: string }[] = [
  { id: 'primary', label: 'Primary' },
  { id: 'junior_secondary', label: 'Junior Secondary' },
  { id: 'senior_secondary', label: 'Senior Secondary' },
  { id: 'university', label: 'University' },
  { id: 'general', label: 'General' },
];

export const SUBJECTS: { id: SubjectId; label: string; color: string }[] = [
  { id: 'general', label: 'Auto', color: '#888888' },
  { id: 'mathematics', label: 'Math', color: '#2980b9' },
  { id: 'english', label: 'English', color: '#e94560' },
  { id: 'literature', label: 'Literature', color: '#9b59b6' },
  { id: 'biology', label: 'Biology', color: '#27ae60' },
  { id: 'chemistry', label: 'Chemistry', color: '#f39c12' },
  { id: 'physics', label: 'Physics', color: '#3498db' },
  { id: 'geography', label: 'Geography', color: '#16a085' },
  { id: 'history', label: 'History', color: '#8e44ad' },
  { id: 'economics', label: 'Economics', color: '#d35400' },
  { id: 'government', label: 'Govt', color: '#c0392b' },
  { id: 'computer_science', label: 'CS', color: '#2c3e50' },
];

export function formatSubjectLabel(subject: string): string {
  return SUBJECTS.find((s) => s.id === subject)?.label ?? subject.replace(/_/g, ' ');
}

export function formatIntentLabel(intent: string): string {
  const labels: Record<string, string> = {
    explain: 'Explanation',
    solve: 'Solution',
    compare: 'Comparison',
    visualize: 'Visualization',
    quiz: 'Quiz',
    summarize: 'Summary',
    examples: 'Examples',
    simplify: 'Simplified',
    unknown: 'Response',
  };
  return labels[intent] ?? intent;
}

export function getSubjectColor(subject: string): string {
  return SUBJECTS.find((s) => s.id === subject)?.color ?? '#888888';
}

export interface AIProvider {
  name: string;
  explainConcept(input: string, context?: AIContext): Promise<ExplanationResponse>;
  recognizeHandwriting(strokes: Stroke[], imageBase64?: string): Promise<string>;
  classifySubject(input: string): Promise<SubjectClassification>;
}
