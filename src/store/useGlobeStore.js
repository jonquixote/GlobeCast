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
  isCitySelected: false,
  isPlayerLocked: false,
  isPlayerFullscreen: false,
  
  // Camera and interaction
  cameraFocusTarget: null,
  
  // Loading states
  isLoadingRadio: false,
  isLoadingTV: false,
  
  // User location for geo-blocking
  userLocation: null,
  
  // UI state for collapsible menus
  isStationMenuOpen: false,
  isRadioMenuOpen: true,
  isTVMenuOpen: true,
  
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
  
  setSelectedCity: (city) => set({
    selectedCity: city,
    isCitySelected: !!city
  }),
  
  setLoadingRadio: (loading) => set({ isLoadingRadio: loading }),
  setLoadingTV: (loading) => set({ isLoadingTV: loading }),
  
  setUserLocation: (location) => set({ userLocation: location }),
  
  closePlayer: () => set({ 
    selectedStation: null, 
    isPlayerVisible: false,
    isPlayerLocked: false,
    isPlayerFullscreen: false
  }),
  
  // UI Actions for collapsible menus
  toggleStationMenu: () => set((state) => ({ isStationMenuOpen: !state.isStationMenuOpen })),
  toggleRadioMenu: () => set((state) => ({ isRadioMenuOpen: !state.isRadioMenuOpen })),
  toggleTVMenu: () => set((state) => ({ isTVMenuOpen: !state.isTVMenuOpen })),
  
  // Close all menus
  closeAllMenus: () => set({ 
    isStationMenuOpen: false,
    isRadioMenuOpen: false,
    isTVMenuOpen: false
  }),
}));

export default useGlobeStore;

