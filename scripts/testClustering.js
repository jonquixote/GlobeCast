import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current TV stations file
const tvStationsPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
const tvStations = JSON.parse(fs.readFileSync(tvStationsPath, 'utf8'));

// Read the current radio stations file
const radioStationsPath = path.join(__dirname, '..', 'src', 'data', 'radioStations.json');
const radioStations = JSON.parse(fs.readFileSync(radioStationsPath, 'utf8'));

console.log(`TV Stations: ${tvStations.length}`);
console.log(`Radio Stations: ${radioStations.length}`);

// Test clustering logic
const allStations = [
  ...radioStations.slice(0, 100).map(station => ({
    id: station.stationuuid,
    name: station.name,
    city: station.state,
    country: station.country,
    latitude: parseFloat(station.geo_lat),
    longitude: parseFloat(station.geo_long),
    type: 'radio',
    clickcount: station.clickcount || 0
  })),
  ...tvStations.slice(0, 100).map(station => ({
    id: station.id,
    name: station.name,
    city: station.city,
    country: station.country,
    latitude: station.latitude,
    longitude: station.longitude,
    type: 'tv',
    clickcount: 0
  }))
];

console.log(`Total test stations: ${allStations.length}`);

// Filter out invalid stations
const validStations = allStations.filter(station => 
  station.latitude && 
  station.longitude && 
  !isNaN(station.latitude) && 
  !isNaN(station.longitude) &&
  station.latitude >= -90 && 
  station.latitude <= 90 &&
  station.longitude >= -180 && 
  station.longitude <= 180
);

console.log(`Valid stations: ${validStations.length}`);

// Group stations by city
const cityMap = {};
const individualStations = [];

validStations.forEach(station => {
  if (station.city && station.city.trim() !== '') {
    const cityKey = `${station.city?.toLowerCase().trim()},${station.country?.toLowerCase().trim() || 'unknown'}`;
    
    if (!cityMap[cityKey]) {
      cityMap[cityKey] = {
        city: station.city.trim(),
        country: station.country?.trim() || 'Unknown',
        count: 0,
        totalLat: 0,
        totalLon: 0,
        stations: []
      };
    }
    
    cityMap[cityKey].count++;
    cityMap[cityKey].totalLat += station.latitude;
    cityMap[cityKey].totalLon += station.longitude;
    cityMap[cityKey].stations.push(station);
  } else {
    // Add to individual stations if no city info
    individualStations.push(station);
  }
});

// Process city clusters - only create clusters for cities with 2 or more stations
const cityClusters = Object.values(cityMap)
  .filter(cityData => cityData.count >= 2)
  .map(cityData => {
    // Sort stations by popularity
    cityData.stations.sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0));
    
    // Use weighted average for coordinates
    let weightedLat = 0;
    let weightedLon = 0;
    let totalWeight = 0;
    
    cityData.stations.forEach(station => {
      const weight = (station.clickcount || 1);
      weightedLat += station.latitude * weight;
      weightedLon += station.longitude * weight;
      totalWeight += weight;
    });
    
    return {
      ...cityData,
      latitude: totalWeight > 0 ? weightedLat / totalWeight : cityData.totalLat / cityData.count,
      longitude: totalWeight > 0 ? weightedLon / totalWeight : cityData.totalLon / cityData.count,
      topStations: cityData.stations.slice(0, 5)
    };
  });

// Get single stations from cities with only 1 station + stations without city info
const singleStations = [
  ...individualStations,
  ...Object.values(cityMap)
    .filter(cityData => cityData.count === 1)
    .map(cityData => cityData.stations[0])
];

console.log(`City clusters: ${cityClusters.length}`);
console.log(`Single stations: ${singleStations.length}`);

// Test proximity clustering
const CLUSTER_DISTANCE_THRESHOLD = 0.5;

// Group single stations by proximity
const proximityGroups = [];

singleStations.forEach(station => {
  let foundGroup = false;
  
  // Try to find an existing group that's close enough
  for (const group of proximityGroups) {
    const distance = Math.sqrt(
      Math.pow(station.latitude - group.latitude, 2) + 
      Math.pow(station.longitude - group.longitude, 2)
    );
    
    if (distance < CLUSTER_DISTANCE_THRESHOLD) {
      // Add to existing group
      group.stations.push(station);
      // Update group center
      group.latitude = (group.latitude * (group.stations.length - 1) + station.latitude) / group.stations.length;
      group.longitude = (group.longitude * (group.stations.length - 1) + station.longitude) / group.stations.length;
      foundGroup = true;
      break;
    }
  }
  
  // Create new group if no close group found
  if (!foundGroup) {
    proximityGroups.push({
      latitude: station.latitude,
      longitude: station.longitude,
      stations: [station]
    });
  }
});

// Process proximity groups - create clusters for groups with 2+ stations
const processedProximityClusters = proximityGroups
  .filter(group => group.stations.length >= 2)
  .map(group => {
    // Sort by popularity
    group.stations.sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0));
    return {
      city: 'Cluster',
      country: group.stations[0].country || 'Unknown',
      count: group.stations.length,
      latitude: group.latitude,
      longitude: group.longitude,
      stations: group.stations,
      topStations: group.stations.slice(0, 5)
    };
  });

// Get stations that remain individual
const finalIndividualStations = proximityGroups
  .filter(group => group.stations.length === 1)
  .map(group => group.stations[0]);

console.log(`Proximity clusters: ${processedProximityClusters.length}`);
console.log(`Final individual stations: ${finalIndividualStations.length}`);

// Show some examples
console.log('\n--- EXAMPLE CITY CLUSTERS ---');
cityClusters.slice(0, 3).forEach(cluster => {
  console.log(`${cluster.city}, ${cluster.country}: ${cluster.count} stations`);
});

console.log('\n--- EXAMPLE INDIVIDUAL STATIONS ---');
finalIndividualStations.slice(0, 5).forEach(station => {
  console.log(`${station.name} (${station.type}) at ${station.latitude}, ${station.longitude}`);
});

console.log('\n--- EXAMPLE PROXIMITY CLUSTERS ---');
processedProximityClusters.slice(0, 3).forEach(cluster => {
  console.log(`Cluster: ${cluster.count} stations at ${cluster.latitude}, ${cluster.longitude}`);
});