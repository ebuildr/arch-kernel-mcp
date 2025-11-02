# VMD (Volume Management Device) Configuration Guide

## What is VMD?

VMD (Volume Management Device) is an Intel technology that allows the PCIe root complex to manage NVMe storage devices. It's commonly found on:

- Intel 11th gen and newer consumer platforms (Tiger Lake, Alder Lake, Raptor Lake, Arrow Lake)
- Intel workstation and server chipsets (C-series)
- High-end gaming laptops (like MSI Raider series)

## Why VMD Matters for Arch Linux

### The Problem

When VMD is enabled in BIOS/UEFI (which is often the default on modern systems):
- NVMe drives appear as devices behind a VMD controller
- Without the VMD kernel module loaded early, NVMe drives aren't detected
- This causes boot failures because the root filesystem can't be found

### The Solution

The VMD kernel module must be included in the **initramfs** (initial RAM filesystem) so it loads before the system tries to mount the root filesystem.

## System Requirements

This guide is specifically tested on:
- **System**: MSI Raider 18 HX AI A2XWJG (MS-1824)
- **CPU**: Intel Core Ultra 9 285HX (Arrow Lake-HX)
- **Chipset**: Intel Arrow Point HM870
- **Configuration**: Dual-boot Windows 11 and Arch Linux
- **Storage**: NVMe drives behind VMD controller

But it applies to any system with VMD-enabled NVMe storage.

## Quick Start

### Using arch-kernel-mcp (Recommended)

1. **Check current status:**
   ```bash
   # In Claude Desktop:
   "Check my VMD status"
   ```

2. **Generate configuration:**
   ```bash
   # In Claude Desktop:
   "Generate VMD configuration for my initramfs"
   ```

3. **Apply the configuration** (manual steps):
   ```bash
   sudo nano /etc/mkinitcpio.conf
   # Add to MODULES line: MODULES=(vmd nvme)
   
   sudo mkinitcpio -P
   sudo reboot
   ```

4. **Verify:**
   ```bash
   # In Claude Desktop after reboot:
   "Check VMD status"
   ```

## Manual Configuration

### Step 1: Edit mkinitcpio.conf

```bash
sudo nano /etc/mkinitcpio.conf
```

Find the `MODULES` line and add `vmd` and `nvme`:

**Before:**
```
MODULES=()
```

**After:**
```
MODULES=(vmd nvme)
```

If you have other modules, add them to the list:
```
MODULES=(vmd nvme ext4)
```

### Step 2: Regenerate Initramfs

For all installed kernels:
```bash
sudo mkinitcpio -P
```

For a specific kernel:
```bash
sudo mkinitcpio -p linux        # Main kernel
sudo mkinitcpio -p linux-lts    # LTS kernel
```

### Step 3: Reboot

```bash
sudo reboot
```

### Step 4: Verify

After reboot, check if VMD is loaded:

```bash
# Check if VMD module is loaded
lsmod | grep vmd

# Check VMD devices
lspci | grep -i vmd

# List NVMe devices
lsblk
nvme list  # If nvme-cli is installed

# Check dmesg for VMD messages
dmesg | grep -i vmd
```

## Understanding the Configuration

### MODULES Array

The `MODULES` array in `/etc/mkinitcpio.conf` specifies kernel modules to include in the initramfs:

```bash
MODULES=(vmd nvme)
```

- **vmd**: Intel Volume Management Device driver
- **nvme**: NVMe storage driver

These modules are loaded **before** the root filesystem is mounted.

### Other Important mkinitcpio Settings

```bash
# Detect and include necessary modules automatically
HOOKS=(base udev autodetect modconf kms keyboard keymap consolefont block filesystems fsck)
```

- **autodetect**: Automatically detects hardware (but may miss VMD)
- **block**: Handles block devices
- **filesystems**: Loads filesystem drivers

### Why autodetect Isn't Enough

The `autodetect` hook scans hardware at build time, but:
- It may not detect VMD if it's not active during mkinitcpio
- It may not realize VMD is needed for boot
- Explicitly listing `vmd` ensures it's always included

## Dual Boot Considerations

### Windows and VMD

Windows typically has VMD drivers built-in or provided by Intel. If Windows boots successfully:
- VMD is enabled in BIOS
- Windows is using VMD to access NVMe drives

### Arch Linux and VMD

Arch needs the VMD module in initramfs to match Windows's functionality:

1. **Before VMD configuration:**
   - Windows: ✅ Boots fine
   - Arch: ❌ Can't find NVMe drives

2. **After VMD configuration:**
   - Windows: ✅ Boots fine
   - Arch: ✅ Boots fine

### BIOS Settings

**Important:** Keep VMD settings consistent:

- **VMD Enabled**: Both Windows and Arch need VMD drivers
- **VMD Disabled**: Both OSes access NVMe directly (no VMD needed)

**Don't** toggle VMD after installation unless you update both OSes.

## Troubleshooting

### Problem: "No such device" or "Root device not found"

**Symptoms:**
```
Waiting 10 seconds for device /dev/nvme0n1p2...
ERROR: device '/dev/nvme0n1p2' not found. Skipping fsck.
ERROR: Unable to find root device '/dev/nvme0n1p2'
```

**Cause:** VMD module not loaded in initramfs

**Solution:**
1. Boot from Arch installation media
2. Mount your system and chroot
3. Configure VMD in mkinitcpio.conf
4. Regenerate initramfs
5. Reboot

**Detailed recovery steps:**
```bash
# Boot from USB, then:
mount /dev/nvme0n1p2 /mnt      # Adjust partition as needed
mount /dev/nvme0n1p1 /mnt/boot # If separate boot partition
arch-chroot /mnt

# Edit config
nano /etc/mkinitcpio.conf
# Add: MODULES=(vmd nvme)

# Regenerate
mkinitcpio -P

# Exit and reboot
exit
reboot
```

### Problem: VMD Module Not Loading

**Check if VMD exists:**
```bash
modinfo vmd
```

If "modinfo: ERROR: Module vmd not found":
- Your kernel may not have VMD support
- Update to a newer kernel: `sudo pacman -S linux`

**Check if VMD is blacklisted:**
```bash
grep -r vmd /etc/modprobe.d/
```

Remove any blacklist entries.

### Problem: lsblk Shows No NVMe Devices

**Diagnosis:**
```bash
# Check if any NVMe controller exists
lspci | grep -i nvm

# Check if VMD device exists
lspci | grep -i vmd

# Check dmesg for errors
dmesg | grep -i "nvme\|vmd"

# List all block devices
ls -l /dev/nvme*
ls -l /dev/sd*
```

**If NVMe controller exists but no devices:**
- VMD is probably needed
- Follow the configuration steps above

**If no NVMe controller at all:**
- Check BIOS settings
- Verify hardware connection
- May need to enable PCIe in BIOS

### Problem: Different Behavior After Kernel Update

**After updating the kernel:**
```bash
# Check which kernels are installed
pacman -Q | grep linux

# Check initramfs files
ls -lh /boot/initramfs-*

# Verify each initramfs has VMD
lsinitcpio /boot/initramfs-linux.img | grep vmd
lsinitcpio /boot/initramfs-linux-fallback.img | grep vmd
```

**If VMD is missing:**
```bash
# Regenerate initramfs
sudo mkinitcpio -P
```

## Advanced Configuration

### Custom VMD Configuration

For systems with multiple VMD domains or special requirements:

```bash
# /etc/modprobe.d/vmd.conf
options vmd disable_irq_remap=Y
```

### Debugging VMD

Enable verbose VMD logging:

```bash
# Add to kernel parameters in bootloader
vmd.dyndbg="+p"
```

View logs:
```bash
dmesg | grep vmd
journalctl -k | grep vmd
```

### Alternative: AHCI Mode

If VMD causes persistent issues, consider switching to AHCI in BIOS:

**Pros:**
- No special configuration needed
- NVMe devices appear directly

**Cons:**
- May lose some features
- Windows may need reconfiguration
- May not be available on all systems

## Performance Considerations

### VMD Impact on Performance

VMD itself has minimal performance impact:
- NVMe devices operate at full speed
- Latency difference is negligible
- IOPS are equivalent to direct mode

### Checking Performance

```bash
# Install fio for benchmarking
sudo pacman -S fio

# Simple read test
fio --name=read_test --rw=read --bs=4k --size=1G --numjobs=1 \
    --runtime=30 --time_based --filename=/tmp/test

# Check NVMe health
sudo nvme smart-log /dev/nvme0n1
```

## Integration with Other Tools

### With pacman Hooks

Automatically check VMD after kernel updates:

```bash
# /etc/pacman.d/hooks/vmd-check.hook
[Trigger]
Operation = Install
Operation = Upgrade
Type = Package
Target = linux
Target = linux-lts
Target = linux-zen
Target = linux-hardened

[Action]
Description = Verifying VMD configuration in initramfs...
When = PostTransaction
Exec = /usr/bin/sh -c 'lsinitcpio /boot/initramfs-linux.img | grep -q vmd || echo "WARNING: VMD not found in initramfs. Run: sudo mkinitcpio -P"'
NeedsTargets
```

### With Systemd

Check VMD status at boot:

```bash
# /etc/systemd/system/vmd-check.service
[Unit]
Description=Check VMD Status
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/usr/bin/sh -c 'lsmod | grep -q vmd && echo "VMD loaded successfully" || echo "WARNING: VMD not loaded"'
StandardOutput=journal

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable vmd-check.service
```

## References

- [Intel VMD Documentation](https://www.intel.com/content/www/us/en/support/articles/000059392/memory-and-storage.html)
- [Arch Linux Wiki: mkinitcpio](https://wiki.archlinux.org/title/Mkinitcpio)
- [Arch Linux Wiki: NVMe](https://wiki.archlinux.org/title/NVMe)
- [Linux Kernel VMD Driver](https://www.kernel.org/doc/html/latest/PCI/vmd.html)

## Conclusion

VMD configuration is essential for modern Intel systems with NVMe storage. With arch-kernel-mcp, you can:

1. **Diagnose** VMD status and configuration
2. **Generate** correct configurations
3. **Verify** everything works after changes

This ensures reliable boot on dual-boot systems and modern hardware.
