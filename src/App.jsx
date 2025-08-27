import React, { useState, useEffect } from 'react';
import Globe from './components/Globe';
import MediaPlayer from './components/MediaPlayer';
import GlobeControls from './components/GlobeControls';
import StationInfo from './components/StationInfo';
import LoadingScreen from './components/LoadingScreen';
import WelcomeOverlay from './components/WelcomeOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import useMediaStations from './hooks/useMediaStations';
import './App.css';
import './styles/mobile.css';

function App() {
  const { isLoading, error, totalStations } = useMediaStations();
  const [showWelcome, setShowWelcome] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (totalStations > 0) {
      setLoadingProgress(100);
      // Show welcome overlay for first-time users
      const hasSeenWelcome = localStorage.getItem('globe-media-streamer-welcome');
      if (!hasSeenWelcome) {
        setTimeout(() => setShowWelcome(true), 1000);
      }
    }
  }, [isLoading, totalStations]);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    localStorage.setItem('globe-media-streamer-welcome', 'true');
  };

  // Show loading screen while loading
  if (isLoading || loadingProgress < 100) {
    return (
      <LoadingScreen 
        progress={loadingProgress} 
        message={isLoading ? 'Loading media stations...' : 'Initializing globe...'}
      />
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black relative">
      <Globe />
      <ErrorBoundary>
        <MediaPlayer key={Date.now()} />
      </ErrorBoundary>
      <GlobeControls />
      <StationInfo />
      
      {/* Welcome overlay */}
      {showWelcome && <WelcomeOverlay onClose={handleWelcomeClose} />}
      
      {/* Error indicator */}
      {error && (
        <div className="absolute top-4 left-4 bg-red-900/90 text-white px-4 py-2 rounded-lg backdrop-blur-sm z-40">
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm max-w-xs z-30 transition-all duration-300 hover:bg-black/90">
        <p className="text-sm">
          🌍 Spin the globe to explore • 📻 Cyan dots = Radio • 📺 Orange dots = TV • Click any dot to play
        </p>
        <button
          onClick={() => setShowWelcome(true)}
          className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline"
        >
          Show tutorial again
        </button>
      </div>

      {/* Floating action button for help */}
      <button
        onClick={() => setShowWelcome(true)}
        className="fixed bottom-6 left-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-all duration-300 hover:scale-110"
        title="Show tutorial"
      >
        <span className="text-lg">?</span>
      </button>
    </div>
  );
}

export default App;
