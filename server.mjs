import express from 'express';
import multer from 'multer';
import whisper from 'nodejs-whisper';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;

  try {
    console.log(`Transcription for ${filePath}`);
    const transcript = await whisper(filePath, {
      modelName: 'large-v3-turbo', // or 'base', 'small', 'medium', 'large'
      whisperOptions: {
        language: 'fr',
        word_timestamps: true,
      },
    });

    res.json({ transcript });
  } catch (error) {
    console.error('Error during transcription:', error);
    res.status(500).send('Error during transcription.');
  } finally {
    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
