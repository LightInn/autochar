import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nodewhisper } from 'nodejs-whisper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to test audio file - you need to provide an audio file
const sampleAudioPath = path.join(__dirname, 'test-audio.mp3');

// Check if sample audio exists, if not create a simple text file as placeholder
if (!fs.existsSync(sampleAudioPath)) {
  console.log('No test audio found at:', sampleAudioPath);
  console.log('Please create a test audio file named test-audio.mp3 in the project root');
  console.log('Testing with direct model functionality instead...');
}

async function testWhisperDirect() {
  try {
    console.log('Testing nodejs-whisper directly...');
    
    // Test the model configuration
    const modelsPath = path.join(__dirname, 'app/models');
    const baseModelPath = path.join(modelsPath, 'ggml-base.bin');
    
    console.log('Models directory:', modelsPath);
    console.log('Base model exists:', fs.existsSync(baseModelPath));
    
    if (fs.existsSync(sampleAudioPath)) {
      console.log('Found test audio file, attempting transcription...');
      
      const result = await nodewhisper(sampleAudioPath, {
        modelName: 'base',
        autoDownloadModelName: 'base',
        removeWavFileAfterTranscription: true,
        logger: console,
        whisperOptions: {
          outputInText: true,
          outputInJson: true,
          wordTimestamps: true,
          splitOnWord: true
        }
      });
      
      console.log('Transcription result:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('No test audio available. Please create test-audio.mp3 to test transcription.');
    }
    
  } catch (error) {
    console.error('Error in direct whisper test:', error);
  }
}

// Run the test
testWhisperDirect();
