#!/usr/bin/env node
import crypto from 'crypto';
import { ContextEntry } from '../src/contextSystem.js';
import { useMcpTool } from '@modelcontextprotocol/sdk';
import { Command } from 'commander';
import fs from 'fs/promises';

interface ContextBundle {
  encryptedPayload: string;
  checksum: string;
  version: string;
}

interface BundleContent {
  entries: ContextEntry[];
  metadata: {
    timestamp: string;
    agentId: string;
    sessionId: string;
  };
}

const CURRENT_VERSION = '1.0.0';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export async function createBundle(): Promise<ContextBundle> {
  // Get current context entries
  const response = await useMcpTool<{ results: ContextEntry[] }>('memory', 'retrieve_context', {
    maxResults: 100 // Get sufficient context
  });

  const content: BundleContent = {
    entries: response.results,
    metadata: {
      timestamp: new Date().toISOString(),
      agentId: process.env.AGENT_ID || 'unknown',
      sessionId: crypto.randomUUID()
    }
  };

  // Generate encryption key from environment
  const key = process.env.CONTEXT_KEY || crypto.randomBytes(32).toString('hex');
  const iv = crypto.randomBytes(16);

  // Create cipher and encrypt content
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(key, 'hex'), iv);
  const contentStr = JSON.stringify(content);
  const encrypted = Buffer.concat([iv, cipher.update(contentStr), cipher.final()]);

  // Generate checksum
  const hash = crypto.createHash('sha256');
  hash.update(contentStr);
  const checksum = hash.digest('hex');

  return {
    encryptedPayload: encrypted.toString('base64'),
    checksum,
    version: CURRENT_VERSION
  };
}

export async function verifyBundle(bundle: ContextBundle): Promise<boolean> {
  if (!process.env.CONTEXT_KEY) {
    throw new Error('CONTEXT_KEY environment variable is required for verification');
  }

  try {
    const encrypted = Buffer.from(bundle.encryptedPayload, 'base64');
    const iv = encrypted.slice(0, 16);
    const encryptedContent = encrypted.slice(16);

    // Decrypt content
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(process.env.CONTEXT_KEY, 'hex'),
      iv
    );
    const decrypted = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
    const content = JSON.parse(decrypted.toString());

    // Verify checksum
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(content));
    const computedChecksum = hash.digest('hex');

    return computedChecksum === bundle.checksum;
  } catch (error) {
    console.error('Bundle verification failed:', error);
    return false;
  }
}

export async function importBundle(bundle: ContextBundle): Promise<void> {
  if (!verifyBundle(bundle)) {
    throw new Error('Bundle verification failed');
  }

  const encrypted = Buffer.from(bundle.encryptedPayload, 'base64');
  const iv = encrypted.slice(0, 16);
  const encryptedContent = encrypted.slice(16);

  // Decrypt content
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(process.env.CONTEXT_KEY!, 'hex'),
    iv
  );
  const decrypted = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
  const content: BundleContent = JSON.parse(decrypted.toString());

  // Store each context entry
  for (const entry of content.entries) {
    await useMcpTool('memory', 'store_memory', {
      content: entry.content,
      metadata: {
        ...entry.metadata,
        importedFrom: content.metadata.agentId,
        importTimestamp: new Date().toISOString()
      }
    });
  }
}

// CLI implementation
if (require.main === module) {
  const program = new Command();

  program
    .name('context-transfer')
    .description('CLI tool for secure context transfer between windows')
    .version(CURRENT_VERSION);

  program
    .command('export')
    .description('Export current context as an encrypted bundle')
    .option('-o, --output <file>', 'Output file path')
    .action(async (options) => {
      try {
        const bundle = await createBundle();
        if (options.output) {
          await fs.writeFile(options.output, JSON.stringify(bundle, null, 2));
          console.log(`Bundle exported to ${options.output}`);
        } else {
          console.log(JSON.stringify(bundle, null, 2));
        }
      } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
      }
    });

  program
    .command('import')
    .description('Import context from an encrypted bundle')
    .argument('<file>', 'Bundle file path')
    .action(async (file) => {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const bundle = JSON.parse(content);
        await importBundle(bundle);
        console.log('Context imported successfully');
      } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
      }
    });

  program
    .command('verify')
    .description('Verify the integrity of a context bundle')
    .argument('<file>', 'Bundle file path')
    .action(async (file) => {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const bundle = JSON.parse(content);
        const isValid = await verifyBundle(bundle);
        console.log(isValid ? 'Bundle is valid' : 'Bundle verification failed');
        process.exit(isValid ? 0 : 1);
      } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
      }
    });

  program.parse();
}