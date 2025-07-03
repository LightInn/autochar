// debug-whisper.js - Utility to debug nodejs-whisper setup
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nodewhisper } from 'nodejs-whisper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== NODEJS-WHISPER DEBUG UTILITY ===');

// Check Node.js executable
console.log('Node.js executable path:', process.execPath);
process.env.NODE_BINARY_PATH = process.execPath;
console.log('Set NODE_BINARY_PATH to:', process.env.NODE_BINARY_PATH);

// Check model paths
const modelPath = path.join(__dirname, 'app/models');
console.log('Models directory:', modelPath);

const baseModelPath = path.join(modelPath, 'ggml-base.bin');
console.log('Base model exists:', fs.existsSync(baseModelPath));
if (fs.existsSync(baseModelPath)) {
  const stats = fs.statSync(baseModelPath);
  console.log(`Base model size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

// Check uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
console.log('Uploads directory exists:', fs.existsSync(uploadsDir));

// List audio files in uploads
if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  const audioFiles = files.filter(file => ['.wav', '.mp3', '.ogg'].some(ext => file.toLowerCase().endsWith(ext)));
  console.log('Audio files found:', audioFiles.length);
  
  if (audioFiles.length > 0) {
    console.log('First audio file:', audioFiles[0]);
    
    // Check permissions and readability
    const audioPath = path.join(uploadsDir, audioFiles[0]);
    try {
      const stats = fs.statSync(audioPath);
      console.log(`File size: ${stats.size} bytes`);
      console.log(`File permissions: ${stats.mode.toString(8)}`);
      
      // Test a simple transcription with minimal options
      console.log('\nAttempting a test transcription...');
      nodewhisper(audioPath, {
        modelName: 'base',
        modelPath: modelPath,
        removeWavFileAfterTranscription: false,
        logger: console,
        whisperOptions: {
          outputInText: true,
          language: 'auto'
        }
      })
      .then(result => {
        console.log('Transcription successful!');
        console.log('Result:', result);
      })
      .catch(error => {
        console.error('Transcription failed:', error);
      });
    } catch (err) {
      console.error('Error reading file stats:', err);
    }
  }
}

// Import version information 
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageInfo = require('nodejs-whisper/package.json');
console.log('\nNodeJS-Whisper version:', packageInfo.version);
console.log('=== DEBUG UTILITY COMPLETED ===');
