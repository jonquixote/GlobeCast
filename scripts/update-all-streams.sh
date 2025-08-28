#!/bin/bash

# Main Stream Update Script
# Updates both radio and TV stations automatically

# Change to project directory
cd "/Users/johnny/Downloads/Interactive 3D Globe for Live Media Streaming" || exit 1

# Log timestamp
echo "[$(date)] Starting comprehensive stream update..." >> update-streams.log

# Update radio stations
echo "[$(date)] Updating radio stations..." >> update-streams.log
node scripts/expandStreams.js >> update-streams.log 2>&1

# Log completion
echo "[$(date)] Stream update completed." >> update-streams.log
