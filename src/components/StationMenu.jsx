import React from 'react';
import useGlobeStore from '../store/useGlobeStore';

const StationMenu = () => {
  const { 
    isStationMenuOpen, 
    toggleStationMenu,
    isRadioMenuOpen,
    isTVMenuOpen,
    toggleRadioMenu,
    toggleTVMenu,
    selectedCity,
    selectedStation
  } = useGlobeStore();

  // Filter stations by type for the selected city/cluster
  const radioStations = selectedCity?.stations?.filter(station => station.type === 'radio') || [];
  const tvStations = selectedCity?.stations?.filter(station => station.type === 'tv') || [];

  // If no city is selected but a station is selected, show that station
  if (!selectedCity && selectedStation) {
    return null; // Don't show menu for individual stations
  }

  // If no city is selected, don't show the menu
  if (!selectedCity) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-black/80 backdrop-blur-sm rounded-lg shadow-xl transition-all duration-300 z-30 ${isStationMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
      {/* Menu Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-white font-bold text-lg">
          {selectedCity.city === 'Cluster' ? 'Nearby Stations' : selectedCity.city}
        </h3>
        <button 
          onClick={toggleStationMenu}
          className="text-gray-300 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Radio Stations Section */}
      <div className="border-b border-gray-700">
        <button
          onClick={toggleRadioMenu}
          className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-800/50 transition-colors"
        >
          <h4 className="text-cyan-400 font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Radio Stations ({radioStations.length})
          </h4>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 text-gray-400 transition-transform ${isRadioMenuOpen ? 'rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {isRadioMenuOpen && (
          <div className="max-h-40 overflow-y-auto">
            {radioStations.length > 0 ? (
              radioStations.map((station, index) => (
                <div 
                  key={`${station.id}-${index}`} 
                  className="p-3 border-t border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => useGlobeStore.getState().setSelectedStation(station)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-cyan-500 mr-3"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{station.name}</p>
                      <p className="text-gray-400 text-xs truncate">{station.country}</p>
                    </div>
                    {station.clickcount && (
                      <span className="text-gray-400 text-xs ml-2">{station.clickcount} listeners</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-gray-400 text-sm text-center">
                No radio stations available
              </div>
            )}
          </div>
        )}
      </div>

      {/* TV Stations Section */}
      <div>
        <button
          onClick={toggleTVMenu}
          className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-800/50 transition-colors"
        >
          <h4 className="text-orange-400 font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
            </svg>
            TV Stations ({tvStations.length})
          </h4>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 text-gray-400 transition-transform ${isTVMenuOpen ? 'rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {isTVMenuOpen && (
          <div className="max-h-40 overflow-y-auto">
            {tvStations.length > 0 ? (
              tvStations.map((station, index) => (
                <div 
                  key={`${station.id}-${index}`} 
                  className="p-3 border-t border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => useGlobeStore.getState().setSelectedStation(station)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-orange-500 mr-3"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{station.name}</p>
                      <p className="text-gray-400 text-xs truncate">{station.country}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-gray-400 text-sm text-center">
                No TV stations available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsed Menu Button */}
      <button
        onClick={toggleStationMenu}
        className={`fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-20 ${isStationMenuOpen ? 'w-10 h-10 opacity-0 pointer-events-none' : 'w-12 h-12 opacity-100'}`}
        title="Show station menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  );
};

export default StationMenu;