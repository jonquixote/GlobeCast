import fs from 'fs/promises';

const TV_STATIONS_PATH = './src/data/tvStationsWithUrlsFixed.json';
const RADIO_STATIONS_PATH = './src/data/radioStationsFixed.json';

async function listAtlanticGridStations(filePath, dataType) {
  try {
    const stationsData = await fs.readFile(filePath, 'utf8');
    const stations = JSON.parse(stationsData);

    const gridStations = stations.filter(station => {
      const lat = parseFloat(station.geo_lat);
      const lon = parseFloat(station.geo_long);

      // Bounding box for the Atlantic grid pattern
      const is_in_grid = (
        lat > 20 && lat < 70 &&
        lon > -100 && lon < -20
      );

      return is_in_grid;
    });

    if (gridStations.length > 0) {
      console.log(`\n--- ${dataType} Stations in Atlantic Grid ---`);
      gridStations.forEach(station => {
        console.log(`ID: ${station.id}, Name: ${station.name}, Lat: ${station.geo_lat}, Lon: ${station.geo_long}`);
      });
    }
    return gridStations;

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return [];
  }
}

async function main() {
  console.log('--- Identifying remaining stations in the Atlantic grid ---');
  const tvStations = await listAtlanticGridStations(TV_STATIONS_PATH, 'TV');
  const radioStations = await listAtlanticGridStations(RADIO_STATIONS_PATH, 'Radio');

  const total = tvStations.length + radioStations.length;
  if (total === 0) {
    console.log('\n✅ No stations found in the Atlantic grid.');
  } else {
    console.log(`\n❌ Found a total of ${total} stations in the Atlantic grid.`);
  }
}

main();
