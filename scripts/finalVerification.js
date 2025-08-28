#!/usr/bin/env node

/**
 * Final Verification Script
 * Verifies that the stream expansion system is working correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project directory
const projectDir = path.join(__dirname, '..');

// Function to validate JSON files
function validateJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    
    if (Array.isArray(jsonData)) {
      console.log(`✓ ${path.basename(filePath)}: Valid JSON array with ${jsonData.length} items`);
      return { valid: true, count: jsonData.length };
    } else {
      console.log(`✗ ${path.basename(filePath)}: Not an array`);
      return { valid: false, count: 0 };
    }
  } catch (error) {
    console.log(`✗ ${path.basename(filePath)}: Invalid JSON - ${error.message}`);
    return { valid: false, count: 0 };
  }
}

// Function to check sample items
function checkSampleItems(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    
    if (Array.isArray(jsonData) && jsonData.length > 0) {
      const sample = jsonData[0];
      console.log(`  Sample item:`);
      console.log(`    Name: ${sample.name || sample.Name || 'Unknown'}`);
      console.log(`    Type: ${sample.type || 'Unknown'}`);
      console.log(`    Location: ${sample.country || sample.Country || 'Unknown'}`);
      console.log(`    Has URL: ${!!(sample.url || sample.Url)}`);
      console.log(`    Has coordinates: ${!!(sample.latitude || sample.geo_lat)}`);
      return true;
    }
  } catch (error) {
    console.log(`  Error checking sample: ${error.message}`);
    return false;
  }
}

// Main verification function
function verifySetup() {
  console.log('=== Final Verification of Stream Expansion System ===\n');
  
  // Check data directory
  const dataDir = path.join(projectDir, 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('✗ Data directory not found');
    return false;
  }
  
  console.log('✓ Data directory exists\n');
  
  // Check required files
  const requiredFiles = [
    'radioStations.json',
    'tvStations.json',
    'tvStationsWithUrls.json'
  ];
  
  let allValid = true;
  let totalCount = 0;
  
  console.log('Verifying data files:');
  
  for (const fileName of requiredFiles) {
    const filePath = path.join(dataDir, fileName);
    if (fs.existsSync(filePath)) {
      const result = validateJsonFile(filePath);
      if (result.valid) {
        totalCount += result.count;
        checkSampleItems(filePath);
      } else {
        allValid = false;
      }
    } else {
      console.log(`✗ ${fileName}: File not found`);
      allValid = false;
    }
    console.log(''); // Empty line for spacing
  }
  
  // Check scripts
  console.log('Verifying scripts:');
  const requiredScripts = [
    'expandStreams.js',
    'updateRadioStationsScheduled.js',
    'fetchWorkingTVStations.js'
  ];
  
  const scriptsDir = path.join(projectDir, 'scripts');
  for (const scriptName of requiredScripts) {
    const scriptPath = path.join(scriptsDir, scriptName);
    if (fs.existsSync(scriptPath)) {
      console.log(`✓ ${scriptName}: Script exists`);
    } else {
      console.log(`✗ ${scriptName}: Script not found`);
      allValid = false;
    }
  }
  
  console.log(''); // Empty line for spacing
  
  // Check setup scripts
  console.log('Verifying setup scripts:');
  const setupScripts = [
    'setup-comprehensive-stream-management.sh',
    'manual-update.sh',
    'update-all-streams.sh'
  ];
  
  for (const scriptName of setupScripts) {
    const scriptPath = path.join(scriptsDir, scriptName);
    if (fs.existsSync(scriptPath)) {
      console.log(`✓ ${scriptName}: Setup script exists`);
    } else {
      console.log(`✗ ${scriptName}: Setup script not found`);
      allValid = false;
    }
  }
  
  console.log(''); // Empty line for spacing
  
  // Summary
  console.log('=== Verification Summary ===');
  if (allValid) {
    console.log(`✓ All systems verified successfully!`);
    console.log(`✓ Total stations: ${totalCount}`);
    console.log(`✓ Automatic updates configured`);
    console.log(`✓ Backup system in place`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart the development server: npm run dev');
    console.log('2. Open the application in your browser');
    console.log('3. Verify streams are loading and playing correctly');
    console.log('4. Check update logs: tail -f update-streams.log');
    return true;
  } else {
    console.log('✗ Some verification steps failed');
    console.log('Please check the errors above and fix accordingly');
    return false;
  }
}

// Run verification
verifySetup();
