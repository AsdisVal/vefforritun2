import { jest } from '@jest/globals';
import fs from 'node:fs/promises';
jest.mock('node:fs/promises');
import path from 'node:path';
import {
  main,
  ensureDirectoryExists,
  readJson as originalReadJson,
  validateEntry,
  filterExistingJsonFiles,
  writeHtml,
  logMessage,
} from './main.js';

const readJson = jest.fn(originalReadJson);

jest.mock('node:fs/promises');
jest.mock('node:path', () => {
  return { ...path };
});
// Mock console.log for logMessage testing
global.console = { ...console, log: jest.fn() };

describe('logMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs info messages correctly', () => {
    logMessage('INFO', 'Test message');
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[INFO -') &&
        expect.stringContaining('Test message')
    );
  });

  test('includes error stack traces', () => {
    const error = new Error('Test error');
    logMessage('ERROR', 'Failed operation', error);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('→ Error: Test error')
    );
  });
});

describe('ensureDirectoryExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates directory when not exists', async () => {
    fs.access = jest.fn().mockRejectedValue(new Error('ENOENT'));
    fs.mkdir.mockResolvedValue(undefined);

    await ensureDirectoryExists('./new-dir');
    expect(fs.mkdir).toHaveBeenCalledWith('./new-dir', { recursive: true });
  });

  test('does nothing for existing directory', async () => {
    fs.access.mockResolvedValue(undefined);
    await ensureDirectoryExists('./existing-dir');
    expect(fs.mkdir).not.toHaveBeenCalled();
  });
});

describe('readJson', () => {
  test('reads valid JSON file', async () => {
    const mockData = { key: 'value' };
    fs.readFile.mockResolvedValueOnce(JSON.stringify(mockData));
    const result = await readJson('./valid.json');
    expect(result).toEqual(mockData);
  });

  test('returns null for invalid JSON', async () => {
    fs.readFile.mockResolvedValueOnce('invalid json');
    const result = await readJson('./invalid.json');
    expect(result).toBeNull();
  });

  test('handles missing files', async () => {
    fs.readFile.mockRejectedValueOnce(
      Object.assign(new Error(), { code: 'ENOENT' })
    );
    const result = await readJson('./missing.json');
    expect(result).toBeNull();
  });
});

describe('validateEntry', () => {
  test('valid index entry', () => {
    const entry = { title: 'Valid', file: 'valid.json' };
    expect(validateEntry(entry, true)).toBe(true);
  });

  test('invalid index entry', () => {
    const entry = { title: '', file: 'invalid.txt' };
    expect(validateEntry(entry, true)).toBe(false);
  });

  test('valid QnA entry', () => {
    const entry = {
      title: 'Questions',
      questions: [{ question: 'Q1', answers: [] }],
    };
    expect(validateEntry(entry)).toBe(true);
  });

  test('invalid QnA entry with malformed questions', () => {
    const entry = { title: 'Test', questions: 'not-an-array' };
    expect(validateEntry(entry)).toBe(false);
  });
});

describe('filterExistingJsonFiles', () => {
  test('filters non-existing files', async () => {
    const entries = [
      { title: 'Valid', file: 'exists.json' },
      { title: 'Invalid', file: 'missing.json' },
    ];

    readJson
      .mockResolvedValueOnce({ questions: [] }) // exists.json
      .mockResolvedValueOnce(null); // missing.json

    const result = await filterExistingJsonFiles(entries);
    expect(result).toEqual([entries[0]]);
  });
});

describe('writeHtml', () => {
  test('generates correct HTML structure', async () => {
    const testData = [
      { title: 'Test 1', file: 'test1.json' },
      { title: 'Test 2', file: 'test2.json' },
    ];

    await writeHtml(testData);

    const expectedHtml = expect.stringContaining(
      '<li><a href="test1.html">Test 1</a></li>' +
        '<li><a href="test2.html">Test 2</a></li>'
    );

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expectedHtml,
      'utf-8'
    );
  });
});

describe('main', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    path.resolve.mockImplementation((...args) => args.join('/'));
  });

  test('successful execution flow', async () => {
    const mockIndex = [
      { title: 'Valid', file: 'valid.json' },
      { title: 'Invalid', file: 'invalid.json' },
    ];

    const mockQuestions = {
      title: 'Test Questions',
      questions: [{ question: 'Q1', answers: [] }],
    };

    readJson
      .mockResolvedValueOnce(mockIndex) // index.json
      .mockResolvedValueOnce(mockQuestions) // valid.json
      .mockResolvedValueOnce(null); // invalid.json

    await main();

    expect(fs.mkdir).toHaveBeenCalledWith('./dist', { recursive: true });
    expect(writeHtml).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Program completed successfully')
    );
  });

  test('handles missing index.json', async () => {
    readJson.mockResolvedValueOnce(null);
    await main();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('index.json is invalid or missing')
    );
  });

  test('handles no valid entries', async () => {
    readJson.mockResolvedValueOnce([]);
    await main();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No valid entries found')
    );
  });
});
