

import fs from 'node:fs/promises';
import path from 'node:path';


const INDEX_PATH = './data/index.json'; 
const DIST_DIR = './dist'; // skráarslóðin sem við ætlum að skrifa í
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
 * @returns {Promise<Object | null>}les skrá úr `filepath` og skilar innihaldi.
 * Skilar `null` ef villa kom upp.
 */
async function readJson(filePath) {
  let data;
  try {
    console.log('reading file', filePath);
    data = await fs.readFile(path.resolve(filePath), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if(error.code === 'ENOENT') {
      console.error(`File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error parsing JSON in file ${filePath}: ${error.message}`);
    } else {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
    return null;
  }
}
  

  /**
   * Validates that an entry has a title and a file property.
    * @param {Object} entry
    * @returns {boolean} true if the entry is valid, otherwise false.
   */
  function validateEntry(entry) {
    if(entry && typeof entry === 'object') { 
      const { title, file } = entry;
      let isValid = true;
      // Check for valid title
      if (typeof title !== 'string' || title.trim() === '') {
        console.warn(`Invalid title for entry: ${JSON.stringify(entry)}`);
        isValid = false;
      }
      // Check for valid file path
      if (typeof file !== 'string' || file.trim() === '' || !file.endsWith('.json')) {
        console.warn(`Invalid file path for entry: ${JSON.stringify(entry)}`);
        isValid = false;
      }
      
      return isValid;
    }
    console.warn(`Entry is not a valid object: ${JSON.stringify(entry)}`);
    return false
  }

  async function filterExistingJsonFiles(data) {
    const filteredData = [];
    for (const entry of data) {
      const filePath = path.join('./data', entry.file);
      try {
        await fs.access(filePath);
        filteredData.push(entry);
      } catch (error) {
        console.warn(`Referenced JSON file not found: ${filePath}`);
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
      console.log(`HTML written to ${HTML_FILE_PATH}`);
    } catch (error) {
      console.error(`Error writing HTML file:`, error.message);
    }
  }

  /**
   * Generates individual HTML files for each entry in the data, displaying the content of the corresponding JSON file.
   * @param {*} data 
   */
  async function createIndividualHtmlFiles(data) {
    for (const item of data) {
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
      console.error('Error: index.json must contain an array of entries.');
      return;
    }
    
    const validEntries = indexJson.filter(validateEntry);
    const existingFiles = await filterExistingJsonFiles(validEntries);
    if (existingFiles.length === 0) {
      console.error('No valid data found in index.json');
      return;
    }
    

    await writeHtml(existingFiles);
    await createIndividualHtmlFiles(existingFiles);

    console.log('Program completed successfully.');
   
  }
  main().catch((err) => {
    console.error('Error running program:', err);
  });