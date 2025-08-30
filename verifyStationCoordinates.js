import fs from 'fs';

// Function to verify station coordinates
function verifyCoordinates(filePath) {
  console.log(`Verifying coordinates in ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let validCount = 0;
    let invalidCount = 0;
    let placeholderCount = 0;
    let atlanticCount = 0;
    
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
    
    data.forEach((station, index) => {
      const lat = parseFloat(station.geo_lat);
      const lon = parseFloat(station.geo_long);
      
      // Check if coordinates are valid numbers
      if (isNaN(lat) || isNaN(lon)) {
        console.log(`Invalid coordinates (NaN) at index ${index}: ${station.name}`);
        invalidCount++;
        return;
      }
      
      // Check if coordinates are in valid range
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.log(`Out of range coordinates at index ${index}: ${station.name} (${lat}, ${lon})`);
        invalidCount++;
        return;
      }
      
      // Check for placeholder coordinates
      const isPlaceholder = placeholders.some(([pLat, pLon]) => lat === pLat && lon === pLon);
      if (isPlaceholder) {
        console.log(`Placeholder coordinates at index ${index}: ${station.name} (${lat}, ${lon})`);
        placeholderCount++;
        return;
      }
      
      // Check for coordinates near the Atlantic Ocean (near 0,0)
      if (Math.abs(lat) < 5 && Math.abs(lon) < 5) {
        console.log(`Near Atlantic Ocean at index ${index}: ${station.name} (${lat}, ${lon})`);
        atlanticCount++;
      }
      
      validCount++;
    });
    
    console.log(`Total stations: ${data.length}`);
    console.log(`Valid stations: ${validCount}`);
    console.log(`Invalid stations: ${invalidCount}`);
    console.log(`Placeholder stations: ${placeholderCount}`);
    console.log(`Near Atlantic Ocean: ${atlanticCount}`);
    console.log('---');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

// Verify both data files
verifyCoordinates('./src/data/tvStationsWithUrls.json');
verifyCoordinates('./src/data/radioStations.json');