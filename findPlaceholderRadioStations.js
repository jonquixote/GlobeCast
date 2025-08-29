import fs from 'fs/promises';

// Read and process radio stations to find ones with placeholder coordinates
async function findPlaceholderRadioStations() {
  try {
    // Read the current radio stations file
    const radioStationsData = await fs.readFile('./src/data/radioStations.json', 'utf8');
    let radioStations = JSON.parse(radioStationsData);

    console.log('Processing ' + radioStations.length + ' radio stations...');
    
    // Counter for stations with placeholder coordinates
    let placeholderStations = [];
    
    // Process each station
    for (let i = 0; i < radioStations.length; i++) {
      const station = radioStations[i];
      
      // Check if coordinates are placeholder values
      const isPlaceholderCoord = 
        (station.geo_lat === 40 && station.geo_long === -100) ||
        (station.geo_lat === 42 && station.geo_long === -100) ||
        (station.geo_lat === 12.4989994 && station.geo_long === 124.6746741) ||
        (station.geo_lat === 0 && station.geo_long === 0);
      
      if (isPlaceholderCoord) {
        placeholderStations.push({
          index: i,
          name: station.name,
          country: station.country,
          state: station.state,
          city: station.city,
          lat: station.geo_lat,
          long: station.geo_long
        });
      }
    }
    
    console.log('\nFound ' + placeholderStations.length + ' radio stations with placeholder coordinates:');
    placeholderStations.forEach((station, index) => {
      console.log((index + 1) + '. ' + station.name);
      console.log('   Country: ' + station.country + ', State: ' + station.state + ', City: ' + station.city);
      console.log('   Coordinates: ' + station.lat + ', ' + station.long);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error processing radio station coordinates:', error);
  }
}

findPlaceholderRadioStations();