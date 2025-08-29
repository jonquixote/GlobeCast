import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to find stations with suspicious coordinates
function findGridStations(filePath) {
  console.log(`Checking for grid pattern stations in ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let gridStations = [];
    let atlanticStations = [];
    
    data.forEach((station, index) => {
      const lat = parseFloat(station.geo_lat);
      const lon = parseFloat(station.geo_long);
      
      // Check for grid pattern coordinates (commonly used as placeholders)
      // These are often at regular intervals like 40, 42, 44, etc. for latitude
      // and -100, -98, -96, etc. for longitude
      const isGridPattern = 
        (Math.abs(lat - Math.round(lat)) < 0.1 && Math.abs(lon - Math.round(lon)) < 0.1) &&
        (lat >= 20 && lat <= 70) && 
        (lon >= -130 && lon <= -60);
      
      // Check for Atlantic Ocean coordinates (near 0,0)
      const isAtlantic = (Math.abs(lat) < 10 && Math.abs(lon) < 10);
      
      if (isGridPattern) {
        gridStations.push({
          index,
          name: station.name,
          id: station.id,
          lat,
          lon,
          country: station.country,
          city: station.city
        });
      }
      
      if (isAtlantic) {
        atlanticStations.push({
          index,
          name: station.name,
          id: station.id,
          lat,
          lon,
          country: station.country,
          city: station.city
        });
      }
    });
    
    console.log(`
Grid pattern stations found: ${gridStations.length}`);
    if (gridStations.length > 0) {
      console.log('Grid stations:');
      gridStations.slice(0, 20).forEach(station => {
        console.log(`  ${station.name} (${station.lat}, ${station.lon}) - ${station.city}, ${station.country}`);
      });
      if (gridStations.length > 20) {
        console.log(`  ... and ${gridStations.length - 20} more`);
      }
    }
    
    console.log(`
Atlantic Ocean stations found: ${atlanticStations.length}`);
    if (atlanticStations.length > 0) {
      console.log('Atlantic stations:');
      atlanticStations.slice(0, 20).forEach(station => {
        console.log(`  ${station.name} (${station.lat}, ${station.lon}) - ${station.city}, ${station.country}`);
      });
      if (atlanticStations.length > 20) {
        console.log(`  ... and ${atlanticStations.length - 20} more`);
      }
    }
    
    console.log('---');
    return { gridStations, atlanticStations };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

// Check both data files
const tvStationsPath = join(__dirname, 'tvStationsWithUrls.json');
const radioStationsPath = join(__dirname, 'radioStations.json');

findGridStations(tvStationsPath);
findGridStations(radioStationsPath);