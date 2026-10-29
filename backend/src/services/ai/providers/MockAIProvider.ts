import {
  AIContext,
  ExplanationResponse,
  InterpretResponse,
  SubjectClassification,
} from '../../../types/ai';
import { Stroke } from '../../../types/stroke';
import { AIProvider } from '../AIProvider';
import { classifyInput } from '../SubjectClassifier';
import { generateMockResponse } from '../mockResponses';

function extractTextStrokes(strokes: Stroke[]): string {
  return strokes
    .filter((s) => s.tool === 'text' && s.textContent)
    .map((s) => s.textContent!)
    .join(' ')
    .trim();
}

export class MockAIProvider implements AIProvider {
  name = 'mock';

  async explainConcept(input: string, context?: AIContext): Promise<ExplanationResponse> {
    if (!input.trim()) {
      return { text: 'Please enter a question or topic to explain.', responseType: 'explain', subject: 'general' };
    }
    const classification = classifyInput(input, context?.subject);
    return generateMockResponse(input, classification, context);
  }

  async recognizeHandwriting(strokes: Stroke[], _imageBase64?: string): Promise<string> {
    const textFromStrokes = extractTextStrokes(strokes);
    if (textFromStrokes) return textFromStrokes;

    const penStrokes = strokes.filter((s) => s.tool === 'pen' || s.tool === 'highlighter');
    if (penStrokes.length === 0) return '';

    return '[Handwriting detected — configure GOOGLE_API_KEY or OPENAI_API_KEY for recognition]';
  }

  async classifySubject(input: string): Promise<SubjectClassification> {
    return classifyInput(input);
  }

  async interpretBoard(input: {
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    context?: AIContext;
  }): Promise<InterpretResponse> {
    let recognizedText = input.text?.trim() ?? '';

    if (!recognizedText && input.strokes?.length) {
      recognizedText = await this.recognizeHandwriting(input.strokes, input.imageBase64);
    }

    const classification = recognizedText
      ? classifyInput(recognizedText, input.context?.subject)
      : { subject: 'general' as const, confidence: 0, intent: 'unknown' as const };

    let explanation: ExplanationResponse | undefined;
    if (recognizedText && !recognizedText.startsWith('[')) {
      explanation = await this.explainConcept(recognizedText, {
        ...input.context,
        subject: classification.subject,
      });
    }

    return { recognizedText, classification, explanation, provider: 'mock' };
  }
}

export const mockAIProvider = new MockAIProvider();
