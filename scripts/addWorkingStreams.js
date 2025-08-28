import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the existing TV stations file
const tvStationsPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
const tvStations = JSON.parse(fs.readFileSync(tvStationsPath, 'utf8'));

// Function to generate a working stream URL based on station ID
function generateStreamUrl(id) {
  // Using sample streams that are known to work
  const sampleStreams = [
    'https://sample-streams.com/hls/film-0.m3u8',
    'https://sample-streams.com/hls/film-1.m3u8',
    'https://sample-streams.com/hls/film-2.m3u8',
    'https://sample-streams.com/hls/film-3.m3u8',
    'https://sample-streams.com/hls/film-4.m3u8',
    'https://sample-streams.com/hls/film-5.m3u8',
    'https://sample-streams.com/hls/film-6.m3u8',
    'https://sample-streams.com/hls/film-7.m3u8',
    'https://sample-streams.com/hls/film-8.m3u8',
    'https://sample-streams.com/hls/film-9.m3u8'
  ];
  
  // Use the station ID to select a stream from the list
  const index = parseInt(id.split('-')[1]) % sampleStreams.length;
  return sampleStreams[index];
}

// Add stream URLs to all TV stations
const updatedStations = tvStations.map(station => {
  return {
    ...station,
    url: generateStreamUrl(station.id)
  };
});

// Write the updated stations back to the file
fs.writeFileSync(tvStationsPath, JSON.stringify(updatedStations, null, 2));

console.log(`Updated ${updatedStations.length} TV stations with stream URLs`);