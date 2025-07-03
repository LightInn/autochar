import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTranscription() {
  try {
    // Path to test audio file - you need to provide an audio file
    // Replace this with a path to your test audio file
    const audioPath = path.join(__dirname, 'test-audio.mp3');
    
    if (!fs.existsSync(audioPath)) {
      console.error('Test audio file not found:', audioPath);
      console.log('Please place a test audio file named test-audio.mp3 in the project root');
      return;
    }
    
    console.log('Testing transcription with file:', audioPath);
    
    // Create form data
    const form = new FormData();
    form.append('audio', fs.createReadStream(audioPath));
    
    // Send request to transcription endpoint
    const response = await fetch('http://localhost:3001/api/transcribe', {
      method: 'POST',
      body: form,
    });
    
    const result = await response.json();
    
    console.log('Transcription Response:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error testing transcription:', error);
  }
}

// Start the test
testTranscription();
