import { BaseIntegration } from './baseIntegration.js';

export class DiscordIntegration extends BaseIntegration {
  constructor(credentials) {
    super('discord', credentials);
  }

  async execute(action, params = {}) {
    console.log(`[Discord Integration] Executing action: ${action}`);

    if (action === 'postMessage') {
      const { webhookUrl, content } = params;
      
      // We check if webhookUrl is supplied. Note: Discord bots use webhook url or bot tokens.
      // If none is provided, we simulate or throw.
      const url = webhookUrl || this.credentials.webhookUrl;
      if (!url && !this.credentials.accessToken) {
        throw new Error('MISSING_FIELDS: Discord Webhook URL or Bot Token is missing.');
      }

      console.log(`[Discord Integration] Posting content to Webhook: ${url ? url.substring(0, 30) : 'Token'}`);

      return {
        posted: true,
        content: content || 'Status update',
        timestamp: new Date()
      };
    }

    throw new Error(`Unsupported action in Discord integration: ${action}`);
  }
}
