import React, { useEffect, useRef, useState } from 'react';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import { X, Lock, Unlock, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './MediaPlayer.css';
import * as Cesium from 'cesium';
import useGlobeStore from '../store/useGlobeStore';

const RetroMediaPlayer = () => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [error, setError] = useState(null);
  const [currentStation, setCurrentStation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
    // Early return if no player exists
    if (!playerRef.current) return;

    // Ensure we have access to player methods
    const player = playerRef.current;
    
    try {
      // Remove all event listeners first
      if (player.off) {
        player.off('play');
        player.off('pause');
        player.off('error');
        player.off('volumechange');
        player.off('ready');
      }
      
      // Pause playback
      if (typeof player.pause === 'function') {
        player.pause();
      }
      
      // Check if player element still exists in DOM
      if (videoRef.current && document.contains(videoRef.current)) {
        // Only dispose if the player instance still has the dispose method
        if (typeof player.dispose === 'function') {
          player.dispose();
        }
      }
    } catch (error) {
      console.warn('Error during player cleanup:', error);
    } finally {
      // Always clear the reference
      playerRef.current = null;
    }
  };

  // Handle station change
  useEffect(() => {
    console.log('Station change effect triggered', { selectedStation, isPlayerVisible });
    
    // If no station or player not visible, cleanup
    if (!selectedStation || !isPlayerVisible) {
      cleanupPlayer();
      setCurrentStation(null);
      return;
    }

    // If station changed, update player
    if (selectedStation.id !== currentStation?.id) {
      console.log('Station changed, updating player', { selectedStation, currentStation });
      setCurrentStation(selectedStation);
      cleanupPlayer();
    }
  }, [selectedStation?.id, isPlayerVisible, currentStation?.id]);

  // Initialize Video.js player
  useEffect(() => {
    console.log('Player initialization effect triggered', { selectedStation, isPlayerVisible, currentStation });
    
    // Only initialize if we have a station and the player is visible
    if (!selectedStation || !isPlayerVisible || !videoRef.current) {
      console.log('Skipping player initialization', { hasSelectedStation: !!selectedStation, isPlayerVisible, hasVideoRef: !!videoRef.current });
      return;
    }

    // Cleanup function
    let initPlayer;
    let retryTimeout;
    let loadTimeout;
    let retryCount = 0;
    const maxRetries = 3;

    // Add better URL validation
    const isValidUrl = (url) => {
      if (!url || url.trim() === '') {
        return false;
      }
      
      // Allow most URLs but filter out obviously invalid ones
      if (url.includes('radio-') && url.includes('.com')) {
        return false;
      }
      
      // Basic validation - check if it looks like a URL
      return url.startsWith('http://') || url.startsWith('https://');
    };

    const initializePlayer = () => {
      console.log('Initializing player for station', selectedStation);
      
      // Set loading state
      setIsLoading(true);
      setError(null);
      
      // Additional check to ensure element is mounted
      if (!videoRef.current) {
        console.warn('Video element is not ready');
        setIsLoading(false);
        return;
      }

      // Check URL validity before attempting to play
      console.log('Station data:', selectedStation);
      if (!selectedStation || !selectedStation.url) {
        setError('This station does not have a stream URL available');
        setIsLoading(false);
        return;
      }
      
      // Allow most URLs but filter out obviously invalid ones
      if (selectedStation.url.trim() === '' || (selectedStation.url.includes('radio-') && selectedStation.url.includes('.com'))) {
        setError('Stream URL appears to be invalid - please try another station');
        setIsLoading(false);
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
        
        // Configure Video.js options with better error handling
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
            vhs: {
              enableLowInitialPlaylist: true,
              smoothQualityChange: true,
              overrideNative: true,
              handlePartialData: true,
            },
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
          // Add better error display
          errorDisplay: true,
        };

        // Initialize player
        const player = videojs(videoRef.current, options);
        playerRef.current = player;
        
        // Set initial volume
        player.volume(volume / 100);
        
        // Set a timeout for loading the stream (60 seconds for live streams)
        loadTimeout = setTimeout(() => {
          if (playerRef.current) {
            const player = playerRef.current;
            // Check if player is actually trying to play
            if (player && typeof player.playing === 'function' && !player.playing()) {
              console.warn('Stream loading timeout for:', selectedStation.name);
              setError('Stream loading timeout - please try another station');
              if (typeof player.pause === 'function') {
                player.pause();
              }
            }
          }
        }, 60000); // 60 second timeout for live streams
        
        // Clear timeout when player is ready
        player.ready(() => {
          if (loadTimeout) {
            clearTimeout(loadTimeout);
          }
          console.log('Player ready for:', selectedStation.name);
          setError(null);
          setIsLoading(false);
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
          
          // Better retry mechanism for network errors
          if ((error && (error.code === 2 || error.code === 4)) && retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying ${selectedStation.name} (${retryCount}/${maxRetries})...`);
            setError(`Retrying... (${retryCount}/${maxRetries})`);
            setIsLoading(false);
            
            // Clean up current player safely
            if (playerRef.current) {
              try {
                // Remove all event listeners first
                if (playerRef.current.off) {
                  playerRef.current.off('play');
                  playerRef.current.off('pause');
                  playerRef.current.off('error');
                  playerRef.current.off('volumechange');
                  playerRef.current.off('ready');
                }
                
                // Pause playback
                if (typeof playerRef.current.pause === 'function') {
                  playerRef.current.pause();
                }
                
                // Dispose of the player
                if (typeof playerRef.current.dispose === 'function') {
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
          setIsLoading(false);
          setIsPlaying(false);
        });

        player.on('volumechange', () => {
          setIsMuted(player.muted());
          setVolume(Math.round(player.volume() * 100));
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

    // Use a longer delay to ensure DOM is fully ready
    initPlayer = setTimeout(initializePlayer, 300);

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
  }, [selectedStation?.id, isPlayerVisible, currentStation?.id, isPlayerFullscreen, volume]);

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

  // Handle volume change
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.volume(newVolume / 100);
      if (newVolume > 0 && playerRef.current.muted()) {
        playerRef.current.muted(false);
      }
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
        premium-boombox
        ${isPlayerFullscreen ? 'w-full h-full' : 'w-72 max-w-sm'}
      `}
    >
      {/* Compact Premium Boombox Layout */}
      <div className="flex items-center">
        {/* Left Speaker */}
        <div className="boombox-speaker w-10 h-14">
          <div className="speaker-grille w-full h-full"></div>
        </div>

        {/* Main Control Panel */}
        <div className="flex-1 px-1">
          {/* Compact Display Header */}
          <div className="boombox-display p-1 mb-1">
            <div className="flex justify-between items-center mb-0.5">
              <div className="flex items-center space-x-1">
                <div className={`status-led ${isPlaying ? 'active' : ''}`}></div>
                <div className={`status-led ${error ? 'recording' : ''}`}></div>
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Compact Volume */}
                <div className="flex items-center space-x-0.5">
                  <span className="text-[6px]">VOL</span>
                  <div className="volume-slider w-6">
                    <div className="volume-fill" style={{ width: `${volume}%` }}></div>
                  </div>
                </div>
                
                {/* Compact Controls */}
                <div className="flex space-x-0.5">
                  <button
                    onClick={togglePlayerLock}
                    className={`w-3 h-3 flex items-center justify-center text-[6px] rounded ${isPlayerLocked ? 'text-yellow-400' : 'text-white/60'}`}
                    title={isPlayerLocked ? 'Unlock' : 'Lock'}
                  >
                    {isPlayerLocked ? <Lock size={6} /> : <Unlock size={6} />}
                  </button>
                  <button
                    onClick={togglePlayerFullscreen}
                    className="w-3 h-3 flex items-center justify-center text-white/60 text-[6px] rounded"
                    title={isPlayerFullscreen ? 'Exit' : 'Full'}
                  >
                    {isPlayerFullscreen ? <Minimize size={6} /> : <Maximize size={6} />}
                  </button>
                  <button
                    onClick={closePlayer}
                    className="w-3 h-3 flex items-center justify-center text-red-400 text-[6px] rounded"
                    title="Close"
                  >
                    <X size={6} />
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Station Info */}
            <div className="text-center">
              <div className="text-[8px] font-bold truncate mb-0.5">
                {selectedStation.name.toUpperCase()}
              </div>
              <div className="text-[6px] opacity-80 truncate">
                {selectedStation.country.toUpperCase()} • {isRadio ? 'RADIO' : 'TV'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Speaker */}
        <div className="boombox-speaker w-10 h-14">
          <div className="speaker-grille w-full h-full"></div>
        </div>
      </div>

      {/* Premium 1982 Boombox Media Display */}
      <div className={`${isPlayerFullscreen ? 'h-full flex-1' : ''} px-2 pb-2`}>
        {error ? (
          <div className="text-center">
              {isLoading ? (
                <>
                  <div className="text-[8px] mb-1 opacity-90">📡 CONNECTING...</div>
                  <div className="text-[8px] mb-1 opacity-80 font-mono">
                    Tuning into {selectedStation.name}...
                  </div>
                  <div className="flex justify-center mt-2">
                    <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[8px] mb-1 opacity-90">⚠️ PLAYBACK ERROR</div>
                  <div className="text-[8px] mb-1 opacity-80 font-mono">
                    {error.length > 40 ? error.substring(0, 40) + '...' : error}
                  </div>
                  <div className="text-[8px] opacity-60 mb-2 font-mono">
                    {error.includes('CORS') || error.includes('403') || error.includes('400') || error.includes('Forbidden')
                      ? "STREAM RESTRICTED"
                      : error.includes('does not have a stream URL')
                      ? "NO STREAM AVAILABLE"
                      : "SIGNAL UNAVAILABLE"}
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => window.open(selectedStation.url, '_blank')}
                      className="boombox-button px-2 py-1 text-[8px]"
                    >
                      DIRECT LINK
                    </button>
                    <button
                      onClick={closePlayer}
                      className="boombox-button px-2 py-1 text-[8px]"
                    >
                      CLOSE
                    </button>
                  </div>
                </>
              )}
            </div>
        ) : isRadio ? (
          // Radio Player - Premium 1982 Boombox Style
          <div>
            {/* Main Display Area */}
            <div className="boombox-display mb-2 p-2">
              <div className="text-center mb-1">
                <div className="text-[10px] font-bold mb-0.5">
                  {isLoading ? '📡 CONNECTING...' : isPlaying ? '♫ NOW STREAMING ♫' : '● RADIO READY ●'}
                </div>
                {selectedStation.tags && typeof selectedStation.tags === 'string' && (
                  <div className="text-[8px] opacity-80 font-mono">
                    {selectedStation.tags.split(',').slice(0, 2).join(' • ').toUpperCase()}
                  </div>
                )}
              </div>

              {/* Audio Visualizer */}
              <div className="audio-visualizer mb-2">
                {isPlaying ? (
                  // Animated frequency bars
                  Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="visualizer-bar"
                      style={{
                        height: `${Math.random() * 24 + 3}px`,
                        animationDelay: `${i * 60}ms`
                      }}
                    />
                  ))
                ) : (
                  // Static bars when not playing
                  Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="visualizer-bar opacity-30"
                      style={{ height: '4px' }}
                    />
                  ))
                )}
              </div>

              {/* Live Status Indicator */}
              <div className="flex justify-center items-center space-x-1.5 text-[8px]">
                <div className={`status-led ${isPlaying ? 'active' : ''}`}></div>
                <span className="font-mono">
                  {isPlaying ? 'LIVE BROADCAST' : 'STANDBY MODE'}
                </span>
              </div>
            </div>

            {/* Media Control Buttons */}
            <div className="flex justify-center space-x-2 mb-2">
              <button className="boombox-button" title="Previous">
                ⏮️
              </button>
              <button className="boombox-button" title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button className="boombox-button" title="Next">
                ⏭️
              </button>
              <button className="boombox-button" title="Shuffle">
                🔀
              </button>
              <button
                className="boombox-button"
                onClick={handleMuteToggle}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>

            {/* Status Bar */}
            <div className="boombox-display p-1 text-[8px] text-center font-mono opacity-80">
              {isLoading ? 'CONNECTING...' : `QUALITY: HIGH • LISTENERS: ${Math.floor(Math.random() * 50000) + 1000}`}
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={videoRef}
              className="hidden"
              data-vjs-player
            />
          </div>
        ) : (
          // TV Player - Premium 1982 Style
          <div className={`${isPlayerFullscreen ? 'h-full' : ''}`}>
            <div className="bg-black border-2 border-gray-600 rounded-md overflow-hidden">
              <video
                ref={videoRef}
                className="video-js vjs-default-skin w-full h-full"
                data-vjs-player
                style={{
                  fontFamily: 'var(--font-led)',
                  background: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%)',
                  backgroundSize: '3px 3px'
                }}
              />
            </div>
            
            {/* TV Control Panel */}
            <div className="flex justify-center space-x-1.5 mt-2">
              <button className="boombox-button" title="Previous Channel">
                ⏮️
              </button>
              <button className="boombox-button" title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button className="boombox-button" title="Next Channel">
                ⏭️
              </button>
              <button
                className="boombox-button"
                onClick={handleMuteToggle}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? '🔇' : '📺'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetroMediaPlayer;
