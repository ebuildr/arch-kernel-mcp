#!/bin/bash
# check_vmd.sh - Manual script to check VMD configuration
# This demonstrates what the MCP server does internally

echo "=== VMD Configuration Checker ==="
echo ""

# Check if VMD module is loaded
echo "1. Checking if VMD module is loaded..."
if lsmod | grep -q vmd; then
    echo "   ✓ VMD module is loaded"
else
    echo "   ✗ VMD module is NOT loaded"
fi
echo ""

# Check VMD devices in lspci
echo "2. Checking for VMD devices (lspci)..."
vmd_devices=$(lspci | grep -i "vmd\|volume management device")
if [ -n "$vmd_devices" ]; then
    echo "   ✓ VMD devices found:"
    echo "$vmd_devices" | sed 's/^/     /'
else
    echo "   ✗ No VMD devices found in lspci"
fi
echo ""

# Check NVMe devices
echo "3. Checking NVMe devices..."
if command -v nvme &> /dev/null; then
    nvme list 2>/dev/null | head -10
else
    echo "   nvme-cli not installed, using lsblk instead:"
    lsblk -o NAME,SIZE,TYPE,MOUNTPOINT | grep nvme
fi
echo ""

# Check mkinitcpio.conf
echo "4. Checking /etc/mkinitcpio.conf..."
if [ -f /etc/mkinitcpio.conf ]; then
    modules_line=$(grep "^MODULES=" /etc/mkinitcpio.conf)
    echo "   Current MODULES line:"
    echo "   $modules_line"
    
    if echo "$modules_line" | grep -q "vmd"; then
        echo "   ✓ VMD is configured in initramfs"
    else
        echo "   ✗ VMD is NOT configured in initramfs"
        echo ""
        echo "   To fix, edit /etc/mkinitcpio.conf and change MODULES line to:"
        echo "   MODULES=(vmd nvme)"
        echo ""
        echo "   Then run: sudo mkinitcpio -P"
    fi
else
    echo "   ✗ /etc/mkinitcpio.conf not found"
fi
echo ""

# Check initramfs files
echo "5. Checking initramfs files..."
for img in /boot/initramfs-*.img; do
    if [ -f "$img" ]; then
        echo "   Checking $img..."
        if lsinitcpio "$img" 2>/dev/null | grep -q "vmd.ko"; then
            echo "   ✓ VMD module found in $img"
        else
            echo "   ✗ VMD module NOT found in $img"
        fi
    fi
done
echo ""

# Check dmesg for VMD
echo "6. Checking kernel messages for VMD..."
vmd_messages=$(dmesg | grep -i vmd | tail -5)
if [ -n "$vmd_messages" ]; then
    echo "   Recent VMD messages from dmesg:"
    echo "$vmd_messages" | sed 's/^/     /'
else
    echo "   No VMD messages in dmesg"
fi
echo ""

echo "=== Check Complete ==="
