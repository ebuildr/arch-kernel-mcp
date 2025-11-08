import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';

const execAsync = promisify(exec);

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
 * Read and parse mkinitcpio.conf
 */
export async function getMkinitcpioConfig(): Promise<string> {
  try {
    const config = await readFile('/etc/mkinitcpio.conf', 'utf-8');
    return config;
  } catch (error: any) {
    throw new Error(`Failed to read mkinitcpio.conf: ${error.message}`);
  }
}

/**
 * Parse MODULES array from mkinitcpio.conf
 */
export function parseModules(config: string): string[] {
  const modulesMatch = config.match(/^MODULES=\(([^)]*)\)/m);
  if (!modulesMatch) {
    return [];
  }

  const modulesString = modulesMatch[1];
  // Split by whitespace, filter empty strings
  return modulesString.split(/\s+/).filter(m => m.length > 0);
}

/**
 * Get current modules configured in mkinitcpio.conf
 */
export async function getConfiguredModules(): Promise<string[]> {
  const config = await getMkinitcpioConfig();
  return parseModules(config);
}

/**
 * Add a module to mkinitcpio.conf MODULES array
 */
export async function addInitramfsModule(moduleName: string): Promise<string> {
  try {
    // Validate module name (alphanumeric, underscore, hyphen only)
    if (!moduleName.match(/^[a-zA-Z0-9_-]+$/)) {
      throw new Error(`Invalid module name: ${moduleName}`);
    }

    const config = await getMkinitcpioConfig();
    const currentModules = parseModules(config);

    // Check if module already exists
    if (currentModules.includes(moduleName)) {
      return `Module '${moduleName}' is already configured in mkinitcpio.conf`;
    }

    // Add module to array
    const newModules = [...currentModules, moduleName];
    const modulesString = newModules.join(' ');

    // Replace MODULES line
    const newConfig = config.replace(
      /^MODULES=\([^)]*\)/m,
      `MODULES=(${modulesString})`
    );

    // Write back to file (requires sudo)
    await writeFile('/etc/mkinitcpio.conf', newConfig, 'utf-8');

    return `Added '${moduleName}' to mkinitcpio.conf MODULES array`;
  } catch (error: any) {
    throw new Error(`Failed to add module to mkinitcpio.conf: ${error.message}`);
  }
}

/**
 * Remove a module from mkinitcpio.conf MODULES array
 */
export async function removeInitramfsModule(moduleName: string): Promise<string> {
  try {
    const config = await getMkinitcpioConfig();
    const currentModules = parseModules(config);

    // Check if module exists
    if (!currentModules.includes(moduleName)) {
      return `Module '${moduleName}' is not configured in mkinitcpio.conf`;
    }

    // Remove module from array
    const newModules = currentModules.filter(m => m !== moduleName);
    const modulesString = newModules.join(' ');

    // Replace MODULES line
    const newConfig = config.replace(
      /^MODULES=\([^)]*\)/m,
      `MODULES=(${modulesString})`
    );

    // Write back to file (requires sudo)
    await writeFile('/etc/mkinitcpio.conf', newConfig, 'utf-8');

    return `Removed '${moduleName}' from mkinitcpio.conf MODULES array`;
  } catch (error: any) {
    throw new Error(`Failed to remove module from mkinitcpio.conf: ${error.message}`);
  }
}

/**
 * Rebuild initramfs for all installed kernels
 */
export async function rebuildInitramfs(): Promise<string> {
  try {
    const result = await execCommand('sudo mkinitcpio -P');
    return `Rebuilt initramfs for all kernels:\n${result}`;
  } catch (error: any) {
    throw new Error(`Failed to rebuild initramfs: ${error.message}`);
  }
}

/**
 * Rebuild initramfs for a specific kernel
 */
export async function rebuildInitramfsForKernel(preset: string): Promise<string> {
  try {
    // Validate preset name
    if (!preset.match(/^[a-zA-Z0-9_-]+$/)) {
      throw new Error(`Invalid preset name: ${preset}`);
    }

    const result = await execCommand(`sudo mkinitcpio -p ${preset}`);
    return `Rebuilt initramfs for kernel preset '${preset}':\n${result}`;
  } catch (error: any) {
    throw new Error(`Failed to rebuild initramfs for ${preset}: ${error.message}`);
  }
}

/**
 * List modules in a specific initramfs image
 */
export async function listInitramfsModules(imagePath?: string): Promise<string[]> {
  try {
    // Default to current kernel's initramfs
    const kernelVersion = await execCommand('uname -r');
    const path = imagePath || `/boot/initramfs-linux.img`;

    // Use lsinitcpio to list modules
    const result = await execCommand(`lsinitcpio -m ${path}`);
    return result.split('\n').filter(m => m.length > 0);
  } catch (error: any) {
    throw new Error(`Failed to list initramfs modules: ${error.message}`);
  }
}

/**
 * Check if a specific module is in the initramfs
 */
export async function checkInitramfsModule(moduleName: string, imagePath?: string): Promise<boolean> {
  try {
    const modules = await listInitramfsModules(imagePath);
    // Check if module exists (with or without .ko extension)
    return modules.some(m =>
      m === moduleName ||
      m === `${moduleName}.ko` ||
      m.endsWith(`/${moduleName}.ko`)
    );
  } catch (error: any) {
    throw new Error(`Failed to check initramfs module: ${error.message}`);
  }
}

/**
 * Get detailed initramfs analysis
 */
export async function analyzeInitramfs(): Promise<{
  configured: string[];
  installed: string[];
  missing: string[];
  extra: string[];
}> {
  try {
    const configured = await getConfiguredModules();
    const installed = await listInitramfsModules();

    // Simplify installed module names (remove paths and .ko extension)
    const installedSimple = installed.map(m => {
      const basename = m.split('/').pop() || m;
      return basename.replace(/\.ko$/, '');
    });

    // Find modules configured but not in initramfs
    const missing = configured.filter(m => !installedSimple.includes(m));

    // Find modules in initramfs but not configured (from autodetect hook)
    const extra = installedSimple.filter(m => !configured.includes(m));

    return {
      configured,
      installed: installedSimple,
      missing,
      extra
    };
  } catch (error: any) {
    throw new Error(`Failed to analyze initramfs: ${error.message}`);
  }
}

/**
 * List available kernel presets
 */
export async function listKernelPresets(): Promise<string[]> {
  try {
    const result = await execCommand('ls /etc/mkinitcpio.d/*.preset 2>/dev/null || true');
    if (!result) {
      return [];
    }

    return result.split('\n')
      .filter(f => f.length > 0)
      .map(f => {
        const basename = f.split('/').pop() || f;
        return basename.replace('.preset', '');
      });
  } catch (error: any) {
    throw new Error(`Failed to list kernel presets: ${error.message}`);
  }
}
