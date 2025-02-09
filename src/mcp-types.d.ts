declare module '@modelcontextprotocol/sdk' {
  export function useMcpTool<T = any>(
    server: string,
    tool: string,
    args: Record<string, any>
  ): Promise<T>;
  
  interface MemoryEntry {
    content: string;
    embedding: number[];
    timestamp: string;
    metadata: Record<string, any>;
  }

  interface MemoryResponse {
    results: Array<{
      content: string;
      score: number;
      timestamp: string;
      metadata: Record<string, any>;
    }>;
  }
}