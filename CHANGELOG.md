# Changelog

All notable changes to arch-kernel-mcp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-02

### Added
- Initial release of arch-kernel-mcp
- MCP server implementation for Arch Linux kernel management
- Tools for kernel listing and information:
  - `list_kernels` - List installed kernel packages and files
  - `list_kernel_packages` - Search available kernel packages
  - `get_current_kernel` - Get current running kernel information
- VMD (Volume Management Device) support:
  - `check_vmd_status` - Check VMD module and NVMe device status
  - `check_initramfs_config` - Analyze mkinitcpio.conf configuration
  - `generate_initramfs_vmd_config` - Generate VMD-enabled configuration
- Bootloader management:
  - `list_bootloader_entries` - Display systemd-boot and GRUB entries
- Comprehensive documentation:
  - README.md with project overview
  - INSTALL.md with installation instructions
  - USAGE.md with detailed usage examples
  - VMD_GUIDE.md with VMD-specific configuration guide
  - CONTRIBUTING.md for contributors
- Example scripts:
  - check_vmd.sh - Diagnostic script for VMD status
  - configure_vmd.sh - Automated VMD configuration script
- Project infrastructure:
  - pyproject.toml for Python packaging
  - requirements.txt for dependencies
  - .gitignore for version control
  - MIT License
  - Claude Desktop configuration example

### Features
- Read-only operations for system safety
- Detailed analysis and recommendations
- Support for modern Intel platforms (Arrow Lake, etc.)
- Dual-boot system considerations
- VMD/NVMe detection and configuration
- Multiple bootloader support (systemd-boot, GRUB)

### Target Systems
- Tested on MSI Raider 18 HX AI A2XWJG
- Intel Core Ultra 9 285HX (Arrow Lake-HX)
- Intel Arrow Point HM870 chipset
- VMD-enabled NVMe storage
- Dual-boot Windows 11 and Arch Linux

### Known Limitations
- Read-only operations only (no automatic system modifications)
- Requires manual execution of recommended commands
- Some commands require sudo privileges
- Arch Linux specific (not compatible with other distributions)

## [Unreleased]

### Planned Features
- Automated testing suite
- Support for additional bootloaders (rEFInd)
- Kernel compilation helpers
- Configuration backup and restore
- Interactive configuration wizard
- Performance monitoring tools
- AUR kernel support

### Under Consideration
- Web interface
- GUI application
- Multi-system management
- Configuration profiles
- Automated kernel updates

---

## Version History

- **0.1.0** (2025-11-02) - Initial release

## Migration Guide

### From Manual Configuration

If you were previously configuring VMD manually:

1. Install arch-kernel-mcp
2. Use the MCP tools to verify your configuration
3. Continue using manual methods or migrate to asking Claude for assistance

### Future Versions

Breaking changes and migration instructions will be documented here for future releases.

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/ebuildr/arch-kernel-mcp/issues
- Discussions: https://github.com/ebuildr/arch-kernel-mcp/discussions
