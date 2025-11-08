import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface KernelInfo {
  name: string;
  version: string;
  installed: boolean;
  current?: boolean;
}

/**
 * Execute a command and return stdout
 */
async function execCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command);
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

/**
 * Get the currently running kernel version
 */
export async function getCurrentKernel(): Promise<string> {
  return await execCommand('uname -r');
}

/**
 * List all installed kernels
 */
export async function listInstalledKernels(): Promise<KernelInfo[]> {
  try {
    const currentKernel = await getCurrentKernel();
    const stdout = await execCommand('pacman -Q | grep "^linux"');

    const kernels: KernelInfo[] = [];
    const lines = stdout.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const [name, version] = line.split(/\s+/);
      // Only include actual kernel packages, not kernel modules or tools
      if (name.match(/^linux(-[a-z0-9]+)?$/)) {
        kernels.push({
          name,
          version,
          installed: true,
          current: currentKernel.includes(name.replace('linux', '').replace('-', ''))
        });
      }
    }

    return kernels;
  } catch (error: any) {
    throw new Error(`Failed to list installed kernels: ${error.message}`);
  }
}

/**
 * List available kernel packages in repositories
 */
export async function listAvailableKernels(): Promise<string[]> {
  try {
    const stdout = await execCommand('pacman -Ss "^linux$|^linux-.*$" | grep "^[a-z]" | cut -d "/" -f 2 | cut -d " " -f 1');
    return stdout.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && trimmed.match(/^linux(-[a-z0-9]+)?$/);
    });
  } catch (error: any) {
    throw new Error(`Failed to list available kernels: ${error.message}`);
  }
}

/**
 * Install a kernel package
 */
export async function installKernel(kernelName: string): Promise<string> {
  try {
    // Validate kernel name to prevent command injection
    if (!kernelName.match(/^linux(-[a-z0-9]+)?$/)) {
      throw new Error(`Invalid kernel name: ${kernelName}`);
    }

    const result = await execCommand(`sudo pacman -S --noconfirm ${kernelName}`);
    return `Successfully installed ${kernelName}\n${result}`;
  } catch (error: any) {
    throw new Error(`Failed to install kernel ${kernelName}: ${error.message}`);
  }
}

/**
 * Remove a kernel package
 */
export async function removeKernel(kernelName: string): Promise<string> {
  try {
    // Validate kernel name
    if (!kernelName.match(/^linux(-[a-z0-9]+)?$/)) {
      throw new Error(`Invalid kernel name: ${kernelName}`);
    }

    // Check if it's the current kernel
    const currentKernel = await getCurrentKernel();
    if (currentKernel.includes(kernelName.replace('linux', '').replace('-', ''))) {
      throw new Error('Cannot remove the currently running kernel. Please boot into another kernel first.');
    }

    const result = await execCommand(`sudo pacman -R --noconfirm ${kernelName}`);
    return `Successfully removed ${kernelName}\n${result}`;
  } catch (error: any) {
    throw new Error(`Failed to remove kernel ${kernelName}: ${error.message}`);
  }
}

/**
 * Regenerate GRUB configuration (full rebuild)
 * WARNING: This regenerates the entire GRUB menu. Use generateGrubEntry for safer operation.
 */
export async function regenerateGrubConfig(): Promise<string> {
  try {
    const result = await execCommand('sudo grub-mkconfig -o /boot/grub/grub.cfg');
    return `GRUB configuration regenerated\n${result}`;
  } catch (error: any) {
    throw new Error(`Failed to regenerate GRUB: ${error.message}`);
  }
}

/**
 * Legacy alias for regenerateGrubConfig
 * @deprecated Use regenerateGrubConfig instead
 */
export async function updateGrub(): Promise<string> {
  return regenerateGrubConfig();
}

/**
 * Update all installed kernels
 */
export async function updateKernels(): Promise<string> {
  try {
    const kernels = await listInstalledKernels();
    const kernelNames = kernels.map(k => k.name).join(' ');

    if (kernelNames) {
      const result = await execCommand(`sudo pacman -Syu --noconfirm ${kernelNames}`);
      return `Kernels updated\n${result}`;
    } else {
      return 'No kernels found to update';
    }
  } catch (error: any) {
    throw new Error(`Failed to update kernels: ${error.message}`);
  }
}

/**
 * Get kernel package information
 */
export async function getKernelInfo(kernelName: string): Promise<string> {
  try {
    if (!kernelName.match(/^linux(-[a-z0-9]+)?$/)) {
      throw new Error(`Invalid kernel name: ${kernelName}`);
    }

    return await execCommand(`pacman -Si ${kernelName} 2>/dev/null || pacman -Qi ${kernelName}`);
  } catch (error: any) {
    throw new Error(`Failed to get info for kernel ${kernelName}: ${error.message}`);
  }
}

/**
 * Check if system uses GRUB or systemd-boot
 */
export async function getBootloader(): Promise<'grub' | 'systemd-boot' | 'unknown'> {
  try {
    // Check for GRUB
    try {
      await execCommand('which grub-mkconfig');
      return 'grub';
    } catch {
      // Continue to check systemd-boot
    }

    // Check for systemd-boot
    try {
      await execCommand('bootctl status');
      return 'systemd-boot';
    } catch {
      return 'unknown';
    }
  } catch {
    return 'unknown';
  }
}

/**
 * Generate a safe GRUB boot entry for a custom kernel
 * This creates a NEW entry without modifying existing ones
 *
 * @param entryName - Custom name for the boot entry (e.g., "EndeavourOS CUDA Kernel")
 * @param kernelImage - Kernel image filename (e.g., "vmlinuz-linux-cuda")
 * @param initramfsImage - Initramfs image filename (e.g., "initramfs-linux-cuda.img")
 * @returns Shell script that safely adds the new GRUB entry
 */
export async function generateGrubEntry(
  entryName: string,
  kernelImage: string = 'vmlinuz-linux',
  initramfsImage: string = 'initramfs-linux.img'
): Promise<string> {
  // Validate inputs
  if (!entryName || entryName.trim().length === 0) {
    throw new Error('Entry name is required');
  }

  // Sanitize entry name for use in filename
  const sanitizedName = entryName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const customEntryFile = `40_custom_${sanitizedName}`;

  const script = `#!/bin/bash
# Safe GRUB Entry Generator for Arch Linux
# Entry: ${entryName}
# Kernel: ${kernelImage}
# Initramfs: ${initramfsImage}
# ==========================================

set -e

echo "=================================="
echo "Safe GRUB Entry Generator"
echo "=================================="
echo ""
echo "This will create a NEW boot entry:"
echo "  Name: ${entryName}"
echo "  Kernel: /boot/${kernelImage}"
echo "  Initramfs: /boot/${initramfsImage}"
echo ""
echo "Your existing boot entries will NOT be modified."
echo "A backup of your current GRUB config will be created."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! \\$REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Check if kernel and initramfs exist
if [[ ! -f "/boot/${kernelImage}" ]]; then
    echo "ERROR: Kernel image /boot/${kernelImage} not found!"
    echo "Available kernels in /boot:"
    ls -1 /boot/vmlinuz-* 2>/dev/null || echo "  (none found)"
    exit 1
fi

if [[ ! -f "/boot/${initramfsImage}" ]]; then
    echo "ERROR: Initramfs image /boot/${initramfsImage} not found!"
    echo "Available initramfs in /boot:"
    ls -1 /boot/initramfs-*.img 2>/dev/null || echo "  (none found)"
    exit 1
fi

# Backup existing GRUB configuration
BACKUP_FILE="/boot/grub/grub.cfg.backup-\\$(date +%Y%m%d-%H%M%S)"
echo ""
echo "Creating backup: \\$BACKUP_FILE"
sudo cp /boot/grub/grub.cfg "\\$BACKUP_FILE"

# Get root UUID
ROOT_UUID=\\$(findmnt -no UUID /)
if [[ -z "\\$ROOT_UUID" ]]; then
    echo "ERROR: Could not determine root filesystem UUID"
    exit 1
fi

# Create custom GRUB entry file
echo ""
echo "Creating custom GRUB entry file..."
sudo tee /etc/grub.d/${customEntryFile} > /dev/null << GRUBEOF
#!/bin/sh
exec tail -n +3 \\$0

menuentry '${entryName}' --class arch --class gnu-linux --class gnu --class os {
    load_video
    set gfxpayload=keep
    insmod gzio
    insmod part_gpt
    insmod ext2

    # Search for boot partition
    search --no-floppy --fs-uuid --set=root \\$(grub-probe --target=fs_uuid /boot)

    echo 'Loading kernel: ${kernelImage}...'
    linux /boot/${kernelImage} root=UUID=\${ROOT_UUID} rw quiet

    echo 'Loading initramfs: ${initramfsImage}...'
    initrd /boot/${initramfsImage}
}
GRUBEOF

# Make it executable
sudo chmod +x /etc/grub.d/${customEntryFile}

# Regenerate GRUB configuration
echo ""
echo "Regenerating GRUB configuration..."
sudo grub-mkconfig -o /boot/grub/grub.cfg

echo ""
echo "=================================="
echo "✓ Success!"
echo "=================================="
echo ""
echo "New boot entry '${entryName}' has been added."
echo ""
echo "Your boot menu now includes:"
echo "  - All original entries (unchanged)"
echo "  - ${entryName} ← NEW"
echo ""
echo "To test:"
echo "  1. Reboot your system"
echo "  2. Select '${entryName}' from GRUB menu"
echo "  3. If there are issues, reboot and select your original kernel"
echo ""
echo "To restore original GRUB config if needed:"
echo "  sudo cp \\$BACKUP_FILE /boot/grub/grub.cfg"
echo ""
echo "To remove this custom entry:"
echo "  sudo rm /etc/grub.d/${customEntryFile}"
echo "  sudo grub-mkconfig -o /boot/grub/grub.cfg"
echo ""
`;

  return script;
}
