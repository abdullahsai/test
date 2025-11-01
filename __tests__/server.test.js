const {
  SHEET_NAME,
  sanitizeText_,
  ensureSheet_,
  readEntries_,
  getEntries,
  saveText,
  doGet,
} = require('../Code.gs');

describe('Apps Script server', () => {
  let spreadsheet;
  let sheets;
  let htmlService;

  beforeEach(() => {
    sheets = {};
    spreadsheet = {
      getSheetByName: jest.fn((name) => sheets[name] || null),
      insertSheet: jest.fn((name) => {
        const sheet = createSheet();
        sheets[name] = sheet;
        return sheet;
      }),
    };

    global.SpreadsheetApp = {
      getActiveSpreadsheet: jest.fn(() => spreadsheet),
    };

    htmlService = {
      createHtmlOutputFromFile: jest.fn(() => ({
        setTitle: jest.fn().mockReturnValue('output'),
      })),
    };

    global.HtmlService = htmlService;
  });

  afterEach(() => {
    delete global.SpreadsheetApp;
    delete global.HtmlService;
  });

  function createSheet() {
    const rows = [];
    const sheet = {
      appendRow: jest.fn((row) => rows.push(row)),
      getLastRow: jest.fn(() => rows.length),
      getRange: jest.fn((startRow, startColumn, numRows) => ({
        getValues: jest.fn(() => rows.slice(startRow - 1, startRow - 1 + numRows)),
      })),
    };
    return sheet;
  }

  test('constants expose sheet name for deployment reference', () => {
    expect(SHEET_NAME).toBe('Entries');
  });

  test('sanitizeText_ trims input and rejects empty strings', () => {
    expect(sanitizeText_('  hello ')).toBe('hello');
    expect(() => sanitizeText_(42)).toThrow('Text must be a string.');
    expect(() => sanitizeText_('   ')).toThrow('Text is required.');
  });

  test('ensureSheet_ reuses existing sheet and sets header', () => {
    const sheet = createSheet();
    sheets[SHEET_NAME] = sheet;

    const ensured = ensureSheet_();

    expect(spreadsheet.getSheetByName).toHaveBeenCalledWith(SHEET_NAME);
    expect(ensured).toBe(sheet);
    expect(sheet.appendRow).toHaveBeenCalledWith(['Text']);
  });

  test('ensureSheet_ creates sheet when missing', () => {
    const ensured = ensureSheet_();

    expect(spreadsheet.insertSheet).toHaveBeenCalledWith(SHEET_NAME);
    expect(ensured.appendRow).toHaveBeenCalledWith(['Text']);
  });

  test('readEntries_ returns stored values excluding header', () => {
    const sheet = createSheet();
    sheet.appendRow(['Text']);
    sheet.appendRow(['First']);
    sheet.appendRow(['Second']);

    const entries = readEntries_(sheet);

    expect(entries).toEqual(['First', 'Second']);
    expect(sheet.getRange).toHaveBeenCalledWith(2, 1, 2, 1);
  });

  test('readEntries_ returns empty array when only header exists', () => {
    const sheet = createSheet();
    sheet.appendRow(['Text']);

    const entries = readEntries_(sheet);

    expect(entries).toEqual([]);
  });

  test('getEntries reads from sheet', () => {
    const sheet = createSheet();
    sheets[SHEET_NAME] = sheet;
    sheet.appendRow(['Text']);
    sheet.appendRow(['Persisted']);

    const entries = getEntries();

    expect(entries).toEqual(['Persisted']);
  });

  test('saveText appends and returns refreshed entries', () => {
    const sheet = createSheet();
    sheets[SHEET_NAME] = sheet;
    sheet.appendRow(['Text']);
    sheet.appendRow(['Existing']);

    const entries = saveText('  New Entry  ');

    expect(sheet.appendRow).toHaveBeenCalledWith(['New Entry']);
    expect(entries).toEqual(['Existing', 'New Entry']);
  });

  test('doGet renders index file with title', () => {
    const output = doGet();

    expect(htmlService.createHtmlOutputFromFile).toHaveBeenCalledWith('index');
    expect(output).toBe('output');
  });
});
