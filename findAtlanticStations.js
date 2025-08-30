import fs from 'fs';

// Function to check for stations in the Atlantic Ocean
function findAtlanticStations(filePath) {
  console.log(`Checking for Atlantic Ocean stations in ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let atlanticCount = 0;
    
    data.forEach((station, index) => {
      const lat = parseFloat(station.geo_lat);
      const lon = parseFloat(station.geo_long);
      
      // Check for common placeholder coordinates
      if (
        (lat === 0 && lon === 0) ||
        (lat === 40 && lon === -100) ||
        (lat === 42 && lon === -100) ||
        (lat === 12.4989994 && lon === 124.6746741) ||
        (lat === 40 && lon === -98) ||
        (lat === 42 && lon === -98) ||
        (lat === 44 && lon === -98) ||
        (lat === 46 && lon === -98) ||
        (lat === 48 && lon === -98) ||
        (lat === 50 && lon === -98) ||
        (lat === 52 && lon === -98) ||
        (lat === 54 && lon === -98) ||
        (lat === 56 && lon === -98) ||
        (lat === 58 && lon === -98) ||
        // Check for coordinates near the Atlantic Ocean
        (Math.abs(lat) < 5 && Math.abs(lon) < 5)
      ) {
        console.log(`Station in Atlantic Ocean at index ${index}: ${station.name} (${lat}, ${lon})`);
        atlanticCount++;
      }
    });
    
    console.log(`Stations in Atlantic Ocean: ${atlanticCount}`);
    console.log('---');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

// Check both data files
findAtlanticStations('./src/data/tvStationsWithUrls.json');
findAtlanticStations('./src/data/radioStations.json');