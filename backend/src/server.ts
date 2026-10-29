import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { registerAgentModels } from './agent/registerModels';

async function start() {
  await connectDB();
  await registerAgentModels();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

start().catch((error: unknown) => {
  console.error('Unable to start server because MongoDB is unavailable:', error);
  process.exit(1);
});
