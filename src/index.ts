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
  updateKernels,
  getKernelInfo,
  getBootloader,
} from './kernel-utils.js';

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
        description: 'Update GRUB bootloader configuration (requires sudo privileges)',
        inputSchema: {
          type: 'object',
          properties: {},
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
