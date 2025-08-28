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
