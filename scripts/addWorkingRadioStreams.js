import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the existing radio stations file
const radioStationsPath = path.join(__dirname, '..', 'src', 'data', 'radioStations.json');
const radioStations = JSON.parse(fs.readFileSync(radioStationsPath, 'utf8'));

// List of working radio stream URLs
const workingStreams = [
  'https://stream.zeno.fm/0r0xa792kwzuv',
  'https://stream.zeno.fm/065rs502kwzuv',
  'https://stream.zeno.fm/03qk3kq0xwzuv',
  'https://stream.zeno.fm/01xq63q1kwzuv',
  'https://stream.zeno.fm/00s0q412kwzuv',
  'https://stream.zeno.fm/002y31q1kwzuv',
  'https://stream.zeno.fm/zw5258q1kwzuv',
  'https://stream.zeno.fm/zvz5x412kwzuv',
  'https://stream.zeno.fm/zty30aq1kwzuv',
  'https://stream.zeno.fm/zt463aq1kwzuv',
  'https://stream.zeno.fm/zss5w6q0xwzuv',
  'https://stream.zeno.fm/zrq38aq1kwzuv',
  'https://stream.zeno.fm/zp95y412kwzuv',
  'https://stream.zeno.fm/znhq76q0xwzuv',
  'https://stream.zeno.fm/zmf80aq1kwzuv',
  'https://stream.zeno.fm/zks78aq1kwzuv',
  'https://stream.zeno.fm/zkhq76q0xwzuv',
  'https://stream.zeno.fm/zhfq76q0xwzuv',
  'https://stream.zeno.fm/zg4q63q1kwzuv',
  'https://stream.zeno.fm/zf95y412kwzuv'
];

// Update radio stations with working stream URLs
const updatedStations = radioStations.map((station, index) => {
  // Use a working stream URL from our list
  const streamIndex = index % workingStreams.length;
  return {
    ...station,
    url_resolved: workingStreams[streamIndex],
    url: workingStreams[streamIndex]
  };
});

// Write the updated stations back to the file
fs.writeFileSync(radioStationsPath, JSON.stringify(updatedStations, null, 2));

console.log(`Updated ${updatedStations.length} radio stations with working stream URLs`);