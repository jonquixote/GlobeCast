#!/bin/bash

# Manual Stream Update Script
# Run this script to manually update streams

echo "=== Manual Stream Update ==="

# Change to project directory
cd "/Users/johnny/Downloads/Interactive 3D Globe for Live Media Streaming" || exit 1

echo "Starting stream validation and update..."

# Run the expansion script
node scripts/expandStreams.js

echo "Stream update completed!"
echo "Check the application to see the new streams."
