#!/bin/bash
# configure_vmd.sh - Script to configure VMD in mkinitcpio.conf
# Use with caution - always backup your configuration first!

set -e

MKINITCPIO_CONF="/etc/mkinitcpio.conf"
BACKUP_CONF="${MKINITCPIO_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "This script must be run as root (use sudo)"
    exit 1
fi

echo "=== VMD Configuration Script ==="
echo ""
echo "This script will:"
echo "1. Backup your current mkinitcpio.conf"
echo "2. Add VMD and NVMe modules to the MODULES array"
echo "3. Regenerate all initramfs images"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Backup
echo "Creating backup: $BACKUP_CONF"
cp "$MKINITCPIO_CONF" "$BACKUP_CONF"

# Check current MODULES line
current_modules=$(grep "^MODULES=" "$MKINITCPIO_CONF" || echo "MODULES=()")
echo "Current configuration: $current_modules"

# Check if VMD is already there
if echo "$current_modules" | grep -q "vmd"; then
    echo "VMD is already configured!"
    read -p "Reconfigure anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Add VMD and NVMe to MODULES
echo "Updating MODULES line..."

# Extract current modules inside parentheses
current_list=$(echo "$current_modules" | sed -n 's/^MODULES=(\(.*\))$/\1/p')

# Create new modules list with vmd and nvme
if [ -z "$current_list" ]; then
    new_modules="MODULES=(vmd nvme)"
else
    # Add vmd and nvme if not present
    new_list="$current_list"
    if ! echo "$new_list" | grep -qw "vmd"; then
        new_list="vmd $new_list"
    fi
    if ! echo "$new_list" | grep -qw "nvme"; then
        new_list="nvme $new_list"
    fi
    new_modules="MODULES=($new_list)"
fi

echo "New configuration: $new_modules"

# Update the file
sed -i "s/^MODULES=.*/$new_modules/" "$MKINITCPIO_CONF"

echo ""
echo "Configuration updated!"
echo ""
echo "Regenerating initramfs for all kernels..."
mkinitcpio -P

echo ""
echo "=== Configuration Complete ==="
echo ""
echo "VMD has been configured in your initramfs."
echo "Backup saved to: $BACKUP_CONF"
echo ""
echo "Next steps:"
echo "1. Reboot your system: sudo reboot"
echo "2. After reboot, verify VMD is loaded: lsmod | grep vmd"
echo "3. Check NVMe devices: lsblk"
echo ""
echo "If something goes wrong, restore the backup:"
echo "  sudo cp $BACKUP_CONF $MKINITCPIO_CONF"
echo "  sudo mkinitcpio -P"
