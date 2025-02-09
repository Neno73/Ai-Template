import { ContextSystem } from './contextSystem.js';
export async function preTaskMemoryCheck(taskDescription) {
    try {
        const context = await ContextSystem.getTaskContext(taskDescription);
        return `PREVIOUS CONTEXT FOUND:\n${context}\n\nCURRENT TASK: ${taskDescription}`;
    }
    catch (error) {
        console.error('Memory check failed:', error);
        return taskDescription; // Fallback to original task
    }
}
export async function postTaskMemorySave(taskResult, metadata) {
    await ContextSystem.storeContext(`Task completed with result: ${taskResult}`, {
        type: 'task-result',
        ...metadata
    });
}
