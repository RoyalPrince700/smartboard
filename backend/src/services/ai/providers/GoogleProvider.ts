import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../../config/env';
import {
  AIContext,
  ExplanationResponse,
  InterpretResponse,
  SubjectClassification,
  TeachingResponse,
} from '../../../types/ai';
import { Stroke } from '../../../types/stroke';
import { AIProvider } from '../AIProvider';
import { classifyInput } from '../SubjectClassifier';
import { getSubjectSystemPrompt, getSubjectUserPrompt } from '../subjectPrompts';

export class GoogleProvider implements AIProvider {
  name = 'google';
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(env.googleApiKey);
  }

  async explainConcept(input: string, context?: AIContext): Promise<ExplanationResponse> {
    if (!input.trim()) {
      return { text: 'Please enter a question or topic.', responseType: 'explain', subject: 'general' };
    }

    const classification = classifyInput(input, context?.subject);
    const systemPrompt = getSubjectSystemPrompt(
      classification.subject,
      classification.intent,
      context?.educationLevel
    );
    const userPrompt = getSubjectUserPrompt(input, classification.intent);
    const result = await this.explainWithPrompt(systemPrompt, userPrompt);

    return {
      ...result,
      text: result.text ?? '',
      responseType: classification.intent,
      subject: classification.subject,
      classification,
      provider: 'google',
    };
  }

  async explainWithPrompt(
    systemPrompt: string,
    userPrompt: string
  ): Promise<Partial<TeachingResponse>> {
    const model = this.client.getGenerativeModel({
      model: env.googleModel,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text()?.trim() || 'No response generated.';
    return { text };
  }

  async recognizeHandwriting(strokes: Stroke[], imageBase64?: string): Promise<string> {
    if (imageBase64) {
      const model = this.client.getGenerativeModel({ model: env.googleVisionModel });
      const result = await model.generateContent([
        {
          text: 'This image shows handwriting or drawings from a classroom whiteboard. Transcribe all readable text exactly as written. Include equations, questions, and labels. If there is no readable text, respond with only: [no text detected]. Do not add explanations.',
        },
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64,
          },
        },
      ]);

      const recognized = result.response.text()?.trim() ?? '';
      if (recognized === '[no text detected]') return '';
      return recognized;
    }

    const textStrokes = strokes
      .filter((s) => s.tool === 'text' && s.textContent)
      .map((s) => s.textContent!)
      .join(' ');

    if (textStrokes) return textStrokes;
    return '';
  }

  async classifySubject(input: string): Promise<SubjectClassification> {
    if (!input.trim()) {
      return { subject: 'general', confidence: 0, intent: 'unknown' };
    }

    const model = this.client.getGenerativeModel({
      model: env.googleModel,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(
      `Classify the educational content. Respond ONLY with valid JSON:
{"subject":"mathematics|english|literature|biology|chemistry|physics|geography|history|economics|government|computer_science|general","confidence":0.0-1.0,"intent":"explain|solve|compare|visualize|quiz|summarize|examples|simplify|unknown","difficulty":"primary|junior_secondary|senior_secondary|university|unknown"}

Content: ${input}`
    );

    try {
      const raw = result.response.text()?.trim() ?? '{}';
      return JSON.parse(raw) as SubjectClassification;
    } catch {
      return classifyInput(input);
    }
  }

  async interpretBoard(input: {
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    context?: AIContext;
  }): Promise<InterpretResponse> {
    let recognizedText = input.text?.trim() ?? '';

    if (!recognizedText) {
      recognizedText = await this.recognizeHandwriting(input.strokes ?? [], input.imageBase64);
    }

    if (!recognizedText || recognizedText.startsWith('[')) {
      return {
        recognizedText: recognizedText || '',
        classification: { subject: 'general', confidence: 0, intent: 'unknown' },
        provider: 'google',
      };
    }

    const classification = await this.classifySubject(recognizedText);
    const explanation = await this.explainConcept(recognizedText, {
      ...input.context,
      subject: classification.subject,
    });

    return { recognizedText, classification, explanation, provider: 'google' };
  }
}

export function createGoogleProvider(): GoogleProvider | null {
  if (!env.googleApiKey) return null;
  return new GoogleProvider();
}
