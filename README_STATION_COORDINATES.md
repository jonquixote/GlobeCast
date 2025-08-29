# Station Coordinate Management System

This directory contains scripts for managing and fixing station coordinates in the Interactive 3D Globe for Live Media Streaming project.

## Overview

The scripts in this directory help maintain the accuracy of station coordinates, ensuring that all stations appear in their correct geographical locations rather than in the middle of the Atlantic Ocean or other incorrect locations.

## Scripts

### Primary Fixing Scripts

1. `fixStationCoordinates.js` - Initial implementation for fixing station coordinates
2. `fixStationCoordinatesImproved.js` - Enhanced version with better error handling
3. `fixStationCoordinatesRobust.js` - More robust implementation with caching
4. `fixAllStationCoordinatesProperly.js` - Updates files in place
5. `fixStationCoordinatesFinal.js` - Final version with fallback geocoding
6. `fixAllStationCoordinatesComprehensive.js` - Comprehensive fixing script (latest)
7. `enhancedFixTVStations.js` - Enhanced fixing and verification system (recommended)

### Verification Scripts

1. `verifyStationCoordinates.js` - Basic verification of coordinate validity
2. `comprehensiveVerification.js` - Detailed verification of all data files
3. `checkForInvalidStations.js` - Check for new stations with invalid coordinates
4. `findAtlanticStations.js` - Identify stations in the Atlantic Ocean

### Utility Scripts

1. `checkCoordinates.js` - Simple coordinate validation
2. `checkFixedStations.js` - Verify specific stations
3. `debugFixStations.js` - Debug remaining issues
4. `findPlaceholderRadioStations.js` - Find radio stations with placeholder coordinates
5. `findPlaceholderStations.js` - Find stations with placeholder coordinates

### Maintenance Scripts

1. `maintainStationCoordinates.js` - Periodic maintenance script
2. `updateStationCoordinates.js` - Update station coordinates

## How to Use

### Verify Current Status

To check if all stations have valid coordinates:

```bash
node checkForInvalidStations.js
```

Or for more detailed verification:

```bash
node enhancedFixTVStations.js --verify
```

### Fix Invalid Coordinates

To fix any stations with invalid coordinates:

```bash
node enhancedFixTVStations.js
```

Or to run the comprehensive fix:

```bash
node fixAllStationCoordinatesComprehensive.js
```

### Check for Atlantic Ocean Stations

To specifically check for stations appearing in the Atlantic Ocean:

```bash
node findAtlanticStations.js
```

## Reports

1. `FINAL_STATION_COORDINATE_FIX_REPORT.md` - Final report on station coordinate fixing
2. `STATION_COORDINATE_FIXING_SUMMARY.md` - Summary of improvements made
3. `STATION_FIX_SUMMARY.md` - General summary of station fixes
4. `FIXES_SUMMARY.md` - Summary of all fixes applied
5. `VERCEL_FIX_SUMMARY.md` - Summary of Vercel deployment fixes

## Data Files

The scripts work with the following data files:

1. `./src/data/tvStationsWithUrls.json` - TV stations with coordinates
2. `./src/data/radioStations.json` - Radio stations with coordinates
3. `./tv_stations_with_coords.json` - Additional TV station data
4. `./radio_stations_with_coords.json` - Additional radio station data

## Best Practices

1. **Regular Verification**: Run verification scripts monthly to catch any new issues
2. **Backup Before Changes**: Always backup data files before running fixing scripts
3. **Rate Limiting**: Scripts include delays to respect API rate limits
4. **Caching**: Results are cached to minimize API calls
5. **Error Handling**: All scripts include comprehensive error handling

## Adding New Stations

When adding new stations to the dataset:

1. Ensure they have valid city/country information
2. Run the verification script to check for issues
3. If needed, run the fixing script to geocode new stations
4. Manually verify critical stations in the 3D globe

## Troubleshooting

If stations appear in incorrect locations:

1. Run `checkForInvalidStations.js` to identify issues
2. Run `enhancedFixTVStations.js` to fix invalid coordinates
3. Check the 3D globe to verify stations are in correct locations
4. If problems persist, manually verify station location data