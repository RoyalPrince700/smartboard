import {
  AIContext,
  InterpretResponse,
  SubjectClassification,
  TeachingResponse,
} from '../../types/ai';
import { Stroke } from '../../types/stroke';
import { mathEngine } from '../math/MathEngine';
import { AIProvider } from './AIProvider';
import { aiService } from './AIService';import { classifyForTeaching, generateMockResponse } from './mockResponses';
import { classifyInput } from './SubjectClassifier';
import { getSubjectSystemPrompt, getSubjectUserPrompt } from './subjectPrompts';

function isMathProblem(classification: SubjectClassification, input: string): boolean {
  if (classification.subject !== 'mathematics') return false;
  return (
    classification.intent === 'solve' ||
    classification.intent === 'visualize' ||
    /[=^²]|x\^|x²|y\s*=/.test(input)
  );
}

class TeachingService {
  async teach(input: string, context?: AIContext): Promise<TeachingResponse> {
    const classification = classifyForTeaching(input, context);

    if (isMathProblem(classification, input)) {
      const result = await mathEngine.solve(input, { includeGraph: true, context });
      return {
        text: result.steps.map((s) => `**${s.step}. ${s.title}:** ${s.content}`).join('\n\n'),
        responseType: classification.intent === 'visualize' ? 'visualize' : 'solve',
        subject: 'mathematics',
        keyPoints: result.answers,
        classification,
        provider: 'math-engine',
        examples: result.explanation ? [result.explanation] : undefined,
      };
    }

    const provider = aiService.getProvider();

    if (provider.name !== 'mock' && provider.explainWithPrompt) {
      return this.teachWithLLM(input, classification, context, provider);
    }

    return generateMockResponse(input, classification, context);
  }

  private async teachWithLLM(
    input: string,
    classification: SubjectClassification,
    context: AIContext | undefined,
    provider: AIProvider
  ): Promise<TeachingResponse> {
    const systemPrompt = getSubjectSystemPrompt(
      classification.subject,
      classification.intent,
      context?.educationLevel
    );
    const userPrompt = getSubjectUserPrompt(input, classification.intent);

    const result = await provider.explainWithPrompt!(systemPrompt, userPrompt);

    return {
      text: result.text ?? '',
      responseType: classification.intent,
      subject: classification.subject,
      classification,
      provider: provider.name,
    };
  }

  async interpret(input: {
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    context?: AIContext;
  }): Promise<InterpretResponse> {
    const provider = aiService.getProvider();
    let recognizedText = input.text?.trim() ?? '';

    if (!recognizedText) {
      recognizedText = await provider.recognizeHandwriting(
        input.strokes ?? [],
        input.imageBase64
      );
    }

    if (!recognizedText || recognizedText.startsWith('[')) {
      return {
        recognizedText: recognizedText || '',
        classification: { subject: 'general', confidence: 0, intent: 'unknown' },
        provider: provider.name,
      };
    }

    const classification = classifyInput(recognizedText, input.context?.subject);
    const explanation = await this.teach(recognizedText, {
      ...input.context,
      subject: classification.subject,
    });

    return {
      recognizedText,
      classification,
      explanation,
      provider: provider.name,
    };
  }

  classify(input: string, subjectOverride?: string): SubjectClassification {
    return classifyInput(input, subjectOverride);
  }
}

export const teachingService = new TeachingService();
