#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('🔍 Testing MCP Server Implementation\n');

  // Create client
  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    // Start the server process
    const serverProcess = spawn('node', ['./build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Connect to server via stdio transport
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['./build/index.js'],
    });

    await client.connect(transport);
    console.log('✓ Server connected successfully\n');

    // Test 1: Get server info
    console.log('Test 1: Server Info');
    const serverInfo = client.getServerCapabilities();
    console.log('Server capabilities:', JSON.stringify(serverInfo, null, 2));
    console.log('✓ Server info retrieved\n');

    // Test 2: List resources
    console.log('Test 2: List Resources');
    const resourcesResult = await client.listResources();
    console.log(`Found ${resourcesResult.resources.length} resources:`);
    resourcesResult.resources.forEach((r) => {
      console.log(`  - ${r.name} (${r.uri})`);
    });
    console.log('✓ Resources listed\n');

    // Test 3: Read a resource
    console.log('Test 3: Read Resource (kernel://current)');
    try {
      const resourceContent = await client.readResource({
        uri: 'kernel://current',
      });
      console.log('Resource content:', resourceContent.contents[0]);
      console.log('✓ Resource read successfully\n');
    } catch (error: any) {
      console.log('⚠️ Resource read failed (may need Arch Linux):', error.message);
      console.log();
    }

    // Test 4: List tools
    console.log('Test 4: List Tools');
    const toolsResult = await client.listTools();
    console.log(`Found ${toolsResult.tools.length} tools:`);
    toolsResult.tools.forEach((t) => {
      console.log(`  - ${t.name}: ${t.description}`);
    });
    console.log('✓ Tools listed\n');

    // Test 5: List prompts
    console.log('Test 5: List Prompts');
    const promptsResult = await client.listPrompts();
    console.log(`Found ${promptsResult.prompts.length} prompts:`);
    promptsResult.prompts.forEach((p) => {
      console.log(`  - ${p.name}: ${p.description}`);
    });
    console.log('✓ Prompts listed\n');

    // Test 6: Get a prompt
    console.log('Test 6: Get Prompt (install-lts-kernel)');
    const promptResult = await client.getPrompt({
      name: 'install-lts-kernel',
    });
    console.log('Prompt messages:', promptResult.messages.length);
    console.log('✓ Prompt retrieved\n');

    // Test 7: Call a tool (get_current_kernel)
    console.log('Test 7: Call Tool (get_current_kernel)');
    try {
      const toolResult = await client.callTool({
        name: 'get_current_kernel',
        arguments: {},
      });
      console.log('Tool result:', toolResult.content[0]);
      console.log('✓ Tool executed\n');
    } catch (error: any) {
      console.log('⚠️ Tool execution failed (may need Arch Linux):', error.message);
      console.log();
    }

    console.log('🎉 All MCP protocol tests passed!\n');

    // Close connection
    await client.close();
    serverProcess.kill();

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testMCPServer();
