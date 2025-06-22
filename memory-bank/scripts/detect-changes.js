#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_BANK_DIR = path.dirname(__dirname);
const BASELINE_FILE = path.join(MEMORY_BANK_DIR, '.baseline');

// Parse command line arguments
const AUTO_MODE = process.argv.includes('--auto');

// Configuration for what constitutes a significant change
const SIGNIFICANT_CHANGES = {
    NEW_DEPENDENCIES: {
        patterns: ['package.json', 'package-lock.json', 'yarn.lock'],
        memoryBankFile: 'techContext.md',
        section: 'Dependencies'
    },
    NEW_TECH: {
        patterns: ['.ts', '.tsx', '.jsx', '.py', '.rb', '.go', '.java'],
        memoryBankFile: 'techContext.md',
        section: 'Technologies Used'
    },
    ARCHITECTURE: {
        patterns: ['src/app', 'src/components', 'src/lib', 'src/contexts'],
        memoryBankFile: 'systemPatterns.md',
        section: 'System Architecture'
    }
};

// Create readline interface for user interaction
const rl = AUTO_MODE ? null : readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to get changed files since last baseline
function getChangedFiles() {
    try {
        const baseline = fs.existsSync(BASELINE_FILE) 
            ? fs.readFileSync(BASELINE_FILE, 'utf8')
            : execSync('git rev-list --max-parents=0 HEAD').toString().trim();
        
        const diff = execSync(`git diff --name-only ${baseline} HEAD`).toString();
        return diff.split('\n').filter(Boolean);
    } catch (error) {
        console.error('Error getting changed files:', error);
        return [];
    }
}

// Function to detect significant changes
function detectSignificantChanges(changedFiles) {
    const changes = {};
    
    for (const [changeType, config] of Object.entries(SIGNIFICANT_CHANGES)) {
        const relevantChanges = changedFiles.filter(file => 
            config.patterns.some(pattern => file.includes(pattern))
        );
        
        if (relevantChanges.length > 0) {
            changes[changeType] = {
                files: relevantChanges,
                memoryBankFile: config.memoryBankFile,
                section: config.section
            };
        }
    }
    
    return changes;
}

// Function to update Memory Bank file
function updateMemoryBankFile(filePath, section, content) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`Memory Bank file not found: ${filePath}`);
            return false;
        }

        let fileContent = fs.readFileSync(filePath, 'utf8');
        const sectionRegex = new RegExp(`## ${section}\\s*[^#]*(?=##|$)`, 's');
        const date = new Date().toISOString().split('T')[0];
        const newContent = `\n\n**Auto-update ${date}**:\n${content.trim()}\n`;
        
        // Check if section exists in file
        if (!sectionRegex.test(fileContent)) {
            console.error(`Section "${section}" not found in ${filePath}`);
            return false;
        }
        const updatedContent = fileContent.replace(
            sectionRegex,
            match => `${match}${newContent}`
        );
        
        fs.writeFileSync(filePath, updatedContent);
        console.log(`Updated ${path.basename(filePath)} successfully!`);
        return true;
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
        return false;
    }
}

// Function to handle Memory Bank updates
async function handleUpdates(changes) {
    if (AUTO_MODE) {
        // In auto mode, automatically update files with detected changes
        for (const [changeType, data] of Object.entries(changes)) {
            const filePath = path.join(MEMORY_BANK_DIR, data.memoryBankFile);
            const content = `Detected changes in:\n${data.files.map(f => `- ${f}`).join('\n')}`;
            updateMemoryBankFile(filePath, data.section, content);
        }
        return;
    }

    // Interactive mode
    for (const [changeType, data] of Object.entries(changes)) {
        console.log(`\nDetected ${changeType} changes in:`);
        data.files.forEach(file => console.log(`  - ${file}`));
        
        const answer = await new Promise(resolve => {
            rl.question(`Would you like to update ${data.memoryBankFile} (${data.section} section)? [y/N] `, resolve);
        });
        
        if (answer.toLowerCase() === 'y') {
            console.log('Enter the update content (type "END" on a new line when done):');
            let content = '';
            while (true) {
                const line = await new Promise(resolve => rl.question('', resolve));
                if (line === 'END') break;
                content += line + '\n';
            }
            const filePath = path.join(MEMORY_BANK_DIR, data.memoryBankFile);
            updateMemoryBankFile(filePath, data.section, content);
        }
    }
}

// Main function
async function main() {
    try {
        const changedFiles = getChangedFiles();
        if (changedFiles.length === 0) {
            console.log('No changes detected since last baseline.');
            rl?.close();
            return;
        }
        
        const significantChanges = detectSignificantChanges(changedFiles);
        if (Object.keys(significantChanges).length === 0) {
            console.log('No significant changes detected that require Memory Bank updates.');
            rl?.close();
            return;
        }
        
        await handleUpdates(significantChanges);
        
        // Update baseline
        const currentCommit = execSync('git rev-parse HEAD').toString().trim();
        fs.writeFileSync(BASELINE_FILE, currentCommit);
        
        console.log('\nBaseline updated.');
        rl?.close();
    } catch (error) {
        console.error('Error in Memory Bank update:', error);
        rl?.close();
        // Don't exit with error in auto mode to prevent blocking dev server
        if (!AUTO_MODE) {
            process.exit(1);
        }
    }
}

main().catch(error => {
    console.error('Unhandled error:', error);
    rl?.close();
    if (!AUTO_MODE) {
        process.exit(1);
    }
}); 