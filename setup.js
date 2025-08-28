#!/usr/bin/env node

// setup.js - Setup script to prepare the application for full automation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source and destination paths
const sourceDir = path.join(__dirname);
const publicDir = path.join(__dirname, 'public');

// Files to copy
const filesToCopy = [
  'tv_stations_with_coords.json',
  'radio_stations_with_coords.json'
];

console.log('Setting up Globe Media Streamer for automation...');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  console.log('Creating public directory...');
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy files to public directory
filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(publicDir, file);
  
  if (fs.existsSync(sourcePath)) {
    console.log(`Copying ${file} to public directory...`);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${file}`);
  } else {
    console.warn(`⚠ Warning: ${file} not found in source directory`);
  }
});

console.log('Setup complete! Files copied to public directory.');
console.log('To start the application:');
console.log('1. Run "npm run start-server" to start the backend API');
console.log('2. Run "npm run dev" to start the frontend development server');
console.log('3. Access the application at http://localhost:5173');