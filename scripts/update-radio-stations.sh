#!/bin/bash

# Automatic Radio Station Update Script
# This script updates the radio stations data

# Change to project directory
cd "/Users/johnny/Downloads/Interactive 3D Globe for Live Media Streaming" || exit 1

# Run the update script
echo "[$(date)] Updating radio stations..." >> update-radio-stations.log
node scripts/updateRadioStationsScheduled.js >> update-radio-stations.log 2>&1
echo "[$(date)] Update completed." >> update-radio-stations.log
