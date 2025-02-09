import { useMcpTool } from '@modelcontextprotocol/sdk';
export class ContextSystem {
    static async queryMemory(query, maxResults = 5) {
        try {
            const response = await useMcpTool('memory', 'retrieve_context', {
                query,
                maxResults
            });
            return response.results;
        }
        catch (error) {
            console.error('Memory query failed:', error);
            return [];
        }
    }
    static async getTaskContext(taskDescription) {
        const relevantContexts = await this.queryMemory(taskDescription);
        if (!relevantContexts.length) {
            return `No relevant context found for: ${taskDescription}`;
        }
        return [
            `Found ${relevantContexts.length} relevant context entries:`,
            ...relevantContexts.map((ctx, index) => `[Context ${index + 1} from ${new Date(ctx.timestamp).toLocaleString()}]\n` +
                `${ctx.content}\n` +
                `Metadata: ${JSON.stringify(ctx.metadata)}`)
        ].join('\n\n');
    }
    static async storeContext(content, metadata) {
        try {
            await useMcpTool('memory', 'store_memory', {
                content,
                metadata: {
                    source: 'agent-system',
                    timestamp: new Date().toISOString(),
                    ...metadata
                }
            });
        }
        catch (error) {
            console.error('Failed to store context:', error);
        }
    }
}
