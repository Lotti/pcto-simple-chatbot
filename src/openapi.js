export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'simple-chatbot',
    version: '2.0.0',
    description: 'Fastify gateway for IBM Watson Assistant.',
  },
  servers: [
    {
      url: '/api',
    },
  ],
  components: {
    securitySchemes: {
      BasicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    },
    schemas: {
      Healthcheck: {
        additionalProperties: false,
        properties: {
          status: { type: 'string' },
        },
        required: ['status'],
        type: 'object',
      },
      Error: {
        additionalProperties: true,
        properties: {
          error: { type: 'boolean' },
          message: { type: 'string' },
        },
        required: ['error', 'message'],
        type: 'object',
      },
      MessageRequest: {
        additionalProperties: false,
        properties: {
          text: { type: 'string' },
          userId: { type: 'string' },
        },
        required: ['text', 'userId'],
        type: 'object',
      },
      MessageResponse: {
        additionalProperties: true,
        properties: {
          output: {
            type: 'object',
          },
        },
        required: ['output'],
        type: 'object',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        operationId: 'health',
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Healthcheck',
                },
              },
            },
            description: 'Health check response.',
          },
        },
        summary: 'Health check',
      },
    },
    '/message': {
      post: {
        operationId: 'message',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/MessageRequest',
              },
            },
          },
          required: true,
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MessageResponse',
                },
              },
            },
            description: 'Assistant response payload.',
          },
          '503': {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
            description: 'Assistant not configured.',
          },
        },
        summary: 'Send a chat message',
      },
    },
  },
};
