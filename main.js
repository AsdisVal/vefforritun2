

import { log } from 'node:console';
import fs from 'node:fs/promises';
import { type } from 'node:os';
import path from 'node:path';
import { queryObjects } from 'node:v8';


const INDEX_PATH = './data/index.json'; 
const DIST_DIR = './dist'; // skráarslóðin sem við ætlum að skrifa í
const HTML_FILE_PATH = path.join(DIST_DIR, 'index.html');


/**
 * Logs a message with a specified level and optional data.
 * @param {string} level - The log level (e.g., INFO, ERROR).
 * @param {string} message - The log message.
 * @param {any} [data=null] - Optional additional data to log.
    details = `\n  → ${data instanceof Error ? data.stack || data.message : data}`;
    */
function logMessage(level, message, data = null) {
  const timespamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  let details = '';

  if (data instanceof Error) {
    details = `\n  → ${data.stack || data.message}`;
  } else if (data) {
    details = `\n  → ${JSON.stringify(data, null, 2)}`;
  }
  console.log(`[${level} -  ${timespamp}] ${message}${details}`);
}


async function ensureDirectoryExists(directory){
  try {
    await fs.access(directory); //called before attempting to create it.
  } catch {
    try {
      await fs.mkdir(directory, { recursive: true });
      logMessage('INFO', `Directory created: ${directory}`);
    } catch (error) {
      logMessage('ERROR', `Failed to create directory ${directory}`, error);
    }
  }
}


/**
 * 
 * Les skrá og skilar gögnum eða null.
 * @param {string} filePath skráin sem á að lesa
 *  
 * @returns {Promise<Object | null>}les skrá úr `filepath` og skilar innihaldi.
 * Skilar `null` ef villa kom upp.
 */
async function readJson(filePath) {
  
  logMessage('INFO', 'Starting to read', filePath);

  let data;
  try {
    logMessage('INFO', `Reading file: ${filePath}`);
    data = await fs.readFile(path.resolve(filePath), 'utf-8');
    return JSON.parse(data); // skilar gögnum úr index.json skrá
  } catch (error) {
    if(error.code === 'ENOENT') {
      logMessage('ERROR', `File not found: ${filePath}`, error);
      console.error(`File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      logMessage('ERROR', `Error parsing JSON in file ${filePath}: ${error.message}`, error);
    } else {
      logMessage('ERROR', `Error reading file ${filePath}:`, error);
    }
    return null;
  }
}
 
/**
 * Find out if the created html has a valid question and an answer.
 */
function validateQnA(entry) {
  if(entry && typeof entry === 'object') { 
    const {question, answer} = entry;
    let isValidQnA = true;
    if (typeof question !== 'string' || question.trim() === ''){
      logMessage('ERROR', `Invalid question for entry: ${JSON.stringify(entry)}`)
      isValidQnA = false;
      return isValidQnA;
    }
    

    if(typeof answer !== 'string' || answer.trim() === '') {
      logMessage('ERROR', `Invalid answer for entry: ${JSON.stringify(entry)}`)
      isValidQnA = false;
      return isValidQnA;

    }
  }
  return
}

  /**
   * Validates that an entry from json has a title and a file property.
    * @param {Object} entry
    * 
   */
  async function validateEntry(entry) {
    if(entry && typeof entry === 'object') { 
      const { title, file } = entry;
      let isValid = true;
      // Check for valid title
      if (typeof title !== 'string' || title.trim() === '') {
        logMessage('WARNING', `Invalid title for entry: ${JSON.stringify(entry)}`);
        isValid = false;
      }
      // Check for valid file path
      if (typeof file !== 'string' || file.trim() === '' || !file.endsWith('.json')) {
        logMessage('WARNING', `Invalid file path for entry: ${JSON.stringify(entry)}`);
        isValid = false;
      }

      return isValid;
    }
    logMessage('WARNING', `Entry is not a valid object: ${JSON.stringify(entry)}`);
    return false;
  }

  async function filterExistingJsonFiles(data) {
    const filteredData = [];
    for (const entry of data) {
      if (!entry.file || typeof entry.file !== 'string') {
        logMessage('WARNING', `Invalid file path for entry: ${JSON.stringify(entry)}`);
        continue;
      }
      const filePath = path.join('./data', entry.file);
      try {
        await fs.access(filePath);
        filteredData.push(entry);
      } catch (error) {
        logMessage('WARNING', `Referenced JSON file not found: ${filePath}`);
      }
    }
    return filteredData;
  }


/**
 * Write the main index.html file with links to indiviual pages.
 * @param {Object[]} data - Array of valid data entries. 
 * @returns {Promise<void>} skrifar gögn í index.html
 */
async function writeHtml(data) {
  const html = data
    .map((item) => {
      const link = item.file.replace('.json', '.html');
      return `<li><a href="${link}">${item.title}</a></li>`;     
    })
    .join('\n');
  
    const htmlContent =  `
    <!DOCTYPE html>
    <html lang="is">
    <head>
      <meta charset="UTF-8">
      <title>Verkefni 1</title>
      </head>
      <body>
      <h1>Verkefni 1</h1>
      <ul>
        ${html}
      </ul>
      </body>
      </html>
      `;

     try {
      await fs.writeFile(HTML_FILE_PATH, htmlContent, 'utf-8');
      logMessage('INFO', `HTML written to ${HTML_FILE_PATH}`);
    } catch (error) {
      logMessage('ERROR', `Error writing HTML file:`, error);
    }
  }


  
    /**
     * Creates individual HTML files for each valid entry in the data array.
     * @param {Array<Object>} data - Array of valid data entries 
     */
    async function createIndividualHtmlFiles(data) {
    await ensureDirectoryExists(DIST_DIR);
    const goodQnA = await validateQnA(data);
    while(goodQnA) {
      
    const tasks = data.map(async (item) => {
      const filePath = path.join('./data', item.file);
      const content = await readJson(filePath);

      
      if(!validateEntry(content)){
        return false;
      } 
      
      /*
      if (!content ||typeof content !== 'object' || !content.questions) {
        logMessage('ERROR', `Skipping ${item.title} due to corrupt JSON file: ${filePath}`);
        return;
      }*/

      const questionsHtml = content.questions
      ? content.questions.map(q => {
        const answersHtml = Array.isArray(q.answers)
        ? q.answers.map(a => `<li>${a.answer} ${a.correct ? '(Correct)': ''}</li>`).join('')
        : '<li>No answer available</li>';
        return `
        <div>
          <h2>${q.question}</h2>
            <ul>
              ${answersHtml}
            </ul>
          </div>
          `;
      }).join('')
      : '';

      const htmlFilePath = path.join(DIST_DIR, item.file.replace('.json', '.html'));
      const htmlContent = `
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
        logMessage('ERROR', `Error writing HTML for ${item.title}: ${htmlFilePath}`, error);
      }
    });

    await Promise.all(tasks);
    }
  }


  /**
  * 1. Ensuring the output directory exists.
  * 2. Reads the index.json file and validates its content.
  * 3. Calls writeHtml to generate the index.html file.
  * 4. Calls createIndividualHtmlFiles to generate individual HTML files for each valid entry.
  */
  async function main() {
    logMessage('INFO', 'Starting program...');

    logMessage('INFO', `Ensuring output directory exists: ${DIST_DIR}`);
    await ensureDirectoryExists(DIST_DIR);

    const indexJson = await readJson(INDEX_PATH);
    if (!Array.isArray(indexJson)) {
      logMessage('ERROR', 'Invalid index.json content.');
      return;
    }
    
    const validEntries = indexJson.filter(validateEntry);
    const existingFiles = await filterExistingJsonFiles(validEntries);
    

    if (existingFiles.length === 0) {
      logMessage('ERROR', 'No valid entries found in index.json');
      return;
    }
    

    await writeHtml(existingFiles);
    
    //const sortedData = existingFiles.sort((a, b) => a.title.localeCompare(b.title));


    //await createIndividualHtmlFiles(sortedData);

    await createIndividualHtmlFiles(existingFiles);

    logMessage('INFO', 'Program completed successfully.');
  
  }
  main().catch((err) => {
    logMessage('ERROR', 'Error running program', err);
  });