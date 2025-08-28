#!/bin/bash

# Comprehensive Stream Management Setup Script
# This script sets up automatic stream validation and updates for both radio and TV

echo "=== Setting Up Comprehensive Stream Management ==="

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Project directory: $PROJECT_DIR"

# Create backup of current data files
echo "Creating backups of current data files..."
mkdir -p "$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
cp "$PROJECT_DIR/src/data/radioStations.json" "$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)/radioStations.json" 2>/dev/null || echo "No radio stations backup needed"
cp "$PROJECT_DIR/src/data/tvStations.json" "$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)/tvStations.json" 2>/dev/null || echo "No TV stations backup needed"
cp "$PROJECT_DIR/src/data/tvStationsWithUrls.json" "$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)/tvStationsWithUrls.json" 2>/dev/null || echo "No TV stations with URLs backup needed"

# Create the main update script
cat > "$PROJECT_DIR/scripts/update-all-streams.sh" << 'EOF'
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
EOF

# Make the script executable
chmod +x "$PROJECT_DIR/scripts/update-all-streams.sh"

# Create a simplified manual update script
cat > "$PROJECT_DIR/scripts/manual-update.sh" << 'EOF'
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
EOF

# Make the manual update script executable
chmod +x "$PROJECT_DIR/scripts/manual-update.sh"

# Set up cron jobs for automatic updates
echo "Setting up automatic updates..."

# Add to crontab (runs radio updates on Wednesdays at 3 AM, TV updates on Sundays at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * 3 /bin/bash $PROJECT_DIR/scripts/update-all-streams.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * 0 /bin/bash $PROJECT_DIR/scripts/update-all-streams.sh") | crontab -

# Create a monitoring script to check stream health
cat > "$PROJECT_DIR/scripts/monitor-streams.sh" << 'EOF'
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
EOF

# Make monitoring script executable
chmod +x "$PROJECT_DIR/scripts/monitor-streams.sh"

# Create a cleanup script for old backups
cat > "$PROJECT_DIR/scripts/cleanup-backups.sh" << 'EOF'
#!/bin/bash

# Cleanup Old Backups
# Removes backups older than 30 days

BACKUP_DIR="/Users/johnny/Downloads/Interactive 3D Globe for Live Media Streaming/backups"

if [ -d "$BACKUP_DIR" ]; then
    echo "Cleaning up backups older than 30 days..."
    find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null
    echo "Cleanup completed."
else
    echo "Backup directory not found."
fi
EOF

# Make cleanup script executable
chmod +x "$PROJECT_DIR/scripts/cleanup-backups.sh"

# Add cleanup to crontab (runs monthly)
(crontab -l 2>/dev/null; echo "0 0 1 * * /bin/bash $PROJECT_DIR/scripts/cleanup-backups.sh") | crontab -

echo ""
echo "=== Setup Complete ==="
echo "The following has been configured:"
echo "1. Automatic stream updates (Wednesdays and Sundays at 3 AM)"
echo "2. Backup system for data files"
echo "3. Manual update capability"
echo "4. Stream health monitoring"
echo "5. Monthly backup cleanup"
echo ""
echo "=== Manual Commands ==="
echo "To manually update streams:"
echo "  cd /Users/johnny/Downloads/Interactive\\ 3D\\ Globe\\ for\\ Live\\ Media\\ Streaming"
echo "  ./scripts/manual-update.sh"
echo ""
echo "To monitor stream health:"
echo "  ./scripts/monitor-streams.sh"
echo ""
echo "To view update logs:"
echo "  tail -f update-streams.log"
echo ""
echo "=== File Locations ==="
echo "Data files: src/data/"
echo "Scripts: scripts/"
echo "Backups: backups/"
echo ""
echo "=== Next Steps ==="
echo "1. Run a manual update to verify everything works:"
echo "   ./scripts/manual-update.sh"
echo ""
echo "2. Check the logs if there are any issues:"
echo "   tail -f update-streams.log"
echo ""
echo "Setup completed successfully!"