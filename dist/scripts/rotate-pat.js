#!/usr/bin/env node
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
const REQUIRED_SCOPES = ['repo', 'workflow'];
const TOKEN_NOTE = 'Roadmap Sync Automation';
async function rotateToken() {
    try {
        const currentPat = process.env.GH_PAT;
        const rotationKey = process.env.GH_PAT_ROTATION_KEY;
        if (!currentPat || !rotationKey) {
            throw new Error('Required environment variables not set');
        }
        // Initialize Octokit with current PAT
        const octokit = new Octokit({
            auth: currentPat
        });
        // Generate new token with required scopes
        const { data: newToken } = await octokit.rest.users.createToken({
            note: `${TOKEN_NOTE} ${new Date().toISOString()}`,
            scopes: REQUIRED_SCOPES
        });
        // Verify new token works
        const testOctokit = new Octokit({
            auth: newToken.token
        });
        await testOctokit.rest.users.getAuthenticated();
        // Encrypt new token for secure logging
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(rotationKey, 'hex'), iv);
        const encrypted = Buffer.concat([cipher.update(newToken.token, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        // Store encrypted new token securely
        const encryptedToken = {
            iv: iv.toString('hex'),
            token: encrypted.toString('hex'),
            tag: authTag.toString('hex')
        };
        console.log('New token created and encrypted successfully');
        console.log('Encrypted token details:', JSON.stringify(encryptedToken));
        // Delete old token
        const { data: tokens } = await octokit.rest.users.listTokens();
        const oldToken = tokens.find(t => t.note?.startsWith(TOKEN_NOTE));
        if (oldToken) {
            await octokit.rest.users.deleteToken({
                token_id: oldToken.id
            });
            console.log('Old token deleted successfully');
        }
        // Update GitHub repository secret
        // Note: This requires additional setup in the repository settings
        const repoOwner = process.env.GITHUB_REPOSITORY?.split('/')[0];
        const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
        if (repoOwner && repoName) {
            const { data: publicKey } = await octokit.rest.actions.getRepoPublicKey({
                owner: repoOwner,
                repo: repoName
            });
            const messageBytes = Buffer.from(newToken.token);
            const keyBytes = Buffer.from(publicKey.key, 'base64');
            const encryptedBytes = crypto.publicEncrypt({
                key: keyBytes,
                padding: crypto.constants.RSA_PKCS1_PADDING
            }, messageBytes);
            await octokit.rest.actions.createOrUpdateRepoSecret({
                owner: repoOwner,
                repo: repoName,
                secret_name: 'GH_PAT',
                encrypted_value: encryptedBytes.toString('base64'),
                key_id: publicKey.key_id
            });
            console.log('Repository secret updated successfully');
        }
    }
    catch (error) {
        console.error('Token rotation failed:', error.message);
        process.exit(1);
    }
}
rotateToken().catch(console.error);
