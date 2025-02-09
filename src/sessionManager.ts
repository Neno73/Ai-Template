import { ContextSystem, type ContextEntry } from './contextSystem.js';
import { AgentFactory } from './agentFactory.js';

export class SessionManager {
  static async startNewSession() {
    const sessionContext = await ContextSystem.queryMemory('session-context', 5);
    const formattedContext = sessionContext.length > 0 
      ? this.formatSessionContext(sessionContext)
      : 'No previous context found - starting new session';

    return {
      header: `AI Session - ${new Date().toLocaleString()}`,
      context: formattedContext,
      agent: await AgentFactory.createAgent(formattedContext)
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
}