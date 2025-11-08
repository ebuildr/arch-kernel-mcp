#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  getCurrentKernel,
  listInstalledKernels,
  listAvailableKernels,
  installKernel,
  removeKernel,
  updateGrub,
  regenerateGrubConfig,
  generateGrubEntry,
  updateKernels,
  getKernelInfo,
  getBootloader,
} from './kernel-utils.js';

import {
  getMkinitcpioConfig,
  getConfiguredModules,
  addInitramfsModule,
  removeInitramfsModule,
  rebuildInitramfs,
  rebuildInitramfsForKernel,
  listInitramfsModules,
  checkInitramfsModule,
  analyzeInitramfs,
  listKernelPresets,
} from './initramfs-utils.js';

import {
  detectVMDHardware,
  isVMDModuleLoaded,
  isVMDModuleAvailable,
  getVMDModuleInfo,
  listVMDManagedDevices,
  getNVMeBehindVMD,
  getVMDStatus,
  requiresVMDForBoot,
  diagnoseVMD,
} from './vmd-utils.js';

// Create MCP server
const server = new Server(
  {
    name: 'arch-kernel-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'kernel://current',
        mimeType: 'text/plain',
        name: 'Current Kernel',
        description: 'Information about the currently running kernel',
      },
      {
        uri: 'kernel://installed',
        mimeType: 'application/json',
        name: 'Installed Kernels',
        description: 'List of all installed kernel packages',
      },
      {
        uri: 'kernel://available',
        mimeType: 'application/json',
        name: 'Available Kernels',
        description: 'List of kernel packages available in repositories',
      },
      {
        uri: 'kernel://bootloader',
        mimeType: 'text/plain',
        name: 'Bootloader Info',
        description: 'Information about the system bootloader',
      },
      {
        uri: 'initramfs://config',
        mimeType: 'text/plain',
        name: 'Initramfs Configuration',
        description: 'Contents of /etc/mkinitcpio.conf',
      },
      {
        uri: 'initramfs://modules',
        mimeType: 'application/json',
        name: 'Configured Initramfs Modules',
        description: 'List of modules configured in mkinitcpio.conf',
      },
      {
        uri: 'initramfs://analysis',
        mimeType: 'application/json',
        name: 'Initramfs Analysis',
        description: 'Detailed analysis of initramfs configuration vs actual content',
      },
      {
        uri: 'vmd://status',
        mimeType: 'application/json',
        name: 'Intel VMD Status',
        description: 'Status of Intel Volume Management Device',
      },
      {
        uri: 'vmd://diagnosis',
        mimeType: 'application/json',
        name: 'VMD Diagnosis',
        description: 'Diagnostic information and recommendations for VMD configuration',
      },
    ],
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri.toString();

  try {
    switch (uri) {
      case 'kernel://current': {
        const current = await getCurrentKernel();
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `Current kernel: ${current}`,
            },
          ],
        };
      }

      case 'kernel://installed': {
        const kernels = await listInstalledKernels();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(kernels, null, 2),
            },
          ],
        };
      }

      case 'kernel://available': {
        const available = await listAvailableKernels();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(available, null, 2),
            },
          ],
        };
      }

      case 'kernel://bootloader': {
        const bootloader = await getBootloader();
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `Detected bootloader: ${bootloader}`,
            },
          ],
        };
      }

      case 'initramfs://config': {
        const config = await getMkinitcpioConfig();
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: config,
            },
          ],
        };
      }

      case 'initramfs://modules': {
        const modules = await getConfiguredModules();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(modules, null, 2),
            },
          ],
        };
      }

      case 'initramfs://analysis': {
        const analysis = await analyzeInitramfs();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      case 'vmd://status': {
        const status = await getVMDStatus();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'vmd://diagnosis': {
        const diagnosis = await diagnoseVMD();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(diagnosis, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to read resource ${uri}: ${error.message}`);
  }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_kernels',
        description: 'List all installed kernel packages on the system',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_current_kernel',
        description: 'Get the currently running kernel version',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_available_kernels',
        description: 'List kernel packages available in repositories',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'install_kernel',
        description: 'Install a kernel package (requires sudo privileges)',
        inputSchema: {
          type: 'object',
          properties: {
            kernel_name: {
              type: 'string',
              description: 'Name of the kernel package to install (e.g., linux, linux-lts, linux-zen)',
            },
          },
          required: ['kernel_name'],
        },
      },
      {
        name: 'remove_kernel',
        description: 'Remove a kernel package (requires sudo privileges, cannot remove current kernel)',
        inputSchema: {
          type: 'object',
          properties: {
            kernel_name: {
              type: 'string',
              description: 'Name of the kernel package to remove',
            },
          },
          required: ['kernel_name'],
        },
      },
      {
        name: 'update_grub',
        description: 'Regenerate entire GRUB configuration (requires sudo, use with caution)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'generate_grub_entry',
        description: 'SAFE: Generate a new GRUB boot entry for a custom kernel without modifying existing entries (requires sudo)',
        inputSchema: {
          type: 'object',
          properties: {
            entry_name: {
              type: 'string',
              description: 'Name for the new boot entry (e.g., "EndeavourOS CUDA Kernel")',
            },
            kernel_image: {
              type: 'string',
              description: 'Kernel image filename in /boot (e.g., "vmlinuz-linux-cuda", default: "vmlinuz-linux")',
            },
            initramfs_image: {
              type: 'string',
              description: 'Initramfs image filename in /boot (e.g., "initramfs-linux-cuda.img", default: "initramfs-linux.img")',
            },
          },
          required: ['entry_name'],
        },
      },
      {
        name: 'update_kernels',
        description: 'Update all installed kernel packages (requires sudo privileges)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_kernel_info',
        description: 'Get detailed information about a kernel package',
        inputSchema: {
          type: 'object',
          properties: {
            kernel_name: {
              type: 'string',
              description: 'Name of the kernel package',
            },
          },
          required: ['kernel_name'],
        },
      },
      {
        name: 'get_bootloader',
        description: 'Detect which bootloader is being used (GRUB or systemd-boot)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // Initramfs management tools
      {
        name: 'check_initramfs_modules',
        description: 'Check which modules are configured in mkinitcpio.conf',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'add_initramfs_module',
        description: 'Add a module to /etc/mkinitcpio.conf and rebuild initramfs (requires sudo)',
        inputSchema: {
          type: 'object',
          properties: {
            module_name: {
              type: 'string',
              description: 'Name of the kernel module to add (e.g., vmd, nvme)',
            },
            rebuild: {
              type: 'boolean',
              description: 'Whether to automatically rebuild initramfs after adding module (default: true)',
            },
          },
          required: ['module_name'],
        },
      },
      {
        name: 'remove_initramfs_module',
        description: 'Remove a module from /etc/mkinitcpio.conf (requires sudo)',
        inputSchema: {
          type: 'object',
          properties: {
            module_name: {
              type: 'string',
              description: 'Name of the kernel module to remove',
            },
          },
          required: ['module_name'],
        },
      },
      {
        name: 'rebuild_initramfs',
        description: 'Rebuild initramfs for all installed kernels (requires sudo)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'analyze_initramfs',
        description: 'Analyze initramfs configuration and identify missing or extra modules',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // VMD detection and management tools
      {
        name: 'detect_vmd_hardware',
        description: 'Detect Intel Volume Management Device (VMD) hardware controllers',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'check_vmd_status',
        description: 'Get comprehensive VMD status including hardware, module, and managed devices',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'diagnose_vmd',
        description: 'Diagnose VMD configuration and get recommendations for issues',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'check_vmd_boot_requirement',
        description: 'Check if system requires VMD module for booting (root on VMD-managed NVMe)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_kernels': {
        const kernels = await listInstalledKernels();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(kernels, null, 2),
            },
          ],
        };
      }

      case 'get_current_kernel': {
        const current = await getCurrentKernel();
        return {
          content: [
            {
              type: 'text',
              text: current,
            },
          ],
        };
      }

      case 'list_available_kernels': {
        const available = await listAvailableKernels();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(available, null, 2),
            },
          ],
        };
      }

      case 'install_kernel': {
        const kernelName = args?.kernel_name as string;
        if (!kernelName) {
          throw new Error('kernel_name is required');
        }
        const result = await installKernel(kernelName);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'remove_kernel': {
        const kernelName = args?.kernel_name as string;
        if (!kernelName) {
          throw new Error('kernel_name is required');
        }
        const result = await removeKernel(kernelName);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'update_grub': {
        const result = await updateGrub();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'generate_grub_entry': {
        const entryName = args?.entry_name as string;
        const kernelImage = args?.kernel_image as string;
        const initramfsImage = args?.initramfs_image as string;

        if (!entryName) {
          throw new Error('entry_name is required');
        }

        const script = await generateGrubEntry(entryName, kernelImage, initramfsImage);
        return {
          content: [
            {
              type: 'text',
              text: script,
            },
          ],
        };
      }

      case 'update_kernels': {
        const result = await updateKernels();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_kernel_info': {
        const kernelName = args?.kernel_name as string;
        if (!kernelName) {
          throw new Error('kernel_name is required');
        }
        const info = await getKernelInfo(kernelName);
        return {
          content: [
            {
              type: 'text',
              text: info,
            },
          ],
        };
      }

      case 'get_bootloader': {
        const bootloader = await getBootloader();
        return {
          content: [
            {
              type: 'text',
              text: `Detected bootloader: ${bootloader}`,
            },
          ],
        };
      }

      // Initramfs management tools
      case 'check_initramfs_modules': {
        const modules = await getConfiguredModules();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(modules, null, 2),
            },
          ],
        };
      }

      case 'add_initramfs_module': {
        const moduleName = args?.module_name as string;
        if (!moduleName) {
          throw new Error('module_name is required');
        }
        const rebuild = args?.rebuild !== false; // default true

        const addResult = await addInitramfsModule(moduleName);
        let rebuildResult = '';

        if (rebuild) {
          rebuildResult = await rebuildInitramfs();
        }

        return {
          content: [
            {
              type: 'text',
              text: `${addResult}\n${rebuildResult}`,
            },
          ],
        };
      }

      case 'remove_initramfs_module': {
        const moduleName = args?.module_name as string;
        if (!moduleName) {
          throw new Error('module_name is required');
        }
        const result = await removeInitramfsModule(moduleName);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'rebuild_initramfs': {
        const result = await rebuildInitramfs();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'analyze_initramfs': {
        const analysis = await analyzeInitramfs();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      // VMD detection and management tools
      case 'detect_vmd_hardware': {
        const devices = await detectVMDHardware();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(devices, null, 2),
            },
          ],
        };
      }

      case 'check_vmd_status': {
        const status = await getVMDStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'diagnose_vmd': {
        const diagnosis = await diagnoseVMD();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(diagnosis, null, 2),
            },
          ],
        };
      }

      case 'check_vmd_boot_requirement': {
        const required = await requiresVMDForBoot();
        return {
          content: [
            {
              type: 'text',
              text: `VMD required for boot: ${required}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'install-lts-kernel',
        description: 'Guide for installing the LTS kernel on Arch Linux',
      },
      {
        name: 'switch-kernel',
        description: 'Guide for switching between different kernel versions',
      },
      {
        name: 'kernel-troubleshooting',
        description: 'Common kernel issues and troubleshooting steps',
      },
      {
        name: 'setup-dual-boot-vmd',
        description: 'Guide for setting up dual boot with Intel VMD enabled',
      },
      {
        name: 'troubleshoot-vmd-boot',
        description: 'Troubleshoot boot failures related to Intel VMD',
      },
      {
        name: 'configure-initramfs',
        description: 'Guide for configuring initramfs modules',
      },
    ],
  };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;

  switch (name) {
    case 'install-lts-kernel':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'I want to install the LTS (Long Term Support) kernel on my Arch Linux system. Can you guide me through the process and help me update the bootloader?',
            },
          },
        ],
      };

    case 'switch-kernel':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'I have multiple kernels installed and want to switch to a different one. How do I check which kernels I have, and how do I configure my bootloader to boot into a specific kernel?',
            },
          },
        ],
      };

    case 'kernel-troubleshooting':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'I am having issues with my current kernel (system crashes, hardware not working, etc.). What are my options for troubleshooting and potentially switching to a more stable kernel version?',
            },
          },
        ],
      };

    case 'setup-dual-boot-vmd':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'I have a laptop with Intel VMD enabled and want to set up dual boot with Windows 11 and Arch Linux (or Endeavor OS). My Linux installation can\'t see the NVMe drive, or boots fail after installation. How do I configure my system for dual boot with VMD?',
            },
          },
        ],
      };

    case 'troubleshoot-vmd-boot':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'My Arch Linux system won\'t boot after I enabled Intel VMD in BIOS, or I just installed Arch but it drops to an initramfs emergency shell on boot. I think this is related to Intel Volume Management Device (VMD). Can you diagnose and fix the issue?',
            },
          },
        ],
      };

    case 'configure-initramfs':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'I need to add kernel modules to my initramfs so they load early in the boot process. Can you guide me through configuring /etc/mkinitcpio.conf and rebuilding the initramfs?',
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Arch Kernel MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
