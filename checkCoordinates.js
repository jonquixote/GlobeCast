import fs from 'fs';
import path from 'path';

// Function to check for invalid coordinates
function checkCoordinates(filePath) {
  console.log(`Checking coordinates in ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let invalidCount = 0;
    let validCount = 0;
    
    data.forEach((station, index) => {
      const lat = parseFloat(station.geo_lat || station.latitude);
      const lon = parseFloat(station.geo_long || station.longitude);
      
      // Check if coordinates are valid numbers
      if (isNaN(lat) || isNaN(lon)) {
        console.log(`Invalid coordinates at index ${index}:`, station);
        invalidCount++;
        return;
      }
      
      // Check if coordinates are in valid range
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.log(`Out of range coordinates at index ${index}: lat=${lat}, lon=${lon}`, station);
        invalidCount++;
        return;
      }
      
      validCount++;
    });
    
    console.log(`Valid stations: ${validCount}`);
    console.log(`Invalid stations: ${invalidCount}`);
    console.log('---');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

// Check both data files
checkCoordinates(path.join('src', 'data', 'tvStationsWithUrls.json'));
checkCoordinates(path.join('src', 'data', 'tvStationsWithUrlsFixed.json'));
checkCoordinates(path.join('src', 'data', 'radioStationsFixed.json'));