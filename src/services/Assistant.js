const assert = require('assert').strict;

const AssistantV2 = require('ibm-watson/assistant/v2');
const { BasicAuthenticator, IamAuthenticator } = require('ibm-watson/auth');

class Assistant {
    constructor() {
        let authenticator;

        assert(process.env.ASSISTANT_URL, 'Environment variable "ASSISTANT_URL" is missing!');

        if (process.env.ASSISTANT_APIKEY) {
            authenticator = new IamAuthenticator({ apikey: process.env.ASSISTANT_APIKEY });
        } else {
            assert(process.env.ASSISTANT_USERNAME, 'Environment variable "ASSISTANT_USERNAME" is missing!');
            assert(process.env.ASSISTANT_PASSWORD, 'Environment variable "ASSISTANT_PASSWORD" is missing!');
            authenticator = new BasicAuthenticator({ username: process.env.ASSISTANT_USERNAME, password: process.env.ASSISTANT_PASSWORD });
        }

        this.service = new AssistantV2({
            authenticator: authenticator,
            url: process.env.ASSISTANT_URL,
            version: '2019-02-28',
            headers: {
                'X-Watson-Learning-Opt-Out': 'true',
            },
        });
    }

    /**
     * Static method to return the same instance
     */
    static INSTANCE() {
        if (!Assistant.instance) {
            Assistant.instance = new Assistant();
        }
        return Assistant.instance;
    }

    async getSessionId(userId) {
    }

    async sendMessage(userId, text) {
    }
}

module.exports = Assistant;