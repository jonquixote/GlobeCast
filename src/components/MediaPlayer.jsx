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
        // Safely remove all event listeners before disposing
        playerRef.current.off('play');
        playerRef.current.off('pause');
        playerRef.current.off('error');
        playerRef.current.off('volumechange');
        playerRef.current.off('ready');
        
        // Pause the player first
        if (typeof playerRef.current.pause === 'function') {
          playerRef.current.pause();
        }
        
        // Check if player is still mounted before disposing
        if (playerRef.current.el && playerRef.current.el()) {
          // Dispose of the player
          playerRef.current.dispose();
        }
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
    let retryTimeout;
    let loadTimeout;
    let retryCount = 0;
    const maxRetries = 3;

    const initializePlayer = () => {
      // Additional check to ensure element is mounted
      if (!videoRef.current || !videoRef.current.isConnected) {
        console.warn('Video element is not connected to DOM');
        return;
      }

      try {
        // Determine media type based on URL
        let mediaType = 'application/x-mpegURL'; // Default to HLS
        if (selectedStation.url.includes('.mpd')) {
          mediaType = 'application/dash+xml'; // DASH
        } else if (selectedStation.url.includes('.mp4')) {
          mediaType = 'video/mp4'; // MP4
        } else if (selectedStation.url.includes('.webm')) {
          mediaType = 'video/webm'; // WebM
        }
        
        // Add CORS proxy for streams that might have CORS issues
        const proxiedUrl = selectedStation.url; // We'll handle CORS proxying through Video.js settings
        
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
            src: proxiedUrl,
            type: selectedStation.type === 'radio' ? 'audio/mpeg' : mediaType,
          }],
          html5: {
            hls: {
              enableLowInitialPlaylist: true,
              smoothQualityChange: true,
              overrideNative: true,
            },
            dash: {
              setLimitBitrateByPortal: true,
            }
          },
          // Add error handling options
          techOrder: ['html5'],
          // Set timeouts for loading
          playbackRates: [0.5, 1, 1.5, 2],
        };

        // Initialize player
        const player = videojs(videoRef.current, options);
        playerRef.current = player;
        
        // Set a timeout for loading the stream
        loadTimeout = setTimeout(() => {
          if (playerRef.current && !playerRef.current.paused()) {
            console.warn('Stream loading timeout for:', selectedStation.name);
            setError('Stream loading timeout - please try another station');
            if (typeof playerRef.current.pause === 'function') {
              playerRef.current.pause();
            }
          }
        }, 30000); // 30 second timeout
        
        // Clear timeout when player is ready
        player.ready(() => {
          clearTimeout(loadTimeout);
          console.log('Player ready for:', selectedStation.name);
          setError(null);
          // Reset retry count on successful load
          retryCount = 0;
        });

        player.on('play', () => {
          setIsPlaying(true);
          setError(null);
        });

        player.on('pause', () => {
          setIsPlaying(false);
        });

        player.on('error', (e) => {
          // Clear any existing timeouts
          if (loadTimeout) {
            clearTimeout(loadTimeout);
          }
          
          const error = player.error();
          console.error('Player error for station:', selectedStation.name, error);
          
          // Handle specific error cases
          let errorMessage = 'Playback error - this stream may not be working';
          if (error) {
            switch (error.code) {
              case 1: // MEDIA_ERR_ABORTED
                errorMessage = 'Media loading aborted';
                break;
              case 2: // MEDIA_ERR_NETWORK
                errorMessage = 'Network error occurred - stream may be temporarily unavailable';
                break;
              case 3: // MEDIA_ERR_DECODE
                errorMessage = 'Media decode error - file may be corrupted';
                break;
              case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                errorMessage = 'Media format not supported or stream unavailable';
                break;
              default:
                errorMessage = `Error ${error.code}: ${error.message}`;
            }
          }
          
          // Check for DNS resolution errors specifically
          if (errorMessage.includes('Network error') && selectedStation.url) {
            try {
              const url = new URL(selectedStation.url);
              // If it's a test URL or obviously fake URL, handle it specially
              if (url.hostname.includes('radio-') && url.hostname.includes('.com')) {
                errorMessage = 'Stream URL appears to be invalid or test data - please try another station';
              }
            } catch (urlError) {
              // Invalid URL
              errorMessage = 'Invalid stream URL - please try another station';
            }
          }
          
          // Implement retry mechanism for network errors
          if ((error && (error.code === 2 || error.code === 4)) && retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying ${selectedStation.name} (${retryCount}/${maxRetries})...`);
            setError(`Retrying... (${retryCount}/${maxRetries})`);
            
            // Clean up current player safely
            if (playerRef.current) {
              try {
                playerRef.current.off('error'); // Remove error listener to prevent recursive calls
                if (typeof playerRef.current.pause === 'function') {
                  playerRef.current.pause();
                }
                // Check if player element exists before disposing
                if (playerRef.current.el && playerRef.current.el()) {
                  playerRef.current.dispose();
                }
              } catch (e) {
                console.warn('Error during player cleanup:', e);
              } finally {
                playerRef.current = null;
              }
            }
            
            // Retry after a delay, with exponential backoff
            const retryDelay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s, etc.
            retryTimeout = setTimeout(initializePlayer, retryDelay);
            return;
          }
          
          // For CORS or forbidden errors, suggest opening in new tab
          if (error && error.message && 
              (error.message.includes('CORS') || 
               error.message.includes('403') || 
               error.message.includes('400') || 
               error.message.includes('Forbidden'))) {
            errorMessage = 'Stream blocked by CORS policy. Try opening in a new tab.';
          }
          
          setError(errorMessage);
          setIsPlaying(false);
        });

        player.on('volumechange', () => {
          setIsMuted(player.muted());
        });

      } catch (err) {
        console.error('Error initializing player for station:', selectedStation.name, err);
        
        // Implement retry mechanism for initialization errors
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying initialization ${selectedStation.name} (${retryCount}/${maxRetries})...`);
          setError(`Retrying initialization... (${retryCount}/${maxRetries})`);
          
          // Exponential backoff for retries
          const retryDelay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s, etc.
          retryTimeout = setTimeout(initializePlayer, retryDelay);
          return;
        }
        
        setError('Failed to initialize player - please try another station');
      }
    };

    // Use a small delay to ensure DOM is fully ready
    initPlayer = setTimeout(initializePlayer, 100);

    return () => {
      if (initPlayer) {
        clearTimeout(initPlayer);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, [selectedStation, isPlayerVisible, currentStation, isPlayerFullscreen]); // Depend on currentStation instead of selectedStation

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
            <div className="text-gray-300 text-xs mb-2">{error}</div>
            <div className="text-gray-400 text-xs mb-3">
              {error.includes('CORS') || error.includes('403') || error.includes('400') || error.includes('Forbidden') 
                ? "Many live streams have restrictions that prevent them from playing in this player."
                : "This stream may be temporarily unavailable."}
              Try another station or open the direct link below.
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.open(selectedStation.url, '_blank')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                Open Direct Link
              </button>
              <button
                onClick={closePlayer}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
              >
                Close Player
              </button>
            </div>
          </div>
        ) : isRadio ? (
          <div className="p-4 flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <div className="flex-1">
              <div className="text-white text-sm">{isPlaying ? 'Now Playing' : 'Paused'}</div>
              <div className="text-gray-300 text-xs">
                {selectedStation.tags && typeof selectedStation.tags === 'string' && selectedStation.tags.split(',').slice(0, 3).join(' • ')}
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

