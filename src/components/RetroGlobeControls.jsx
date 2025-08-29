import React, { useState } from 'react';
import { Search, Home, Filter, MapPin } from 'lucide-react';
import { Button } from 'react-aria-components';
import { Input } from 'react-aria-components';
import useGlobeStore from '../store/useGlobeStore';

const RetroGlobeControls = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const {
    viewer,
    allStations,
    setCameraFocusTarget,
    radioStations,
    tvStations,
    selectedCity,
    setSelectedStation,
    isPlayerVisible,
    closePlayer,
  } = useGlobeStore();

  // Reset camera to home position
  const handleHomeClick = () => {
    if (viewer) {
      viewer.camera.flyTo({
        destination: viewer.scene.globe.ellipsoid.cartographicToCartesian({
          longitude: 0,
          latitude: 0,
          height: 20000000,
        }),
        duration: 2.0,
      });
    }
  };

  // Search for stations
  const handleSearch = (query) => {
    if (!query.trim()) return;
    
    const matchingStation = allStations.find(station =>
      station.name.toLowerCase().includes(query.toLowerCase()) ||
      station.country.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matchingStation && matchingStation.latitude && matchingStation.longitude) {
      setCameraFocusTarget({
        longitude: parseFloat(matchingStation.longitude),
        latitude: parseFloat(matchingStation.latitude),
        height: 1000000,
      });
    }
  };

  // Focus on a specific country
  const focusOnCountry = (countryCode) => {
    try {
      const countryStations = allStations.filter(station => 
        station.countrycode === countryCode
      );
      
      if (countryStations.length > 0) {
        const station = countryStations[0];
        // Check if latitude and longitude exist and are valid
        if (station.latitude && station.longitude) {
          setCameraFocusTarget({
            longitude: parseFloat(station.longitude),
            latitude: parseFloat(station.latitude),
            height: 5000000,
          });
        }
      }
    } catch (error) {
      console.warn('Error focusing on country:', error);
    }
  };

  // Continent buttons with realistic continent shapes
  const continents = [
    {
      code: 'NA',
      name: 'NORTH AMERICA',
      stations: allStations.filter(s => ['US', 'CA', 'MX'].includes(s.countrycode)),
      // Realistic North America shape
      shape: "M5 2 L8 1 L12 2 L15 3 L18 4 L20 6 L19 9 L17 12 L14 15 L11 16 L8 15 L5 13 L3 10 L2 7 L3 4 Z",
      lat: 45.0, lng: -100.0, zoom: 3000000
    },
    {
      code: 'SA',
      name: 'SOUTH AMERICA',
      stations: allStations.filter(s => ['BR', 'AR', 'CL', 'PE', 'CO', 'VE'].includes(s.countrycode)),
      // Realistic South America shape
      shape: "M8 2 L10 1 L12 3 L13 6 L12 10 L11 14 L10 18 L8 20 L6 18 L5 15 L6 12 L7 8 L8 5 Z",
      lat: -15.0, lng: -60.0, zoom: 4000000
    },
    {
      code: 'EU',
      name: 'EUROPE',
      stations: allStations.filter(s => ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'AT', 'CH'].includes(s.countrycode)),
      // Realistic Europe shape
      shape: "M2 8 L6 6 L10 7 L14 8 L16 10 L15 12 L12 13 L8 12 L4 11 L2 10 Z",
      lat: 54.0, lng: 15.0, zoom: 3000000
    },
    {
      code: 'AF',
      name: 'AFRICA',
      stations: allStations.filter(s => ['ZA', 'NG', 'EG', 'KE', 'GH', 'MA', 'TN', 'DZ'].includes(s.countrycode)),
      // Realistic Africa shape
      shape: "M8 2 L12 3 L14 5 L15 8 L14 12 L13 16 L11 19 L9 20 L7 19 L6 16 L7 12 L8 8 L9 5 Z",
      lat: 0.0, lng: 20.0, zoom: 4000000
    },
    {
      code: 'AS',
      name: 'ASIA',
      stations: allStations.filter(s => ['JP', 'CN', 'IN', 'KR', 'TH', 'VN', 'MY', 'SG', 'PH', 'ID'].includes(s.countrycode)),
      // Realistic Asia shape
      shape: "M2 6 L8 4 L14 5 L20 6 L22 8 L20 12 L16 14 L10 13 L6 12 L2 10 Z",
      lat: 35.0, lng: 100.0, zoom: 4000000
    },
    {
      code: 'OC',
      name: 'OCEANIA',
      stations: allStations.filter(s => ['AU', 'NZ', 'FJ', 'PG'].includes(s.countrycode)),
      // Realistic Oceania shape
      shape: "M2 8 L8 6 L12 8 L14 10 L12 12 L8 14 L4 12 L2 10 Z",
      lat: -25.0, lng: 140.0, zoom: 5000000
    },
  ];

  // Fly to continent and play a random station
  const playRandomStationFromContinent = (continent) => {
    // First fly to the continent view
    setCameraFocusTarget({
      longitude: continent.lng,
      latitude: continent.lat,
      height: continent.zoom,
    });
    
    // After a brief delay, select and play a random station
    setTimeout(() => {
      if (continent.stations.length > 0) {
        const randomStation = continent.stations[Math.floor(Math.random() * continent.stations.length)];
        
        if (randomStation.latitude && randomStation.longitude) {
          // Zoom into the specific station location
          setCameraFocusTarget({
            longitude: parseFloat(randomStation.longitude),
            latitude: parseFloat(randomStation.latitude),
            height: 800000,
          });
          
          // Set the station as selected to play
          setSelectedStation(randomStation);
        }
      }
    }, 1500); // Wait for continent flyto animation
  };

  // Power button functionality
  const handlePower = () => {
    // If something is playing, stop it
    if (isPlayerVisible) {
      closePlayer();
    } else {
      // Play a random station from anywhere
      if (allStations.length > 0) {
        const randomStation = allStations[Math.floor(Math.random() * allStations.length)];
        if (randomStation.latitude && randomStation.longitude) {
          setCameraFocusTarget({
            longitude: parseFloat(randomStation.longitude),
            latitude: parseFloat(randomStation.latitude),
            height: 1000000,
          });
          setSelectedStation(randomStation);
        }
      }
    }
  };

  // Channel navigation
  const navigateChannel = (direction) => {
    const { selectedStation } = useGlobeStore.getState();
    if (!selectedStation) return;
    
    // Get current station list based on type
    const currentStations = selectedStation.type === 'radio' ? radioStations : tvStations;
    if (currentStations.length === 0) return;
    
    // Find current station index
    const currentIndex = currentStations.findIndex(s => s.id === selectedStation.id);
    if (currentIndex === -1) return;
    
    // Calculate new index
    let newIndex;
    if (direction === 'up') {
      newIndex = (currentIndex + 1) % currentStations.length;
    } else {
      newIndex = (currentIndex - 1 + currentStations.length) % currentStations.length;
    }
    
    // Set new station
    setSelectedStation(currentStations[newIndex]);
  };

  // Volume control
  const adjustVolume = (direction) => {
    // This would interface with the media player volume controls
    console.log(`Volume ${direction}`);
  };

  // Toggle collapsed state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
      {/* Collapsed Remote Control - Premium 1982 Style */}
      {isCollapsed && (
        <button
          onClick={toggleCollapse}
          className="premium-remote w-12 h-12 flex items-center justify-center transition-all duration-300"
          title="Expand Controls"
        >
          <div className="status-led active"></div>
        </button>
      )}

      {/* Compact Premium Remote Control */}
      {!isCollapsed && (
        <div className="premium-remote w-44 transition-all duration-300">
          {/* Remote Control Header */}
          <div className="remote-header p-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1">
                <div className="status-led active"></div>
                <div className="status-led active"></div>
              </div>
              <div className="text-[10px] tracking-wider font-bold">GLOBE</div>
              <button
                onClick={toggleCollapse}
                className="text-current hover:text-white opacity-70 hover:opacity-100 transition-opacity"
                title="Collapse"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Compact Remote Body */}
          <div className="p-2 space-y-2">
            {/* Compact Power Button */}
            <div className="flex justify-center">
              <button
                onClick={handlePower}
                className={`w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 border border-red-800 flex items-center justify-center text-white text-[8px] font-bold shadow-lg hover:shadow-red-500/50 transition-all ${isPlayerVisible ? 'animate-pulse' : ''}`}
                title={isPlayerVisible ? "Stop" : "Play Random Station"}
              >
                PWR
              </button>
            </div>

            {/* Compact Controls */}
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => navigateChannel('up')} className="control-button text-[8px] py-1">CH▲</button>
              <button onClick={() => adjustVolume('up')} className="control-button text-[8px] py-1">VOL▲</button>
              <button onClick={() => navigateChannel('down')} className="control-button text-[8px] py-1">CH▼</button>
              <button onClick={() => adjustVolume('down')} className="control-button text-[8px] py-1">VOL▼</button>
            </div>

            {/* Compact Continent Navigation */}
            <div>
              <div className="text-center text-[9px] font-bold text-white/80 mb-1">CONTINENTS</div>
              <div className="grid grid-cols-3 gap-1">
                {continents.map((continent) => (
                  <button
                    key={continent.code}
                    onClick={() => playRandomStationFromContinent(continent)}
                    className="continent-button h-8 text-[7px]"
                    title={`${continent.name} (${continent.stations.length} stations)`}
                  >
                    <svg viewBox="0 0 24 20" className="w-4 h-3 fill-current mb-0.5">
                      <path d={continent.shape} />
                    </svg>
                    <span>{continent.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Functions */}
            <div className="grid grid-cols-2 gap-1">
              <button onClick={handleHomeClick} className="control-button text-[8px] py-1 flex items-center justify-center">
                <Home className="w-2 h-2 mr-1" />HOME
              </button>
              <button onClick={() => setShowFilters(!showFilters)} className="control-button text-[8px] py-1 flex items-center justify-center">
                <Filter className="w-2 h-2 mr-1" />FIND
              </button>
            </div>

            {/* Compact Search */}
            <div className="led-display p-1">
              <div className="flex space-x-1">
                <Input
                  type="text"
                  placeholder="SEARCH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery);
                    }
                  }}
                  className="flex-1 bg-black/50 border border-white/20 text-current placeholder-current/50 text-[9px] p-1 rounded font-mono"
                />
                <Button
                  onClick={() => handleSearch(searchQuery)}
                  className="control-button px-1"
                  title="SEARCH"
                >
                  <Search className="w-2 h-2" />
                </Button>
              </div>
            </div>

            {/* Compact Statistics */}
            <div className="led-display p-1 text-[8px] font-mono space-y-0.5">
              <div className="flex justify-between">
                <span>📻 RADIO:</span><span>{radioStations.length}</span>
              </div>
              <div className="flex justify-between">
                <span>📺 TV:</span><span>{tvStations.length}</span>
              </div>
            </div>

            {/* Quick Country Navigation */}
            {showFilters && (
              <div className="led-display mt-4">
                <div className="text-xs font-bold mb-2">QUICK NAVIGATION</div>
                <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
                  {['US', 'GB', 'DE', 'FR', 'BR', 'JP', 'AU', 'CA'].map((countryCode) => {
                    const countryStations = allStations.filter(s => s.countrycode === countryCode);
                    
                    return (
                      <button
                        key={countryCode}
                        onClick={() => focusOnCountry(countryCode)}
                        className="control-button text-xs py-1"
                        title={`${countryCode} (${countryStations.length} stations)`}
                      >
                        {countryCode}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RetroGlobeControls;