import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';

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
 * Intel VMD PCI device IDs (known controllers)
 */
const VMD_DEVICE_IDS = [
  '8086:467f', // Intel VMD (Tiger Lake and newer)
  '8086:9a0b', // Intel VMD (Comet Lake)
  '8086:a77f', // Intel VMD (Raptor Lake)
  '8086:7d0b', // Intel VMD (Meteor Lake)
  '8086:ad0b', // Intel VMD (Alder Lake)
];

export interface VMDDevice {
  pciAddress: string;
  deviceId: string;
  deviceName: string;
  driver: string;
}

/**
 * Detect Intel VMD hardware
 */
export async function detectVMDHardware(): Promise<VMDDevice[]> {
  try {
    // Use lspci to find VMD controllers
    const lspciOutput = await execCommand('lspci -nn');
    const lines = lspciOutput.split('\n');

    const vmdDevices: VMDDevice[] = [];

    for (const line of lines) {
      // Look for Intel VMD devices
      if (line.includes('Volume Management Device') ||
          VMD_DEVICE_IDS.some(id => line.includes(id))) {

        // Parse PCI address (e.g., "00:0e.0")
        const addressMatch = line.match(/^([0-9a-f:.]+)/);
        const pciAddress = addressMatch ? addressMatch[1] : 'unknown';

        // Parse device ID (e.g., "[8086:467f]")
        const deviceIdMatch = line.match(/\[([0-9a-f:]+)\]/);
        const deviceId = deviceIdMatch ? deviceIdMatch[1] : 'unknown';

        // Parse device name
        const nameMatch = line.match(/: (.+?) \[/);
        const deviceName = nameMatch ? nameMatch[1] : 'Intel Volume Management Device';

        // Check if driver is loaded
        let driver = 'none';
        try {
          const driverPath = `/sys/bus/pci/devices/0000:${pciAddress}/driver`;
          await access(driverPath);
          const driverLink = await execCommand(`readlink ${driverPath}`);
          driver = driverLink.split('/').pop() || 'unknown';
        } catch {
          // Driver not loaded
        }

        vmdDevices.push({
          pciAddress,
          deviceId,
          deviceName,
          driver
        });
      }
    }

    return vmdDevices;
  } catch (error: any) {
    throw new Error(`Failed to detect VMD hardware: ${error.message}`);
  }
}

/**
 * Check if VMD kernel module is loaded
 */
export async function isVMDModuleLoaded(): Promise<boolean> {
  try {
    const result = await execCommand('lsmod | grep "^vmd " || true');
    return result.length > 0;
  } catch {
    return false;
  }
}

/**
 * Check if VMD kernel module is available
 */
export async function isVMDModuleAvailable(): Promise<boolean> {
  try {
    const kernelVersion = await execCommand('uname -r');
    const modulePath = `/lib/modules/${kernelVersion}/kernel/drivers/pci/controller/vmd.ko`;

    try {
      await access(modulePath);
      return true;
    } catch {
      // Try compressed version
      try {
        await access(`${modulePath}.xz`);
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
}

/**
 * Get VMD module information
 */
export async function getVMDModuleInfo(): Promise<string> {
  try {
    const result = await execCommand('modinfo vmd');
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get VMD module info: ${error.message}`);
  }
}

/**
 * List devices managed by VMD
 */
export async function listVMDManagedDevices(): Promise<string[]> {
  try {
    // VMD-managed devices appear under /sys/bus/pci/drivers/vmd/
    const result = await execCommand('ls -1 /sys/bus/pci/drivers/vmd/ 2>/dev/null || true');

    if (!result) {
      return [];
    }

    return result.split('\n')
      .filter(item => item.match(/^[0-9a-f:]+$/))
      .map(item => item.trim());
  } catch {
    return [];
  }
}

/**
 * Get NVMe devices behind VMD
 */
export async function getNVMeBehindVMD(): Promise<string[]> {
  try {
    const vmdDevices = await listVMDManagedDevices();
    const nvmeDevices: string[] = [];

    for (const vmdPci of vmdDevices) {
      try {
        // Look for NVMe controllers under this VMD domain
        const devices = await execCommand(
          `find /sys/devices -path "*${vmdPci}*/nvme/nvme*" -name "nvme*" 2>/dev/null || true`
        );

        if (devices) {
          const deviceList = devices.split('\n')
            .filter(d => d.length > 0)
            .map(d => d.split('/').pop() || '');
          nvmeDevices.push(...deviceList);
        }
      } catch {
        // Continue to next VMD device
      }
    }

    return [...new Set(nvmeDevices)]; // Remove duplicates
  } catch {
    return [];
  }
}

/**
 * Get comprehensive VMD status
 */
export async function getVMDStatus(): Promise<{
  hardwareDetected: boolean;
  devices: VMDDevice[];
  moduleLoaded: boolean;
  moduleAvailable: boolean;
  managedDevices: string[];
  nvmeDevices: string[];
}> {
  const devices = await detectVMDHardware();
  const moduleLoaded = await isVMDModuleLoaded();
  const moduleAvailable = await isVMDModuleAvailable();
  const managedDevices = await listVMDManagedDevices();
  const nvmeDevices = await getNVMeBehindVMD();

  return {
    hardwareDetected: devices.length > 0,
    devices,
    moduleLoaded,
    moduleAvailable,
    managedDevices,
    nvmeDevices
  };
}

/**
 * Check if system requires VMD for boot
 */
export async function requiresVMDForBoot(): Promise<boolean> {
  try {
    // Check if root device is behind VMD
    const rootDevice = await execCommand('findmnt -n -o SOURCE /');

    // If root is on NVMe
    if (rootDevice.includes('nvme')) {
      // Check if any NVMe devices are behind VMD
      const nvmeBehindVMD = await getNVMeBehindVMD();
      if (nvmeBehindVMD.length > 0) {
        // Check if root device is one of them
        const rootNvme = rootDevice.match(/nvme\d+/);
        if (rootNvme && nvmeBehindVMD.some(d => d.includes(rootNvme[0]))) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Diagnose VMD configuration issues
 */
export async function diagnoseVMD(): Promise<{
  status: 'ok' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const vmdStatus = await getVMDStatus();

  // Check if VMD hardware exists
  if (!vmdStatus.hardwareDetected) {
    return {
      status: 'ok',
      issues: ['No Intel VMD hardware detected'],
      recommendations: ['VMD is not needed on this system']
    };
  }

  // VMD hardware detected
  issues.push(`Intel VMD hardware detected: ${vmdStatus.devices.length} controller(s)`);

  // Check if module is available
  if (!vmdStatus.moduleAvailable) {
    issues.push('VMD kernel module not available');
    recommendations.push('Install kernel with VMD support');
    return { status: 'error', issues, recommendations };
  }

  // Check if module is loaded
  if (!vmdStatus.moduleLoaded) {
    issues.push('VMD kernel module not loaded');
    recommendations.push('Load VMD module: sudo modprobe vmd');
    recommendations.push('Add vmd to /etc/mkinitcpio.conf MODULES array');
    return { status: 'warning', issues, recommendations };
  }

  // Check if managing any devices
  if (vmdStatus.managedDevices.length === 0) {
    issues.push('VMD module loaded but managing no devices');
    recommendations.push('Check if VMD is enabled in BIOS');
    return { status: 'warning', issues, recommendations };
  }

  // Check if NVMe devices are behind VMD
  if (vmdStatus.nvmeDevices.length > 0) {
    issues.push(`VMD managing ${vmdStatus.nvmeDevices.length} NVMe device(s)`);

    // Check if vmd is in initramfs
    const requiresBoot = await requiresVMDForBoot();
    if (requiresBoot) {
      issues.push('Root filesystem is on VMD-managed NVMe');
      recommendations.push('Ensure vmd module is in initramfs (check /etc/mkinitcpio.conf)');
    }
  }

  return {
    status: 'ok',
    issues,
    recommendations: recommendations.length > 0 ? recommendations : ['VMD configuration looks good']
  };
}
