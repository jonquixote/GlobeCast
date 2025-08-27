import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import useGlobeStore from '../store/useGlobeStore';

// Set Cesium Ion access token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3OTA4NDgwNC1kY2U0LTQwZDgtOTkzYi1iNDcwNjYzYzQ4MzkiLCJpZCI6MzMyOTY2LCJpYXQiOjE3NTU1MTgwMTh9.NG_8CiTTqadGIjdOctXOV83eSZWpN_w6a8RgtlSQX_k';

const Globe = () => {
  const cesiumContainer = useRef(null);
  const [error, setError] = useState(null);
  const { 
    setViewer, 
    viewer, 
    allStations, 
    setSelectedStation, 
    cameraFocusTarget,
    setCameraFocusTarget 
  } = useGlobeStore();

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
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.station) {
          setSelectedStation(pickedObject.id.station);
        } else {
          // Clicked on empty space, close player if not locked
          const { isPlayerLocked } = useGlobeStore.getState();
          if (!isPlayerLocked) {
            setSelectedStation(null);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      setViewer(cesiumViewer);

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
  }, [setViewer, setSelectedStation]);

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

  // Add station markers to the globe (simplified for now)
  useEffect(() => {
    if (!viewer || !allStations.length) return;

    // Check if viewer is properly initialized before accessing entities
    if (!viewer.entities) {
      console.warn('Cesium viewer entities not available yet');
      return;
    }

    try {
      // Clear existing entities
      viewer.entities.removeAll();

      // Add markers for each station
      allStations.forEach((station) => {
        if (!station.geo_lat || !station.geo_long) return;

        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(
            parseFloat(station.geo_long),
            parseFloat(station.geo_lat)
          ),
          point: {
            pixelSize: 10,
            color: station.type === 'radio' ? Cesium.Color.CYAN : Cesium.Color.ORANGE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: station.name,
            font: '12pt sans-serif',
            pixelOffset: new Cesium.Cartesian2(0, -50),
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          },
        });

        // Attach station data to the entity
        entity.station = station;
      });
    } catch (error) {
      console.error('Error adding station markers to globe:', error);
    }
  }, [viewer, allStations]);

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

