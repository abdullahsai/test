const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('index.html client behavior', () => {
  let document;
  let window;
  let textLogger;
  let input;
  let button;
  let list;

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
    input = document.querySelector('#textInput');
    button = document.querySelector('#saveButton');
    list = document.querySelector('#entries');
  });

  beforeEach(() => {
    jest.useFakeTimers();
    textLogger.fallbackRun.reset();
    list.innerHTML = '';
    input.value = '';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('has a text input and save button', () => {
    expect(input).not.toBeNull();
    expect(button).not.toBeNull();
    expect(button.textContent).toMatch(/save/i);
  });

  test('renderEntries replaces list items with new entries', () => {
    list.innerHTML = '<li>Old</li>';

    textLogger.renderEntries(['First', 'Second']);

    const items = Array.from(list.querySelectorAll('li')).map((li) => li.textContent);
    expect(items).toEqual(['First', 'Second']);
  });

  test('fallback runner invokes success handler immediately', () => {
    list.innerHTML = '';

    const handler = jest.fn((entries) => textLogger.renderEntries(entries));

    textLogger.fallbackRun
      .withSuccessHandler(handler)
      .withFailureHandler(() => {})
      .getEntries();

    jest.runAllTimers();

    expect(handler).toHaveBeenCalledWith([]);
    expect(list.children.length).toBe(0);
  });

  test('clicking save renders pending entry immediately then persists', () => {
    input.value = 'Hello world';

    button.click();

    const pendingItems = list.querySelectorAll('.entry--pending');
    expect(pendingItems.length).toBe(1);
    expect(list.textContent).toContain('Hello world');
    expect(input.value).toBe('');

    jest.runAllTimers();

    expect(list.querySelectorAll('li').length).toBe(1);
    expect(list.querySelector('li').classList.contains('entry--pending')).toBe(
      false
    );
    expect(list.querySelector('.entry__error')).toBeNull();
  });

  test('failed save leaves entry visible and shows error message', () => {
    textLogger.fallbackRun.failNextSave();
    input.value = 'Will fail';

    button.click();

    expect(list.querySelectorAll('.entry--pending').length).toBe(1);

    jest.runAllTimers();

    const item = list.querySelector('li');
    expect(item).not.toBeNull();
    expect(item.textContent).toContain('Will fail');
    const error = item.querySelector('.entry__error');
    expect(error).not.toBeNull();
    expect(error.textContent).toMatch(/failed to save/i);
  });
});
