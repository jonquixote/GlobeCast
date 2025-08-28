#!/bin/bash

# Setup Script for Automatic Radio Station Updates
# This script sets up a cron job to automatically update radio stations weekly

echo "Setting up automatic radio station updates..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Create the update script
cat > "$PROJECT_DIR/scripts/update-radio-stations.sh" << 'EOF'
#!/bin/bash

# Automatic Radio Station Update Script
# This script updates the radio stations data

# Change to project directory
cd "/Users/johnny/Downloads/Interactive 3D Globe for Live Media Streaming" || exit 1

# Run the update script
echo "[$(date)] Updating radio stations..." >> update-radio-stations.log
node scripts/updateRadioStationsScheduled.js >> update-radio-stations.log 2>&1
echo "[$(date)] Update completed." >> update-radio-stations.log
EOF

# Make the script executable
chmod +x "$PROJECT_DIR/scripts/update-radio-stations.sh"

# Add to crontab (runs every Wednesday at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * 3 /bin/bash $PROJECT_DIR/scripts/update-radio-stations.sh") | crontab -

echo "Automatic radio station updates have been set up!"
echo "The script will run every Wednesday at 3 AM."
echo ""
echo "To manually run an update:"
echo "  cd /Users/johnny/Downloads/Interactive\\ 3D\\ Globe\\ for\\ Live\\ Media\\ Streaming"
echo "  node scripts/updateRadioStationsScheduled.js"
echo ""
echo "To view the update log:"
echo "  tail -f update-radio-stations.log"