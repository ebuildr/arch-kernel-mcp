# arch-kernel-mcp

MCP server for managing Arch Linux kernels through the Model Context Protocol.

[![MCP Compliant](https://img.shields.io/badge/MCP-Compliant-green)](https://modelcontextprotocol.io)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()
[![Tests](https://img.shields.io/badge/Tests-Passing-success)]()

## 🎉 Status: Fully Validated & Production Ready

This MCP server has been **comprehensively validated** against the Model Context Protocol specification:
- ✅ **100% MCP Compliant** - All goals achieved
- ✅ **Fully Tested** - Comprehensive test suite passing
- ✅ **Production Ready** - Ready for deployment with Claude Desktop, ChatGPT, and more

📖 **Documentation:**
- [Success Summary](./SUCCESS_SUMMARY.md) - Project achievements and impact
- [MCP Goals Validation](./MCP_GOALS_VALIDATION.md) - Detailed compliance validation
- [Implementation Details](./MCP_IMPLEMENTATION.md) - Technical specification
- [VMD Task Analysis](./VMD_TASK_ANALYSIS.md) - Intel VMD dual boot analysis
- [VMD Implementation](./VMD_IMPLEMENTATION_SUMMARY.md) - VMD features implementation

## Features

This MCP server provides comprehensive tools and resources for managing Linux kernels on Arch Linux systems:

### Resources (9 total)

**Kernel Resources:**
- **Current Kernel**: View the currently running kernel version
- **Installed Kernels**: List all installed kernel packages with version information
- **Available Kernels**: Browse kernel packages available in repositories
- **Bootloader Info**: Detect the system bootloader (GRUB or systemd-boot)

**Initramfs Resources:**
- **Initramfs Config**: View /etc/mkinitcpio.conf contents
- **Configured Modules**: List modules configured in mkinitcpio.conf
- **Initramfs Analysis**: Detailed analysis of configuration vs actual content

**VMD Resources:**
- **VMD Status**: Intel Volume Management Device hardware and module status
- **VMD Diagnosis**: Automated diagnostics and recommendations

### Tools (18 total)

**Kernel Management:**
- `list_kernels`: List all installed kernel packages
- `get_current_kernel`: Get the currently running kernel version
- `list_available_kernels`: List available kernel packages in repositories
- `install_kernel`: Install a kernel package (requires sudo)
- `remove_kernel`: Remove a kernel package (requires sudo, cannot remove current kernel)
- `update_grub`: Update GRUB bootloader configuration (requires sudo)
- `update_kernels`: Update all installed kernel packages (requires sudo)
- `get_kernel_info`: Get detailed information about a specific kernel package
- `get_bootloader`: Detect which bootloader is in use

**Initramfs Management:**
- `check_initramfs_modules`: List modules configured in mkinitcpio.conf
- `add_initramfs_module`: Add module to initramfs (requires sudo)
- `remove_initramfs_module`: Remove module from initramfs (requires sudo)
- `rebuild_initramfs`: Rebuild initramfs for all kernels (requires sudo)
- `analyze_initramfs`: Analyze initramfs configuration

**Intel VMD Detection:**
- `detect_vmd_hardware`: Detect Intel VMD controllers
- `check_vmd_status`: Get comprehensive VMD status
- `diagnose_vmd`: Diagnose VMD configuration issues
- `check_vmd_boot_requirement`: Check if VMD needed for boot

### Prompts (6 total)

**Kernel Prompts:**
- **install-lts-kernel**: Guide for installing the LTS kernel
- **switch-kernel**: Guide for switching between kernel versions
- **kernel-troubleshooting**: Common kernel issues and solutions

**VMD & Initramfs Prompts:**
- **setup-dual-boot-vmd**: Guide for dual boot with Intel VMD
- **troubleshoot-vmd-boot**: Fix VMD-related boot failures
- **configure-initramfs**: Guide for configuring initramfs modules

## Installation

1. Clone this repository:
```bash
git clone https://github.com/ebuildr/arch-kernel-mcp.git
cd arch-kernel-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### With Claude Desktop

Add this configuration to your Claude Desktop config file:

**Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "arch-kernel": {
      "command": "node",
      "args": ["/path/to/arch-kernel-mcp/build/index.js"]
    }
  }
}
```

### Standalone

Run the server directly:
```bash
npm run dev
```

## Requirements

- Node.js 18 or higher
- Arch Linux system
- `pacman` package manager
- `sudo` privileges for kernel installation/removal operations
- GRUB or systemd-boot bootloader

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run watch
```

### Testing

Run the basic MCP protocol test:
```bash
npm test
```

Run comprehensive validation tests:
```bash
npm run test:comprehensive
```

The tests validate:
- MCP protocol compliance
- All resources, tools, and prompts
- Error handling
- JSON formatting
- Argument validation

See [MCP_IMPLEMENTATION.md](./MCP_IMPLEMENTATION.md) for detailed implementation documentation.

## Common Use Cases

### Check current kernel
Ask Claude: "What kernel am I currently running?"

### Install LTS kernel
Ask Claude: "Help me install the linux-lts kernel"

### List available kernels
Ask Claude: "What kernel packages are available?"

### Switch kernels
Ask Claude: "I want to switch to the zen kernel"

### Troubleshoot kernel issues
Ask Claude: "I'm having hardware issues, can you help me try a different kernel?"

## Security Notes

- This server requires sudo privileges for installing, removing, and updating kernels
- Kernel names are validated to prevent command injection
- The server will not allow removal of the currently running kernel
- Always review changes before applying them to your system

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
