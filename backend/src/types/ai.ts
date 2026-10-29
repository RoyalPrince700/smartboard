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
  educationLevel?: string;
  subject?: SubjectId | string;
}

export interface SubjectClassification {
  subject: SubjectId;
  confidence: number;
  intent: ResponseIntent;
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
  responseType: ResponseIntent;
  subject: SubjectId;
  examples?: string[];
  nonExamples?: string[];
  keyPoints?: string[];
  comparison?: ComparisonData;
  quizQuestions?: QuizQuestion[];
  classification?: SubjectClassification;
  provider?: string;
}

export interface ExplanationResponse extends TeachingResponse {}

export interface InterpretResponse {
  recognizedText: string;
  classification: SubjectClassification;
  explanation?: TeachingResponse;
  provider?: string;
}

export interface ExplainRequest {
  input: string;
  context?: AIContext;
  boardId?: string;
}

export interface RecognizeRequest {
  strokes?: import('./stroke').Stroke[];
  imageBase64?: string;
  boardId?: string;
}

export interface InterpretRequest {
  text?: string;
  strokes?: import('./stroke').Stroke[];
  imageBase64?: string;
  context?: AIContext;
  boardId?: string;
  explain?: boolean;
}

export type EducationLevel =
  | 'primary'
  | 'junior_secondary'
  | 'senior_secondary'
  | 'university'
  | 'general';

export const EDUCATION_LEVELS: { id: EducationLevel; label: string }[] = [
  { id: 'primary', label: 'Primary' },
  { id: 'junior_secondary', label: 'Junior Secondary' },
  { id: 'senior_secondary', label: 'Senior Secondary' },
  { id: 'university', label: 'University' },
  { id: 'general', label: 'General' },
];

export const SUBJECTS: { id: SubjectId; label: string; color: string }[] = [
  { id: 'general', label: 'Auto', color: '#888' },
  { id: 'mathematics', label: 'Math', color: '#2980b9' },
  { id: 'english', label: 'English', color: '#e94560' },
  { id: 'literature', label: 'Literature', color: '#9b59b6' },
  { id: 'biology', label: 'Biology', color: '#27ae60' },
  { id: 'chemistry', label: 'Chemistry', color: '#f39c12' },
  { id: 'physics', label: 'Physics', color: '#3498db' },
  { id: 'geography', label: 'Geography', color: '#16a085' },
  { id: 'history', label: 'History', color: '#8e44ad' },
  { id: 'economics', label: 'Economics', color: '#d35400' },
  { id: 'government', label: 'Government', color: '#c0392b' },
  { id: 'computer_science', label: 'CS', color: '#2c3e50' },
];

export function educationLevelPrompt(level?: string): string {
  switch (level) {
    case 'primary':
      return 'Explain for primary school students using simple words and everyday examples.';
    case 'junior_secondary':
      return 'Explain for junior secondary students (ages 11–14) with clear examples.';
    case 'senior_secondary':
      return 'Explain for senior secondary students preparing for exams.';
    case 'university':
      return 'Explain at university level with appropriate technical depth.';
    default:
      return 'Explain clearly for a general classroom audience.';
  }
}

export function formatSubjectLabel(subject: string): string {
  return SUBJECTS.find((s) => s.id === subject)?.label ?? subject.replace('_', ' ');
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
