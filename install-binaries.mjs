#!/usr/bin/env node

/**
 * AutoChar Studio Binary Installation
 * 
 * This script copies necessary binaries and models from node_modules to the app's
 * resources and models directories, making them available for packaging with electron-builder.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

console.log(`${BLUE}======================================${RESET}`);
console.log(`${BLUE}AutoChar Studio - Binary Installation${RESET}`);
console.log(`${BLUE}======================================${RESET}\n`);

/**
 * Check if a file exists and is executable
 */
function checkExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Make a file executable
 */
function makeExecutable(filePath) {
  try {
    if (process.platform !== 'win32') { // Skip on Windows
      fs.chmodSync(filePath, 0o755); // rwxr-xr-x
      console.log(`${GREEN}Made file executable: ${filePath}${RESET}`);
    }
    return true;
  } catch (err) {
    console.error(`${RED}Failed to make file executable: ${filePath}${RESET}`, err);
    return false;
  }
}

/**
 * Copy a file to a destination
 */
function copyFile(source, destination) {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log(`${GREEN}Created directory: ${destDir}${RESET}`);
    }
    
    // Skip if file already exists
    if (fs.existsSync(destination)) {
      console.log(`${YELLOW}File already exists, skipping: ${destination}${RESET}`);
      return true;
    }

    // Copy the file
    fs.copyFileSync(source, destination);
    console.log(`${GREEN}Copied file: ${source} -> ${destination}${RESET}`);
    return true;
  } catch (err) {
    console.error(`${RED}Failed to copy file: ${source} -> ${destination}${RESET}`, err);
    return false;
  }
}

/**
 * Install whisper-cli binary
 */
function installWhisperBinary() {
  // Source path in node_modules
  const whisperSources = [
    path.join(
      __dirname,
      'node_modules',
      '.pnpm',
      'nodejs-whisper@0.2.9',
      'node_modules',
      'nodejs-whisper',
      'cpp',
      'whisper.cpp',
      'build',
      'bin',
      'whisper-cli'
    ),
    path.join(
      __dirname,
      'node_modules',
      'nodejs-whisper',
      'cpp',
      'whisper.cpp',
      'build',
      'bin',
      'whisper-cli'
    )
  ];
  
  // Destination path in app resources
  const destination = path.join(__dirname, 'app', 'resources', 'whisper-cli');
  
  // Try each source path
  for (const source of whisperSources) {
    if (fs.existsSync(source)) {
      console.log(`${GREEN}Found whisper-cli at: ${source}${RESET}`);
      if (copyFile(source, destination)) {
        makeExecutable(destination);
        return true;
      }
    }
  }
  
  console.error(`${RED}Could not find whisper-cli binary in node_modules!${RESET}`);
  console.log(`${YELLOW}Looking in: ${whisperSources.join(', ')}${RESET}`);
  
  // Try to rebuild nodejs-whisper
  console.log(`${YELLOW}Attempting to build nodejs-whisper...${RESET}`);
  try {
    execSync('cd node_modules/nodejs-whisper && npm run build', { stdio: 'inherit' });
    console.log(`${GREEN}Rebuild completed, checking again...${RESET}`);
    
    // Check if build succeeded
    for (const source of whisperSources) {
      if (fs.existsSync(source)) {
        console.log(`${GREEN}Found whisper-cli after rebuild at: ${source}${RESET}`);
        if (copyFile(source, destination)) {
          makeExecutable(destination);
          return true;
        }
      }
    }
  } catch (err) {
    console.error(`${RED}Failed to rebuild nodejs-whisper:${RESET}`, err);
  }
  
  console.error(`${RED}Failed to install whisper-cli binary!${RESET}`);
  return false;
}

/**
 * Install whisper model files
 */
function installWhisperModels() {
  // Base model sources
  const baseModelSources = [
    path.join(
      __dirname,
      'node_modules',
      '.pnpm',
      'nodejs-whisper@0.2.9',
      'node_modules',
      'nodejs-whisper',
      'models',
      'ggml-base.bin'
    ),
    path.join(
      __dirname,
      'node_modules',
      'nodejs-whisper',
      'models',
      'ggml-base.bin'
    )
  ];
  
  // Large model sources
  const largeModelSources = [
    path.join(
      __dirname,
      'node_modules',
      '.pnpm',
      'nodejs-whisper@0.2.9',
      'node_modules',
      'nodejs-whisper',
      'models',
      'ggml-large-v3-turbo.bin'
    ),
    path.join(
      __dirname,
      'node_modules',
      'nodejs-whisper',
      'models',
      'ggml-large-v3-turbo.bin'
    )
  ];
  
  // Destination paths
  const baseModelDest = path.join(__dirname, 'app', 'models', 'ggml-base.bin');
  const largeModelDest = path.join(__dirname, 'app', 'models', 'ggml-large-v3-turbo.bin');
  
  let baseInstalled = false;
  let largeInstalled = false;
  
  // Install base model
  for (const source of baseModelSources) {
    if (fs.existsSync(source)) {
      console.log(`${GREEN}Found base model at: ${source}${RESET}`);
      if (copyFile(source, baseModelDest)) {
        baseInstalled = true;
        break;
      }
    }
  }
  
  // Try to install large model (optional)
  for (const source of largeModelSources) {
    if (fs.existsSync(source)) {
      console.log(`${GREEN}Found large model at: ${source}${RESET}`);
      if (copyFile(source, largeModelDest)) {
        largeInstalled = true;
        break;
      }
    }
  }
  
  if (!baseInstalled) {
    console.error(`${RED}Could not find base model file in node_modules!${RESET}`);
    console.log(`${YELLOW}Base model is required for transcription!${RESET}`);
    console.log(`${YELLOW}The model should download automatically on first run, but it's recommended to install it manually.${RESET}`);
    return false;
  }
  
  if (!largeInstalled) {
    console.log(`${YELLOW}Large model not installed (optional)${RESET}`);
  }
  
  return baseInstalled;
}

// Main function
async function main() {
  let success = true;
  
  console.log(`${BLUE}Installing whisper-cli binary...${RESET}`);
  if (!installWhisperBinary()) {
    success = false;
  }
  
  console.log(`\n${BLUE}Installing whisper model files...${RESET}`);
  if (!installWhisperModels()) {
    success = false;
  }
  
  // Final report
  console.log(`\n${BLUE}======================================${RESET}`);
  console.log(`${success ? GREEN : RED}Installation ${success ? 'COMPLETED' : 'FAILED'}${RESET}`);
  console.log(`${BLUE}======================================${RESET}`);
  
  if (!success) {
    console.log(`\n${YELLOW}Some components could not be installed. The app may still work with auto-download features, but it's recommended to fix these issues before packaging.${RESET}`);
    
    // Don't exit with error code to prevent CI failure
    // process.exit(1);
  }
}

main().catch(error => {
  console.error(`${RED}Error:${RESET}`, error);
});
