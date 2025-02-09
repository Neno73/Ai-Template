import { useMcpTool } from '@modelcontextprotocol/sdk';

interface ContextQuery {
  taskDescription: string;
  maxResults?: number;
}

export async function loadRelevantContext(taskDescription: string): Promise<string> {
  const result = await useMcpTool('memory', 'retrieve_context', {
    query: taskDescription,
    maxResults: 3
  });
  
  return result.content[0].text;
}

export async function saveContextToMemory(content: string, metadata?: Record<string, any>) {
  await useMcpTool('memory', 'store_memory', {
    content,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
}