import { useEffect, useState } from 'react';
import useGlobeStore from '../store/useGlobeStore';
import radioService from '../services/radioService';
import tvService from '../services/tvService';

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
      const stations = await tvService.getSampleStations(30); // Limit to 30 for performance
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
  };
};

export default useMediaStations;

