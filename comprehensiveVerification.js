import fs from 'fs';

// Function to check for stations with invalid or placeholder coordinates
function checkForInvalidStations(filePath) {
  console.log(`Checking for invalid stations in ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let invalidCount = 0;
    let placeholderCount = 0;
    let atlanticCount = 0;
    let validCount = 0;
    
    // Common placeholder coordinates
    const placeholders = [
      [0, 0],
      [40, -100],
      [42, -100],
      [12.4989994, 124.6746741],
      [40, -98],
      [42, -98],
      [44, -98],
      [46, -98],
      [48, -98],
      [50, -98],
      [52, -98],
      [54, -98],
      [56, -98],
      [58, -98]
    ];
    
    console.log(`Total stations in file: ${data.length}`);
    
    data.forEach((station, index) => {
      const lat = parseFloat(station.geo_lat);
      const lon = parseFloat(station.geo_long);
      
      // Check if coordinates are valid numbers
      if (isNaN(lat) || isNaN(lon)) {
        console.log(`INVALID (NaN): Index ${index} - ${station.name || station.id}`);
        invalidCount++;
        return;
      }
      
      // Check if coordinates are in valid range
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.log(`INVALID (Out of range): Index ${index} - ${station.name || station.id} (${lat}, ${lon})`);
        invalidCount++;
        return;
      }
      
      // Check for placeholder coordinates
      const isPlaceholder = placeholders.some(([pLat, pLon]) => 
        Math.abs(lat - pLat) < 0.0001 && Math.abs(lon - pLon) < 0.0001);
      if (isPlaceholder) {
        console.log(`PLACEHOLDER: Index ${index} - ${station.name || station.id} (${lat}, ${lon})`);
        placeholderCount++;
        return;
      }
      
      // Check for coordinates near the Atlantic Ocean (near 0,0)
      if (Math.abs(lat) < 5 && Math.abs(lon) < 5) {
        console.log(`NEAR ATLANTIC: Index ${index} - ${station.name || station.id} (${lat}, ${lon})`);
        atlanticCount++;
      }
      
      validCount++;
    });
    
    console.log(`\nSummary for ${filePath}:`);
    console.log(`  Valid stations: ${validCount}`);
    console.log(`  Invalid stations: ${invalidCount}`);
    console.log(`  Placeholder stations: ${placeholderCount}`);
    console.log(`  Near Atlantic Ocean: ${atlanticCount}`);
    console.log('---\n');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

// Check all relevant data files
console.log('=== STATION COORDINATE VERIFICATION REPORT ===\n');

checkForInvalidStations('./src/data/tvStationsWithUrls.json');
checkForInvalidStations('./src/data/radioStations.json');
checkForInvalidStations('./tv_stations_with_coords.json');
checkForInvalidStations('./radio_stations_with_coords.json');

console.log('=== END OF REPORT ===');