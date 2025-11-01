const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('index.html client behavior', () => {
  let document;
  let window;
  let textLogger;

  beforeAll(() => {
    const filePath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
    });
    window = dom.window;
    document = window.document;
    textLogger = window.__textLogger__;
  });

  test('has a text input and save button', () => {
    const input = document.querySelector('#textInput');
    const button = document.querySelector('#saveButton');

    expect(input).not.toBeNull();
    expect(button).not.toBeNull();
    expect(button.textContent).toMatch(/save/i);
  });

  test('renderEntries replaces list items with new entries', () => {
    const list = document.querySelector('#entries');
    list.innerHTML = '<li>Old</li>';

    textLogger.renderEntries(['First', 'Second']);

    const items = Array.from(list.querySelectorAll('li')).map((li) => li.textContent);
    expect(items).toEqual(['First', 'Second']);
  });

  test('fallback runner invokes success handler immediately', () => {
    const list = document.querySelector('#entries');
    list.innerHTML = '';

    const handler = jest.fn((entries) => textLogger.renderEntries(entries));

    textLogger.fallbackRun
      .withSuccessHandler(handler)
      .withFailureHandler(() => {})
      .getEntries();

    expect(handler).toHaveBeenCalledWith([]);
    expect(list.children.length).toBe(0);
  });
});
