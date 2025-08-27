import { create } from 'zustand';

const useGlobeStore = create((set, get) => ({
  // Globe state
  viewer: null,
  isGlobeReady: false,
  
  // Station data
  radioStations: [],
  tvStations: [],
  allStations: [],
  
  // Selected station and media player
  selectedStation: null,
  isPlayerVisible: false,
  isPlayerLocked: false,
  isPlayerFullscreen: false,
  
  // Camera and interaction
  cameraFocusTarget: null,
  
  // Loading states
  isLoadingRadio: false,
  isLoadingTV: false,
  
  // User location for geo-blocking
  userLocation: null,
  
  // Actions
  setViewer: (viewer) => set({ viewer, isGlobeReady: true }),
  
  setRadioStations: (stations) => set((state) => {
    const allStations = [...stations, ...state.tvStations];
    return { radioStations: stations, allStations };
  }),
  
  setTVStations: (stations) => set((state) => {
    const allStations = [...state.radioStations, ...stations];
    return { tvStations: stations, allStations };
  }),
  
  setSelectedStation: (station) => set({ 
    selectedStation: station,
    isPlayerVisible: !!station 
  }),
  
  togglePlayerLock: () => set((state) => ({ 
    isPlayerLocked: !state.isPlayerLocked 
  })),
  
  togglePlayerFullscreen: () => set((state) => ({ 
    isPlayerFullscreen: !state.isPlayerFullscreen 
  })),
  
  setCameraFocusTarget: (target) => set({ cameraFocusTarget: target }),
  
  setLoadingRadio: (loading) => set({ isLoadingRadio: loading }),
  setLoadingTV: (loading) => set({ isLoadingTV: loading }),
  
  setUserLocation: (location) => set({ userLocation: location }),
  
  closePlayer: () => set({ 
    selectedStation: null, 
    isPlayerVisible: false,
    isPlayerLocked: false,
    isPlayerFullscreen: false
  }),
}));

export default useGlobeStore;

