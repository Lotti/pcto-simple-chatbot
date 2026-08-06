import { Buffer } from 'node:buffer';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { openApiDocument } from '../openapi.js';
import { createAssistantClient } from './Assistant.js';

const docsAuthUser =
  process.env.BASIC_AUTH_USERNAME ?? process.env.SWAGGER_NEXT_BASIC_AUTH_USERNAME ?? null;
const docsAuthPassword =
  process.env.BASIC_AUTH_PASSWORD ?? process.env.SWAGGER_NEXT_BASIC_AUTH_PASSWORD ?? null;

const shouldProtectRoute = (url) =>
  url === '/api-docs' || url === '/docs' || url.startsWith('/docs/') || url.startsWith('/api/');

const parseBasicAuth = (header) => {
  if (!header?.startsWith('Basic ')) {
    return null;
  }

  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');

  if (separatorIndex < 0) {
    return null;
  }

  return {
    password: decoded.slice(separatorIndex + 1),
    username: decoded.slice(0, separatorIndex),
  };
};

const renderHomePage = () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>simple-chatbot</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Helvetica Neue", sans-serif;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top right, rgba(72, 187, 120, 0.22), transparent 32%),
          linear-gradient(180deg, #e7efe9 0%, #f8f4ea 100%);
        color: #102a43;
      }

      main {
        width: min(52rem, calc(100vw - 2rem));
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(16, 42, 67, 0.1);
        border-radius: 28px;
        padding: 2rem;
        box-shadow: 0 22px 60px rgba(16, 42, 67, 0.12);
      }

      h1 {
        margin: 0 0 0.75rem;
        font-size: clamp(2rem, 8vw, 4rem);
      }

      p {
        line-height: 1.7;
        max-width: 40rem;
      }

      a {
        color: #0f5b4c;
        font-weight: 700;
      }

      ul {
        padding-left: 1.2rem;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>simple-chatbot</h1>
      <p>
        Minimal Fastify gateway for IBM Watson Assistant. This repository now focuses on
        the server-side integration only, with a small, auditable dependency graph.
      </p>
      <ul>
        <li><a href="/docs">Interactive API docs</a></li>
        <li><a href="/api-docs">OpenAPI JSON</a></li>
        <li><a href="/api/health">Health endpoint</a></li>
      </ul>
    </main>
  </body>
</html>`;

export const createApp = async ({ assistantClient = createAssistantClient() } = {}) => {
  const app = Fastify({
    logger: false,
  });

  await app.register(swagger, {
    openapi: openApiDocument,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  app.addHook('onRequest', async (request, reply) => {
    if (!docsAuthUser || !docsAuthPassword || !shouldProtectRoute(request.url)) {
      return;
    }

    const credentials = parseBasicAuth(request.headers.authorization);

    if (
      credentials?.username === docsAuthUser &&
      credentials?.password === docsAuthPassword
    ) {
      return;
    }

    reply
      .code(401)
      .header('www-authenticate', 'Basic realm="simple-chatbot"')
      .send({ error: true, message: 'invalid credentials' });
  });

  app.get('/', async (_request, reply) => {
    reply.type('text/html; charset=utf-8');
    return renderHomePage();
  });

  app.get('/api-docs', async () => openApiDocument);

  app.get('/api/health', async () => ({ status: 'UP' }));

  app.post('/api/message', async (request, reply) => {
    const { text, userId } = request.body ?? {};

    if (typeof text !== 'string' || text.trim() === '' || typeof userId !== 'string' || userId.trim() === '') {
      reply.code(400);
      return {
        error: true,
        message: 'Both "text" and "userId" must be non-empty strings.',
      };
    }

    if (!assistantClient.isConfigured) {
      reply.code(503);
      return {
        error: true,
        message:
          'Watson Assistant is not configured. Set ASSISTANT_URL, ASSISTANT_ID, and ASSISTANT_APIKEY.',
      };
    }

    try {
      const output = await assistantClient.sendMessage(userId.trim(), text.trim());
      return { output };
    } catch (error) {
      reply.code(502);
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Assistant request failed.',
      };
    }
  });

  return app;
};
