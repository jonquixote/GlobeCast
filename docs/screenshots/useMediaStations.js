import { useEffect, useState } from 'react';
import useGlobeStore from '../../src/store/useGlobeStore';
import radioService from '../../src/services/radioService';
import tvService from '../../src/services/tvService';

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
  
  // Helper function to cluster stations by city
  const updateCityClusters = (stations) => {
    const clusters = {};
    
    stations.forEach(station => {
      if (!station.city || !station.country || !station.geo_lat || !station.geo_long) return;
      
      const key = `${station.city},${station.state || ''},${station.country}`;
      if (!clusters[key]) {
        clusters[key] = {
          city: station.city,
          state: station.state,
          country: station.country,
          count: 0,
          totalLat: 0,
          totalLong: 0,
          stations: []
        };
      }
      
      clusters[key].count++;
      clusters[key].totalLat += parseFloat(station.geo_lat);
      clusters[key].totalLong += parseFloat(station.geo_long);
      clusters[key].stations.push(station);
    });
    
    const clusterArray = Object.values(clusters).map(cluster => ({
      ...cluster,
      latitude: cluster.totalLat / cluster.count,
      longitude: cluster.totalLong / cluster.count,
      // Sort stations by popularity (clickcount)
      topStations: [...cluster.stations]
        .sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0))
        .slice(0, 5)
    }));
    
    useGlobeStore.getState().setCityClusters(clusterArray);
  };

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
      updateCityClusters([...stations, ...get().tvStations]);
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
      updateCityClusters([...get().radioStations, ...stations]);
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
  };
};

export default useMediaStations;

