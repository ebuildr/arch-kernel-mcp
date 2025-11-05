# MCP Implementation Documentation

## Overview

This document describes the Model Context Protocol (MCP) implementation for the Arch Kernel MCP Server.

## MCP Specification Compliance

This server implements the **Model Context Protocol (MCP)** according to the latest specification, using the official TypeScript SDK version **1.21.0**.

### Protocol Version

- **SDK Version**: @modelcontextprotocol/sdk@1.21.0
- **Transport**: stdio (Standard Input/Output)
- **Message Format**: JSON-RPC 2.0

## Implementation Details

### Server Capabilities

The server declares three primary capabilities:

1. **Resources**: Read-only data endpoints
2. **Tools**: Executable operations and commands
3. **Prompts**: Reusable prompt templates

### Resources (4 total)

Resources provide read-only access to kernel information:

| URI | MIME Type | Description |
|-----|-----------|-------------|
| `kernel://current` | text/plain | Currently running kernel version |
| `kernel://installed` | application/json | List of installed kernel packages |
| `kernel://available` | application/json | Available kernel packages in repos |
| `kernel://bootloader` | text/plain | Detected bootloader type |

#### Resource Handlers

- `ListResourcesRequestSchema`: Returns metadata for all available resources
- `ReadResourceRequestSchema`: Fetches actual resource content

### Tools (9 total)

Tools enable kernel management operations:

#### Read-Only Tools

1. **list_kernels**: List all installed kernel packages
   - Input: None
   - Output: JSON array of kernel information

2. **get_current_kernel**: Get running kernel version
   - Input: None
   - Output: Kernel version string

3. **list_available_kernels**: List available kernel packages
   - Input: None
   - Output: JSON array of package names

4. **get_bootloader**: Detect bootloader type
   - Input: None
   - Output: 'grub', 'systemd-boot', or 'unknown'

5. **get_kernel_info**: Get detailed package information
   - Input: `kernel_name` (string)
   - Output: Package information from pacman

#### Write/Modify Tools (Require sudo)

6. **install_kernel**: Install a kernel package
   - Input: `kernel_name` (string, validated)
   - Output: Installation result
   - Side effects: Installs package via pacman

7. **remove_kernel**: Remove a kernel package
   - Input: `kernel_name` (string, validated)
   - Output: Removal result
   - Safety: Cannot remove currently running kernel

8. **update_grub**: Update GRUB configuration
   - Input: None
   - Output: GRUB update result
   - Side effects: Regenerates /boot/grub/grub.cfg

9. **update_kernels**: Update all installed kernels
   - Input: None
   - Output: Update result
   - Side effects: Updates packages via pacman

#### Tool Handler

- `ListToolsRequestSchema`: Returns tool metadata and schemas
- `CallToolRequestSchema`: Executes tools with argument validation

### Prompts (3 total)

Reusable prompt templates for common tasks:

1. **install-lts-kernel**: Guide for installing LTS kernel
2. **switch-kernel**: Guide for switching between kernels
3. **kernel-troubleshooting**: Kernel troubleshooting steps

#### Prompt Handlers

- `ListPromptsRequestSchema`: Returns available prompts
- `GetPromptRequestSchema`: Returns prompt message content

## Security Features

### Input Validation

All kernel names are validated against a strict regex pattern:
```typescript
/^linux(-[a-z0-9]+)?$/
```

This prevents command injection attacks.

### Safety Checks

1. **Current Kernel Protection**: The `remove_kernel` tool prevents removal of the currently running kernel
2. **Argument Validation**: All tool arguments are validated before execution
3. **Error Handling**: All errors are caught and returned with meaningful messages

### Privilege Requirements

Tools that modify the system require `sudo` privileges:
- install_kernel
- remove_kernel
- update_grub
- update_kernels

## Error Handling

### Error Response Format

When a tool encounters an error, it returns:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: <error message>"
    }
  ],
  "isError": true
}
```

### Common Error Scenarios

1. **Command Not Found**: When pacman is unavailable (non-Arch systems)
2. **Permission Denied**: When sudo is required but not available
3. **Invalid Package**: When a kernel package doesn't exist
4. **Current Kernel**: When trying to remove the running kernel

## Testing

### Test Suite

The implementation includes two test clients:

#### 1. Basic Test (`test-client.ts`)

Tests fundamental MCP protocol compliance:
- Server connection via stdio
- Resource listing and reading
- Tool listing and execution
- Prompt listing and retrieval

Run with:
```bash
npm test
```

#### 2. Comprehensive Test (`comprehensive-test.ts`)

Performs extensive validation:
- All resources with JSON validation
- All tools with argument testing
- All prompts with content validation
- Error handling verification

Run with:
```bash
npm run test:comprehensive
```

### Test Results

All tests pass successfully on the reference implementation:

```
✓ Server connected successfully
✓ 4 resources listed and readable
✓ 9 tools listed and callable
✓ 3 prompts listed and retrievable
✓ JSON resources properly formatted
✓ Error handling works correctly
```

## Transport

### Stdio Transport

The server uses **stdio** (Standard Input/Output) transport:

```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

This allows the server to:
- Run as a subprocess
- Communicate via stdin/stdout
- Keep stderr available for logging

### Message Flow

1. Client sends JSON-RPC request via stdin
2. Server processes request
3. Server sends JSON-RPC response via stdout
4. Errors and logs go to stderr

## Integration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arch-kernel": {
      "command": "node",
      "args": ["/path/to/arch-kernel-mcp/build/index.js"]
    }
  }
}
```

### MCP Clients

Any MCP-compatible client can connect using:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['./build/index.js'],
});

await client.connect(transport);
```

## Future Enhancements

Potential improvements based on 2025 MCP spec:

1. **Tool Annotations**: Add `readOnlyHint` metadata to tools
2. **OAuth Support**: Implement authorization for sensitive operations
3. **Structured Outputs**: Use typed schemas for tool responses
4. **HTTP Transport**: Add SSE-based HTTP transport option
5. **Sampling**: Implement server-initiated interactions

## References

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Arch Linux Kernel Documentation](https://wiki.archlinux.org/title/Kernel)
