import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current TV stations file
const tvStationsPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
const tvStations = JSON.parse(fs.readFileSync(tvStationsPath, 'utf8'));

// Add sample URLs to all stations
const stationsWithUrls = tvStations.map((station, index) => {
  // Generate a sample HLS stream URL
  const url = `https://sample-streams.com/hls/tv-${index}.m3u8`;
  
  return {
    ...station,
    url: url
  };
});

// Write to new file
const outputPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
fs.writeFileSync(outputPath, JSON.stringify(stationsWithUrls, null, 2));

console.log(`Updated ${stationsWithUrls.length} stations with sample URLs`);