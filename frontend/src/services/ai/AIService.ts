import {
  AIContext,
  ExplanationResponse,
  SubjectClassification,
} from '../../types/ai';
import { explainText, recognizeStrokes, interpretBoard } from '../api/aiApi';
import { Stroke } from '../../types/stroke';

class AIService {
  async explainConcept(input: string, context?: AIContext): Promise<ExplanationResponse> {
    return explainText(input, { context });
  }

  async recognizeHandwriting(strokes: Stroke[], imageBase64?: string): Promise<string> {
    const result = await recognizeStrokes(strokes, { imageBase64 });
    return result.text;
  }

  async classifySubject(input: string): Promise<SubjectClassification> {
    const result = await interpretBoard({ text: input, explain: false });
    return result.classification;
  }
}

export const aiService = new AIService();
