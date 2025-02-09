#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { Octokit } from '@octokit/rest';
import { useMcpTool } from '@modelcontextprotocol/sdk';
async function parseRoadmap(content) {
    const tasks = [];
    const lines = content.split('\n');
    for (const line of lines) {
        const taskMatch = line.match(/### \[Task (\d+)\] (.*?)( ✅)?$/);
        if (taskMatch) {
            const [_, id, title, completed] = taskMatch;
            const fileMatch = lines[lines.indexOf(line) + 1]?.match(/\*\*File:\*\* `([^`]+)`/);
            tasks.push({
                id: id.padStart(3, '0'),
                title: title.trim(),
                status: completed ? 'complete' : 'pending',
                file: fileMatch?.[1]
            });
        }
    }
    return tasks;
}
async function main() {
    const program = new Command();
    program
        .option('--auto', 'Automatically process pending tasks')
        .option('--git-commit <hash>', 'Sync specific git commit')
        .parse(process.argv);
    const options = program.opts();
    // Read roadmap content
    const roadmapPath = path.join(process.cwd(), 'roadmap.md');
    const content = await fs.readFile(roadmapPath, 'utf-8');
    const tasks = await parseRoadmap(content);
    // In auto mode, sync all pending tasks
    if (options.auto) {
        const pendingTasks = tasks.filter(t => t.status === 'pending');
        if (pendingTasks.length > 0) {
            console.log('Found pending tasks:', pendingTasks.map(t => t.id).join(', '));
            // Create branch for pending work
            const branchName = `feature/task-${pendingTasks[0].id}`;
            await useMcpTool('git', 'create_branch', {
                branch_name: branchName,
                base_branch: 'main'
            });
            // Update task status to in-progress
            const updatedContent = content.replace(`### [Task ${pendingTasks[0].id}] ${pendingTasks[0].title}`, `### [Task ${pendingTasks[0].id}] ${pendingTasks[0].title} (In Progress)`);
            await fs.writeFile(roadmapPath, updatedContent);
            // Commit and create PR
            await useMcpTool('git', 'auto_commit', {
                message: `Start task ${pendingTasks[0].id}: ${pendingTasks[0].title}`,
                files: ['roadmap.md']
            });
            await useMcpTool('git', 'create_pr', {
                title: `Task ${pendingTasks[0].id}: ${pendingTasks[0].title}`,
                description: `Automated PR for roadmap task ${pendingTasks[0].id}`,
                target_branch: 'main'
            });
        }
    }
    // If git commit provided, sync specific commit
    if (options.gitCommit) {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });
        // Get commit info from GitHub API
        const [owner, repo] = process.env.GITHUB_REPOSITORY?.split('/') || ['Neno73', 'Ai-Template'];
        const { data: commit } = await octokit.rest.git.getCommit({
            owner,
            repo,
            commit_sha: options.gitCommit
        });
        const taskMatch = commit.message.match(/Task (\d+)/i);
        if (taskMatch) {
            const taskId = taskMatch[1].padStart(3, '0');
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                console.log(`Syncing commit ${options.gitCommit} with task ${taskId}`);
                // Update task status
                const updatedContent = content.replace(`### [Task ${taskId}] ${task.title}`, `### [Task ${taskId}] ${task.title} ✅`);
                await fs.writeFile(roadmapPath, updatedContent);
                await useMcpTool('git', 'auto_commit', {
                    message: `Complete task ${taskId}`,
                    files: ['roadmap.md']
                });
            }
        }
    }
}
main().catch(console.error);
