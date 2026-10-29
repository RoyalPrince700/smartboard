import { env } from '../../config/env';
import { AIProvider } from './AIProvider';
import { createGoogleProvider } from './providers/GoogleProvider';
import { mockAIProvider } from './providers/MockAIProvider';
import { createOpenAIProvider } from './providers/OpenAIProvider';

function selectProvider(): AIProvider {
  // Local agent testing: skip Gemini/OpenAI — handwriting uses text strokes or tutor input
  if (env.agentEnabled) {
    return mockAIProvider;
  }

  if (env.aiProvider === 'openai') {
    const openai = createOpenAIProvider();
    if (openai) return openai;
    console.warn('AI_PROVIDER=openai but OPENAI_API_KEY is missing — trying Google or mock');
  }

  if (env.aiProvider === 'google' || (env.aiProvider === 'mock' && env.googleApiKey)) {
    const google = createGoogleProvider();
    if (google) return google;
    if (env.aiProvider === 'google') {
      console.warn('AI_PROVIDER=google but GOOGLE_API_KEY is missing — using mock provider');
    }
  }

  if (env.openaiApiKey) {
    const openai = createOpenAIProvider();
    if (openai) return openai;
  }

  return mockAIProvider;
}

class AIService {
  private provider: AIProvider = selectProvider();

  getProviderName(): string {
    return this.provider.name;
  }

  refreshProvider(): void {
    this.provider = selectProvider();
  }

  getProvider(): AIProvider {
    return this.provider;
  }
}

export const aiService = new AIService();
