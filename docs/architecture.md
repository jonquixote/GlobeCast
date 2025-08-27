# Application Architecture: 3D Globe Media Streamer

## 1. Overview

The 3D Globe Media Streamer is a web-based application designed to provide an interactive and visually stunning experience for discovering live radio and TV stations worldwide. The core of the application is a photorealistic 3D globe, acting as the primary user interface, where media stations are represented as interactive markers. Clicking on a marker will activate a floating media player for instant playback.

## 2. Architectural Layers

The application is structured into three main architectural layers:

### 2.1. Foundational Technology Stack

This layer comprises the core libraries and frameworks that provide the underlying capabilities for 3D globe rendering, user interface, and media playback.

*   **Geospatial Engine:** CesiumJS (for high-precision WGS84 ellipsoid model, realistic rendering, and geospatial accuracy).
*   **User Interface (UI) Framework:** React (for building a responsive and interactive UI).
*   **Media Playback Engine:** Video.js with HLS.js (for reliable and consistent video/audio playback across browsers, supporting HLS).

### 2.2. Data Acquisition and Processing Pipeline

This layer is responsible for sourcing, normalizing, and geolocating media streams from various open-source databases.

*   **Radio Streams:** Radio-Browser.info API (provides structured JSON data with explicit geographic coordinates).
*   **IPTV Streams:** iptv-org GitHub repository (aggregates publicly available streams in M3U playlist files, requiring parsing and geolocation).
*   **IP Geolocation API:** A third-party IP geolocation service (e.g., ip-api.com) to infer geographic coordinates for IPTV streams based on hostnames.

### 2.3. Core Application Implementation

This layer focuses on building the user-facing features and managing the interactions between the UI and the 3D globe.

*   **Interactive Globe:** Initialization of Cesium.Viewer, adding interactive markers (Cesium.Entity) for stations, and performance optimizations (Entity Clustering).
*   **State Management Bridge:** A critical pattern to manage communication between the declarative React UI and the imperative CesiumJS globe. A central state store will synchronize data and events between these two 


worlds. This involves:
    *   **Globe to UI Flow:** Cesium.ScreenSpaceEventHandler listens for clicks on the globe. If a station marker is clicked, an action is dispatched to the central state store to update the `selectedStation` state. UI components subscribed to this state will re-render to display the media player.
    *   **UI to Globe Flow:** User actions in the UI (e.g., clicking an item in a list) dispatch an action to the central store to set a `cameraFocusTarget` state. A dedicated React `useEffect` hook (or similar pattern) listens for changes to `cameraFocusTarget` and executes imperative CesiumJS code (e.g., `viewer.camera.flyTo()`) to move the globe's camera.
*   **Floating Media Player:** A UI component that renders conditionally based on `selectedStation` state. It will be positioned using `@floating-ui/react` and anchored to the selected station's 2D pixel coordinates on the screen (obtained via `Cesium.SceneTransforms.wgs84ToWindowCoordinates()`). It will initialize a Video.js player instance with HLS.js for playback.

## 3. Data Flow

### 3.1. Radio Station Data Flow

1.  **Sourcing:** Application fetches radio station data from the Radio-Browser.info API.
2.  **Processing:** The API provides structured JSON with `geo_lat` and `geo_long` coordinates, which are directly used.
3.  **Display:** Each radio station is represented as a `Cesium.Entity` (marker) on the globe at its specified coordinates.

### 3.2. TV Station Data Flow

1.  **Sourcing:** Application fetches M3U playlist files from the iptv-org GitHub repository.
2.  **Parsing:** A JavaScript library (e.g., `m3u-parser-generator`) parses the M3U file into a structured JavaScript object.
3.  **Hostname Extraction:** For each stream, the hostname is extracted from the stream URL.
4.  **Geolocation:** The extracted hostname is used to query a free IP geolocation API (e.g., ip-api.com) to resolve its IP address and estimate geographic coordinates.
5.  **Caching:** Geolocation results are cached to avoid redundant API calls and improve performance.
6.  **Display:** Each TV station is represented as a `Cesium.Entity` (marker) on the globe at its inferred coordinates.

## 4. Performance Optimizations

*   **Entity Clustering:** CesiumJS's `EntityCluster` data source wrapper will be used to automatically group nearby markers into a single, clickable cluster when viewed from a distance, reducing rendering load.
*   **Data Virtualization:** For any long lists of stations in the UI, libraries like `react-window` will be considered to prevent performance degradation from rendering thousands of DOM elements.
*   **Web Workers:** Data parsing and geolocation for IPTV streams will be performed in Web Workers to avoid blocking the main UI thread.

## 5. Geo-Blocking Considerations

To manage user expectations regarding geo-blocked content:

1.  A one-time IP geolocation lookup of the user's location will be performed.
2.  The user's country will be compared to the stream's country of origin (inferred from IP geolocation).
3.  Streams that are likely to be geo-blocked will be visually differentiated on the globe.

## 6. Component Diagram (High-Level)

```mermaid
graph TD
    A[User Interface (React)] --> B{State Management Bridge}
    B --> C[3D Globe (CesiumJS)]
    B --> D[Floating Media Player (Video.js/HLS.js)]
    C --> B
    E[Radio-Browser.info API] --> F[Data Processing (Radio)]
    G[iptv-org M3U Playlists] --> H[Data Processing (IPTV)]
    H --> I[IP Geolocation API]
    F --> B
    I --> H
    H --> B
```

