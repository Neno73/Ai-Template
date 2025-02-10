#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
const [, , command, ...args] = process.argv;
async function main() {
    const server = new Server({
        name: 'mcp-cli',
        version: '0.1.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    switch (command) {
        case 'list-tools':
            if (args.length !== 1) {
                console.error('Usage: mcp-cli list-tools <server-name>');
                process.exit(1);
            }
            const serverName = args[0];
            const tools = await server.listTools(serverName);
            console.log('Available tools:');
            tools.forEach(tool => {
                console.log(`- ${tool.name}: ${tool.description}`);
            });
            break;
        case 'execute':
            if (args.length < 2) {
                console.error('Usage: mcp-cli execute <server-name> <tool-name> [arguments]');
                process.exit(1);
            }
            const [targetServer, toolName, ...toolArgs] = args;
            const result = await server.callTool(targetServer, toolName, toolArgs.length ? JSON.parse(toolArgs[0]) : {});
            console.log('Result:', result);
            break;
        default:
            console.error(`Unknown command: ${command}`);
            console.error('Available commands:');
            console.error('  list-tools <server-name>');
            console.error('  execute <server-name> <tool-name> [arguments]');
            process.exit(1);
    }
    await server.close();
}
main().catch(console.error);
