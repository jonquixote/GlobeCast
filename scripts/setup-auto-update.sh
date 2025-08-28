#!/bin/bash

# Setup Script for Automatic TV Station Updates
# This script sets up a cron job to automatically update TV stations weekly

echo "Setting up automatic TV station updates..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Create the update script
cat > "$PROJECT_DIR/scripts/update-tv-stations.sh" << 'EOF'
#!/bin/bash

# Automatic TV Station Update Script
# This script updates the TV stations data

# Change to project directory
cd "/Users/johnny/Downloads/Interactive 3D Globe for Live Media Streaming" || exit 1

# Run the update script
echo "[$(date)] Updating TV stations..." >> update-tv-stations.log
node scripts/updateTVStationsScheduled.js >> update-tv-stations.log 2>&1
echo "[$(date)] Update completed." >> update-tv-stations.log
EOF

# Make the script executable
chmod +x "$PROJECT_DIR/scripts/update-tv-stations.sh"

# Add to crontab (runs every Sunday at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * 0 /bin/bash $PROJECT_DIR/scripts/update-tv-stations.sh") | crontab -

echo "Automatic TV station updates have been set up!"
echo "The script will run every Sunday at 2 AM."
echo ""
echo "To manually run an update:"
echo "  cd /Users/johnny/Downloads/Interactive\\ 3D\\ Globe\\ for\\ Live\\ Media\\ Streaming"
echo "  node scripts/updateTVStationsScheduled.js"
echo ""
echo "To view the update log:"
echo "  tail -f update-tv-stations.log"