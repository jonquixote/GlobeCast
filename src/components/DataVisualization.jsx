import React, { useState, useEffect } from 'react';

const DataVisualization = () => {
  const [tvStations, setTvStations] = useState([]);
  const [radioStations, setRadioStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load TV stations
        const tvResponse = await fetch('/tv_stations_with_coords.json');
        const tvData = await tvResponse.json();
        setTvStations(tvData);
        
        // Load Radio stations
        const radioResponse = await fetch('/radio_stations_with_coords.json');
        const radioData = await radioResponse.json();
        setRadioStations(radioData);
        
        console.log('TV Stations:', tvData.slice(0, 5));
        console.log('Radio Stations:', radioData.slice(0, 5));
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load station data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-gray-900 text-white">
        <h2 className="text-xl font-bold mb-4">Loading Station Data...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900 text-white">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 text-white max-h-screen overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Media Station Data Visualization</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-2 text-orange-400">TV Stations</h3>
          <p className="mb-4">Total: {tvStations.length}</p>
          
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">City</th>
                  <th className="text-left py-2">Country</th>
                </tr>
              </thead>
              <tbody>
                {tvStations.slice(0, 10).map((station, index) => (
                  <tr key={station.id || index} className="border-b border-gray-700">
                    <td className="py-2">{station.name}</td>
                    <td className="py-2">{station.city}</td>
                    <td className="py-2">{station.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-2 text-cyan-400">Radio Stations</h3>
          <p className="mb-4">Total: {radioStations.length}</p>
          
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">City</th>
                  <th className="text-left py-2">Country</th>
                </tr>
              </thead>
              <tbody>
                {radioStations.slice(0, 10).map((station, index) => (
                  <tr key={station.id || index} className="border-b border-gray-700">
                    <td className="py-2">{station.name}</td>
                    <td className="py-2">{station.city}</td>
                    <td className="py-2">{station.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-2">Sample Data Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold mb-2 text-orange-400">TV Station Sample:</h4>
            <pre className="text-xs bg-gray-700 p-2 rounded overflow-x-auto">
              {JSON.stringify(tvStations[0], null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="font-bold mb-2 text-cyan-400">Radio Station Sample:</h4>
            <pre className="text-xs bg-gray-700 p-2 rounded overflow-x-auto">
              {JSON.stringify(radioStations[0], null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;