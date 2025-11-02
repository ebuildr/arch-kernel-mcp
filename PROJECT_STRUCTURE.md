# Project Structure

This document describes the organization and purpose of files in the arch-kernel-mcp repository.

## Directory Tree

```
arch-kernel-mcp/
├── .gitignore                          # Git ignore patterns
├── CHANGELOG.md                        # Version history and changes
├── CONTRIBUTING.md                     # Contribution guidelines
├── INSTALL.md                          # Installation instructions
├── LICENSE                             # MIT License
├── PROJECT_STRUCTURE.md                # This file
├── QUICKSTART.md                       # 5-minute quick start guide
├── README.md                           # Main project documentation
├── USAGE.md                            # Detailed usage guide
├── VMD_GUIDE.md                        # VMD-specific configuration guide
├── claude_desktop_config.example.json  # Example Claude Desktop config
├── examples/                           # Example scripts
│   ├── README.md                       # Examples documentation
│   ├── check_vmd.sh                    # VMD diagnostic script
│   └── configure_vmd.sh                # VMD configuration script
├── pyproject.toml                      # Python project configuration
├── requirements.txt                    # Python dependencies
└── src/                                # Source code
    └── arch_kernel_mcp/
        ├── __init__.py                 # Package initialization
        └── server.py                   # Main MCP server implementation
```

## File Descriptions

### Documentation Files

#### README.md
Main project documentation including:
- Project overview and features
- Installation instructions
- Available MCP tools
- VMD configuration overview
- System requirements
- Troubleshooting basics

#### QUICKSTART.md
Condensed guide for getting started in 5 minutes:
- Installation steps
- Basic configuration
- First commands to try
- Common questions

#### INSTALL.md
Comprehensive installation guide:
- Prerequisites
- Multiple installation methods
- Claude Desktop configuration
- Verification steps
- Detailed troubleshooting

#### USAGE.md
Detailed usage examples and scenarios:
- Common use cases with examples
- Troubleshooting scenarios
- Advanced usage patterns
- Best practices
- Integration with other tools

#### VMD_GUIDE.md
Complete guide to VMD configuration:
- What is VMD and why it matters
- Step-by-step configuration
- Dual-boot considerations
- Troubleshooting VMD issues
- Performance considerations
- Integration examples

#### CONTRIBUTING.md
Guidelines for contributors:
- Development setup
- Code style and standards
- Adding new tools
- Testing procedures
- Pull request process
- Security considerations

#### CHANGELOG.md
Version history:
- Release notes
- New features
- Bug fixes
- Breaking changes
- Migration guides

#### PROJECT_STRUCTURE.md
This file - documentation of project organization.

### Configuration Files

#### pyproject.toml
Python project configuration:
- Package metadata (name, version, description)
- Dependencies (mcp>=0.9.0)
- Build system configuration
- Entry point definition

#### requirements.txt
Python dependencies in traditional format:
- mcp>=0.9.0

#### .gitignore
Git ignore patterns:
- Python cache files (`__pycache__`, `*.pyc`)
- Virtual environments
- IDE files
- Build artifacts

#### claude_desktop_config.example.json
Example Claude Desktop configuration:
- Shows how to configure the MCP server
- Can be copied to actual config location

### Source Code

#### src/arch_kernel_mcp/__init__.py
Package initialization:
- Version number
- Package-level imports (if any)

#### src/arch_kernel_mcp/server.py
Main MCP server implementation:
- Server initialization
- Tool definitions (7 tools)
- Tool implementations
- Helper functions
- Main entry point

**Tools implemented:**
1. `list_kernels` - List installed kernels
2. `list_kernel_packages` - Search kernel packages
3. `get_current_kernel` - Current kernel info
4. `check_initramfs_config` - Check mkinitcpio.conf
5. `list_bootloader_entries` - List boot entries
6. `check_vmd_status` - VMD and NVMe status
7. `generate_initramfs_vmd_config` - Generate VMD config

### Example Scripts

#### examples/check_vmd.sh
Bash script for VMD diagnostics:
- Check VMD module status
- List VMD devices
- Check NVMe devices
- Analyze mkinitcpio.conf
- Check initramfs contents
- Show kernel messages

**Usage:** `./examples/check_vmd.sh`

#### examples/configure_vmd.sh
Bash script for VMD configuration:
- Backup current configuration
- Modify mkinitcpio.conf
- Add VMD and NVMe modules
- Regenerate initramfs

**Usage:** `sudo ./examples/configure_vmd.sh`

#### examples/README.md
Documentation for example scripts:
- Script descriptions
- Usage instructions
- Safety notes
- Customization guide

### License

#### LICENSE
MIT License - permissive open source license allowing:
- Commercial use
- Modification
- Distribution
- Private use

## Code Organization

### Server Architecture

```python
# server.py structure:

1. Imports
   - Standard library (asyncio, json, subprocess)
   - MCP framework imports

2. Server Initialization
   - app = Server("arch-kernel-mcp")

3. Helper Functions
   - run_command() - Execute shell commands safely

4. MCP Handlers
   - list_tools() - Register available tools
   - call_tool() - Route tool calls to implementations

5. Tool Implementations
   - list_kernels_impl()
   - list_kernel_packages_impl()
   - get_current_kernel_impl()
   - check_initramfs_config_impl()
   - list_bootloader_entries_impl()
   - check_vmd_status_impl()
   - generate_initramfs_vmd_config_impl()

6. Main Function
   - main() - Run stdio server
```

### Tool Implementation Pattern

Each tool follows this pattern:

```python
async def tool_name_impl(param: Type) -> Sequence[TextContent]:
    """Tool description.
    
    Args:
        param: Parameter description.
    
    Returns:
        Sequence of TextContent with results.
    """
    # Execute commands
    stdout, stderr, returncode = run_command([...])
    
    # Process results
    result = "Formatted output"
    
    # Return text content
    return [TextContent(type="text", text=result)]
```

## Design Principles

### 1. Safety First
- All operations are read-only
- No automatic system modifications
- Provides recommendations, not automated changes

### 2. Comprehensive Information
- Detailed diagnostic output
- Context and explanations
- Actionable recommendations

### 3. User-Friendly
- Natural language interface through Claude
- Clear, readable output
- Step-by-step guidance

### 4. Platform-Specific
- Arch Linux focused
- VMD/NVMe specialized
- Modern Intel platform support

### 5. Well-Documented
- Multiple documentation levels
- Examples and guides
- Troubleshooting scenarios

## Dependencies

### Runtime Dependencies
- **Python 3.10+** - Core runtime
- **mcp>=0.9.0** - Model Context Protocol framework
- **pacman** - Arch Linux package manager
- **mkinitcpio** - Initramfs generator

### Optional Dependencies
- **nvme-cli** - Enhanced NVMe device info
- **bootctl** - systemd-boot management
- **efibootmgr** - EFI boot manager
- **lsblk, lspci, lsmod** - System information tools

### Development Dependencies
- **pytest** - Testing framework (planned)
- **black** - Code formatting
- **mypy** - Type checking
- **ruff** - Linting

## Build and Distribution

### Development Install
```bash
pip install -e .
```

### Production Install (future)
```bash
pip install arch-kernel-mcp
```

### Building Distribution Package
```bash
python -m build
```

## Testing

### Current Testing
- Manual testing through Claude Desktop
- Syntax validation (`python -m py_compile`)
- Script testing on Arch Linux systems

### Planned Testing
- Unit tests for tool implementations
- Integration tests with MCP framework
- Mock system commands for testing
- CI/CD pipeline

## Future Enhancements

### Code
- [ ] Automated testing suite
- [ ] Type checking with mypy
- [ ] Code coverage reporting
- [ ] CI/CD with GitHub Actions

### Features
- [ ] More kernel management tools
- [ ] AUR kernel support
- [ ] Kernel compilation helpers
- [ ] Configuration backup/restore

### Documentation
- [ ] Video tutorials
- [ ] More platform-specific guides
- [ ] Translation to other languages
- [ ] Interactive documentation

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Code standards
- Testing procedures
- Pull request process

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: This repository

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

Current version: **0.1.0** (Initial Release)
