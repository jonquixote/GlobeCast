import fs from 'fs';
import path from 'path';

// Function to fix coordinates in a data file
async function fixCoordinates(filePath) {
  console.log(`Fixing coordinates in ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let fixedCount = 0;
    let removedCount = 0;
    
    // Filter out stations with invalid coordinates
    const filteredData = data.filter((station, index) => {
      const lat = parseFloat(station.geo_lat || station.latitude);
      const lon = parseFloat(station.geo_long || station.longitude);
      
      // Check if coordinates are valid numbers and in valid range
      if (
        isNaN(lat) || isNaN(lon) ||
        lat < -90 || lat > 90 || 
        lon < -180 || lon > 180 ||
        // These are often placeholder values that should be removed
        (lat === 0 && lon === 0) ||
        (Math.abs(lat) === 90 && lon === 0) // North/South pole placeholders
      ) {
        console.log(`Removing station with invalid coordinates: ${station.name || station.id} (${lat}, ${lon})`);
        removedCount++;
        return false;
      }
      
      // Fix the station data to use consistent field names
      if (station.geo_lat !== undefined) {
        station.latitude = station.geo_lat;
        delete station.geo_lat;
      }
      
      if (station.geo_long !== undefined) {
        station.longitude = station.geo_long;
        delete station.geo_long;
      }
      
      // Ensure coordinates are proper numbers
      station.latitude = parseFloat(station.latitude);
      station.longitude = parseFloat(station.longitude);
      
      return true;
    });
    
    console.log(`Removed ${removedCount} stations with invalid coordinates`);
    console.log(`Kept ${filteredData.length} stations with valid coordinates`);
    
    // Write the fixed data back to file
    fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
    console.log(`Successfully updated ${filePath}`);
    console.log('---');
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Fix both data files
async function fixAllStationCoordinates() {
  console.log('Fixing all station coordinates...');
  
  await fixCoordinates(path.join('src', 'data', 'tvStationsWithUrlsFixed.json'));
  await fixCoordinates(path.join('src', 'data', 'radioStationsFixed.json'));
  
  console.log('Finished fixing all station coordinates');
}

// Run the fix
fixAllStationCoordinates().catch(console.error);