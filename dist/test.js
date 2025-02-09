import { useMcpTool } from '@modelcontextprotocol/sdk';
import { ContextSystem } from './contextSystem.js';
import { SessionManager } from './sessionManager.js';
async function testMemoryPersistence() {
    try {
        console.log('Testing memory persistence...');
        // 1. Store initial context
        console.log('\nStoring initial context...');
        await ContextSystem.storeContext('Initial test context: Working on AI template implementation', {
            type: 'test',
            features: ['memory-server', 'context-persistence', 'roadmap-integration']
        });
        // 2. Verify context was stored
        console.log('\nRetrieving stored context...');
        const initialContext = await useMcpTool('memory', 'retrieve_context', {
            query: 'AI template implementation',
            maxResults: 1
        });
        console.log('Initial context retrieved:', initialContext);
        // 3. Store additional context
        console.log('\nStoring additional context...');
        await ContextSystem.storeContext('Added memory persistence and session management', {
            type: 'implementation',
            components: ['SessionManager', 'ContextSystem', 'AgentSystem']
        });
        // 4. Start new session to verify persistence
        console.log('\nStarting new session...');
        const session = await SessionManager.startNewSession();
        console.log('Session context:', session.context);
        console.log('\nMemory persistence test completed successfully!');
    }
    catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}
// Run the test
testMemoryPersistence().catch(console.error);
