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
 * Update GRUB configuration
 */
export async function updateGrub(): Promise<string> {
  try {
    const result = await execCommand('sudo grub-mkconfig -o /boot/grub/grub.cfg');
    return `GRUB configuration updated\n${result}`;
  } catch (error: any) {
    throw new Error(`Failed to update GRUB: ${error.message}`);
  }
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
