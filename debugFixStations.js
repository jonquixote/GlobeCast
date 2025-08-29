import fs from 'fs/promises';

async function findAtlanticStations() {
  try {
    // Read the TV stations file
    const tvStationsData = await fs.readFile('./src/data/tvStationsWithUrls.json', 'utf8');
    const tvStations = JSON.parse(tvStationsData);
    
    // Read the radio stations file
    const radioStationsData = await fs.readFile('./src/data/radioStations.json', 'utf8');
    const radioStations = JSON.parse(radioStationsData);
    
    console.log('=== Stations Near the Atlantic Ocean (0,0) ===\n');
    
    // Find TV stations near (0,0)
    console.log('TV Stations near (0,0):');
    const atlanticTVStations = tvStations.filter(station => {
      const lat = station.geo_lat || 0;
      const lon = station.geo_long || 0;
      // Check if coordinates are within 5 degrees of (0,0)
      return Math.abs(lat) <= 5 && Math.abs(lon) <= 5;
    });
    
    if (atlanticTVStations.length === 0) {
      console.log('None found - all TV stations have been properly geocoded!');
    } else {
      atlanticTVStations.forEach(station => {
        console.log(`- ${station.name}: ${station.geo_lat}, ${station.geo_long} (${station.city}, ${station.country})`);
      });
    }
    
    console.log('\nRadio Stations near (0,0):');
    const atlanticRadioStations = radioStations.filter(station => {
      const lat = station.geo_lat || 0;
      const lon = station.geo_long || 0;
      // Check if coordinates are within 5 degrees of (0,0)
      return Math.abs(lat) <= 5 && Math.abs(lon) <= 5;
    });
    
    if (atlanticRadioStations.length === 0) {
      console.log('None found - all radio stations have been properly geocoded!');
    } else {
      atlanticRadioStations.forEach(station => {
        console.log(`- ${station.name}: ${station.geo_lat}, ${station.geo_long} (${station.city}, ${station.state}, ${station.country})`);
      });
    }
    
    // Also check for the specific placeholder coordinates we've been fixing
    console.log('\n=== Stations with Known Placeholder Coordinates ===\n');
    
    const placeholderCoords = [
      { lat: 40, lon: -100 },
      { lat: 42, lon: -100 },
      { lat: 12.4989994, lon: 124.6746741 },
      { lat: 40, lon: -98 },
      { lat: 42, lon: -98 },
      { lat: 44, lon: -98 },
      { lat: 46, lon: -98 },
      { lat: 48, lon: -98 },
      { lat: 50, lon: -98 },
      { lat: 52, lon: -98 },
      { lat: 54, lon: -98 },
      { lat: 56, lon: -98 },
      { lat: 58, lon: -98 }
    ];
    
    console.log('TV Stations with placeholder coordinates:');
    let foundPlaceholders = false;
    tvStations.forEach(station => {
      const matches = placeholderCoords.some(coord => 
        station.geo_lat === coord.lat && station.geo_long === coord.lon
      );
      if (matches) {
        foundPlaceholders = true;
        console.log(`- ${station.name}: ${station.geo_lat}, ${station.geo_long} (${station.city}, ${station.country})`);
      }
    });
    
    if (!foundPlaceholders) {
      console.log('None found - all placeholder coordinates have been fixed!');
    }
    
    console.log('\nRadio Stations with placeholder coordinates:');
    foundPlaceholders = false;
    radioStations.forEach(station => {
      const matches = placeholderCoords.some(coord => 
        station.geo_lat === coord.lat && station.geo_long === coord.lon
      );
      if (matches) {
        foundPlaceholders = true;
        console.log(`- ${station.name}: ${station.geo_lat}, ${station.geo_long} (${station.city}, ${station.state}, ${station.country})`);
      }
    });
    
    if (!foundPlaceholders) {
      console.log('None found - all placeholder coordinates have been fixed!');
    }
    
  } catch (error) {
    console.error('Error checking stations:', error);
  }
}

// Run the check
findAtlanticStations();