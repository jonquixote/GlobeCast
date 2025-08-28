import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current TV stations file
const tvStationsPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
const tvStations = JSON.parse(fs.readFileSync(tvStationsPath, 'utf8'));

// Read the current radio stations file
const radioStationsPath = path.join(__dirname, '..', 'src', 'data', 'radioStations.json');
const radioStations = JSON.parse(fs.readFileSync(radioStationsPath, 'utf8'));

console.log(`TV Stations: ${tvStations.length}`);
console.log(`Radio Stations: ${radioStations.length}`);

// Analyze geographic distribution
const locationCount = {};

// Count stations by city
[...radioStations, ...tvStations].forEach(station => {
  let city;
  let lat, lon;
  
  if (station.geo_lat) {
    // Radio station
    city = station.state || 'Unknown';
    lat = parseFloat(station.geo_lat);
    lon = parseFloat(station.geo_long);
  } else {
    // TV station
    city = station.city || 'Unknown';
    lat = station.latitude;
    lon = station.longitude;
  }
  
  if (!locationCount[city]) {
    locationCount[city] = { count: 0, lat, lon };
  }
  locationCount[city].count++;
});

// Sort by count
const sortedLocations = Object.entries(locationCount)
  .sort((a, b) => b[1].count - a[1].count);

console.log('\n--- TOP LOCATIONS ---');
sortedLocations.slice(0, 20).forEach(([city, data]) => {
  console.log(`${city}: ${data.count} stations (${data.lat}, ${data.lon})`);
});

// Check for scattered stations
const scatteredStations = [...radioStations, ...tvStations].filter(station => {
  let lat, lon;
  if (station.geo_lat) {
    lat = parseFloat(station.geo_lat);
    lon = parseFloat(station.geo_long);
  } else {
    lat = station.latitude;
    lon = station.longitude;
  }
  
  // Look for stations outside major cities
  // This is a rough check - we're looking for stations that should be individual
  return lat && lon && (lat < 30 || lat > 50 || lon < -100 || lon > -70);
});

console.log(`\nScattered stations (outside major US cities): ${scatteredStations.length}`);

if (scatteredStations.length > 0) {
  console.log('\n--- SAMPLE SCATTERED STATIONS ---');
  scatteredStations.slice(0, 10).forEach(station => {
    if (station.geo_lat) {
      console.log(`Radio: ${station.name} in ${station.state} at ${station.geo_lat}, ${station.geo_long}`);
    } else {
      console.log(`TV: ${station.name} in ${station.city} at ${station.latitude}, ${station.longitude}`);
    }
  });
}

// Check for stations with unique coordinates
const uniqueCoords = new Set();
const stationsWithCoords = [...radioStations, ...tvStations].filter(station => {
  let lat, lon;
  if (station.geo_lat) {
    lat = parseFloat(station.geo_lat);
    lon = parseFloat(station.geo_long);
  } else {
    lat = station.latitude;
    lon = station.longitude;
  }
  
  if (lat && lon) {
    const coordKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (uniqueCoords.has(coordKey)) {
      return false;
    }
    uniqueCoords.add(coordKey);
    return true;
  }
  return false;
});

console.log(`\nStations with unique coordinates: ${stationsWithCoords.length}`);
console.log(`Total stations: ${radioStations.length + tvStations.length}`);
console.log(`Duplicate coordinates: ${radioStations.length + tvStations.length - stationsWithCoords.length}`);