import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import useGlobeStore from '../store/useGlobeStore';
import useMediaStations from '../hooks/useMediaStations';

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
  
  const { radioStations, tvStations, clusterStationsByGrid } = useMediaStations();
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(0);

  // Handle cluster click interactions
  const handleClusterClick = (cluster) => {
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
  };

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
      cesiumViewer.camera.moveEnd.addEventListener(() => {
        const position = cesiumViewer.camera.positionCartographic;
        const height = position.height;
        // Convert height to zoom level (rough approximation)
        const newZoomLevel = Math.max(0, Math.min(20, Math.log(50000000 / height) / Math.log(2)));
        setZoomLevel(newZoomLevel);
      });
      
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
  }, [setViewer, toggleStationMenu]);
  
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

  // Dynamic clustering based on zoom level
  useEffect(() => {
    if (!viewer || (radioStations.length === 0 && tvStations.length === 0)) return;
    
    const allStations = [...radioStations, ...tvStations];
    
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
    const clusteredMarkers = gridSize < 10 ? clusterStationsByGrid(allStations, gridSize) : allStations.map(station => ({
      city: station.city || 'Station',
      country: station.country || 'Unknown',
      latitude: station.latitude,
      longitude: station.longitude,
      count: 1,
      stations: [station],
      topStations: [station]
    }));
    
    setVisibleMarkers(clusteredMarkers);
  }, [viewer, radioStations, tvStations, zoomLevel, clusterStationsByGrid]);

  // Add markers to the globe
  useEffect(() => {
    if (!viewer) return;
    
    console.log('Updating markers:', {
      visibleMarkers: visibleMarkers.length,
      zoomLevel: zoomLevel
    });
    
    try {
      // Clear existing entities
      viewer.entities.removeAll();

      // Add markers for each cluster or individual station
      visibleMarkers.forEach((marker, index) => {
        // Determine marker size based on count
        const baseSize = marker.count === 1 ? 8 : 12;
        const maxSize = 30;
        const size = Math.min(baseSize + Math.log(marker.count) * 3, maxSize);
        
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
              ? (marker.stations[0].city || marker.stations[0].name)
              : `${marker.city} (${marker.count})`,
            font: '12pt sans-serif',
            pixelOffset: new Cesium.Cartesian2(0, -25 - (index % 5) * 5), // Stagger labels
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
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
  }, [viewer, visibleMarkers, zoomLevel]);

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
              <h4 class="font-bold">${pickedObject.id.station.name}</h4>
              <p class="text-sm">${pickedObject.id.station.country}</p>
              <p class="text-xs mt-1">${pickedObject.id.station.tags?.split(',')[0] || ''}</p>
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
