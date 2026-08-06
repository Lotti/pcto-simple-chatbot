# Simple chatbot

This repo is now a small Fastify service that exposes:

- `GET /api/health`
- `POST /api/message`
- interactive docs at `/docs`
- OpenAPI JSON at `/api-docs`

Required environment variables for real Watson Assistant calls:

```bash
ASSISTANT_URL='...'
ASSISTANT_APIKEY='...'
ASSISTANT_ID='...'
```

Optional docs/API basic auth:

```bash
BASIC_AUTH_USERNAME='...'
BASIC_AUTH_PASSWORD='...'
```

Useful commands:

- `npm install`
- `npm run lint`
- `npm test`
- `npm start`
- `npm run dev`

Docker example:

```bash
docker build -t chatbot .
docker run --env-file ./Docker.env -p 8080:3000 chatbot
```
