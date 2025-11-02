# arch-kernel-mcp

MCP server for managing Arch Linux kernels, with special support for VMD (Volume Management Device) configurations on modern Intel platforms.

## Overview

This MCP (Model Context Protocol) server provides tools for managing Linux kernels on Arch Linux systems, particularly those with VMD-enabled NVMe storage configurations common on newer Intel platforms like Arrow Lake.

## Features

- **Kernel Management**: List installed kernels and available kernel packages
- **Current Kernel Info**: Get details about the running kernel
- **Initramfs Configuration**: Check and generate VMD-enabled mkinitcpio configurations
- **Bootloader Support**: View systemd-boot and GRUB configurations
- **VMD/NVMe Detection**: Check VMD module status and NVMe device detection
- **Configuration Recommendations**: Get tailored recommendations for VMD/NVMe setups

## Installation

### Prerequisites

- Arch Linux system
- Python 3.10 or higher
- pip package manager

### Install from source

```bash
git clone https://github.com/ebuildr/arch-kernel-mcp.git
cd arch-kernel-mcp
pip install -e .
```

## Usage

### Running the Server

The MCP server communicates via stdio and is meant to be used with MCP clients like Claude Desktop.

```bash
arch-kernel-mcp
```

### Configuration with Claude Desktop

Add to your Claude Desktop configuration file:

**Linux/Mac**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arch-kernel": {
      "command": "arch-kernel-mcp"
    }
  }
}
```

## Available Tools

### list_kernels
List all installed Linux kernel packages on the system and kernel files in /boot.

### list_kernel_packages
Search for available kernel packages in Arch repositories.

### get_current_kernel
Get information about the currently running kernel including version and loaded modules.

### check_initramfs_config
Examine the current mkinitcpio.conf configuration and check for VMD/NVMe support.

### list_bootloader_entries
Display bootloader configuration (systemd-boot or GRUB) and EFI boot entries.

### check_vmd_status
Check VMD kernel module status and list NVMe devices. Useful for diagnosing boot issues on systems with VMD-enabled storage.

### generate_initramfs_vmd_config
Generate recommended mkinitcpio.conf settings for systems with VMD/NVMe storage, including configuration for Intel Arrow Lake-HX platforms.

## Special Configuration for VMD Systems

### What is VMD?

VMD (Volume Management Device) is an Intel technology that allows the PCIe controller to manage NVMe devices. On systems like the MSI Raider 18 HX with Intel Arrow Lake-HX processors, VMD must be configured in the initramfs for NVMe drives to be detected during boot.

### Configuring VMD Support

1. **Check current status**:
   ```bash
   # Use the MCP tool: check_vmd_status
   ```

2. **Generate configuration**:
   ```bash
   # Use the MCP tool: generate_initramfs_vmd_config
   ```

3. **Manually edit /etc/mkinitcpio.conf**:
   ```
   MODULES=(vmd nvme)
   ```

4. **Regenerate initramfs**:
   ```bash
   sudo mkinitcpio -P
   ```

5. **Reboot and verify**:
   ```bash
   lsmod | grep vmd
   lsblk
   ```

## Dual Boot Configuration

For dual-boot systems (Windows 11 + Arch Linux) with VMD:

1. Ensure VMD is enabled in BIOS/UEFI
2. Configure initramfs with VMD support (see above)
3. Both operating systems should use VMD for NVMe access
4. Verify boot partition is accessible by both systems

## System Requirements

Tested on:
- MSI Raider 18 HX AI A2XWJG (MS-1824)
- Intel Core Ultra 9 285HX (8C+16c, Arrow Lake-HX)
- Intel Arrow Point HM870 chipset
- VMD-enabled NVMe storage

## Troubleshooting

### NVMe drives not detected during boot
- Check VMD module is in initramfs: Use `check_initramfs_config` tool
- Verify VMD is enabled in BIOS
- Regenerate initramfs after configuration changes

### Bootloader doesn't show Arch entry
- Use `list_bootloader_entries` to check configuration
- Verify kernel files exist in /boot using `list_kernels`
- Check EFI boot entries with the tool

## Development

### Project Structure
```
arch-kernel-mcp/
├── src/
│   └── arch_kernel_mcp/
│       ├── __init__.py
│       └── server.py
├── pyproject.toml
└── README.md
```

### Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License

## Author

Created for managing Arch Linux kernels on high-performance systems with VMD-enabled storage.
