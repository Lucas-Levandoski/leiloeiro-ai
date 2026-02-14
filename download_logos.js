
const https = require('https');
const fs = require('fs');
const path = require('path');

const banks = [
  { name: 'bradesco', url: 'https://commons.wikimedia.org/wiki/File:Banco_Bradesco_logo.svg' },
  { name: 'caixa', url: 'https://commons.wikimedia.org/wiki/File:Caixa_Econ%C3%B4mica_Federal_logo_1997.svg' },
  { name: 'santander', url: 'https://commons.wikimedia.org/wiki/File:Banco_Santander_Logotipo.svg' },
  { name: 'bancodobrasil', url: 'https://commons.wikimedia.org/wiki/File:Banco_do_Brasil_logo.svg' },
  { name: 'itau', url: 'https://commons.wikimedia.org/wiki/File:Ita%C3%BA_Unibanco_logo_2023.svg' },
  { name: 'safra', url: 'https://commons.wikimedia.org/wiki/File:Banco_Safra_logo.svg' },
  { name: 'btg', url: 'https://commons.wikimedia.org/wiki/File:BTG_Pactual_logo.svg' }
];

const downloadDir = path.join(__dirname, 'public', 'images', 'banks');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

function getOriginalFileUrl(pageUrl) {
  return new Promise((resolve, reject) => {
    https.get(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // Look for the "Original file" link
        const match = data.match(/href="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)" class="internal"/);
        if (match) {
          resolve(match[1]);
        } else {
            // Try another pattern
            const match2 = data.match(/href="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"/);
             if (match2 && match2[1].endsWith('.svg')) {
                 resolve(match2[1]);
             } else {
                 resolve(null);
             }
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
            if (response.headers.location) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
        }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function processBanks() {
  for (const bank of banks) {
    console.log(`Processing ${bank.name}...`);
    try {
      const originalUrl = await getOriginalFileUrl(bank.url);
      if (originalUrl) {
        console.log(`Found URL for ${bank.name}: ${originalUrl}`);
        await downloadFile(originalUrl, path.join(downloadDir, `${bank.name}.svg`));
        console.log(`Downloaded ${bank.name}.svg`);
      } else {
        console.error(`Could not find original file URL for ${bank.name}`);
      }
    } catch (error) {
      console.error(`Error processing ${bank.name}:`, error);
    }
  }
}

processBanks();
