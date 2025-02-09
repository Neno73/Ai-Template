import { ContextSystem } from './contextSystem.js';
async function testMemorySystem() {
    try {
        console.log('Testing memory system...');
        // Store test context
        await ContextSystem.storeContext('Test context from AI template', {
            type: 'test',
            timestamp: new Date().toISOString()
        });
        console.log('Context stored successfully');
        // Retrieve context
        const results = await ContextSystem.queryMemory('AI template');
        console.log('Retrieved context:', results);
    }
    catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}
// Run test
testMemorySystem().catch(console.error);
