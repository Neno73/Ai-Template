declare module '@modelcontextprotocol/sdk' {
  export function useMcpTool<T = any>(
    server: string,
    tool: string,
    args: Record<string, any>
  ): Promise<T>;

  export interface Server {
    name: string;
    version: string;
    capabilities: {
      tools?: Array<{
        name: string;
        description: string;
        inputSchema: Record<string, any>;
      }>;
    };
  }

  export class StdioServerTransport {
    constructor();
    connect(): Promise<void>;
  }
}