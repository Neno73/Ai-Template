import { AgentSystem } from './agentSystem.js';
import { ContextSystem } from './contextSystem.js';

export class AgentFactory {
  static async createAgent(taskDescription: string) {
    // 1. Check memory first
    const context = await ContextSystem.getTaskContext(taskDescription);

    // 2. Create agent with enriched context
    const agent = new AgentSystem(
      `${context}\n\n` +
      `You can access previous context entries using the ContextSystem.getTaskContext method.\n` +
      `Current Task: ${taskDescription}`
    );

    // 3. Store creation event in memory
    await ContextSystem.storeContext(`Agent created for task: ${taskDescription}`, {
      type: 'agent-creation',
      timestamp: new Date().toISOString(),
    });

    return agent;
  }

  static async createAgentWithValidation(taskDescription: string) {
    // Enforce memory check rules
    if (!await this.hasRequiredContext(taskDescription)) {
      throw new Error('Cannot create agent without required context validation');
    }
    
    return this.createAgent(taskDescription);
  }

  private static async hasRequiredContext(taskDescription: string): Promise<boolean> {
    const results = await ContextSystem.queryMemory(taskDescription);
    return results.length > 0;
  }
}