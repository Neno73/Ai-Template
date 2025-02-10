import { ContextSystem, type ContextEntry } from './contextSystem.js';
import { AgentFactory } from './agentFactory.js';
import { useMcpTool } from '@modelcontextprotocol/sdk';
import { v4 as uuidv4 } from 'uuid';

export class SessionManager {
  private static currentSessionId: string | null = null;

  static getCurrentSessionId(): string | null {
    return SessionManager.currentSessionId;
  }
  static async startNewSession(): Promise<{ header: string; context: string; agent: any }> {
    SessionManager.currentSessionId = uuidv4();

    // Retrieve the latest context from memory
    const latestContext = await ContextSystem.getLatestContext();

    // Summarize the context to fit within token limits
    const summarizedContext = await this.summarizeContext(latestContext);

    const sessionContext = await ContextSystem.queryMemory('session-context', 5);
    const formattedContext = sessionContext.length > 0
      ? this.formatSessionContext(sessionContext)
      : 'No previous context found - starting new session';

    return {
      header: `AI Session - ${new Date().toLocaleString()}`,
      context: formattedContext,
      agent: await AgentFactory.createAgent(summarizedContext)
    };
  }

  private static formatSessionContext(contexts: ContextEntry[]): string {
    return [
      'Previous Session Context:',
      ...contexts.map((ctx, index) =>
        `[Session ${index + 1} - ${new Date(ctx.timestamp).toLocaleString()}]\n` +
        `${ctx.content}\n` +
        `Metadata: ${JSON.stringify(ctx.metadata)}`
      )
    ].join('\n\n');
  }

  // Summarize the context to fit within token limits
  private static async summarizeContext(context: ContextEntry | null): Promise<string> {
    if (!context) {
      return 'No previous context found.';
    }

    try {
      const response = await useMcpTool<{ summary: string }>('agent-system', 'summarize_text', {
        text: context.content,
        maxLength: 100 // Limit the summary to 100 tokens
      });
      return `Previous context: ${response.summary}`;
    } catch (error) {
      console.error('Failed to summarize context:', error);
      return `Previous context: ${context.content}`;
    }
  }
}