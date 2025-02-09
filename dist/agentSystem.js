import { preTaskMemoryCheck, postTaskMemorySave } from './agentHooks.js';
export class AgentSystem {
    currentTask;
    constructor(task) {
        this.currentTask = task;
    }
    async initialize() {
        this.currentTask = await preTaskMemoryCheck(this.currentTask);
        return this;
    }
    async executeTask() {
        try {
            // Execute the task with memory-enhanced context
            const taskResult = `Processed task: ${this.currentTask}`;
            // Save context after execution
            await postTaskMemorySave(taskResult, {
                agentType: this.constructor.name,
                status: 'completed'
            });
            return taskResult;
        }
        catch (error) {
            console.error('Task execution failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            await postTaskMemorySave(this.currentTask, {
                agentType: this.constructor.name,
                status: 'failed',
                error: errorMessage
            });
            throw error instanceof Error ? error : new Error(errorMessage);
        }
    }
}
