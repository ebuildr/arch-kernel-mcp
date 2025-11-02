# Usage Guide

This guide provides detailed examples of using arch-kernel-mcp through Claude Desktop.

## Quick Start

After installing and configuring the MCP server in Claude Desktop, you can ask Claude natural language questions about your Arch Linux kernel setup.

## Common Use Cases

### 1. Checking Installed Kernels

**Ask Claude:**
> "What Linux kernels are installed on my system?"

**What it does:**
- Lists all installed kernel packages
- Shows kernel files in /boot
- Displays vmlinuz and initramfs files

**Example Output:**
```
Installed kernel packages:

linux 6.11.5.arch1-1
linux-headers 6.11.5.arch1-1
linux-firmware 20241017.30666ca9-1

Kernel files in /boot:
-rw-r--r-- 1 root root  12M Nov  1 08:45 vmlinuz-linux
-rw-r--r-- 1 root root  15M Nov  1 08:45 initramfs-linux.img
-rw-r--r-- 1 root root  15M Nov  1 08:45 initramfs-linux-fallback.img
```

### 2. Checking Current Kernel

**Ask Claude:**
> "What kernel am I currently running?"

**What it does:**
- Shows the running kernel version
- Lists kernel information
- Reports number of loaded modules

### 3. VMD Configuration Check

**Ask Claude:**
> "Is VMD configured in my initramfs?"

Or:
> "Check my VMD status"

**What it does:**
- Analyzes /etc/mkinitcpio.conf
- Checks for VMD and NVMe modules
- Provides recommendations if not configured

**Example Output:**
```
Current /etc/mkinitcpio.conf configuration:

MODULES=()
HOOKS=(base udev autodetect modconf kms keyboard keymap...)

--- Analysis ---
⚠ VMD module not found in configuration
⚠ NVMe support not explicitly configured

Active MODULES line: MODULES=()
```

### 4. Generate VMD Configuration

**Ask Claude:**
> "Generate a recommended mkinitcpio.conf for VMD support"

Or:
> "How do I configure VMD for my Intel Arrow Lake system?"

**What it does:**
- Generates recommended configuration
- Provides step-by-step instructions
- Includes verification steps

**You'll need to manually:**
1. Edit `/etc/mkinitcpio.conf`
2. Run `sudo mkinitcpio -P`
3. Reboot

### 5. Check NVMe Devices

**Ask Claude:**
> "Check my VMD and NVMe device status"

**What it does:**
- Checks if VMD kernel module is loaded
- Lists VMD devices from lspci
- Shows NVMe devices
- Displays block device information

**Example Output:**
```
VMD and NVMe Device Status:

VMD kernel module loaded: Yes

=== NVMe Devices ===
Node           SN                   Model                    Namespace Usage
-------------- -------------------- ------------------------ --------- ------
/dev/nvme0n1   S7N0NS0T123456       Samsung SSD 990 PRO      1         2.00 TB

=== Block Devices ===
NAME        SIZE  TYPE  MOUNTPOINT  MODEL
nvme0n1     2T    disk
├─nvme0n1p1 512M  part  /boot/efi
├─nvme0n1p2 100G  part  /
└─nvme0n1p3 1.9T  part  /home
```

### 6. Check Bootloader Configuration

**Ask Claude:**
> "Show my bootloader configuration"

Or:
> "List my boot entries"

**What it does:**
- Detects systemd-boot or GRUB
- Lists boot entries
- Shows EFI boot manager entries

### 7. Search for Kernel Packages

**Ask Claude:**
> "What kernel packages are available in the Arch repositories?"

Or:
> "Search for LTS kernel packages"

**What it does:**
- Searches pacman repositories
- Shows available kernel versions
- Includes descriptions

## Troubleshooting Scenarios

### Scenario 1: NVMe Drive Not Detected at Boot

**Problem:** After installing Arch, the system won't boot because NVMe drives aren't detected.

**Solution Steps:**

1. **Ask Claude:**
   > "Check if VMD is configured in my initramfs"

2. **Generate config:**
   > "Generate VMD configuration for my initramfs"

3. **Manual steps:**
   ```bash
   # Edit the configuration
   sudo nano /etc/mkinitcpio.conf
   
   # Change MODULES line to:
   MODULES=(vmd nvme)
   
   # Regenerate initramfs
   sudo mkinitcpio -P
   
   # Reboot
   sudo reboot
   ```

4. **Verify after reboot:**
   > "Check VMD status"

### Scenario 2: Dual Boot Issues

**Problem:** Windows works but Arch won't boot, or vice versa.

**Solution Steps:**

1. **Check bootloader:**
   > "Show my bootloader configuration"

2. **Verify kernels:**
   > "What kernels are installed?"

3. **Check if Arch kernel exists:**
   ```bash
   ls -l /boot/vmlinuz-*
   ```

4. **Regenerate bootloader:**
   - For systemd-boot: `sudo bootctl update`
   - For GRUB: `sudo grub-mkconfig -o /boot/grub/grub.cfg`

### Scenario 3: After Kernel Update, System Won't Boot

**Problem:** Upgraded kernel, now system fails to boot.

**Solution Steps:**

1. **Boot from live USB**

2. **Mount your system:**
   ```bash
   mount /dev/nvme0n1p2 /mnt
   mount /dev/nvme0n1p1 /mnt/boot
   arch-chroot /mnt
   ```

3. **In chroot, ask Claude:**
   > "List installed kernels"
   > "Check initramfs configuration"

4. **Regenerate initramfs:**
   ```bash
   mkinitcpio -P
   ```

## Advanced Usage

### Custom Initramfs Hooks

If you need additional modules beyond VMD:

```bash
# Example: Adding other storage drivers
MODULES=(vmd nvme ahci sd_mod usb_storage)
```

### Multiple Kernel Management

Keep multiple kernels installed for fallback:

```bash
# Install LTS kernel alongside regular kernel
sudo pacman -S linux linux-lts
```

Then ask Claude:
> "List all installed kernels"

### Monitoring Kernel Updates

Ask Claude periodically:
> "Are there kernel updates available?"

## Best Practices

1. **Before Major Changes:**
   - Always check current configuration
   - List installed kernels
   - Verify bootloader entries

2. **After Kernel Updates:**
   - Verify initramfs was regenerated
   - Check boot entries
   - Don't remove old kernels immediately

3. **For Dual Boot Systems:**
   - Keep VMD configuration consistent
   - Verify both OSes can see storage
   - Don't disable VMD in BIOS

4. **Regular Maintenance:**
   - Ask Claude to check for kernel updates monthly
   - Review initramfs config after system changes
   - Keep at least one fallback kernel

## Integration with Other Tools

### With pacman Hooks

Create automatic checks after kernel updates:

```bash
# /etc/pacman.d/hooks/kernel-check.hook
[Trigger]
Operation = Install
Operation = Upgrade
Type = Package
Target = linux
Target = linux-lts

[Action]
Description = Checking kernel configuration...
When = PostTransaction
Exec = /usr/bin/systemd-cat -t kernel-check echo "Kernel updated, check configuration"
```

### With System Monitoring

Ask Claude to generate monitoring scripts:
> "Create a script to check if VMD is loaded at boot"

## Getting Help

If you encounter issues:

1. **Ask Claude specific questions:**
   - "Why isn't my NVMe drive detected?"
   - "What's wrong with my initramfs config?"
   - "How do I recover from a kernel update issue?"

2. **Provide context:**
   - Share your hardware (motherboard, CPU)
   - Mention if it's a dual-boot system
   - Include any error messages

3. **Use diagnostic tools:**
   > "Check VMD status"
   > "List bootloader entries"
   > "Show current kernel info"

## Example Conversation Flow

```
You: "I just installed Arch on my MSI Raider with Intel Arrow Lake CPU, 
      but NVMe drives aren't showing up at boot"

Claude: Let me check your VMD configuration...
        [Uses check_vmd_status tool]
        [Uses check_initramfs_config tool]
        
        I see the issue. Your initramfs isn't configured for VMD.
        Let me generate the correct configuration...
        [Uses generate_initramfs_vmd_config tool]
        
        Here's what you need to do:
        1. Edit /etc/mkinitcpio.conf
        2. Change MODULES=() to MODULES=(vmd nvme)
        3. Run: sudo mkinitcpio -P
        4. Reboot
        
        After rebooting, I can verify it's working.

You: [after reboot] "Check if VMD is working now"

Claude: [Uses check_vmd_status tool]
        Great! VMD is now loaded and your NVMe devices are detected.
        [Shows device list]
```

## Notes

- Most operations are **read-only** - the MCP server doesn't modify your system
- When changes are needed, Claude will provide manual commands
- Always review suggested commands before executing them
- Some operations may require sudo privileges
