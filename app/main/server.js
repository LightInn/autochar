import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { nodewhisper } from 'nodejs-whisper';
import * as child_process from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to validate and potentially convert audio file
const ensureValidAudioFile = (filePath) => {
  try {
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    
    // If not a .wav file, no need to validate further
    if (ext !== '.wav') {
      console.log(`File ${filePath} is not a WAV file, will be converted by nodejs-whisper`);
      return;
    }
    
    // Basic check for WAV file header
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);
    
    // Check RIFF header and WAVE format
    const isValidWav = 
      buffer.toString('ascii', 0, 4) === 'RIFF' && 
      buffer.toString('ascii', 8, 12) === 'WAVE';
    
    if (!isValidWav) {
      console.log(`File ${filePath} has .wav extension but invalid WAV header`);
      
      // Rename the original file by appending .original
      const originalPath = `${filePath}.original`;
      fs.renameSync(filePath, originalPath);
      console.log(`Renamed problematic file to ${originalPath}`);
      
      // Let nodejs-whisper handle the conversion
      return;
    }
    
    console.log(`File ${filePath} is a valid WAV file`);
  } catch (error) {
    console.error('Error validating audio file:', error);
    // Continue with processing and let nodejs-whisper handle conversion
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Helper function to ensure whisper model is available
const ensureWhisperModel = async () => {
  try {
    const modelsPath = path.join(__dirname, '../models');
    const modelFilePath = path.join(modelsPath, 'ggml-base.bin');
    
    // Check if model already exists in app's models directory
    if (fs.existsSync(modelFilePath)) {
      console.log('Model file already exists in app directory:', modelFilePath);
      return modelFilePath;
    }
    
    console.log('Model not found in app directory, looking for it in alternative locations...');
    
    // Define possible model locations
    const possibleLocations = [
      // From node_modules
      path.join(
        process.cwd(),
        'node_modules',
        '.pnpm',
        'nodejs-whisper@0.2.9',
        'node_modules',
        'nodejs-whisper',
        'models',
        'ggml-base.bin'
      ),
      // Simple node_modules path
      path.join(process.cwd(), 'node_modules', 'nodejs-whisper', 'models', 'ggml-base.bin'),
      // Electron resources path (for packaged app)
      path.join(process.resourcesPath || process.cwd(), 'models', 'ggml-base.bin'),
      // Resources directory
      path.join(__dirname, '../resources/models/ggml-base.bin')
    ];
    
    // Check each possible location
    for (const location of possibleLocations) {
      console.log(`Checking for model at: ${location}`);
      
      if (fs.existsSync(location)) {
        console.log(`Found model at: ${location}`);
        
        // Ensure models directory exists
        if (!fs.existsSync(modelsPath)) {
          fs.mkdirSync(modelsPath, { recursive: true });
          console.log('Created models directory:', modelsPath);
        }
        
        // Copy model file to app's models directory
        fs.copyFileSync(location, modelFilePath);
        console.log('Copied model file to app directory:', modelFilePath);
        
        return modelFilePath;
      }
    }
    
    console.log('Model not found in any location');
    return null;
  } catch (error) {
    console.error('Error ensuring whisper model:', error);
    return null;
  }
};

// Helper function to run whisper-cli directly if needed
const runWhisperDirectly = async (audioPath, modelPath) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Running whisper-cli directly...');
      
      // Construct the path to the whisper-cli binary
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
      
      console.log('Whisper binary path:', whisperBinPath);
      
      // Ensure we have the model file
      const modelFilePath = path.join(modelPath, 'ggml-base.bin');
      console.log('Model file path:', modelFilePath);
      
      if (!fs.existsSync(modelFilePath)) {
        return reject(new Error(`Model file not found at: ${modelFilePath}`));
      }
      
      // Make file path absolute
      const inputFile = path.resolve(audioPath);
      console.log('Using input file:', inputFile);
      
      // Ensure the binary exists
      if (!fs.existsSync(whisperBinPath)) {
        // Try to find the binary in alternative locations
        const altPaths = [
          // Resources directory for packaged app
          path.join(process.resourcesPath || process.cwd(), 'resources', 'whisper-cli'),
          // App's resources directory
          path.join(__dirname, '..', 'resources', 'whisper-cli'),
          // Alternative node_modules paths
          path.join(process.cwd(), 'node_modules', 'nodejs-whisper', 'cpp', 'whisper.cpp', 'build', 'bin', 'whisper-cli')
        ];
        
        console.log('Trying alternative binary paths...');
        
        for (const altPath of altPaths) {
          console.log(`Checking: ${altPath}`);
          if (fs.existsSync(altPath)) {
            console.log(`Found whisper-cli at alternative path: ${altPath}`);
            console.log('Using this path instead');
            // Use the alternative path instead
            return runWithWhisperPath(altPath, inputFile, modelFilePath, resolve, reject);
          }
        }
        
        return reject(new Error(`whisper-cli binary not found at: ${whisperBinPath} or any alternative locations`));
      }
      
      // Continue with normal execution using the primary path
      return runWithWhisperPath(whisperBinPath, inputFile, modelFilePath, resolve, reject);
    } catch (error) {
      console.error('Error in runWhisperDirectly:', error);
      reject(error);
    }
  });
};

// Helper function to run whisper with a specific binary path
function runWithWhisperPath(binPath, inputFile, modelFilePath, resolve, reject) {
  try {
    // Construct the command with arguments
    const args = [
      '-otxt',
      '-l', 'auto',
      '-m', modelFilePath,
      '-f', inputFile
    ];
    
    console.log('Running command:', binPath, args.join(' '));
    
    // Execute whisper-cli directly
    const child = child_process.spawn(binPath, args);
    
    let stdoutData = '';
    let stderrData = '';
    
    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdoutData += chunk;
      console.log('whisper-cli stdout:', chunk);
    });
    
    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderrData += chunk;
      console.log('whisper-cli stderr:', chunk);
    });
    
    child.on('close', (code) => {
      console.log(`whisper-cli process exited with code ${code}`);
      
      if (code === 0) {
        console.log('whisper-cli executed successfully');
        
        // Check if whisper created a text output file
        const txtOutputPath = `${inputFile}.txt`;
        if (fs.existsSync(txtOutputPath)) {
          try {
            const fileContent = fs.readFileSync(txtOutputPath, 'utf8');
            console.log('Found output text file, using its content');
            resolve(fileContent);
          } catch (readError) {
            console.error('Error reading output file:', readError);
            resolve(stdoutData || 'Transcription completed, but no text was captured.');
          }
        } else {
          resolve(stdoutData || 'Transcription completed, but no text was captured.');
        }
      } else {
        console.error('whisper-cli execution failed:', stderrData);
        reject(new Error(`whisper-cli failed with code ${code}: ${stderrData}`));
      }
    });
    
    child.on('error', (err) => {
      console.error('Failed to start whisper-cli process:', err);
      reject(err);
    });
  } catch (error) {
    console.error('Error in runWithWhisperPath:', error);
    reject(error);
  }
}

// Handles transcription using nodejs-whisper library
const transcribeWithLibrary = async (audioPath, modelPath) => {
  console.log('Attempting fallback to nodejs-whisper library...');
  try {
    const result = await nodewhisper(audioPath, {
      modelName: 'base',
      autoDownloadModelName: 'base',
      modelPath: modelPath,
      binPath: path.join(process.cwd(), 'node_modules', '.pnpm', 'nodejs-whisper@0.2.9', 'node_modules', 'nodejs-whisper', 'cpp', 'whisper.cpp', 'build', 'bin'),
      removeWavFileAfterTranscription: false,
      whisperOptions: {
        outputInText: true,
        language: 'auto'
      }
    });
    console.log('nodejs-whisper library succeeded');
    return result;
  } catch (error) {
    console.error('nodejs-whisper library failed:', error);
    throw error;
  }
};

// Handles transcription using simplified direct execution
const transcribeWithSimpleExecution = async (audioPath, modelPath) => {
  console.log('Attempting with simpler parameters...');
  try {
    // Use the whisper-cli binary directly with minimal arguments
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
    
    const modelFilePath = path.join(modelPath, 'ggml-base.bin');
    
    // Check if binary exists, if not, try alternative paths
    if (!fs.existsSync(whisperBinPath)) {
      const altPaths = [
        path.join(process.resourcesPath || process.cwd(), 'resources', 'whisper-cli'),
        path.join(__dirname, '..', 'resources', 'whisper-cli'),
        path.join(process.cwd(), 'node_modules', 'nodejs-whisper', 'cpp', 'whisper.cpp', 'build', 'bin', 'whisper-cli')
      ];
      
      console.log('Simple approach: Checking alternative binary paths...');
      
      for (const altPath of altPaths) {
        console.log(`Checking: ${altPath}`);
        if (fs.existsSync(altPath)) {
          console.log(`Found whisper-cli at: ${altPath}`);
          
          // Simpler command execution with alternative path
          const result = child_process.execSync(
            `"${altPath}" -m "${modelFilePath}" -f "${audioPath}" -otxt`, 
            { encoding: 'utf8' }
          );
          
          console.log('Simple approach succeeded with alternative path');
          return result;
        }
      }
      
      throw new Error('whisper-cli binary not found in any location');
    }
    
    // Simpler command execution
    const result = child_process.execSync(
      `"${whisperBinPath}" -m "${modelFilePath}" -f "${audioPath}" -otxt`, 
      { encoding: 'utf8' }
    );
    
    console.log('Simple approach succeeded');
    return result;
  } catch (error) {
    console.error('Simple approach failed:', error);
    throw error;
  }
};

// Formats transcription result for API response
const formatTranscriptionResult = (transcription) => {
  if (typeof transcription === 'object' && transcription !== null) {
    return transcription.text || JSON.stringify(transcription);
  }
  return transcription;
};

// Check if all required binaries and models are available
const checkRequiredBinaries = () => {
  try {
    console.log('Checking for required binaries and models...');
    const binaries = [];
    
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
    binaries.push({ name: 'whisper-cli', path: whisperBinPath, exists: whisperExists });
    
    // Check for model file
    const modelPath = path.join(__dirname, '../models');
    const modelFilePath = path.join(modelPath, 'ggml-base.bin');
    const modelExists = fs.existsSync(modelFilePath);
    binaries.push({ name: 'ggml-base.bin model', path: modelFilePath, exists: modelExists });
    
    // Log results
    console.log('Binary check results:');
    let allFound = true;
    
    binaries.forEach(binary => {
      console.log(`- ${binary.name}: ${binary.exists ? 'FOUND ✓' : 'MISSING ✗'} at ${binary.path}`);
      if (!binary.exists) allFound = false;
    });
    
    if (allFound) {
      console.log('All required binaries and models are available! ✓');
    } else {
      console.warn('Some required binaries or models are missing! Transcription may fail.');
    }
    
    return binaries;
  } catch (error) {
    console.error('Error checking binaries:', error);
    return [];
  }
};

export async function createServer() {
  const app = express();
  const PORT = 3001;

  // Path to the models directory
  const modelsPath = path.join(__dirname, '../models');

  // Ensure model is available before starting the server
  console.log('Ensuring whisper model is available...');
  const modelResult = await ensureWhisperModel();
  
  // Check all required binaries
  checkRequiredBinaries();
  
  // Check if models exist and log available models
  const modelExists = fs.existsSync(path.join(modelsPath, 'ggml-base.bin'));
  console.log('Models directory:', modelsPath);
  console.log('Available models:', ['base', 'large-v3-turbo']);
  console.log('Base model exists:', modelExists);
  
  if (!modelExists && !modelResult) {
    console.warn('WARNING: No model found. Transcription may fail unless auto-download works.')
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../../uploads')));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AutoChar Studio Server is running' });
  });

  // Audio upload and transcription endpoint
  app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const audioPath = req.file.path;
      console.log('Processing audio file:', audioPath);

      // Explicitly set the path to Node.js binary for nodejs-whisper
      // This is crucial for the command execution to work
      const nodePath = process.execPath;
      process.env.NODE_BINARY_PATH = nodePath;
      console.log('Setting NODE_BINARY_PATH to:', nodePath);
      
      // Ensure audioFile exists and is readable
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }
      
      // Validate the WAV file
      ensureValidAudioFile(audioPath);

      // Set model path and check if models exist
      const modelPath = path.join(__dirname, '../models');
      
      // Ensure the model exists before attempting transcription
      await ensureWhisperModel();
      
      const baseModelPath = path.join(modelPath, 'ggml-base.bin');
      if (!fs.existsSync(baseModelPath)) {
        console.warn('Base model not found at:', baseModelPath);
        console.log('Attempting to use auto-download feature as last resort...');
      }
      
      // Log file information for debugging
      try {
        const stats = fs.statSync(audioPath);
        console.log(`File size: ${stats.size} bytes`);
        console.log(`File permissions: ${stats.mode.toString(8)}`);
      } catch (err) {
        console.error('Error reading file stats:', err);
      }

      // Use nodejs-whisper for transcription with improved error handling
      console.log('Starting transcription process...');
      let transcription;
      
      // Attempt direct execution first as it's more reliable
      try {
        console.log('Using direct binary execution as primary method');
        transcription = await runWhisperDirectly(audioPath, modelPath);
        console.log('Direct binary execution succeeded');
      } catch (directError) {
        console.error('Direct execution failed:', directError);
        
        // If direct execution failed, try with a simplified approach
        try {
          transcription = await transcribeWithSimpleExecution(audioPath, modelPath);
        } catch (simpleError) {
          console.error('Simple approach failed:', simpleError);
          
          // Last resort - try the nodejs-whisper library
          try {
            transcription = await transcribeWithLibrary(audioPath, modelPath);
          } catch (whisperError) {
            console.error('All methods failed!', whisperError);
            console.error('Full error:', whisperError);
            
            // Detailed error logging for troubleshooting
            if (whisperError.stderr) {
              console.error('Error output:', whisperError.stderr);
            }
            if (whisperError.stdout) {
              console.error('Standard output:', whisperError.stdout);
            }
            
            throw new Error(`Transcription failed with all available methods: ${whisperError.message}`);
          }
        }
      }
      
      console.log('Transcription completed successfully');
      
      let result = formatTranscriptionResult(transcription);
      
      res.json({ 
        transcription: result,
        audioFile: req.file.filename 
      });

    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ 
        error: `Failed to transcribe audio: ${error.message}`,
        details: error.stack
      });
    }
  });

  // Start server
  const server = app.listen(PORT, () => {
    console.log(`AutoChar Studio server running on port ${PORT}`);
  });

  return server;
}
