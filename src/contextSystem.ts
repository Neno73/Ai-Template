import { useMcpTool } from '@modelcontextprotocol/sdk';
import { SessionManager } from './sessionManager.js';

export interface ContextEntry {
  content: string;
  embedding: number[];
  timestamp: string;
  sessionId: string;
  metadata: Record<string, any>;
}

interface MemoryResponse {
  results: ContextEntry[];
}

export class ContextSystem {
  public static async queryMemory(query: string, maxResults = 5, parentSessionId: string | null = null): Promise<ContextEntry[]> {
    try {
      const response = await useMcpTool<MemoryResponse>('memory', 'retrieve_context', {
        query,
        maxResults,
        parentSessionId
      });
      const summarizedResults = await Promise.all(response.results.map(async (result) => ({
        ...result,
        content: await ContextSystem.summarizeContext(result.content),
      })));
      return summarizedResults;
    } catch (error) {
      console.error('Memory query failed:', error);
      return [];
    }
  }

  static async getTaskContext(taskDescription: string, parentSessionId: string | null = null): Promise<string> {
    const relevantContexts = await this.queryMemory(taskDescription, 5, parentSessionId);

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
    const currentSessionId = SessionManager.getCurrentSessionId();
    try {
      await useMcpTool('memory', 'store_memory', {
        content,
        sessionId: currentSessionId,
        metadata: {
          source: 'agent-system',
          timestamp: new Date().toISOString(),
          parentSessionId: metadata?.parentSessionId || null,
          ...metadata,
        },
      });
    } catch (error) {
      console.error('Failed to store context:', error);
    }
  }

  static async getLatestContext(): Promise<ContextEntry | null> {
    try {
      const response = await useMcpTool<MemoryResponse>('memory', 'retrieve_context', {
        query: 'latest-context',
        maxResults: 1
      });

      if (response.results.length > 0) {
        return response.results[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to retrieve latest context:', error);
      return null;
    }
  }

  static async summarizeContext(content: string): Promise<string> {
    try {
      const response = await useMcpTool<{ summary: string }>('agent-system', 'summarize_text', {
        text: content,
        maxLength: 200, // Limit the summary to 200 tokens
      });
      return response.summary;
    } catch (error) {
      console.error('Failed to summarize context:', error);
      return content; // Return original content if summarization fails
    }
  }
}