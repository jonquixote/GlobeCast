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
    
    const hasRadio = gridCell.stations.some(s => s.type === 'radio');
    const hasTV = gridCell.stations.some(s => s.type === 'tv');
    
    const isUniform = (field) => {
      const first = gridCell.stations[0][field];
      return gridCell.stations.every(station => station[field] && station[field] === first);
    };
    
    // Get top stations
    const topStations = gridCell.stations.slice(0, 3);
    
    // Build cluster label using hierarchical uniformity checks
    let clusterName = '';
    if (isUniform('city') && isUniform('country')) {
      clusterName = hasRadio ? (isUniform('state') ?
        `${gridCell.stations[0].city}, ${gridCell.stations[0].state}, ${gridCell.stations[0].country} (Radio)` :
        `${gridCell.stations[0].city}, ${gridCell.stations[0].country} (Radio)`) :
        (hasTV ?
          `${gridCell.stations[0].city}, ${gridCell.stations[0].country} (TV)` :
          `${gridCell.stations[0].city}, ${gridCell.stations[0].country} (${gridCell.stations[0].type})`);
    } else if (isUniform('country')) {
      clusterName = hasRadio && isUniform('state') ?
        `${gridCell.stations[0].state}, ${gridCell.stations[0].country} (Radio)` :
        (hasRadio ?
          `${gridCell.stations[0].country} (Radio)` :
          (hasTV ?
            `${gridCell.stations[0].country} (TV)` :
            `${gridCell.stations[0].country} (${gridCell.stations[0].type})`));
    }
    
    return {
      city: clusterName || gridCell.stations[0].city || 'Media Cluster',
      country: clusterName && hasRadio ? gridCell.stations[0].country : (hasRadio ? gridCell.stations[0].country : ''),
      latitude: totalLat / count,
      longitude: totalLon / count,
      count: count,
      stations: gridCell.stations,
      topStations: topStations
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
    if (tvStations.length > 0) {
      console.log('TV stations already loaded:', tvStations.length);
      return; // Already loaded
    }
    
    setLoadingTV(true);
    setError(null);
    
    try {
      console.log('Loading TV stations...');
      // Load 1000 stations for better coverage
      const stations = await tvService.getSampleStations(1000);
      console.log(`Loaded ${stations.length} TV stations`, stations.slice(0, 3));
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
    console.log('Loading all stations...');
    await Promise.all([
      loadRadioStations(),
      loadTVStations(),
    ]);
    console.log('Finished loading all stations');
  };

  // Auto-load stations on mount
  useEffect(() => {
    console.log('useMediaStations: Auto-loading stations...');
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
