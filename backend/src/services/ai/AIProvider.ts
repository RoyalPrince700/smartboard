import {
  AIContext,
  ExplanationResponse,
  InterpretResponse,
  SubjectClassification,
  TeachingResponse,
} from '../../types/ai';
import { Stroke } from '../../types/stroke';

export interface AIProvider {
  name: string;
  explainConcept(input: string, context?: AIContext): Promise<ExplanationResponse>;
  explainWithPrompt?(systemPrompt: string, userPrompt: string): Promise<Partial<TeachingResponse>>;
  recognizeHandwriting(strokes: Stroke[], imageBase64?: string): Promise<string>;
  classifySubject(input: string): Promise<SubjectClassification>;
  interpretBoard(input: {
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    context?: AIContext;
  }): Promise<InterpretResponse>;
}
