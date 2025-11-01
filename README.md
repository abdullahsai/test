# Google Apps Script Text Logger

## Overview
This project contains a minimal Google Apps Script web application that lets a user submit short text notes that persist to a connected Google Sheet. The app demonstrates end-to-end communication between client-side HTML/JavaScript and Apps Script server functions backed by SpreadsheetApp.

## Features
- **Single input workflow** – `index.html` renders one text input and a save button. Users submit a line of text and immediately see updated history appended beneath the form.
- **Persistent storage in Google Sheets** – `Code.gs` ensures a sheet named `Entries` exists (creating it on first run) and appends sanitized submissions beneath a single `Text` header row.
- **Automatic history loading** – When the web app loads, the client calls `getEntries()` so previously saved rows render in order, with the newest submission appearing last to mirror sheet order.
- **Graceful local testing fallback** – The client exposes `window.__textLogger__` helpers and a no-op `fallbackRun` implementation so unit tests (and local previews) can exercise rendering logic without Google Apps Script globals.

## Architecture
- `index.html` – Client template served by `doGet()`. Uses inline JavaScript to:
  - Render and clear `<ul id="entries">` elements via `renderEntries`.
  - Chain Apps Script calls through `google.script.run` (or the local fallback) for `saveText` and `getEntries`.
  - Expose helpers on `window.__textLogger__` for deterministic testing.
- `Code.gs` – Server-side Apps Script module containing:
  - `doGet()` to serve the HTML file with the page title set to “Text Logger”.
  - `saveText(text)` to sanitize input, append it to the `Entries` sheet, and return the refreshed list.
  - `getEntries()` to read all saved values (excluding the header row) for display.
  - Private helpers `sanitizeText_`, `ensureSheet_`, `readEntries_`, and `getSheet_` that encapsulate validation and sheet access logic.
  - Conditional `module.exports` to enable Jest unit tests with mocked SpreadsheetApp/HtmlService objects.
- `package.json` – Configures Jest with CommonJS, sets 80%+ coverage thresholds for `Code.gs`, and pins `jsdom@20.0.3` for HTML DOM simulation.

## Workflow
1. Deploy the Apps Script project (see Setup below).
2. Open the deployed web app URL.
3. Type text into the single input and press **Save**.
4. The submission posts to `saveText`, which writes to the Google Sheet and returns all entries.
5. The client re-renders the ordered list so the newest value appears at the bottom.
6. On subsequent visits, the client automatically calls `getEntries()` to show the persisted history without requiring further interaction.

## Setup & Deployment
1. Create a new [Apps Script project](https://script.google.com) bound to or standalone from a Google Sheet.
2. Create (or identify) a Google Sheet and ensure it is bound or accessible to the script. The script will create a sheet named `Entries` with a header row of `Text` on first execution.
3. In the Apps Script editor:
   - Add a file named `Code.gs` and paste the contents of this repository’s `Code.gs` file.
   - Add an HTML file named `index.html` and paste the contents of `index.html` from this repository.
   - (Optional) Adjust the sheet name by updating `SHEET_NAME` in `Code.gs`.
4. Deploy the project as a web app (Deploy ▶ Manage deployments ▶ New deployment ▶ Web app) and grant the necessary spreadsheet scopes when prompted.
5. Visit the deployment URL to use the web interface.

## Testing
- **Command**: `npm test`
  - Runs Jest unit tests with coverage enabled.
  - Server tests (`__tests__/server.test.js`) mock SpreadsheetApp and HtmlService to exercise sanitization, sheet creation, persistence, and the `doGet` response contract.
  - Client tests (`__tests__/client.test.js`) load `index.html` into JSDOM to validate DOM structure, rendering behavior, and the offline fallback runner.
- **Coverage**: 100% statements / 91.66% branches / 100% functions / 100% lines (see `coverage/lcov-report/index.html` for details).

## Changelog
- **v1.0.0** – Initial implementation of the Google Apps Script text logger, including Apps Script server functions, HTML client, npm-based Jest test harness, and documentation.
