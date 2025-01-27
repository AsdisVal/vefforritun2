import fs from 'node:fs/promises';
import path from 'node:path';


const INDEX_PATH = './data/index.json';
//const DIST_FOLDER = './dist';

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
      data = await fs.readFile(path.resolve(filePath), 'utf-8');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      return null;
    }
    try {
      const parsed = JSON.parse(data); 
      return parsed;
    } catch (error) {
      console.error('Error parsing data as json');
      return null;
    }
  }
  /*
  async function createFolder(folderPath) {

    try {
        await fs.mkdir(folderPath);
        console.log(`Created folder ${folderPath}`);
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(`Error creating folder ${folderPath}:`, error.message);
        }
    }

}*/



/**
 * NOTKUN: writeHtml(data)
 * FYRIR: data er strengur með html
 * EFTIR: skrifar data í index.html
 * @param {any} data 
 * @returns {Promise<void>} skrifar gögn í index.html
 */
async function writeHtml(data) {
    const htmlFilePath = 'dist/index.html';

    const html = data.map((item) => `<li>${item.title}</li>`).join('\n');

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

    fs.writeFile(htmlFilePath, htmlContent, 'utf-8');
}


/**
 * 
 * Það tekur inn data og skilar string
 * @param {unknown} data
 * @returns{any} skilar data sem streng en for now: any
 * 
 */

function parseIndexJson(data) {
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
    
    // Búa til dist-möppuna ef hún er ekki til
    /*
    await createFolder(DIST_FOLDER);
    */

    const indexJson = await readJson(INDEX_PATH);
    
    const indexData = parseIndexJson(indexJson);
   
    writeHtml(indexData);
    
   console.log(indexData);

   
   

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
/*
async function writeHtml(data) {
    const htmlFilePath = 'index.html';
    const htmlContent = '<html><h1>halló heimur</h1></html>';

    fs.writeFile(htmlFilePath, htmlContent, 'utf-8');
    
}*/

}

main();