#!/bin/bash

# Automatic TV Station Update Script
# This script updates the TV stations data

# Change to project directory
cd "/Users/johnny/Downloads/Interactive 3D Globe for Live Media Streaming" || exit 1

# Run the update script
echo "[$(date)] Updating TV stations..." >> update-tv-stations.log
node scripts/updateTVStationsScheduled.js >> update-tv-stations.log 2>&1
echo "[$(date)] Update completed." >> update-tv-stations.log
