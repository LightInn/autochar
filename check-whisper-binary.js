// check-whisper-binary.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import child_process from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Checking nodejs-whisper binaries...');

// Check for the whisper-cli binary
const binPath = path.join(process.cwd(), 'node_modules', '.pnpm', 'nodejs-whisper@0.2.9', 'node_modules', 'nodejs-whisper', 'cpp', 'whisper.cpp', 'build', 'bin');

console.log('Expected binary path:', binPath);
console.log('Path exists:', fs.existsSync(binPath));

if (fs.existsSync(binPath)) {
  // List files in the bin directory
  const files = fs.readdirSync(binPath);
  console.log('Files in bin directory:', files);
  
  // Check for whisper-cli
  const whisperCli = files.find(file => file === 'whisper-cli');
  if (whisperCli) {
    console.log('whisper-cli found at:', path.join(binPath, whisperCli));
    
    // Check if it's executable
    try {
      const stats = fs.statSync(path.join(binPath, whisperCli));
      console.log('Is executable:', !!(stats.mode & 0o111));
    } catch (err) {
      console.error('Error checking whisper-cli permissions:', err);
    }
  } else {
    console.log('whisper-cli not found in bin directory');
  }
}

// Check if we have the model file
const modelPath = path.join(__dirname, 'app', 'models', 'ggml-base.bin');
console.log('\nChecking model file:', modelPath);
console.log('Model exists:', fs.existsSync(modelPath));

if (fs.existsSync(modelPath)) {
  const stats = fs.statSync(modelPath);
  console.log('Model size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
}

// Check Node.js binary
console.log('\nNode.js binary:', process.execPath);
console.log('Node.js version:', process.version);

console.log('\nCheck complete');
