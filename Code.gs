var SHEET_NAME = 'Entries';

function sanitizeText_(text) {
  if (typeof text !== 'string') {
    throw new Error('Text must be a string.');
  }
  var trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Text is required.');
  }
  return trimmed;
}

function ensureSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Text']);
  }
  return sheet;
}

function readEntries_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }
  var range = sheet.getRange(2, 1, lastRow - 1, 1);
  var values = range.getValues();
  return values.map(function(row) {
    return row[0];
  });
}

function getSheet_() {
  return ensureSheet_();
}

function getEntries() {
  var sheet = getSheet_();
  return readEntries_(sheet);
}

function saveText(text) {
  var sanitized = sanitizeText_(text);
  var sheet = getSheet_();
  sheet.appendRow([sanitized]);
  return readEntries_(sheet);
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index').setTitle('Text Logger');
}

if (typeof module !== 'undefined') {
  module.exports = {
    SHEET_NAME: SHEET_NAME,
    sanitizeText_: sanitizeText_,
    ensureSheet_: ensureSheet_,
    readEntries_: readEntries_,
    getSheet_: getSheet_,
    getEntries: getEntries,
    saveText: saveText,
    doGet: doGet
  };
}
