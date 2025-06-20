import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { nodewhisper } = require('nodejs-whisper');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post('/transcribe', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;

  // Setup Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  console.log(`Transcription for ${filePath} using SSE.`);

  // Run transcription asynchronously
  (async () => {
    try {
      const transcript = await nodewhisper(filePath, {
        modelName: 'base', // Using a much faster model
        whisperOptions: {
          language: 'fr',
          word_timestamps: true,
          outputInJson: true, // get output result in json file
        },
      });

        if (!transcript) {
        throw new Error('Transcription failed or produced no output.');
        }

    console.log(transcript);

      console.log('Transcription completed successfully!');
      console.log('Transcript length:', transcript.length, 'characters');

      // Send the final result as text wrapped in an object
      res.write(`event: result\ndata: ${JSON.stringify({ text: transcript })}\n\n`);

    } catch (error) {
      console.error('Error during transcription:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message || 'Error during transcription' })}\n\n`);
    } finally {
      // End the connection
      res.write(`event: done\ndata: Transcription finished\n\n`);
      res.end();

      // Clean up the uploaded file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${filePath}`, err);
        }
      });
    }
  })();

  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected.');
    res.end();
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
