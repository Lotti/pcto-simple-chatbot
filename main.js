import 'dotenv/config';
import { createApp } from './src/services/Server.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

try {
  const app = await createApp();
  await app.listen({ host, port });
  console.log(`simple-chatbot listening on http://${host}:${port}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
