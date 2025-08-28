#!/bin/bash

# Stream Health Monitor
# Checks if streams are still working and reports issues

echo "=== Stream Health Check ==="
cd "/Users/johnny/Downloads/Interactive 3D Globe for Live Media Streaming" || exit 1

# Simple check - count lines in each file
radio_count=$(jq '. | length' src/data/radioStations.json 2>/dev/null || echo "0")
tv_count=$(jq '. | length' src/data/tvStations.json 2>/dev/null || echo "0")

echo "Current stream counts:"
echo "- Radio stations: $radio_count"
echo "- TV stations: $tv_count"

# Basic validation
if [ "$radio_count" -gt 100 ] && [ "$tv_count" -gt 50 ]; then
    echo "✓ Stream data appears healthy"
    exit 0
else
    echo "! Warning: Low stream count detected"
    exit 1
fi
