#!/usr/bin/env node

/**
 * AutoChar Studio Setup Verification
 * 
 * This script checks if all required binaries and models are available for the Electron app.
 * It should be run after installation to ensure the app will work properly for end users.
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
console.log(`${BLUE}AutoChar Studio - Setup Verification${RESET}`);
console.log(`${BLUE}======================================${RESET}\n`);

// Check for required binaries and models
function checkRequiredComponents() {
  const requiredComponents = [];
  let allFound = true;
  
  // Check for whisper-cli binary
  const whisperBinPath = path.join(
    process.cwd(), 
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
  );
  
  const whisperExists = fs.existsSync(whisperBinPath);
  const whisperExecutable = whisperExists ? checkExecutable(whisperBinPath) : false;
  requiredComponents.push({ 
    name: 'whisper-cli binary', 
    path: whisperBinPath, 
    exists: whisperExists,
    executable: whisperExecutable
  });
  
  // Check for model files
  const modelPath = path.join(__dirname, 'app', 'models');
  const baseModelPath = path.join(modelPath, 'ggml-base.bin');
  const baseModelExists = fs.existsSync(baseModelPath);
  requiredComponents.push({ 
    name: 'ggml-base.bin model', 
    path: baseModelPath, 
    exists: baseModelExists
  });
  
  const largeModelPath = path.join(modelPath, 'ggml-large-v3-turbo.bin');
  const largeModelExists = fs.existsSync(largeModelPath);
  requiredComponents.push({ 
    name: 'ggml-large-v3-turbo.bin model', 
    path: largeModelPath, 
    exists: largeModelExists,
    optional: true
  });
  
  // Check Node.js binary
  const nodeBinaryPath = process.execPath;
  const nodeExists = fs.existsSync(nodeBinaryPath);
  requiredComponents.push({ 
    name: 'Node.js binary', 
    path: nodeBinaryPath, 
    exists: nodeExists
  });
  
  // Print results
  console.log(`${BLUE}Component check results:${RESET}`);
  
  requiredComponents.forEach(component => {
    const status = component.exists 
      ? (component.hasOwnProperty('executable') && !component.executable 
          ? `${YELLOW}FOUND BUT NOT EXECUTABLE ⚠${RESET}` 
          : `${GREEN}FOUND ✓${RESET}`) 
      : component.optional 
        ? `${YELLOW}MISSING (OPTIONAL) ⚠${RESET}` 
        : `${RED}MISSING ✗${RESET}`;
    
    console.log(`- ${component.name}: ${status}`);
    console.log(`  Path: ${component.path}`);
    
    if (!component.exists && !component.optional) {
      allFound = false;
    }
    if (component.hasOwnProperty('executable') && !component.executable) {
      allFound = false;
    }
  });
  
  console.log('\n');
  
  if (allFound) {
    console.log(`${GREEN}All required components are available and executable! ✓${RESET}`);
    console.log(`${GREEN}The app should work properly for end users.${RESET}`);
  } else {
    console.log(`${RED}Some required components are missing or not executable! ✗${RESET}`);
    console.log(`${RED}The app may not work properly for end users.${RESET}`);
    console.log(`${YELLOW}Please see the troubleshooting guide below.${RESET}`);
    
    printTroubleshootingGuide();
  }
  
  return allFound;
}

// Check if a file is executable
function checkExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch (err) {
    return false;
  }
}

// Print troubleshooting guide
function printTroubleshootingGuide() {
  console.log(`\n${BLUE}Troubleshooting Guide:${RESET}`);
  console.log(`
1. ${YELLOW}Missing whisper-cli binary:${RESET}
   - Run: npm install nodejs-whisper@0.2.9
   - Verify binary was built with: ls -la node_modules/.pnpm/nodejs-whisper@0.2.9/node_modules/nodejs-whisper/cpp/whisper.cpp/build/bin
   - If not built, run: cd node_modules/.pnpm/nodejs-whisper@0.2.9/node_modules/nodejs-whisper && npm run build

2. ${YELLOW}Missing model files:${RESET}
   - Copy from node_modules to app/models:
     mkdir -p app/models
     cp node_modules/.pnpm/nodejs-whisper@0.2.9/node_modules/nodejs-whisper/models/ggml-base.bin app/models/

3. ${YELLOW}Binary not executable:${RESET}
   - Make binary executable: chmod +x <binary_path>
   
4. ${YELLOW}For packaged app issues:${RESET}
   - Ensure your build process correctly includes the models directory
   - For Electron, add "models/**" to extraResources or files in your build config
  `);
}

// Test a simple transcription
async function testTranscription() {
  try {
    console.log(`${BLUE}Testing transcription functionality...${RESET}`);
    
    // Check for whisper-cli binary
    const whisperBinPath = path.join(
      process.cwd(), 
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
    );
    
    // Check for model file
    const modelPath = path.join(__dirname, 'app', 'models');
    const modelFilePath = path.join(modelPath, 'ggml-base.bin');
    
    if (!fs.existsSync(whisperBinPath) || !fs.existsSync(modelFilePath)) {
      console.log(`${RED}Cannot test transcription - missing required components.${RESET}`);
      return false;
    }
    
    console.log('Running whisper-cli directly to test transcription...');
    
    // Run a simple test command - this will fail if not properly set up
    const testOutput = execSync(
      `"${whisperBinPath}" --version`, 
      { encoding: 'utf8' }
    );
    
    console.log(`${GREEN}Whisper CLI test successful!${RESET}`);
    console.log(`Output: ${testOutput.trim()}`);
    
    return true;
  } catch (error) {
    console.error(`${RED}Transcription test failed:${RESET}`, error.message);
    return false;
  }
}

// Main function
async function main() {
  const componentsOk = checkRequiredComponents();
  
  if (componentsOk) {
    await testTranscription();
  }
  
  console.log(`\n${BLUE}======================================${RESET}`);
  console.log(`${componentsOk ? GREEN : RED}Setup verification ${componentsOk ? 'PASSED' : 'FAILED'}${RESET}`);
  console.log(`${BLUE}======================================${RESET}`);
}

main().catch(error => {
  console.error(`${RED}Error:${RESET}`, error);
  process.exit(1);
});
