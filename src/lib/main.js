import fs from 'node:fs/promises';
import path from 'node:path';

const INDEX_PATH = './data/index.json';
const DIST_DIRECTORY = './dist';
const HTML_FILE_PATH = path.join(DIST_DIRECTORY, 'index.html');

/**
 * Logs messages with a timestamp and level.
 * @param {string} level - The log level: INFO, WARNING, ERROR, etc.
 * @param {string} message - The log message.
 * @param {any} [data=null] - Optional additional data to log.
 */
function logMessage(level, message, data = null) {
  const timespamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  let details = '';

  if (data instanceof Error) {
    details = `\n  → ${data.stack || data.message}`;
  } else if (data) {
    details = `\n  → ${JSON.stringify(data, null, 2)}`;
  }
  console.log(`[${level} - ${timespamp}] ${message}${details}`);
}

/**
 *  Checks to see if a particular directory exists on my computer.
 * @param {any} directory
 * @returns true if that directry exists, otherwise returns false.
 */
async function ensureDirectoryExists(directory) {
  try {
    await fs.access(directory);
    logMessage('INFO', `Directory ${directory} can be accessed.`);
  } catch {
    makeDirectory(directory);
  }
}

/**
 *
 * @param {string} directory
 */
async function makeDirectory(directory) {
  logMessage('INFO', `Trying to make a directory.`);
  try {
    await fs.mkdir(directory, { recursive: true });
    logMessage('INFO', `Directory created: ${directory}`);
  } catch (error) {
    logMessage('ERROR', `Failed to create directory ${directory}`, error);
  }
}

/**
 *
 * Les skrá og skilar gögnum eða null.
 * @param {string} filePath skráin sem á að lesa
 *
 * @returns {Promise<any | null>}les skrá úr `filepath` og skilar innihaldi, og skilar null ef villa kom upp.
 * Skilar `null` ef villa kom upp.
 */
async function readJson(filePath) {
  logMessage('INFO', `Start reading file: ${filePath}`);
  let data;
  try {
    data = await fs.readFile(path.resolve(filePath), 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      logMessage('ERROR', `File not found: ${filePath}`);
      console.error(`File not found: ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      logMessage('ERROR', `JSON syntax error in file: ${filePath}`, error);
    }
    return null;
  }

  try {
    const parseData = JSON.parse(data);
    return parseData;
  } catch (error) {
    logMessage('ERROR', 'Error parsing the data as JSON.');
    return null;
  }
}

/**
 * Validates a question and its answer.
 */
function validateQnA(entry) {
  if (entry && typeof entry === 'object') {
    const { question, answers } = entry;
    const hasValidQuestion =
      typeof question === 'string' && question.trim() != '';
    const hasValidAnswers =
      Array.isArray(answers) &&
      answers.every((a) => typeof a.answer === 'string');

    if (!hasValidQuestion)
      logMessage('ERROR', `Invalid question: ${JSON.stringify(entry)}`);
    if (!hasValidAnswers)
      logMessage('ERROR', `Invalid answers:  ${JSON.stringify(entry)}`);

    return hasValidQuestion && hasValidAnswers;
  }
  return false;
}

/**
 * Validates a JSON entry for title and file properties.
 * @param {Object} entry
 *
 */
function validateEntry(entry, isIndexEntry = false) {
  if (!entry || typeof entry !== 'object') {
    logMessage('WARNING', `Skipping invalid entry: Not an object.`);
    return false;
  }

  const { title, file, questions } = entry;

  if (isIndexEntry) {
    if (
      typeof title !== 'string' ||
      title.trim() === '' ||
      typeof file !== 'string' ||
      file.trim() === '' ||
      !file.endsWith('.json')
    ) {
      logMessage(
        'WARNING',
        `Skipping invalid index entry: ${JSON.stringify(entry)}`
      );
      return false;
    }
    return true;
  }

  if (
    typeof title !== 'string' ||
    title.trim() === '' ||
    !Array.isArray(questions) ||
    questions.length === 0
  ) {
    logMessage(
      'WARNING',
      `Skipping invalid question file: ${JSON.stringify(entry)}`
    );
    return false;
  }

  return true;
}

/**
 * Filters JSON files that actually exist.
 * @param {*} data
 * @returns
 */
async function filterExistingJsonFiles(data) {
  const validEntries = await Promise.all(
    data.map(async (entry) => {
      const filePath = path.resolve('data', entry.file);
      try {
        await fs.access(filePath);
        const content = await readJson(filePath);

        if (!validateEntry(content) || !Array.isArray(content.questions)) {
          logMessage(
            'WARNING',
            `Skipping invalid or corrupt file: ${filePath}`
          );
          return null;
        }
        return entry;
      } catch (error) {
        logMessage('WARNING', `JSON file not found: ${filePath}`);
        return null;
      }
    })
  );
  return validEntries.filter(Boolean);
}

/**
 * Write the main index.html file with links to indiviual pages.
 * @param {Object[]} data - Array of valid data entries.
 * @returns {Promise<void>} skrifar gögn í index.html
 */
async function writeHtml(data) {
  const html = data
    .map(
      (item) =>
        `<li><a href="${item.file.replace('.json', '.html')}">${
          item.title
        }</a></li>`
    )
    .join('\n');

  const htmlContent = /* html */ `
    <!DOCTYPE html>
    <html lang="is" class="">

    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Verkefni 1</title>
      <link rel="stylesheet" href="styles.css">
      <meta name="Forsíða" content="Verkefni 1 í veff2, Forsíða">
    </head>
      <body>
        <div class="wrapper">
          <header class="header">
            <h1>Verkefni 1</h1>
          </header>

          <div class="intro">
            <p>Þetta er nokkurs konar æfing í hugtökum sem varðar vefforritun. Gangi þér vel :D. </p>
          </div>

          <ul class="entry-options">
            ${html}
          </ul>
        </div>
      </body>
    </html>
      `;

  try {
    await fs.writeFile(HTML_FILE_PATH, htmlContent, 'utf-8');
    logMessage(
      'INFO',
      `HTML content with valid entries written to ${HTML_FILE_PATH}`
    );
  } catch (error) {
    logMessage('ERROR', `Error writing HTML file:`, error);
  }
}

/**
 * Creates individual HTML files.
 * @param {Array<Object>} data - Array of valid data entries
 */
async function createIndividualHtmlFiles(data) {
  await ensureDirectoryExists(DIST_DIRECTORY);

  await Promise.all(
    data.map(async (item) => {
      const filePath = path.join('./data', item.file);
      const content = await readJson(filePath);

      if (!content || !validateEntry(content)) return;

      if (!Array.isArray(content.questions) || content.questions.length === 0) {
        logMessage('WARNING', `Skipping ${item.title}: No valid questions.`);
        return;
      }

      const questionsHtml = content.questions
        .map((q) => {
          if (
            !q.question ||
            typeof q.question !== 'string' ||
            !Array.isArray(q.answers)
          ) {
            logMessage(
              'WARNING',
              `Skipping invalid question: ${JSON.stringify(q)}`
            );
            return '';
          }

          const answersHtml = q.answers
            .filter(
              (a) =>
                typeof a.answer === 'string' && typeof a.correct === 'boolean'
            ) // Ensure valid answers
            .map((a) => `<li>${a.answer} ${a.correct ? '(Correct)' : ''}</li>`)
            .join('');

          return `<div><h2>${q.question}</h2><ul>${answersHtml}</ul></div>`;
        })
        .join('');

      if (!questionsHtml.trim()) {
        logMessage(
          'WARNING',
          `Skipping ${item.title}: No valid questions to display.`
        );
        return;
      }

      const htmlFilePath = path.join(
        DIST_DIRECTORY,
        item.file.replace('.json', '.html')
      );
      const htmlContent = /* html */ `
          <!DOCTYPE html>
          <html lang="is">
          <head>
            <meta charset="UTF-8">
            <title>${item.title}</title>
          </head>
          <body>
            <h1>${item.title}</h1>
            ${questionsHtml}
          </body>
          </html>
        `;

      try {
        await fs.writeFile(htmlFilePath, htmlContent, 'utf-8');
        logMessage('INFO', `Generated HTML for ${item.title}: ${htmlFilePath}`);
      } catch (error) {
        logMessage('ERROR', `Error writing HTML for ${item.title}`, error);
      }
    })
  );
}

/**
 * Step 0: Ensuring the output directory exists.
 * Step 1: Read index.json
 * Step 2: Validate index.json entries
 * 3. Calls writeHtml to generate the index.html file.
 * 4. Calls createIndividualHtmlFiles to generate individual HTML files for each valid entry.
 */
async function main() {
  logMessage('INFO', 'Starting program...');

  await ensureDirectoryExists(DIST_DIRECTORY);

  // Read index.json
  const indexJson = await readJson(INDEX_PATH);
  if (!Array.isArray(indexJson)) {
    logMessage('ERROR', 'index.json is invalid or missing.');
    return;
  }

  // Validate index.json entries
  const validEntries = indexJson.filter((entry) => validateEntry(entry, true)); //g.r.f að hlutir séu gildir í byrjun
  if (validEntries.length === 0) {
    logMessage('ERROR', 'No valid entries found in index.json.');
    return;
  }

  // Skip invalid index.json entries
  const existingFiles = await filterExistingJsonFiles(validEntries);
  if (existingFiles.length === 0) {
    logMessage('ERROR', 'No valid question files found.');
    return;
  }

  // Write the valid index.json entries into index.html(The home page)
  await writeHtml(existingFiles);

  // Generate HTML files out of the valid index.json entries.
  await createIndividualHtmlFiles(existingFiles);

  logMessage('INFO', 'Program completed successfully.');
}

main().catch((err) => logMessage('ERROR', 'Unhandled error', err));
