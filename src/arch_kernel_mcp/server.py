#!/usr/bin/env python3
"""
MCP Server for managing Arch Linux kernels.

This server provides tools for:
- Listing installed kernels
- Managing kernel packages
- Configuring initramfs (including VMD support)
- Managing bootloader configurations
"""

import asyncio
import json
import subprocess
from typing import Any, Sequence

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent


# Initialize the MCP server
app = Server("arch-kernel-mcp")


def run_command(cmd: list[str]) -> tuple[str, str, int]:
    """Run a shell command and return stdout, stderr, and exit code."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "Command timed out", 1
    except Exception as e:
        return "", str(e), 1


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools for kernel management."""
    return [
        Tool(
            name="list_kernels",
            description="List all installed Linux kernels on the system",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="list_kernel_packages",
            description="List available kernel packages in Arch repositories",
            inputSchema={
                "type": "object",
                "properties": {
                    "search_term": {
                        "type": "string",
                        "description": "Optional search term to filter kernel packages"
                    }
                },
                "required": []
            }
        ),
        Tool(
            name="get_current_kernel",
            description="Get information about the currently running kernel",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="check_initramfs_config",
            description="Check the current initramfs configuration (mkinitcpio.conf)",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="list_bootloader_entries",
            description="List bootloader entries (systemd-boot or GRUB)",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="check_vmd_status",
            description="Check VMD (Volume Management Device) status and NVMe devices",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="generate_initramfs_vmd_config",
            description="Generate recommended mkinitcpio.conf configuration for VMD/NVMe support",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> Sequence[TextContent]:
    """Handle tool calls for kernel management."""
    
    if name == "list_kernels":
        return await list_kernels_impl()
    elif name == "list_kernel_packages":
        search_term = arguments.get("search_term", "")
        return await list_kernel_packages_impl(search_term)
    elif name == "get_current_kernel":
        return await get_current_kernel_impl()
    elif name == "check_initramfs_config":
        return await check_initramfs_config_impl()
    elif name == "list_bootloader_entries":
        return await list_bootloader_entries_impl()
    elif name == "check_vmd_status":
        return await check_vmd_status_impl()
    elif name == "generate_initramfs_vmd_config":
        return await generate_initramfs_vmd_config_impl()
    else:
        raise ValueError(f"Unknown tool: {name}")


async def list_kernels_impl() -> Sequence[TextContent]:
    """List all installed kernel packages."""
    stdout, stderr, returncode = run_command(["pacman", "-Q"])
    
    if returncode != 0:
        return [TextContent(
            type="text",
            text=f"Error listing packages: {stderr}"
        )]
    
    # Filter for kernel packages
    kernels = []
    for line in stdout.splitlines():
        # Match lines starting with 'linux' followed by space or dash
        parts = line.split()
        if parts and parts[0].lower().startswith(('linux ', 'linux-')) or parts[0].lower() == 'linux':
            kernels.append(line)
    
    result = "Installed kernel packages:\n\n"
    if kernels:
        result += "\n".join(kernels)
    else:
        result += "No kernel packages found"
    
    # Also check /boot for kernel files
    stdout_boot, _, _ = run_command(["ls", "-lh", "/boot"])
    result += "\n\nKernel files in /boot:\n"
    for line in stdout_boot.splitlines():
        if "vmlinuz" in line or "initramfs" in line:
            result += line + "\n"
    
    return [TextContent(type="text", text=result)]


async def list_kernel_packages_impl(search_term: str) -> Sequence[TextContent]:
    """List available kernel packages in repositories."""
    search = search_term if search_term else "^linux"
    stdout, stderr, returncode = run_command(["pacman", "-Ss", search])
    
    if returncode != 0:
        return [TextContent(
            type="text",
            text=f"Error searching packages: {stderr}"
        )]
    
    # Filter for actual kernel packages
    # Note: 'community' has been merged into 'extra' in recent Arch Linux
    lines = stdout.splitlines()
    filtered_lines = []
    for i, line in enumerate(lines):
        # Match lines starting with repo/linux (flexible for any repo name)
        if '/' in line and line.split('/', 1)[1].startswith('linux'):
            filtered_lines.append(line)
            # Add description line if it exists (doesn't start with repo/)
            if i + 1 < len(lines) and not lines[i + 1].startswith((" ", "\t")) and '/' not in lines[i + 1]:
                filtered_lines.append(lines[i + 1])
    
    result = "Available kernel packages:\n\n"
    result += "\n".join(filtered_lines) if filtered_lines else "No kernel packages found"
    
    return [TextContent(type="text", text=result)]


async def get_current_kernel_impl() -> Sequence[TextContent]:
    """Get information about the currently running kernel."""
    stdout, stderr, returncode = run_command(["uname", "-a"])
    
    if returncode != 0:
        return [TextContent(
            type="text",
            text=f"Error getting kernel info: {stderr}"
        )]
    
    result = f"Current kernel:\n{stdout}\n"
    
    # Get kernel version
    stdout_version, _, _ = run_command(["uname", "-r"])
    result += f"\nKernel version: {stdout_version}"
    
    # Check kernel modules
    stdout_modules, _, _ = run_command(["lsmod"])
    result += f"\nLoaded kernel modules: {len(stdout_modules.splitlines()) - 1} modules loaded\n"
    
    return [TextContent(type="text", text=result)]


async def check_initramfs_config_impl() -> Sequence[TextContent]:
    """Check the current initramfs configuration."""
    try:
        with open("/etc/mkinitcpio.conf", "r") as f:
            config = f.read()
        
        result = "Current /etc/mkinitcpio.conf configuration:\n\n"
        result += config
        
        # Highlight important VMD-related settings
        result += "\n\n--- Analysis ---\n"
        
        if "vmd" in config.lower():
            result += "✓ VMD module appears to be configured\n"
        else:
            result += "⚠ VMD module not found in configuration\n"
        
        if "nvme" in config.lower():
            result += "✓ NVMe support appears to be configured\n"
        else:
            result += "⚠ NVMe support not explicitly configured\n"
        
        # Check MODULES line
        for line in config.splitlines():
            if line.startswith("MODULES=") and not line.startswith("#"):
                result += f"\nActive MODULES line: {line}\n"
        
        return [TextContent(type="text", text=result)]
    
    except FileNotFoundError:
        return [TextContent(
            type="text",
            text="Error: /etc/mkinitcpio.conf not found. Is this an Arch Linux system?"
        )]
    except Exception as e:
        return [TextContent(
            type="text",
            text=f"Error reading mkinitcpio.conf: {str(e)}"
        )]


async def list_bootloader_entries_impl() -> Sequence[TextContent]:
    """List bootloader entries."""
    result = "Bootloader configuration:\n\n"
    
    # Check for systemd-boot
    stdout_boot, _, rc_boot = run_command(["bootctl", "status"])
    if rc_boot == 0:
        result += "=== systemd-boot Status ===\n"
        result += stdout_boot + "\n"
        
        # List entries
        stdout_list, _, _ = run_command(["bootctl", "list"])
        result += "\n=== Boot Entries ===\n"
        result += stdout_list + "\n"
    else:
        result += "systemd-boot not detected or not accessible\n"
    
    # Check for GRUB
    stdout_grub, _, rc_grub = run_command(["ls", "-l", "/boot/grub/grub.cfg"])
    if rc_grub == 0:
        result += "\n=== GRUB Detected ===\n"
        result += stdout_grub + "\n"
        
        # Try to read grub entries
        try:
            with open("/boot/grub/grub.cfg", "r") as f:
                grub_config = f.read()
                entries = [line for line in grub_config.splitlines() if "menuentry" in line]
                result += "\nGRUB menu entries:\n"
                for entry in entries[:10]:  # Limit to first 10
                    result += entry + "\n"
        except Exception as e:
            result += f"Could not read GRUB config: {str(e)}\n"
    
    # Check EFI entries
    stdout_efi, _, rc_efi = run_command(["efibootmgr", "-v"])
    if rc_efi == 0:
        result += "\n=== EFI Boot Manager ===\n"
        result += stdout_efi + "\n"
    
    return [TextContent(type="text", text=result)]


async def check_vmd_status_impl() -> Sequence[TextContent]:
    """Check VMD and NVMe device status."""
    result = "VMD and NVMe Device Status:\n\n"
    
    # Check for VMD in kernel modules
    stdout_lsmod, _, _ = run_command(["lsmod"])
    vmd_loaded = "vmd" in stdout_lsmod.lower()
    result += f"VMD kernel module loaded: {'Yes' if vmd_loaded else 'No'}\n\n"
    
    # Check lspci for VMD devices
    stdout_pci, _, _ = run_command(["lspci", "-vv"])
    vmd_devices = [line for line in stdout_pci.splitlines() if "vmd" in line.lower() or "volume management device" in line.lower()]
    
    if vmd_devices:
        result += "=== VMD Devices (lspci) ===\n"
        result += "\n".join(vmd_devices) + "\n\n"
    else:
        result += "No VMD devices found in lspci output\n\n"
    
    # Check NVMe devices
    stdout_nvme, _, rc_nvme = run_command(["nvme", "list"])
    if rc_nvme == 0:
        result += "=== NVMe Devices ===\n"
        result += stdout_nvme + "\n\n"
    else:
        result += "nvme-cli not installed or no NVMe devices found\n\n"
    
    # Check block devices
    stdout_lsblk, _, _ = run_command(["lsblk", "-o", "NAME,SIZE,TYPE,MOUNTPOINT,MODEL"])
    result += "=== Block Devices ===\n"
    result += stdout_lsblk + "\n"
    
    return [TextContent(type="text", text=result)]


async def generate_initramfs_vmd_config_impl() -> Sequence[TextContent]:
    """Generate recommended mkinitcpio configuration for VMD/NVMe support."""
    
    config_recommendation = """
Recommended mkinitcpio.conf configuration for VMD/NVMe support:

=== MODULES Configuration ===
For systems using VMD (Volume Management Device) with NVMe drives, you need to load
the VMD module early in the boot process.

Add to MODULES line in /etc/mkinitcpio.conf:
MODULES=(vmd nvme)

Or if you have other modules:
MODULES=(vmd nvme <other modules>)

=== HOOKS Configuration ===
Ensure you have the necessary hooks. A typical configuration:
HOOKS=(base udev autodetect modconf kms keyboard keymap consolefont block filesystems fsck)

=== After Modifying Configuration ===
1. Save the changes to /etc/mkinitcpio.conf
2. Regenerate initramfs for all kernels:
   sudo mkinitcpio -P

3. For a specific kernel preset:
   sudo mkinitcpio -p linux

=== Verification ===
After rebooting, verify VMD is loaded:
   lsmod | grep vmd

Check NVMe devices are detected:
   lsblk
   nvme list

=== Additional Notes for Intel Arrow Lake-HX with VMD ===
- VMD is commonly used on newer Intel platforms (like Arrow Lake)
- VMD allows the PCIe controller to manage NVMe devices
- Without VMD support in initramfs, NVMe drives may not be detected during boot
- This is critical for dual-boot configurations where the boot partition is on NVMe

=== Current System Detection ===
"""
    
    # Try to detect current configuration
    try:
        with open("/etc/mkinitcpio.conf", "r") as f:
            config = f.read()
            
        config_recommendation += "\nCurrent MODULES configuration:\n"
        for line in config.splitlines():
            if line.startswith("MODULES=") and not line.startswith("#"):
                config_recommendation += f"  {line}\n"
                
                if "vmd" in line.lower():
                    config_recommendation += "  ✓ VMD module is already configured\n"
                else:
                    config_recommendation += "  ⚠ VMD module NOT found - needs to be added\n"
    except Exception as e:
        config_recommendation += f"\nCould not read current config: {str(e)}\n"
    
    return [TextContent(type="text", text=config_recommendation)]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
