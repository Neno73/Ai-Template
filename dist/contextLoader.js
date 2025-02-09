import { useMcpTool } from '@modelcontextprotocol/sdk';
export async function loadRelevantContext(taskDescription) {
    const result = await useMcpTool('memory', 'retrieve_context', {
        query: taskDescription,
        maxResults: 3
    });
    return result.content[0].text;
}
export async function saveContextToMemory(content, metadata) {
    await useMcpTool('memory', 'store_memory', {
        content,
        metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
        }
    });
}
