import { useMcpTool } from '@modelcontextprotocol/sdk';

export interface ContextEntry {
  content: string;
  embedding: number[];
  timestamp: string;
  metadata: Record<string, any>;
}

interface MemoryResponse {
  results: ContextEntry[];
}

export class ContextSystem {
  public static async queryMemory(query: string, maxResults = 5): Promise<ContextEntry[]> {
    try {
      const response = await useMcpTool<MemoryResponse>('memory', 'retrieve_context', {
        query,
        maxResults
      });
      return response.results;
    } catch (error) {
      console.error('Memory query failed:', error);
      return [];
    }
  }

  static async getTaskContext(taskDescription: string): Promise<string> {
    const relevantContexts = await this.queryMemory(taskDescription);
    
    if (!relevantContexts.length) {
      return `No relevant context found for: ${taskDescription}`;
    }

    return [
      `Found ${relevantContexts.length} relevant context entries:`,
      ...relevantContexts.map((ctx, index) =>
        `[Context ${index + 1} from ${new Date(ctx.timestamp).toLocaleString()}]\n` +
        `${ctx.content}\n` +
        `Metadata: ${JSON.stringify(ctx.metadata)}`
      )
    ].join('\n\n');
  }

  static async storeContext(content: string, metadata?: Record<string, any>) {
    try {
      await useMcpTool('memory', 'store_memory', {
        content,
        metadata: {
          source: 'agent-system',
          timestamp: new Date().toISOString(),
          ...metadata
        }
      });
    } catch (error) {
      console.error('Failed to store context:', error);
    }
  }
}