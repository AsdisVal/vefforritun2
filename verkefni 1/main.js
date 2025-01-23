import { write } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { stringify } from 'node:querystring';

const INDEX_PATH = './data/index.json';
const DIST_FOLDER = './dist';

/**
 * 
 * @param {string} filePath skráin sem á að lesa og skilar gögnum eða null.
 *  
 * @returns {Promise<unknown | null>}les skrá úr filepath og skilar innihaldi.
 * Skilar null ef ekki tekst að lesa skrá
 */
async function readJson(filePath) {
    //bíða eftir harða disknum að lesa skrána
    //erum að búa til loforð
    let data;
    console.log('starting to read', filePath);
  try {
    const data = await fs.readFile(path.resolve(filePath), 'utf-8');
    return JSON.parse(data);
    
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }

  try{
    const parsed = JSON.parse(data); 
    return JSON.parse(data);
  }catch (error) {
    console.error(`Error parsing data as json`);
    return null;
  }
}

async function createFolder(folderPath) {

    try {
        await fs.mkdir(folderPath);
        console.log(`Created folder ${folderPath}`);
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(`Error creating folder ${folderPath}:`, error.message);
        }
    }

}


/**
 * 
 * @param {unknown} data
 * @returns{Array<title: string; file: string;> | null} 
 * 
 */
function parseIndexJson(data) {
    if (typeof data !== 'string') {
    return data;
    }
    return null;
}

/** 
 *Keyrir forritið okkar: 
 * 1. Sækir gögn
 * 2. Staðfestir að gögn séu í réttu formatti
 *  
*/
async function main() {
    console.log('Starting program...');

    // Búa til dist-möppuna ef hún er ekki til
    await createFolder(DIST_FOLDER);
    

    const indexJson = await readJson(INDEX_PATH);

    const indexData = parseIndexJson(indexJson);
    writeHtml(indexData);
    

    /*
  if (!Array.isArray(indexData)) {
    console.error('index.json is not an array. Check the file format.');
    return [];
  }

  // Read other JSON files listed in index.json
  const allData = await Promise.all(
    indexData.map(async (item) => {
      const filePath = `./data/${item.file}`;
      const fileData = await readJson(filePath);
      
      if(!fileData) {
        console.warn(`Skipping corrupt or unreadable file: ${filePath}`);
        return null;
      }

      return fileData ? { ...item, content: fileData } : null;
    }),
  );

*/

/**
 * Notkun: writehtml
 * Fyrir: data er strengur með html
 * eftir: skrifar data í index.html
 * @param {*} data gögn til að skrifa
 * @returns {Promise<void>} skrifar gögn í index.html
 */
async function writeHtml(data) {
    const htmlFilePath = 'index.html';
    const htmlContent = '<html><h1>halló heimur</h1></html>';

    fs.writeFile(htmlFilePath, htmlContent, 'utf-8');
    
}
}

main();