import { useEffect, useState } from 'react';
import useGlobeStore from '../store/useGlobeStore';
import radioService from '../services/radioService';
import tvService from '../services/tvService';

// Simple grid-based clustering algorithm
function clusterStationsByGrid(stations, gridSize) {
  const grid = {};
  
  stations.forEach(station => {
    // Validate coordinates
    if (!station.latitude || !station.longitude || 
        isNaN(station.latitude) || isNaN(station.longitude) ||
        station.latitude < -90 || station.latitude > 90 ||
        station.longitude < -180 || station.longitude > 180) {
      return; // Skip invalid stations
    }
    
    // Create grid coordinates
    const gridLat = Math.round(station.latitude / gridSize) * gridSize;
    const gridLon = Math.round(station.longitude / gridSize) * gridSize;
    const gridKey = `${gridLat},${gridLon}`;
    
    if (!grid[gridKey]) {
      grid[gridKey] = {
        latitude: gridLat,
        longitude: gridLon,
        stations: []
      };
    }
    
    grid[gridKey].stations.push(station);
  });
  
  // Convert to cluster objects
  return Object.values(grid).map(gridCell => {
    // Calculate center of cluster (average of all stations)
    const totalLat = gridCell.stations.reduce((sum, s) => sum + s.latitude, 0);
    const totalLon = gridCell.stations.reduce((sum, s) => sum + s.longitude, 0);
    const count = gridCell.stations.length;
    
    // Sort by popularity
    gridCell.stations.sort((a, b) => (b.clickcount || b.listeners || 0) - (a.clickcount || a.listeners || 0));
    
    // Determine cluster name based on majority city/country or geographic region
    const cityCounts = {};
    const countryCounts = {};
    
    gridCell.stations.forEach(station => {
      if (station.city) {
        cityCounts[station.city] = (cityCounts[station.city] || 0) + 1;
      }
      if (station.country) {
        countryCounts[station.country] = (countryCounts[station.country] || 0) + 1;
      }
    });
    
    // Get most common city and country
    const topCity = Object.keys(cityCounts).sort((a, b) => cityCounts[b] - cityCounts[a])[0];
    const topCountry = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a])[0];
    
    // Create cluster name
    let clusterName = 'Cluster';
    if (topCity) {
      clusterName = topCity;
    } else if (topCountry) {
      clusterName = topCountry;
    }
    
    return {
      city: clusterName,
      country: topCountry || 'Unknown',
      latitude: totalLat / count,
      longitude: totalLon / count,
      count: count,
      stations: gridCell.stations,
      topStations: gridCell.stations.slice(0, 5)
    };
  });
}

const useMediaStations = () => {
  const {
    setRadioStations,
    setTVStations,
    setLoadingRadio,
    setLoadingTV,
    radioStations,
    tvStations,
    isLoadingRadio,
    isLoadingTV,
  } = useGlobeStore();

  const [error, setError] = useState(null);

  // Load radio stations
  const loadRadioStations = async () => {
    if (radioStations.length > 0) return; // Already loaded
    
    setLoadingRadio(true);
    setError(null);
    
    try {
      console.log('Loading radio stations...');
      // Load 1000 stations for better coverage
      const stations = await radioService.getDiverseStations();
      console.log(`Loaded ${stations.length} radio stations`);
      setRadioStations(stations);
    } catch (err) {
      console.error('Failed to load radio stations:', err);
      setError('Failed to load radio stations: ' + err.message);
    } finally {
      setLoadingRadio(false);
    }
  };

  // Load TV stations
  const loadTVStations = async () => {
    if (tvStations.length > 0) return; // Already loaded
    
    setLoadingTV(true);
    setError(null);
    
    try {
      console.log('Loading TV stations...');
      // Load 1000 stations for better coverage
      const stations = await tvService.getSampleStations(1000);
      console.log(`Loaded ${stations.length} TV stations`);
      setTVStations(stations);
    } catch (err) {
      console.error('Failed to load TV stations:', err);
      setError('Failed to load TV stations: ' + err.message);
    } finally {
      setLoadingTV(false);
    }
  };

  // Load both radio and TV stations
  const loadAllStations = async () => {
    await Promise.all([
      loadRadioStations(),
      loadTVStations(),
    ]);
  };

  // Auto-load stations on mount
  useEffect(() => {
    loadAllStations();
  }, []);

  return {
    loadRadioStations,
    loadTVStations,
    loadAllStations,
    isLoadingRadio,
    isLoadingTV,
    isLoading: isLoadingRadio || isLoadingTV,
    error,
    radioStations,
    tvStations,
    totalStations: radioStations.length + tvStations.length,
    // Export clustering function for use in Globe component
    clusterStationsByGrid
  };
};

export default useMediaStations;
