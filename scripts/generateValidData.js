import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to add small random variations to coordinates
function addCoordinateVariation(lat, lon, maxVariation = 0.1) {
  // Add up to maxVariation degrees of variation (roughly 11km at equator)
  const latVariation = (Math.random() - 0.5) * maxVariation * 2;
  const lonVariation = (Math.random() - 0.5) * maxVariation * 2;
  return {
    lat: lat + latVariation,
    lon: lon + lonVariation
  };
}

// Generate more realistic radio stations with varied coordinates
const realisticRadioStations = [];
let radioId = 1;

// Major cities with their base coordinates
const majorCities = [
  { name: 'New York', country: 'United States', countrycode: 'US', lat: 40.7127281, lon: -74.0060152 },
  { name: 'Los Angeles', country: 'United States', countrycode: 'US', lat: 34.0536909, lon: -118.242766 },
  { name: 'Chicago', country: 'United States', countrycode: 'US', lat: 41.8755616, lon: -87.6244212 },
  { name: 'Houston', country: 'United States', countrycode: 'US', lat: 29.7589382, lon: -95.3676974 },
  { name: 'Phoenix', country: 'United States', countrycode: 'US', lat: 33.4484367, lon: -112.074141 },
  { name: 'Philadelphia', country: 'United States', countrycode: 'US', lat: 39.9527237, lon: -75.1635262 },
  { name: 'San Antonio', country: 'United States', countrycode: 'US', lat: 29.4246002, lon: -98.4951405 },
  { name: 'San Diego', country: 'United States', countrycode: 'US', lat: 32.7174202, lon: -117.162772 },
  { name: 'Dallas', country: 'United States', countrycode: 'US', lat: 32.7762719, lon: -96.7968559 },
  { name: 'San Jose', country: 'United States', countrycode: 'US', lat: 37.3361663, lon: -121.890591 },
  { name: 'London', country: 'United Kingdom', countrycode: 'GB', lat: 51.4893335, lon: -0.1440551 },
  { name: 'Birmingham', country: 'United Kingdom', countrycode: 'GB', lat: 52.4796992, lon: -1.9026911 },
  { name: 'Leeds', country: 'United Kingdom', countrycode: 'GB', lat: 53.7974185, lon: -1.5437941 },
  { name: 'Glasgow', country: 'United Kingdom', countrycode: 'GB', lat: 55.861155, lon: -4.2501687 },
  { name: 'Sheffield', country: 'United Kingdom', countrycode: 'GB', lat: 53.3806626, lon: -1.4702278 },
  { name: 'Bradford', country: 'United Kingdom', countrycode: 'GB', lat: 53.7944229, lon: -1.7519186 },
  { name: 'Liverpool', country: 'United Kingdom', countrycode: 'GB', lat: 53.4071991, lon: -2.99168 },
  { name: 'Manchester', country: 'United Kingdom', countrycode: 'GB', lat: 53.4794892, lon: -2.2451148 },
  { name: 'Bristol', country: 'United Kingdom', countrycode: 'GB', lat: 51.4538022, lon: -2.5972985 },
  { name: 'Wakefield', country: 'United Kingdom', countrycode: 'GB', lat: 53.6829541, lon: -1.4967286 }
];

// List of real or valid test streaming URLs
const validStreamUrls = [
  // Real public radio streams
  'https://icecast.omroep.nl/radio1-bb-mp3',
  'https://stream.srg-ssr.ch/m/rsj/mp3_128',
  'https://streaming.live365.com/a49350',
  'https://ais-sa2.cdnstream1.com/1992_128.mp3',
  'https://stream.zeno.fm/0r0xa792kwzuv',
  'https://stream.zeno.fm/065rs502kwzuv',
  'https://stream.zeno.fm/03qk3kq0xwzuv',
  // Valid test URLs that won't cause DNS errors
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // HLS test stream
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // MP4 test file
  // Localhost test URLs (will fail but won't cause DNS errors)
  'http://localhost:8080/stream.mp3',
  'http://127.0.0.1:8080/stream.mp3'
];

// Generate 1000 radio stations with varied coordinates and valid URLs
for (let i = 0; i < 1000; i++) {
  const city = majorCities[Math.floor(Math.random() * majorCities.length)];
  const variedCoords = addCoordinateVariation(city.lat, city.lon, 0.05); // Small variation within city
  const streamUrl = validStreamUrls[Math.floor(Math.random() * validStreamUrls.length)];
  
  const station = {
    "stationuuid": `station-${radioId}`,
    "name": `${city.name} Radio ${i + 1}`,
    "url": streamUrl,
    "homepage": `http://www.${city.name.toLowerCase().replace(/\s+/g, '')}radio${i + 1}.com`,
    "favicon": `http://www.${city.name.toLowerCase().replace(/\s+/g, '')}radio${i + 1}.com/favicon.ico`,
    "country": city.country,
    "countrycode": city.countrycode,
    "state": city.name,
    "language": "English",
    "tags": "pop,rock,music",
    "codec": "MP3",
    "bitrate": Math.floor(Math.random() * 320) + 64,
    "geo_lat": variedCoords.lat,
    "geo_long": variedCoords.lon,
    "votes": Math.floor(Math.random() * 1000),
    "clickcount": Math.floor(Math.random() * 10000),
    "lastcheckok": 1,
    "type": "radio"
  };
  
  realisticRadioStations.push(station);
  radioId++;
}

// Write to file
const radioOutputPath = path.join(__dirname, '..', 'src', 'data', 'radioStations.json');
fs.writeFileSync(radioOutputPath, JSON.stringify(realisticRadioStations, null, 2));

console.log(`Generated ${realisticRadioStations.length} radio stations with valid URLs`);

// Generate more realistic TV stations with varied coordinates
const realisticTVStations = [];
let tvId = 1;

// Generate 1000 TV stations with varied coordinates
for (let i = 0; i < 1000; i++) {
  const city = majorCities[Math.floor(Math.random() * majorCities.length)];
  const variedCoords = addCoordinateVariation(city.lat, city.lon, 0.05); // Small variation within city
  const streamUrl = validStreamUrls[Math.floor(Math.random() * validStreamUrls.length)];
  
  const station = {
    "id": `tv-${tvId}`,
    "name": `${city.name} TV ${i + 1}`,
    "city": city.name,
    "country": city.country,
    "latitude": variedCoords.lat,
    "longitude": variedCoords.lon,
    "categories": "general",
    "url": streamUrl
  };
  
  realisticTVStations.push(station);
  tvId++;
}

// Write to file
const tvOutputPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
fs.writeFileSync(tvOutputPath, JSON.stringify(realisticTVStations, null, 2));

console.log(`Generated ${realisticTVStations.length} TV stations with valid URLs`);

// Also generate the tvStationsWithUrls.json file
const tvStationsWithUrls = realisticTVStations.map((station, index) => {
  return {
    ...station,
    url: validStreamUrls[Math.floor(Math.random() * validStreamUrls.length)]
  };
});

const tvWithUrlsOutputPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
fs.writeFileSync(tvWithUrlsOutputPath, JSON.stringify(tvStationsWithUrls, null, 2));

console.log(`Generated ${tvStationsWithUrls.length} TV stations with URLs`);