import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { registerAgentModels } from './agent/registerModels';

async function start() {
  try {
    await connectDB();
    await registerAgentModels();
  } catch {
    console.warn('Starting without MongoDB — board persistence will fail until DB is available');
  }

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

start();
