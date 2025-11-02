# Example Scripts

This directory contains example scripts that demonstrate VMD configuration and checking.

## Available Scripts

### check_vmd.sh

Diagnostic script to check your VMD configuration status.

**Usage:**
```bash
./check_vmd.sh
```

**What it checks:**
- VMD kernel module status
- VMD devices in lspci
- NVMe device detection
- mkinitcpio.conf configuration
- initramfs contents
- Kernel messages (dmesg)

**No root required** - this is a read-only diagnostic script.

### configure_vmd.sh

Automated script to configure VMD in mkinitcpio.conf.

**Usage:**
```bash
sudo ./configure_vmd.sh
```

**What it does:**
1. Creates a backup of your current mkinitcpio.conf
2. Adds `vmd` and `nvme` to the MODULES array
3. Regenerates all initramfs images
4. Provides verification instructions

**Requires root** - this script modifies system configuration.

**⚠️ Warning:** Always review what the script will do before running it. The script will:
- Show you the current and new configuration
- Ask for confirmation before making changes
- Create a backup that you can restore

## When to Use These Scripts

### Use check_vmd.sh when:
- Setting up a new Arch Linux installation on VMD hardware
- Diagnosing boot issues related to NVMe detection
- Verifying VMD configuration after manual changes
- Troubleshooting dual-boot issues

### Use configure_vmd.sh when:
- You've verified VMD is needed (using check_vmd.sh)
- You want to automate the configuration process
- You're comfortable with the script modifying system files
- You've read and understood the changes it will make

## Alternative: Using the MCP Server

These scripts demonstrate what the MCP server can help you do through Claude Desktop:

**Instead of running scripts:**
```bash
./check_vmd.sh
```

**Ask Claude:**
> "Check my VMD status"

**Instead of:**
```bash
sudo ./configure_vmd.sh
```

**Ask Claude:**
> "Generate VMD configuration for my initramfs"
> (Then apply the recommendations manually)

## Safety Notes

1. **Always backup** before making system changes
2. **Test in a VM** if you're unsure
3. **Keep a live USB** handy for recovery
4. **Read the script** before running it
5. **Understand what VMD is** and why you need it (see VMD_GUIDE.md)

## Customization

You can modify these scripts for your specific needs:

### Add Custom Modules

Edit `configure_vmd.sh` and modify the modules list:
```bash
new_modules="MODULES=(vmd nvme ahci ext4)"
```

### Different initramfs Location

If your initramfs files are in a non-standard location, edit the path in `check_vmd.sh`:
```bash
for img in /custom/path/initramfs-*.img; do
```

### Additional Checks

Add more diagnostic checks to `check_vmd.sh`:
```bash
# Check specific PCI device
echo "Checking specific VMD device..."
lspci -vv -s 00:0e.0
```

## Troubleshooting

### Script says "command not found"

Make sure the script is executable:
```bash
chmod +x check_vmd.sh configure_vmd.sh
```

### Permission denied

For configure_vmd.sh, use sudo:
```bash
sudo ./configure_vmd.sh
```

### Scripts don't work

These scripts are designed for Arch Linux. If you're using a different distribution:
- Initramfs configuration may be different (dracut instead of mkinitcpio)
- Commands may be in different locations
- Adapt the scripts for your distribution

## Contributing

If you have improved versions of these scripts or additional examples, please contribute:
1. Test your script thoroughly
2. Add comments explaining what it does
3. Update this README
4. Submit a pull request

## See Also

- [VMD_GUIDE.md](../VMD_GUIDE.md) - Comprehensive VMD configuration guide
- [USAGE.md](../USAGE.md) - How to use the MCP server with Claude
- [INSTALL.md](../INSTALL.md) - Installation instructions
