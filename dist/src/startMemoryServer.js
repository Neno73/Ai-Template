import { spawn } from 'child_process';
import { join } from 'path';
export async function startMemoryServer() {
    return new Promise((resolve, reject) => {
        const serverPath = join(process.cwd(), '../Documents/Cline/MCP/memory-server/build/index.js');
        const server = spawn('node', [serverPath], {
            env: {
                ...process.env,
                HF_TOKEN: process.env.HF_TOKEN || 'default-token',
                MAX_SHORT_TERM_ENTRIES: '100'
            }
        });
        server.stdout.on('data', (data) => {
            console.log(`Memory Server: ${data}`);
            if (data.includes('Memory MCP server running')) {
                resolve();
            }
        });
        server.stderr.on('data', (data) => {
            console.error(`Memory Server Error: ${data}`);
        });
        server.on('error', (error) => {
            reject(error);
        });
        // Ensure server cleanup on process exit
        process.on('exit', () => {
            server.kill();
        });
    });
}
