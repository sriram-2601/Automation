import { BaseIntegration } from './baseIntegration.js';

export class GoogleSheetsIntegration extends BaseIntegration {
  constructor(credentials) {
    super('google-sheets', credentials);
  }

  async execute(action, params = {}) {
    console.log(`[Google Sheets Integration] Executing action: ${action}`);

    if (action === 'appendRow') {
      const { spreadsheetId, range, values } = params;
      if (!spreadsheetId) throw new Error('MISSING_FIELDS: Spreadsheet ID is required.');
      if (!values) throw new Error('MISSING_FIELDS: Comma-separated row values are required.');

      console.log(`[Google Sheets Integration] Appending row to Sheet ID ${spreadsheetId} range ${range}`);

      return {
        appended: true,
        spreadsheetId,
        range: range || 'Sheet1!A:Z',
        rowValues: values.split(',').map(v => v.trim()),
        timestamp: new Date()
      };
    }

    throw new Error(`Unsupported action in Google Sheets integration: ${action}`);
  }
}
