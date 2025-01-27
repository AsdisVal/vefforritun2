

import fs from 'node:fs/promises';
import path from 'node:path';


const INDEX_PATH = './data/index.json'; 
const DIST_DIR = './dist'; // skráar slóðin sem við ætlum að skrifa í
const HTML_FILE_PATH = path.join(DIST_DIR, 'index.html');

/**
 * Ensure that a directory exists, creating it if necessary.
 * @param {*} directory 
 */
async function ensureDirectoryExists(directory) {
  console.log('Ensuring directory exists:', directory);
  try {
    await fs.mkdir(directory, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${directory}:`, error.message);
  }
}


/**
 * 
 * Les skrá og skilar gögnum eða null.
 * @param {string} filePath skráin sem á að lesa
 *  
 * @returns {Promise<unknown | null>}les skrá úr `filepath` og skilar innihaldi.
 * Skilar `null` ef villa kom upp.
 */
async function readJson(filePath) {
   
    console.log('starting to read', filePath);
    let data;
    try {
      console.log('reading file', filePath);
      data = await fs.readFile(path.resolve(filePath), 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      return null;
    }
  }
  

/**
 * Skrifar forsíðu HTML með tenglum á aðrar síður
 * @param {any} data 
 * @returns {Promise<void>} skrifar gögn í index.html
 */
async function writeHtml(data) {
    if (!Array.isArray(data)) {
    console.error('Invalid data format, expected an array.');
    return;
    }

    await ensureDirectoryExists(DIST_DIR);
    const html = data
    .map((item) => {
      if (item.file && item.title) {
        const link = item.file.replace('.json', '.html');
        return `<li><a href="${link}">${item.title}</a></li>`;
      } 
      console.warn('Invalid data item:', item);
      return '';
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
      console.log(`HTML written to ${HTML_FILE_PATH}`);
    } catch (error) {
      console.error(`Error writing HTML file:`, error.message);
    }
  }

  /**
   * Validates that an entry has a title and a file property.
    * @param {*} entry
    * @returns {boolean} true if the entry is valid, otherwise false.
   */
  function validateEntry(entry) {
    if(entry && typeof entry === 'object') { 
      const { title, file } = entry;
      let isValid = true;
      if (typeof title !== 'string' || title.trim() === '') {
        console.warn(`Invalid title for entry: ${JSON.stringify(entry)}`);
        isValid = false;
      }
      if (typeof file !== 'string' || file.trim() === '' || !file.endsWith('.json')) {
        console.warn(`Invalid file path for entry: ${JSON.stringify(entry)}`);
        isValid = false;
      }
      return isValid;
    }
    console.warn(`Entry is not a valid object: ${JSON.stringify(entry)}`);
    return false
  }

  /**
   * Generates individual HTML files for each entry in the data, displaying the content of the corresponding JSON file.
   * @param {*} data 
   */
  async function createIndividualHtmlFiles(data) {
    for (const item of data) {
      if (!validateEntry(item)) {
        console.warn('Skipping invalid entry:', item);
        continue;
      }
  
      const filePath = path.join('./data', item.file);
      const content = await readJson(filePath);
  
      if (!content) {
        console.warn(`Skipping ${item.title} due to invalid or missing JSON content.`);
        continue;
      }
  
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
          <pre>${JSON.stringify(content, null, 2)}</pre>
        </body>
        </html>
      `;
  
      try {
        await fs.writeFile(htmlFilePath, htmlContent, 'utf-8');
        console.log(`Generated HTML for ${item.title}: ${htmlFilePath}`);
      } catch (error) {
        console.error(`Error writing HTML for ${item.title}:`, error.message);
      }
    }
  }



/**
 * 1. Ensuring the output directory exists.
 * 2. Reads the index.json file and validates its content.
 * 3. Calls writeHtml to generate the index.html file.
 * 4. Calls createIndividualHtmlFiles to generate individual HTML files for each valid entry.
 */
async function main() {

    console.log('Starting program...');
    await ensureDirectoryExists(DIST_DIR);

    const indexJson = await readJson(INDEX_PATH);
    if (!Array.isArray(indexJson)) {
      console.error('Error reading index.json');
      return;
    }
    
    const validData = indexJson.filter(validateEntry);
    if (validData.length === 0) {
      console.error('No valid data found in index.json');
      return;
    }

    await writeHtml(validData);
    await createIndividualHtmlFiles(validData);

    console.log('Program completed successfully.');
   
  }

  main().catch((error) => {
    console.error('An unexpected error occurred:', error);
  });