#!/usr/bin/env node

/**
 * Maintenance script to periodically check and fix station coordinates
 * 
 * This script should be run periodically to ensure all stations have valid coordinates.
 * It will:
 * 1. Verify all station coordinates
 * 2. Fix any invalid or placeholder coordinates
 * 3. Generate a report of actions taken
 */

import { verifyAllStationCoordinates } from './verifyStationCoordinates.js';
import { fixAllStationCoordinates } from './fixStationCoordinatesFinal.js';

async function runMaintenance() {
  console.log('=== Station Coordinate Maintenance Script ===');
  console.log(new Date().toISOString());
  console.log('');
  
  try {
    // First, verify the current state
    console.log('1. Verifying current station coordinates...');
    await verifyAllStationCoordinates();
    console.log('');
    
    // Then, run the fixing script to address any issues
    console.log('2. Fixing any invalid coordinates...');
    await fixAllStationCoordinates();
    console.log('');
    
    // Finally, verify again to confirm all issues are resolved
    console.log('3. Verifying fixes...');
    await verifyAllStationCoordinates();
    console.log('');
    
    console.log('=== Maintenance Complete ===');
  } catch (error) {
    console.error('Maintenance failed:', error);
    process.exit(1);
  }
}

// If this script is run directly, execute the maintenance function
if (import.meta.url === `file://${process.argv[1]}`) {
  runMaintenance();
}

export { runMaintenance };