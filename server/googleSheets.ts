import { google } from 'googleapis';

export interface SheetConfig {
  spreadsheetId: string;
  sheetName: string;
  serviceAccountKey: string; // JSON string
}

export interface StockUpdate {
  itemCode: string;
  quantity: number;
}

/**
 * Import stock data from Google Sheets
 * Expected format: Column A = Item Code, Column B = Quantity
 */
export async function importFromGoogleSheet(config: SheetConfig): Promise<StockUpdate[]> {
  try {
    // Parse service account credentials
    const credentials = JSON.parse(config.serviceAccountKey);
    
    // Authenticate with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Read data from sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${config.sheetName}!A2:B`, // Skip header row, read columns A and B
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Parse rows into stock updates
    const updates: StockUpdate[] = [];
    for (const row of rows) {
      const [itemCode, quantityStr] = row;
      if (!itemCode || !quantityStr) continue;

      const quantity = parseInt(quantityStr, 10);
      if (isNaN(quantity)) continue;

      updates.push({
        itemCode: itemCode.trim(),
        quantity,
      });
    }

    return updates;
  } catch (error) {
    console.error('[GoogleSheets] Import failed:', error);
    throw new Error(`Failed to import from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test Google Sheets connection
 */
export async function testGoogleSheetConnection(config: SheetConfig): Promise<boolean> {
  try {
    const credentials = JSON.parse(config.serviceAccountKey);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Try to get spreadsheet metadata
    await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId,
    });

    return true;
  } catch (error) {
    console.error('[GoogleSheets] Connection test failed:', error);
    return false;
  }
}
