import React, { useEffect, useRef, useState } from 'react';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import { X, Lock, Unlock, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './MediaPlayer.css';
import * as Cesium from 'cesium';
import useGlobeStore from '../store/useGlobeStore';

const MediaPlayer = () => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [currentStation, setCurrentStation] = useState(null);
  
  const {
    selectedStation,
    isPlayerVisible,
    isPlayerLocked,
    isPlayerFullscreen,
    closePlayer,
    togglePlayerLock,
    togglePlayerFullscreen,
    viewer,
  } = useGlobeStore();

  // Create virtual element for positioning
  const [virtualElement, setVirtualElement] = useState(null);
  
  const { refs, floatingStyles } = useFloating({
    elements: {
      reference: virtualElement,
    },
    middleware: [offset(10), flip(), shift({ padding: 20 })],
    whileElementsMounted: autoUpdate,
  });

  // Update virtual element position based on selected station
  useEffect(() => {
    if (selectedStation && viewer && selectedStation.geo_lat && selectedStation.geo_long) {
      const updatePosition = () => {
        try {
          // Check if viewer and scene are properly initialized
          if (!viewer || !viewer.scene) {
            return;
          }
          
          const position = Cesium.Cartesian3.fromDegrees(
            parseFloat(selectedStation.geo_long),
            parseFloat(selectedStation.geo_lat)
          );
          
          // Check if SceneTransforms is available and the scene is valid
          if (Cesium.SceneTransforms && typeof Cesium.SceneTransforms.wgs84ToWindowCoordinates === 'function') {
            const screenPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
              viewer.scene,
              position
            );
            
            if (screenPosition) {
              setVirtualElement({
                getBoundingClientRect() {
                  return {
                    width: 0,
                    height: 0,
                    x: screenPosition.x,
                    y: screenPosition.y,
                    left: screenPosition.x,
                    right: screenPosition.x,
                    top: screenPosition.y,
                    bottom: screenPosition.y,
                  };
                },
              });
            }
          }
        } catch (error) {
          console.warn('Error updating player position:', error);
        }
      };

      updatePosition();
      
      // Update position when camera moves
      const removeListener = viewer.camera.changed.addEventListener(updatePosition);
      
      return () => {
        if (removeListener) removeListener();
      };
    }
  }, [selectedStation, viewer]);

  // Cleanup player
  const cleanupPlayer = () => {
    if (playerRef.current) {
      try {
        // Remove all event listeners before disposing
        playerRef.current.off('play');
        playerRef.current.off('pause');
        playerRef.current.off('error');
        playerRef.current.off('volumechange');
        playerRef.current.off('ready');
        
        // Dispose of the player
        playerRef.current.dispose();
      } catch (e) {
        console.warn('Error disposing player:', e);
      } finally {
        playerRef.current = null;
      }
    }
  };

  // Handle station change
  useEffect(() => {
    // If no station or player not visible, cleanup
    if (!selectedStation || !isPlayerVisible) {
      cleanupPlayer();
      setCurrentStation(null);
      return;
    }

    // If station changed, update player
    if (selectedStation !== currentStation) {
      setCurrentStation(selectedStation);
      cleanupPlayer();
    }
  }, [selectedStation, isPlayerVisible, currentStation]);

  // Initialize Video.js player
  useEffect(() => {
    // Only initialize if we have a station and the player is visible
    if (!selectedStation || !isPlayerVisible || !videoRef.current) {
      return;
    }

    // Cleanup function
    let initPlayer;

    const initializePlayer = () => {
      // Additional check to ensure element is mounted
      if (!videoRef.current || !videoRef.current.isConnected) {
        console.warn('Video element is not connected to DOM');
        return;
      }

      try {
        // Configure Video.js options
        const options = {
          controls: true,
          responsive: true,
          fluid: false,
          width: isPlayerFullscreen ? window.innerWidth : 400,
          height: isPlayerFullscreen ? window.innerHeight : (selectedStation.type === 'radio' ? 100 : 225),
          preload: 'auto',
          autoplay: true,
          muted: false,
          sources: [{
            src: selectedStation.url,
            type: selectedStation.type === 'radio' ? 'audio/mpeg' : 'application/x-mpegURL',
          }],
          html5: {
            hls: {
              enableLowInitialPlaylist: true,
              smoothQualityChange: true,
              overrideNative: true,
            },
          },
        };

        // Initialize player
        const player = videojs(videoRef.current, options);
        playerRef.current = player;

        // Event listeners
        player.ready(() => {
          console.log('Player ready for:', selectedStation.name);
          setError(null);
        });

        player.on('play', () => {
          setIsPlaying(true);
          setError(null);
        });

        player.on('pause', () => {
          setIsPlaying(false);
        });

        player.on('error', (e) => {
          const error = player.error();
          console.error('Player error:', error);
          setError(error ? `Error ${error.code}: ${error.message}` : 'Playback error');
          setIsPlaying(false);
        });

        player.on('volumechange', () => {
          setIsMuted(player.muted());
        });

      } catch (err) {
        console.error('Error initializing player:', err);
        setError('Failed to initialize player');
      }
    };

    // Use a small delay to ensure DOM is fully ready
    initPlayer = setTimeout(initializePlayer, 100);

    return () => {
      if (initPlayer) {
        clearTimeout(initPlayer);
      }
    };
  }, [selectedStation, isPlayerVisible, currentStation]); // Depend on currentStation instead of selectedStation

  // Handle fullscreen changes
  useEffect(() => {
    if (playerRef.current) {
      // Update player size when fullscreen changes
      playerRef.current.width(isPlayerFullscreen ? window.innerWidth : 400);
      playerRef.current.height(isPlayerFullscreen ? window.innerHeight : (selectedStation?.type === 'radio' ? 100 : 225));
    }
  }, [isPlayerFullscreen, selectedStation?.type]);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      cleanupPlayer();
    };
  }, []);

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (playerRef.current) {
      playerRef.current.muted(!playerRef.current.muted());
    }
  }

  if (!isPlayerVisible || !selectedStation) {
    return null;
  }

  const isRadio = selectedStation.type === 'radio';

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={`
        ${isPlayerFullscreen ? 'fixed inset-0 z-50' : 'z-40'}
        bg-black/95 backdrop-blur-sm rounded-lg shadow-2xl border border-white/20
        ${isPlayerFullscreen ? '' : 'max-w-md'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/20">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">
            {selectedStation.name}
          </h3>
          <p className="text-gray-300 text-xs truncate">
            {selectedStation.country} • {isRadio ? 'Radio' : 'TV'}
            {selectedStation.codec && ` • ${selectedStation.codec}`}
            {selectedStation.bitrate && ` • ${selectedStation.bitrate}kbps`}
          </p>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {/* Mute button */}
          <button
            onClick={handleMuteToggle}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          {/* Lock button */}
          <button
            onClick={togglePlayerLock}
            className={`p-1.5 rounded transition-colors ${
              isPlayerLocked 
                ? 'text-yellow-400 bg-yellow-400/20' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title={isPlayerLocked ? 'Unlock player' : 'Lock player'}
          >
            {isPlayerLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
          
          {/* Fullscreen button */}
          <button
            onClick={togglePlayerFullscreen}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={isPlayerFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isPlayerFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          
          {/* Close button */}
          <button
            onClick={closePlayer}
            className="p-1.5 text-white/70 hover:text-white hover:bg-red-500/20 rounded transition-colors"
            title="Close player"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Media content */}
      <div className={`${isPlayerFullscreen ? 'h-full' : ''}`}>
        {error ? (
          <div className="p-4 text-center">
            <div className="text-red-400 text-sm mb-2">⚠️ Playback Error</div>
            <div className="text-gray-300 text-xs">{error}</div>
            <button
              onClick={() => window.open(selectedStation.url, '_blank')}
              className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              Open Direct Link
            </button>
          </div>
        ) : isRadio ? (
          <div className="p-4 flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <div className="flex-1">
              <div className="text-white text-sm">{isPlaying ? 'Now Playing' : 'Paused'}</div>
              <div className="text-gray-300 text-xs">
                {selectedStation.tags && selectedStation.tags.split(',').slice(0, 3).join(' • ')}
              </div>
            </div>
            <audio
              ref={videoRef}
              className="hidden"
              data-vjs-player
            />
          </div>
        ) : (
          <div className={`video-container ${isPlayerFullscreen ? 'fullscreen' : ''} ${isRadio ? 'audio' : ''}`}>
            <video
              ref={videoRef}
              className="video-js vjs-default-skin w-full h-full"
              data-vjs-player
            />
          </div>
        )}
      </div>

      {/* Footer for additional info */}
      {selectedStation.homepage && !isPlayerFullscreen && (
        <div className="p-2 border-t border-white/20">
          <a
            href={selectedStation.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs underline"
          >
            Visit Station Website
          </a>
        </div>
      )}
    </div>
  );
};

export default MediaPlayer;

