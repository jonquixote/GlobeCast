import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Cesium from 'cesium';
import useGlobeStore from '../store/useGlobeStore';
import mediaService from '../services/mediaService';

// Set Cesium Ion access token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3OTA4NDgwNC1kY2U0LTQwZDgtOTkzYi1iNDcwNjYzYzQ4MzkiLCJpZCI6MzMyOTY2LCJpYXQiOjE3NTU1MTgwMTh9.NG_8CiTTqadGIjdOctXOV83eSZWpN_w6a8RgtlSQX_k';

const Globe = () => {
  const cesiumContainer = useRef(null);
  const [error, setError] = useState(null);
  const {
    setViewer,
    viewer,
    setSelectedStation,
    setSelectedCity,
    cameraFocusTarget,
    setCameraFocusTarget,
    toggleStationMenu
  } = useGlobeStore();
  
  const [mediaStations, setMediaStations] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(0);

  // Load media station data
  useEffect(() => {
    const loadMediaStations = async () => {
      try {
        console.log('Loading media stations from API...');
        
        // Load stations from API
        const response = await mediaService.getAllStations({ limit: 2000 });
        
        if (response.success) {
          console.log('Raw station data:', response.data.slice(0, 5)); // Log first 5 stations
          
          const stations = response.data.map(station => {
            // Better detection of station type
            let type = station.type || 'radio'; // Start with provided type or default to radio
            
            // Override if strong indicators of TV are present, as the `type` field might be generic.
            if (
              (station.name && station.name.toLowerCase().includes('tv')) ||
              (station.url && (station.url.includes('.m3u8') || station.url.includes('.smil'))) ||
              (station.categories && typeof station.categories === 'string' && station.categories.toLowerCase().includes('tv'))
            ) {
              type = 'tv';
            }
            
            const processedStation = {
              id: station.id,
              name: station.name || station.id || 'Unknown Station',
              country: station.country || 'Unknown',
              city: station.city || 'Unknown City',
              geo_lat: parseFloat(station.geo_lat || station.latitude),
              geo_long: parseFloat(station.geo_long || station.longitude),
              type: type,
              url: station.url || '',
              tags: Array.isArray(station.tags) ? station.tags : 
                    typeof station.tags === 'string' ? station.tags.split(',') : 
                    station.tags || [],
              clickcount: station.clickcount || 0
            };
            
            // Log stations that might be misclassified
            if (response.data.indexOf(station) < 3) {
              console.log('Processed station:', processedStation);
            }
            
            return processedStation;
          }).filter(station => {
            const isValid = station.geo_lat && 
              station.geo_long && 
              !isNaN(station.geo_lat) && 
              !isNaN(station.geo_long) &&
              station.geo_lat >= -90 && station.geo_lat <= 90 &&
              station.geo_long >= -180 && station.geo_long <= 180 &&
              station.url && 
              station.url.length > 0 && 
              !station.url.includes('radio-'); // Filter out test URLs
              
            if (!isValid) {
              if (response.data.indexOf(station) < 5) {
                console.log('Filtered out station:', station);
              }
            }
            
            return isValid;
          });
          
          setMediaStations(stations);
          console.log(`Loaded ${stations.length} valid media stations`);
          
          // Log counts by type
          const tvCount = stations.filter(s => s.type === 'tv').length;
          const radioCount = stations.filter(s => s.type === 'radio').length;
          console.log(`TV stations: ${tvCount}, Radio stations: ${radioCount}`);
        } else {
          throw new Error(response.error || 'Failed to load stations');
        }
      } catch (error) {
        console.error('Error loading media stations:', error);
        setError('Failed to load media station data: ' + error.message);
      }
    };
    
    loadMediaStations();
  }, []);

  // Handle cluster click interactions
  const handleClusterClick = useCallback((cluster) => {
    // Get the current viewer from the store state
    const currentViewer = useGlobeStore.getState().viewer;
    
    if (!currentViewer) {
      console.warn('Viewer not initialized when handleClusterClick was called.');
      return;
    }
    
    useGlobeStore.getState().setSelectedCity(cluster);
    
    // Determine zoom level based on cluster size
    const zoomDistance = Math.max(300000, 1000000 - (cluster.count * 10000));
    
    // Zoom to cluster with animation
    currentViewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        cluster.longitude,
        cluster.latitude,
        zoomDistance
      ),
      duration: 1.5,
      complete: () => {
        // Add 3D circle visualization
        const circleRadius = Math.min(150000, 50000 + (cluster.count * 5000));
        const circleEntity = currentViewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(cluster.longitude, cluster.latitude),
          ellipse: {
            semiMinorAxis: circleRadius,
            semiMajorAxis: circleRadius,
            material: Cesium.Color.BLUE.withAlpha(0.3),
            outline: true,
            outlineColor: Cesium.Color.WHITE,
            height: 0, // Ensure geometry is above terrain but not clamped
            outlineWidth: 2
          }
        });
        
        // Add popular stations around the circle
        cluster.topStations.forEach((station, i) => {
          const angle = (i / cluster.topStations.length) * Math.PI * 2;
          const radius = circleRadius * 1.2; // Slightly larger than circle radius
          
          // Calculate proper position on the globe surface
          const position = Cesium.Cartesian3.fromDegrees(
            cluster.longitude + (radius * Math.cos(angle)) / 10000,
            cluster.latitude + (radius * Math.sin(angle)) / 10000
          );
          
          const stationEntity = currentViewer.entities.add({
            position: position,
            label: {
              text: station.name,
              font: '14px sans-serif',
              fillColor: Cesium.Color.WHITE,
              backgroundColor: Cesium.Color.BLACK.withAlpha(0.5),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2000000),
              scale: 0.8
            },
            billboard: {
              image: station.type === 'radio'
                ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLXJhZGlvIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiA2djZtMCAwaDMiLz48L3N2Zz4='
                : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLXR2Ij48cmVjdCB4PSIyIiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHJ4PSIyIiByeT0iMiIvPjxwb2x5bGluZSBwb2ludHM9IjEyIDYgMTIgMCAxMiAyNCAxMiAxOCIvPjwvc3ZnPg==',
              scale: 0.5,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM
            }
          });
          
          stationEntity.station = station;
        });
      }
    });
    
    // Open the station menu
    toggleStationMenu();
  }, [toggleStationMenu]);

  useEffect(() => {
    if (!cesiumContainer.current) return;

    try {
      console.log('Initializing Cesium viewer...');
      
      // Initialize Cesium viewer with proper configuration for full-screen display
      const cesiumViewer = new Cesium.Viewer(cesiumContainer.current, {
        timeline: false,
        animation: false,
        creditContainer: document.createElement('div'), // Hide credits
        infoBox: false,
        selectionIndicator: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        geocoder: false,
        fullscreenButton: false,
        vrButton: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity
      });

      // Configure the scene for better performance and appearance
      cesiumViewer.scene.globe.enableLighting = true;
      cesiumViewer.scene.globe.dynamicAtmosphereLighting = true;
      cesiumViewer.scene.globe.atmosphereLightIntensity = 10.0;
      cesiumViewer.scene.fog.enabled = true;
      cesiumViewer.scene.fog.density = 0.0002;
      
      // Disable depth testing for better label visibility
      cesiumViewer.scene.globe.depthTestAgainstTerrain = false;
      
      // Configure camera constraints
      cesiumViewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000;
      cesiumViewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000;
      
      // Enable touch-friendly controls for mobile
      cesiumViewer.scene.screenSpaceCameraController.enableRotate = true;
      cesiumViewer.scene.screenSpaceCameraController.enableTranslate = true;
      cesiumViewer.scene.screenSpaceCameraController.enableZoom = true;
      cesiumViewer.scene.screenSpaceCameraController.enableTilt = true;
      cesiumViewer.scene.screenSpaceCameraController.enableLook = true;
      
      // Set up resize handler for responsive design
      const resizeObserver = new ResizeObserver(() => {
        if (cesiumViewer && !cesiumViewer.isDestroyed()) {
          cesiumViewer.resize();
        }
      });
      
      if (cesiumContainer.current) {
        resizeObserver.observe(cesiumContainer.current);
      }

      console.log('Cesium viewer initialized successfully');

      // Set up the camera
      cesiumViewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000), // Start with a global view
      });

      // Set up click handler
      const handler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.scene.canvas);
      handler.setInputAction((event) => {
        const pickedObject = cesiumViewer.scene.pick(event.position);
        
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          if (pickedObject.id.station) {
            // If it's an individual station, select it directly
            useGlobeStore.getState().setSelectedStation(pickedObject.id.station);
          } else if (pickedObject.id.cluster) {
            // If it's a cluster, show the cluster details
            handleClusterClick(pickedObject.id.cluster);
          }
        } else {
          // Clicked on empty space
          const { isPlayerLocked, isCitySelected } = useGlobeStore.getState();
          if (!isPlayerLocked) {
            useGlobeStore.getState().setSelectedStation(null);
            if (isCitySelected) {
              useGlobeStore.getState().setSelectedCity(null);
              // Cleanup circle and station labels
              cesiumViewer.entities.values.forEach(entity => {
                if (entity.circle || entity.stationLabel) {
                  cesiumViewer.entities.remove(entity);
                }
              });
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      
      setViewer(cesiumViewer);
      
      // Setup camera move end handler for dynamic clustering
      const cameraMoveEndHandler = () => {
        const position = cesiumViewer.camera.positionCartographic;
        const height = position.height;
        // Convert height to zoom level (rough approximation)
        const newZoomLevel = Math.max(0, Math.min(20, Math.log(50000000 / height) / Math.log(2)));
        
        // Only update if significantly different to prevent infinite loops
        setZoomLevel(prevZoomLevel => {
          if (Math.abs(prevZoomLevel - newZoomLevel) > 0.01) {
            return newZoomLevel;
          }
          return prevZoomLevel;
        });
      };
      
      cesiumViewer.camera.moveEnd.addEventListener(cameraMoveEndHandler);
      
      // Cleanup
      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (cesiumViewer && !cesiumViewer.isDestroyed()) {
          cesiumViewer.destroy();
        }
      };
    } catch (err) {
      console.error('Error initializing Cesium:', err);
      setError(err.message);
    }
  }, [setViewer, handleClusterClick]);
  
  // Handle camera focus changes
  useEffect(() => {
    if (viewer && cameraFocusTarget) {
      const { longitude, latitude, height = 1000000 } = cameraFocusTarget;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        duration: 2.0,
      });
      setCameraFocusTarget(null); // Clear the target after flying
    }
  }, [viewer, cameraFocusTarget, setCameraFocusTarget]);

  // Cluster stations by grid for dynamic clustering
  const clusterStationsByGrid = useCallback((stations, gridSize = 1.0) => {
    if (!stations || stations.length === 0) return [];
    
    // Create a map to hold grid cells
    const grid = new Map();
    
    // Place stations in grid cells
    stations.forEach(station => {
      // Debug log for stations with missing or invalid coordinates
      if (!station.geo_lat || !station.geo_long) {
        console.log('Station missing coordinates:', station);
        return;
      }
      
      // Check if coordinates are valid numbers
      if (isNaN(station.geo_lat) || isNaN(station.geo_long)) {
        console.log('Station with invalid coordinates:', station);
        return;
      }
      
      // Check if coordinates are in valid range
      if (station.geo_lat < -90 || station.geo_lat > 90 || 
          station.geo_long < -180 || station.geo_long > 180) {
        console.log('Station with out-of-range coordinates:', station);
        return;
      }
      
      // Calculate grid cell coordinates
      const gridLat = Math.floor(station.geo_lat / gridSize) * gridSize;
      const gridLon = Math.floor(station.geo_long / gridSize) * gridSize;
      const gridKey = `${gridLat},${gridLon}`;
      
      // Add to grid cell
      if (!grid.has(gridKey)) {
        grid.set(gridKey, []);
      }
      grid.get(gridKey).push(station);
    });
    
    // Convert grid cells to clusters
    const clusters = [];
    grid.forEach((stationsInCell, gridKey) => {
      if (stationsInCell.length === 0) return;
      
      // Calculate centroid of cluster
      const avgLat = stationsInCell.reduce((sum, s) => sum + s.geo_lat, 0) / stationsInCell.length;
      const avgLon = stationsInCell.reduce((sum, s) => sum + s.geo_long, 0) / stationsInCell.length;
      
      // Check if all stations share the same location hierarchy with proper empty value handling
      const isUniform = (field) => {
        const values = stationsInCell.map(s => s[field]).filter(v => v && v !== 'Unknown' && v !== 'Unknown City');
        return values.length > 0 && new Set(values).size === 1;
      };

      let clusterLabel = '';
      // Only use city + country if both are uniformly shared
      if (isUniform('city') && isUniform('country')) {
        clusterLabel = `${stationsInCell[0].city}, ${stationsInCell[0].country}`;
      }
      // Fall back to city only if uniformly shared
      else if (isUniform('city')) {
        clusterLabel = stationsInCell[0].city;
      }
      // No label if neither city nor country are uniform
      
      // Helper function to find the most frequent item in an array
      const getMostFrequent = (arr, key) => {
        if (!arr || arr.length === 0) return null;
        const counts = {};
        arr.forEach(item => {
          const value = item[key];
          if (value) {
            counts[value] = (counts[value] || 0) + 1;
          }
        });
        let maxCount = 0;
        let mostFrequent = null;
        for (const value in counts) {
          if (counts[value] > maxCount) {
            maxCount = counts[value];
            mostFrequent = value;
          }
        }
        return mostFrequent;
      };

      const topCountry = getMostFrequent(stationsInCell, 'country');
      const topCity = getMostFrequent(stationsInCell, 'city');
      
      // Get top 3 stations by popularity (click count)
      const topStations = [...stationsInCell]
        .sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0))
        .slice(0, 3);
      
      clusters.push({
        latitude: avgLat,
        longitude: avgLon,
        count: stationsInCell.length,
        label: clusterLabel,
        country: topCountry,
        city: topCity || 'Media Cluster',
        stations: stationsInCell,
        topStations: topStations
      });
    });
    
    return clusters;
  }, []);

  // Memoize the clusters to prevent infinite loops
  const clusteredMarkers = useMemo(() => {
    if (mediaStations.length === 0) return [];
    
    // Determine clustering grid size based on zoom level
    // Higher zoom = smaller grid = more individual markers
    let gridSize;
    if (zoomLevel < 2) {
      gridSize = 5.0; // Very coarse clustering
    } else if (zoomLevel < 4) {
      gridSize = 2.0; // Coarse clustering
    } else if (zoomLevel < 6) {
      gridSize = 1.0; // Medium clustering
    } else if (zoomLevel < 8) {
      gridSize = 0.5; // Fine clustering
    } else {
      gridSize = 0.1; // Very fine or no clustering
    }
    
    // Apply clustering
    return gridSize < 10 ? clusterStationsByGrid(mediaStations, gridSize) : mediaStations.map(station => ({
      city: station.city || 'Station',
      country: station.country || 'Unknown',
      latitude: station.geo_lat,
      longitude: station.geo_long,
      count: 1,
      stations: [station],
      topStations: [station]
    }));
  }, [mediaStations, zoomLevel, clusterStationsByGrid]);

  // Add markers to the globe
  useEffect(() => {
    if (!viewer) return;
    
    console.log('Updating markers:', {
      clusteredMarkers: clusteredMarkers.length,
      zoomLevel: zoomLevel,
      tvCount: clusteredMarkers.filter(m => m.stations && m.stations.some(s => s.type === 'tv')).length,
      radioCount: clusteredMarkers.filter(m => m.stations && m.stations.some(s => s.type === 'radio')).length
    });
    
    try {
      // Clear existing entities
      viewer.entities.removeAll();

      // Add markers for each cluster or individual station
      clusteredMarkers.forEach((marker, index) => {
        // Determine marker size based on count
        const baseSize = marker.count === 1 ? 8 : 12;
        const maxSize = 30;
        // Reduce size by 80% (keep 20% of original size)
        const size = Math.min((baseSize + Math.log(marker.count) * 3) * 0.2, maxSize * 0.2);
        
        // Determine color based on station types
        const hasRadio = marker.stations.some(s => s.type === 'radio');
        const hasTV = marker.stations.some(s => s.type === 'tv');
        let color;
        
        if (hasRadio && hasTV) {
          color = Cesium.Color.PURPLE.withAlpha(0.8); // Mixed
        } else if (hasRadio) {
          color = Cesium.Color.CYAN.withAlpha(0.8); // Radio only
        } else {
          color = Cesium.Color.ORANGE.withAlpha(0.8); // TV only
        }
        
        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(
            marker.longitude,
            marker.latitude
          ),
          point: {
            pixelSize: size,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: marker.count === 1 ? 1 : 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: marker.count === 1
              ? (marker.stations[0].name || 'Unknown Station')
              : marker.label ? `${marker.label} (${marker.count})` : '',
            font: '12pt sans-serif',
            pixelOffset: new Cesium.Cartesian2(0, -25 - (index % 5) * 5), // Stagger labels
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: true,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
            show: marker.count >= 3 || zoomLevel > 5 // Show labels for larger clusters or when zoomed in
          },
        });
        
        // Attach data to the entity
        if (marker.count === 1) {
          entity.station = marker.stations[0];
        } else {
          entity.cluster = marker;
        }
      });
    } catch (error) {
      console.error('Error adding markers to globe:', error);
    }
  }, [viewer, clusteredMarkers, zoomLevel]);

  // Add mouse move handler for hover interactions
  useEffect(() => {
    if (!viewer) return;

    const mouseHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    mouseHandler.setInputAction((movement) => {
      const pickedObject = viewer.scene.pick(movement.endPosition);
      
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.station) {
        // Show hover effect for station
        if (pickedObject.id.label) {
          pickedObject.id.label.scale = 1.2;
          pickedObject.id.label.fillColor = Cesium.Color.YELLOW;
          // Show label only for hovered station
          pickedObject.id.label.show = true;
        }
        
        // Show tooltip with station info
        const tooltip = document.getElementById('station-tooltip');
        if (tooltip && pickedObject.id.station) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${movement.endPosition.x + 10}px`;
          tooltip.style.top = `${movement.endPosition.y + 10}px`;
          tooltip.innerHTML = `
            <div class="bg-black/80 text-white p-2 rounded shadow-lg max-w-xs">
              <h4 class="font-bold">${pickedObject.id.station.name || 'Unknown Station'}</h4>
              <p class="text-sm">${pickedObject.id.station.country || 'Unknown Country'}</p>
              <p class="text-xs mt-1">${Array.isArray(pickedObject.id.station.tags) ? pickedObject.id.station.tags.join(', ') : pickedObject.id.station.tags || ''}</p>
            </div>
          `;
        }
      } else {
        // Reset all station labels
        viewer.entities.values.forEach(entity => {
          if (entity.station && entity.label) {
            entity.label.scale = 0.8;
            entity.label.fillColor = Cesium.Color.WHITE;
            // Hide labels by default to reduce clutter
            entity.label.show = false;
          }
        });
        
        // Hide tooltip
        const tooltip = document.getElementById('station-tooltip');
        if (tooltip) {
          tooltip.style.display = 'none';
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Cleanup mouse handler on component unmount
    return () => {
      if (mouseHandler) {
        mouseHandler.destroy();
      }
    };
  }, [viewer]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-900 text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Globe</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={cesiumContainer} 
      className="absolute inset-0 w-full h-full"
      style={{ 
        background: 'linear-gradient(to bottom, #000428, #004e92)',
        touchAction: 'none' // Prevent default touch behaviors on mobile
      }}
    />
  );
};

export default Globe;
