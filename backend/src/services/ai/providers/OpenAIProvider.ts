import OpenAI from 'openai';
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

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.openaiApiKey });
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
      provider: 'openai',
    };
  }

  async explainWithPrompt(
    systemPrompt: string,
    userPrompt: string
  ): Promise<Partial<TeachingResponse>> {
    const completion = await this.client.chat.completions.create({
      model: env.openaiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1800,
    });

    const text = completion.choices[0]?.message?.content ?? 'No response generated.';
    return { text };
  }

  async recognizeHandwriting(strokes: Stroke[], imageBase64?: string): Promise<string> {
    if (imageBase64) {
      const completion = await this.client.chat.completions.create({
        model: env.openaiVisionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'This image shows handwriting or drawings from a classroom whiteboard. Transcribe all readable text exactly as written. Include equations, questions, and labels. If there is no readable text, respond with only: [no text detected]. Do not add explanations.',
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${imageBase64}` },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const result = completion.choices[0]?.message?.content?.trim() ?? '';
      if (result === '[no text detected]') return '';
      return result;
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

    const completion = await this.client.chat.completions.create({
      model: env.openaiModel,
      messages: [
        {
          role: 'system',
          content: `Classify the educational content. Respond ONLY with valid JSON:
{"subject":"mathematics|english|literature|biology|chemistry|physics|geography|history|economics|government|computer_science|general","confidence":0.0-1.0,"intent":"explain|solve|compare|visualize|quiz|summarize|examples|simplify|unknown","difficulty":"primary|junior_secondary|senior_secondary|university|unknown"}`,
        },
        { role: 'user', content: input },
      ],
      temperature: 0.2,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    try {
      const raw = completion.choices[0]?.message?.content ?? '{}';
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
        provider: 'openai',
      };
    }

    const classification = await this.classifySubject(recognizedText);
    const explanation = await this.explainConcept(recognizedText, {
      ...input.context,
      subject: classification.subject,
    });

    return { recognizedText, classification, explanation, provider: 'openai' };
  }
}

export function createOpenAIProvider(): OpenAIProvider | null {
  if (!env.openaiApiKey) return null;
  return new OpenAIProvider();
}
