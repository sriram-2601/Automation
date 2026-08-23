export class BaseIntegration {
  constructor(provider, credentials = {}) {
    this.provider = provider;
    this.credentials = credentials; // Holds decrypted accessToken/refreshToken
  }

  /**
   * Run tool actions
   * @param {string} actionName Name of the node action to run (e.g. "sendEmail")
   * @param {object} params Resolved variables from templates
   */
  async execute(actionName, params = {}) {
    throw new Error(`Execution method not implemented on base integration adapter.`);
  }

  /**
   * Refreshes OAuth tokens if expired
   */
  async refreshTokens() {
    return this.credentials;
  }
}
