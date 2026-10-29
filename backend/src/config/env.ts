import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';
const mongodbUri = process.env.MONGODB_URI;

if (nodeEnv === 'production' && !mongodbUri) {
  throw new Error('MONGODB_URI must be configured in production');
}

export const env = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  mongodbUri: mongodbUri ?? 'mongodb://localhost:27017/smart-board',
  nodeEnv,
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  aiProvider: (process.env.AI_PROVIDER ?? 'mock') as 'mock' | 'openai' | 'google',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  openaiVisionModel: process.env.OPENAI_VISION_MODEL ?? 'gpt-4o-mini',
  googleApiKey: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? '',
  googleModel: process.env.GOOGLE_MODEL ?? 'gemini-3.6-flash',
  googleVisionModel: process.env.GOOGLE_VISION_MODEL ?? process.env.GOOGLE_MODEL ?? 'gemini-3.6-flash',
  agentEnabled: process.env.AGENT_ENABLED === 'true' || process.env.NODE_ENV === 'development',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? '',
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
};
