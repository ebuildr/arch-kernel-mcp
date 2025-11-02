# Quick Start Guide

Get up and running with arch-kernel-mcp in 5 minutes.

## Installation (2 minutes)

```bash
# Clone and install
git clone https://github.com/ebuildr/arch-kernel-mcp.git
cd arch-kernel-mcp
pip install -e .
```

## Configuration (2 minutes)

Edit Claude Desktop config:

**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arch-kernel": {
      "command": "arch-kernel-mcp"
    }
  }
}
```

Restart Claude Desktop.

## First Use (1 minute)

Ask Claude:

```
"What kernels are installed on my system?"
```

## VMD Quick Fix

If you're having NVMe boot issues:

1. **Ask Claude:**
   ```
   "Check my VMD status"
   ```

2. **If VMD is missing, ask:**
   ```
   "Generate VMD configuration"
   ```

3. **Apply the fix manually:**
   ```bash
   sudo nano /etc/mkinitcpio.conf
   # Add: MODULES=(vmd nvme)
   sudo mkinitcpio -P
   sudo reboot
   ```

## Common Questions

**Q: What can I ask Claude?**
- "What kernels are installed?"
- "Check VMD status"
- "Show bootloader entries"
- "Generate VMD configuration"
- "What's my current kernel?"
- "Search for kernel packages"

**Q: Does it modify my system?**
- No, it's read-only. It provides recommendations that you apply manually.

**Q: Do I need sudo?**
- Not for the MCP server itself
- Some recommended commands will need sudo

**Q: Will it work on my system?**
- Designed for Arch Linux
- Especially helpful for systems with VMD/NVMe
- Works on any Arch system for kernel management

## Next Steps

- Read [USAGE.md](USAGE.md) for detailed examples
- See [VMD_GUIDE.md](VMD_GUIDE.md) if you have VMD-related issues
- Check [INSTALL.md](INSTALL.md) for troubleshooting

## Help

Something not working? Check:

1. `which arch-kernel-mcp` - Is it installed?
2. Claude Desktop config - Is the JSON valid?
3. Restart Claude Desktop completely
4. Check logs in `~/.config/Claude/` directory

## One-Line Summary

**arch-kernel-mcp** lets you ask Claude about your Arch Linux kernel configuration, especially for modern Intel systems with VMD/NVMe storage.
