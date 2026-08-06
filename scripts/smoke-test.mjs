import assert from 'node:assert/strict';
import { createApp } from '../src/services/Server.js';

const app = await createApp({
  assistantClient: {
    isConfigured: true,
    async sendMessage(userId, text) {
      return {
        generic: [
          {
            response_type: 'text',
            text: `Echo for ${userId}: ${text}`,
          },
        ],
      };
    },
  },
});

try {
  const healthResponse = await app.inject({
    method: 'GET',
    url: '/api/health',
  });
  assert.equal(healthResponse.statusCode, 200);
  assert.deepEqual(healthResponse.json(), { status: 'UP' });

  const docsResponse = await app.inject({
    method: 'GET',
    url: '/api-docs',
  });
  assert.equal(docsResponse.statusCode, 200);
  assert.equal(docsResponse.json().openapi, '3.1.0');

  const messageResponse = await app.inject({
    method: 'POST',
    url: '/api/message',
    payload: {
      text: 'ciao',
      userId: 'user-123',
    },
  });
  assert.equal(messageResponse.statusCode, 200);
  assert.equal(
    messageResponse.json().output.generic[0].text,
    'Echo for user-123: ciao',
  );

  const invalidResponse = await app.inject({
    method: 'POST',
    url: '/api/message',
    payload: {
      text: '',
      userId: 'user-123',
    },
  });
  assert.equal(invalidResponse.statusCode, 400);

  console.log('Smoke test passed');
} finally {
  await app.close();
}
