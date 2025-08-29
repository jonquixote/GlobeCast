import fs from 'fs';
import path from 'path';

// Function to fix coordinates in a data file
function fixCoordinates(filePath) {
  console.log(`Fixing coordinates in ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let fixedCount = 0;
    
    data.forEach((station, index) => {
      const lat = parseFloat(station.geo_lat || station.latitude);
      const lon = parseFloat(station.geo_long || station.longitude);
      
      // Check if coordinates are valid numbers and in valid range
      if (
        isNaN(lat) || isNaN(lon) ||
        lat < -90 || lat > 90 || 
        lon < -180 || lon > 180 ||
        (lat === 0 && lon === 0) // Often placeholder values
      ) {
        // Skip fixing for now, just count
        fixedCount++;
        console.log(`Problematic coordinates at index ${index}: lat=${lat}, lon=${lon}`, station.name);
      }
    });
    
    console.log(`Found ${fixedCount} stations with invalid coordinates`);
    console.log('---');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

// Check the data files
fixCoordinates(path.join('src', 'data', 'tvStationsWithUrlsFixed.json'));
fixCoordinates(path.join('src', 'data', 'radioStationsFixed.json'));