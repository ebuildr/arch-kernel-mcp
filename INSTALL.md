# Installation Guide

## Prerequisites

Before installing arch-kernel-mcp, ensure you have:

1. **Arch Linux** system (this is Arch-specific)
2. **Python 3.10+** installed
   ```bash
   python --version
   ```
3. **pip** package manager
   ```bash
   pip --version
   ```

## Installation Methods

### Method 1: Install from Source (Recommended for Development)

```bash
# Clone the repository
git clone https://github.com/ebuildr/arch-kernel-mcp.git
cd arch-kernel-mcp

# Install in editable mode
pip install -e .
```

### Method 2: Install from PyPI (when published)

```bash
pip install arch-kernel-mcp
```

### Method 3: Manual Installation

If you prefer not to use pip:

```bash
# Clone the repository
git clone https://github.com/ebuildr/arch-kernel-mcp.git
cd arch-kernel-mcp

# Install dependencies
pip install mcp

# Run directly
python -m arch_kernel_mcp.server
```

## Verifying Installation

After installation, verify the command is available:

```bash
which arch-kernel-mcp
# Should output: /usr/local/bin/arch-kernel-mcp or ~/.local/bin/arch-kernel-mcp
```

Test the server:

```bash
# The server will wait for stdio input (this is normal)
arch-kernel-mcp
# Press Ctrl+C to exit
```

## Configuring with Claude Desktop

### Step 1: Locate Claude Desktop Config

The configuration file location depends on your system:

- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Step 2: Edit Configuration

Add the arch-kernel-mcp server to your configuration:

```json
{
  "mcpServers": {
    "arch-kernel": {
      "command": "arch-kernel-mcp"
    }
  }
}
```

If you have other MCP servers configured:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "some-other-mcp-server"
    },
    "arch-kernel": {
      "command": "arch-kernel-mcp"
    }
  }
}
```

### Step 3: Restart Claude Desktop

After editing the configuration:
1. Save the file
2. Restart Claude Desktop completely
3. The arch-kernel tools should now be available

### Step 4: Verify in Claude

In Claude Desktop, you can verify the server is loaded by asking:
- "What MCP tools are available?"
- "Can you list the installed kernels on my system?"

## Troubleshooting

### Command not found

If `arch-kernel-mcp` is not found after installation:

```bash
# Check if it's in your local bin
ls ~/.local/bin/arch-kernel-mcp

# Add to PATH if needed
export PATH="$HOME/.local/bin:$PATH"

# Make permanent by adding to ~/.bashrc or ~/.zshrc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

### Permission Errors

Some operations require sudo. The MCP server itself doesn't need sudo, but when Claude tries to:
- Install kernels
- Modify system files
- Regenerate initramfs

You'll need to execute the suggested commands manually with sudo.

### Module Import Errors

If you get import errors:

```bash
# Ensure mcp is installed
pip install mcp

# Or reinstall the package
pip install --force-reinstall arch-kernel-mcp
```

### Claude Desktop Not Detecting Server

1. Check the config file syntax (must be valid JSON)
2. Verify the command path is correct
3. Check Claude Desktop logs (usually in the same config directory)
4. Restart Claude Desktop completely (quit and reopen)

## System Requirements

- **OS**: Arch Linux (or Arch-based distribution)
- **Python**: 3.10 or higher
- **Disk Space**: ~10 MB for package and dependencies
- **Network**: Required for initial installation from PyPI

## Next Steps

After installation, see:
- [README.md](README.md) - Overview and features
- [USAGE.md](USAGE.md) - Detailed usage examples (if available)
- Example queries you can ask Claude:
  - "What kernels are installed on my system?"
  - "Check if VMD is configured in my initramfs"
  - "Generate a recommended mkinitcpio.conf for VMD support"
