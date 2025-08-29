import fs from 'fs/promises';

// Read and process TV stations to find ones with placeholder coordinates
async function findPlaceholderStations() {
  try {
    // Read the current TV stations file
    const tvStationsData = await fs.readFile('./src/data/tvStationsWithUrls.json', 'utf8');
    let tvStations = JSON.parse(tvStationsData);

    console.log(`Processing ${tvStations.length} TV stations...`);
    
    // Counter for stations with placeholder coordinates
    let placeholderStations = [];
    
    // Process each station
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      
      // Check if coordinates are placeholder values
      const isPlaceholderCoord = 
        (station.geo_lat === 40 && station.geo_long === -98) ||
        (station.geo_lat === 40 && station.geo_long === -100) ||
        (station.geo_lat === 42 && station.geo_long === -100) ||
        (station.geo_lat === 42 && station.geo_long === -98) ||
        (station.geo_lat === 44 && station.geo_long === -98) ||
        (station.geo_lat === 46 && station.geo_long === -98) ||
        (station.geo_lat === 48 && station.geo_long === -98) ||
        (station.geo_lat === 50 && station.geo_long === -98) ||
        (station.geo_lat === 52 && station.geo_long === -98) ||
        (station.geo_lat === 54 && station.geo_long === -98) ||
        (station.geo_lat === 56 && station.geo_long === -98) ||
        (station.geo_lat === 58 && station.geo_long === -98) ||
        (station.geo_lat === 12.4989994 && station.geo_long === 124.6746741) ||
        (station.geo_lat === 0 && station.geo_long === 0);
      
      if (isPlaceholderCoord) {
        placeholderStations.push({
          index: i,
          name: station.name,
          country: station.country,
          city: station.city,
          lat: station.geo_lat,
          long: station.geo_long
        });
      }
    }
    
    console.log(`\nFound ${placeholderStations.length} stations with placeholder coordinates:`);
    placeholderStations.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name}`);
      console.log(`   Country: ${station.country}, City: ${station.city}`);
      console.log(`   Coordinates: ${station.lat}, ${station.long}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error processing TV station coordinates:', error);
  }
}

findPlaceholderStations();