import assert from 'node:assert/strict';
import AssistantV2 from 'ibm-watson/assistant/v2.js';
import {
  BasicAuthenticator,
  IamAuthenticator,
} from 'ibm-watson/auth/index.js';

const buildAuthenticator = () => {
  if (process.env.ASSISTANT_APIKEY) {
    return new IamAuthenticator({
      apikey: process.env.ASSISTANT_APIKEY,
    });
  }

  if (process.env.ASSISTANT_USERNAME && process.env.ASSISTANT_PASSWORD) {
    return new BasicAuthenticator({
      password: process.env.ASSISTANT_PASSWORD,
      username: process.env.ASSISTANT_USERNAME,
    });
  }

  return null;
};

class DisabledAssistantClient {
  constructor() {
    this.isConfigured = false;
  }

  async sendMessage() {
    throw new Error(
      'Watson Assistant is not configured. Set ASSISTANT_URL, ASSISTANT_ID, and ASSISTANT_APIKEY.',
    );
  }
}

export class AssistantClient {
  constructor() {
    assert(process.env.ASSISTANT_URL, 'Environment variable "ASSISTANT_URL" is missing.');
    assert(process.env.ASSISTANT_ID, 'Environment variable "ASSISTANT_ID" is missing.');

    const authenticator = buildAuthenticator();
    assert(
      authenticator,
      'Provide either ASSISTANT_APIKEY or ASSISTANT_USERNAME/ASSISTANT_PASSWORD.',
    );

    this.isConfigured = true;
    this.assistantId = process.env.ASSISTANT_ID;
    this.sessions = new Map();
    this.service = new AssistantV2({
      authenticator,
      headers: {
        'X-Watson-Learning-Opt-Out': 'true',
      },
      serviceUrl: process.env.ASSISTANT_URL,
      version: process.env.ASSISTANT_VERSION ?? '2024-08-25',
    });
  }

  async #createSession(userId) {
    const response = await this.service.createSession({
      assistantId: this.assistantId,
    });
    const sessionId = response.result.session_id;
    this.sessions.set(userId, sessionId);
    return sessionId;
  }

  async #getSessionId(userId) {
    return this.sessions.get(userId) ?? this.#createSession(userId);
  }

  async sendMessage(userId, text) {
    const send = async () =>
      this.service.message({
        assistantId: this.assistantId,
        input: {
          message_type: 'text',
          text,
        },
        sessionId: await this.#getSessionId(userId),
      });

    try {
      const response = await send();
      return response.result.output ?? {};
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (/session/i.test(message)) {
        this.sessions.delete(userId);
        const retryResponse = await send();
        return retryResponse.result.output ?? {};
      }

      throw error;
    }
  }
}

export const createAssistantClient = () => {
  if (!process.env.ASSISTANT_URL || !process.env.ASSISTANT_ID) {
    return new DisabledAssistantClient();
  }

  return new AssistantClient();
};
