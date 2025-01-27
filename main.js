
import fs from 'node:fs/promises';
import path from 'node:path';


const INDEX_PATH = './data/index.json';
const DIST_DIR = './dist';
const HTML_FILE_PATH = path.join(DIST_DIR, 'index.html');

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
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      return null;
    }
    try {
      const parsed = JSON.parse(data); 
      console.log('data parsed');
      return parsed;
    } catch (error) {
      console.error('Error parsing data as json');
      return null;
    }
  }
  



/**
 * Skrifar forsíðu HTML með tenglum á aðrar síður
 * @param {any} data 
 * @returns {Promise<void>} skrifar gögn í index.html
 */
async function writeHtml(data) {
    console.log('Starting to write HTML file...');
    if (!Array.isArray(data)) {
    console.error('Invalid data format, expected an array.');
    return;
    }

    await ensureDirectoryExists(DIST_DIR);
    const html = data
    .map((item) => {
      if (item.file) {
        return `<li><a href="${item.file.replace('.json', '.html')}">${item.title}</a></li>`;
      } else {
        console.warn('Item missing file property:', item);
        return '';
      }
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
 * 
 * Það tekur inn data og skilar string
 * @param {unknown} data
 * @returns{Array<{ title: string }>} skilar data sem streng en for now: any
 * 
 */

function parseIndexJson(data) {
  if (!Array.isArray(data)) {
    console.error('Invalid JSON data. Expected an array.');
    return [];
  }
  return data;
}


/** 
 *Keyrir forritið okkar: 
 * 1. Sækir gögn
 * 2. Staðfestir gögn (validation)
 * 3. Skrifar út HTML
 *  
*/
async function main() {

    console.log('Starting program...');
    await ensureDirectoryExists(DIST_DIR);
    const indexJson = await readJson(INDEX_PATH);
    if (!indexJson) {
      console.error('Error reading index.json');
      return;
    }
    
    const indexData = parseIndexJson(indexJson);
    if (indexData.length === 0) {
      console.error('No valid data in index.json');
      return;
    }
    
    await writeHtml(indexData);

    console.log('Program completed successfully.');
    console.log(indexData);
  }

  main().catch((error) => {
    console.error('An unexpected error occurred:', error);
  });