// Script to download cryptocurrency logos from CoinGecko API
// This only needs to be run once to cache the logos locally

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGOS_DIR = path.join(__dirname, '..', 'public', 'crypto-logos');

// Popular cryptocurrencies to display
const CRYPTO_IDS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'ripple',
  'cardano',
  'solana',
  'polkadot',
  'dogecoin',
  'avalanche-2',
  'chainlink',
  'polygon',
  'litecoin'
];

// Ensure directory exists
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

// Function to download file from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        fileStream.on('error', reject);
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Fetch coin data from CoinGecko
function fetchCoinData(coinId) {
  return new Promise((resolve, reject) => {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`;
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function downloadAllLogos() {
  console.log('🚀 Starting cryptocurrency logo download...\n');
  
  for (const coinId of CRYPTO_IDS) {
    try {
      console.log(`Fetching ${coinId}...`);
      
      // Fetch coin data
      const coinData = await fetchCoinData(coinId);
      const imageUrl = coinData.image?.large || coinData.image?.small;
      
      if (!imageUrl) {
        console.log(`❌ No image found for ${coinId}`);
        continue;
      }
      
      // Download image
      const filename = `${coinId}.png`;
      const filepath = path.join(LOGOS_DIR, filename);
      
      await downloadImage(imageUrl, filepath);
      console.log(`✅ Downloaded ${filename}`);
      
      // Rate limiting - CoinGecko free tier allows ~10-30 calls/minute
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error downloading ${coinId}:`, error.message);
    }
  }
  
  console.log('\n✨ Download complete!');
  
  // Create manifest file
  const manifest = {
    cryptos: CRYPTO_IDS.map(id => ({
      id,
      logo: `/crypto-logos/${id}.png`
    })),
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(LOGOS_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('📝 Manifest created at public/crypto-logos/manifest.json');
}

downloadAllLogos().catch(console.error);
