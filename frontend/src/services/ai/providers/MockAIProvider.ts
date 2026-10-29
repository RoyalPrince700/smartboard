import { ExplanationResponse, SubjectClassification, AIProvider } from '../../../types/ai';
import { Stroke } from '../../../types/stroke';

export class MockAIProvider implements AIProvider {
  name = 'mock';

  async explainConcept(_input: string): Promise<ExplanationResponse> {
    return {
      text: 'AI explanations will be available in Phase 2.',
      examples: [],
    };
  }

  async recognizeHandwriting(_strokes: Stroke[]): Promise<string> {
    return '';
  }

  async classifySubject(_input: string): Promise<SubjectClassification> {
    return {
      subject: 'general',
      confidence: 0,
      intent: 'unknown',
    };
  }
}

export const mockAIProvider = new MockAIProvider();
