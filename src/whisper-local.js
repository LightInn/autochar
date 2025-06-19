class WhisperLocal {
    constructor() {
        this.isInitialized = false;
        this.model = null;
        this.processor = null;
        this.modelName = 'base';
        this.isDownloading = false;
        this.downloadProgress = 0;
        this.modelCache = new Map();
        this.currentLanguage = 'fr';
        this.transcriptionCallbacks = [];
        
        console.log('WhisperLocal initialized');
    }

    async initialize() {
        try {
            // Check if transformers.js is available
            if (typeof transformers === 'undefined') {
                throw new Error('Transformers.js not loaded');
            }
            
            this.isInitialized = true;
            console.log('WhisperLocal ready');
            return true;
        } catch (error) {
            console.error('Failed to initialize WhisperLocal:', error);
            return false;
        }
    }

    async downloadModel(modelName = 'base', onProgress = null) {
        if (this.isDownloading) {
            console.warn('Model download already in progress');
            return false;
        }

        try {
            this.isDownloading = true;
            this.downloadProgress = 0;
            this.modelName = modelName;
            
            console.log(`Downloading Whisper ${modelName} model...`);
            
            // Model configuration
            const modelConfig = {
                'tiny': { size: '39MB', id: 'openai/whisper-tiny' },
                'base': { size: '74MB', id: 'openai/whisper-base' },
                'small': { size: '244MB', id: 'openai/whisper-small' }
            };
            
            const config = modelConfig[modelName];
            if (!config) {
                throw new Error(`Unknown model: ${modelName}`);
            }
            
            // Progress callback
            const progressCallback = (progress) => {
                this.downloadProgress = progress.loaded / progress.total * 100;
                console.log(`Download progress: ${this.downloadProgress.toFixed(1)}%`);
                
                if (onProgress) {
                    onProgress(this.downloadProgress, progress);
                }
            };
            
            // Download model using transformers.js
            console.log(`Loading model: ${config.id}`);
            
            // Note: In a real implementation, you would use:
            // this.model = await transformers.WhisperForConditionalGeneration.from_pretrained(config.id, {
            //     progress_callback: progressCallback
            // });
            // this.processor = await transformers.WhisperProcessor.from_pretrained(config.id);
            
            // For now, simulate download
            await this.simulateDownload(progressCallback);
            
            this.modelCache.set(modelName, {
                model: 'simulated_model',
                processor: 'simulated_processor'
            });
            
            this.isDownloading = false;
            console.log(`Model ${modelName} downloaded successfully`);
            return true;
            
        } catch (error) {
            this.isDownloading = false;
            console.error('Failed to download model:', error);
            throw error;
        }
    }

    async simulateDownload(progressCallback) {
        // Simulate download progress
        for (let i = 0; i <= 100; i += 5) {
            await new Promise(resolve => setTimeout(resolve, 100));
            progressCallback({ loaded: i, total: 100 });
        }
    }

    async transcribeAudio(audioBuffer, options = {}) {
        if (!this.isInitialized) {
            throw new Error('WhisperLocal not initialized');
        }

        if (!this.modelCache.has(this.modelName)) {
            throw new Error(`Model ${this.modelName} not downloaded`);
        }

        try {
            console.log('Starting transcription...');
            
            const defaultOptions = {
                language: this.currentLanguage,
                task: 'transcribe',
                return_timestamps: true,
                chunk_length_s: 30,
                stride_length_s: 5
            };
            
            const transcriptionOptions = { ...defaultOptions, ...options };
            
            // In a real implementation, you would use:
            // const inputs = await this.processor(audioBuffer, {
            //     sampling_rate: 16000,
            //     return_tensors: 'pt'
            // });
            // 
            // const generated_ids = await this.model.generate(inputs.input_features, {
            //     language: transcriptionOptions.language,
            //     task: transcriptionOptions.task,
            //     return_timestamps: transcriptionOptions.return_timestamps
            // });
            // 
            // const transcription = this.processor.batch_decode(generated_ids, {
            //     skip_special_tokens: true
            // });
            
            // For now, simulate transcription
            const result = await this.simulateTranscription(audioBuffer, transcriptionOptions);
            
            console.log('Transcription completed');
            return result;
            
        } catch (error) {
            console.error('Transcription failed:', error);
            throw error;
        }
    }

    async simulateTranscription(audioBuffer, options) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate sample French transcription with timestamps
        const sampleSegments = [
            { start: 0.0, end: 2.5, text: "Bonjour, je suis très content aujourd'hui." },
            { start: 3.0, end: 5.5, text: "Cette musique me donne envie de danser." },
            { start: 6.0, end: 8.0, text: "C'est fantastique, quelle énergie !" },
            { start: 8.5, end: 11.0, text: "Je me sens vraiment excité et joyeux." },
            { start: 11.5, end: 14.0, text: "Allons bouger sur ce rythme entraînant." }
        ];
        
        // Calculate actual duration from audio buffer
        const duration = audioBuffer ? audioBuffer.length / 16000 : 15; // Assume 16kHz
        
        // Adjust segments to audio duration
        const scaleFactor = duration / 15;
        const adjustedSegments = sampleSegments.map(segment => ({
            start: segment.start * scaleFactor,
            end: segment.end * scaleFactor,
            text: segment.text
        })).filter(segment => segment.start < duration);
        
        return {
            text: adjustedSegments.map(s => s.text).join(' '),
            segments: adjustedSegments,
            language: options.language,
            duration: duration
        };
    }

    async transcribeFile(file, options = {}) {
        try {
            console.log(`Transcribing file: ${file.name}`);
            
            // Convert file to audio buffer
            const audioBuffer = await this.fileToAudioBuffer(file);
            
            // Transcribe
            const result = await this.transcribeAudio(audioBuffer, options);
            
            // Notify callbacks
            this.transcriptionCallbacks.forEach(callback => {
                callback({
                    type: 'transcription_complete',
                    result: result,
                    file: file
                });
            });
            
            return result;
            
        } catch (error) {
            console.error('File transcription failed:', error);
            throw error;
        }
    }

    async fileToAudioBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // Convert to mono 16kHz for Whisper
                    const sampleRate = 16000;
                    const samples = audioBuffer.getChannelData(0);
                    
                    // Resample if needed
                    let resampledSamples;
                    if (audioBuffer.sampleRate !== sampleRate) {
                        resampledSamples = this.resample(samples, audioBuffer.sampleRate, sampleRate);
                    } else {
                        resampledSamples = samples;
                    }
                    
                    resolve(resampledSamples);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    resample(samples, originalRate, targetRate) {
        if (originalRate === targetRate) return samples;
        
        const ratio = originalRate / targetRate;
        const newLength = Math.round(samples.length / ratio);
        const result = new Float32Array(newLength);
        
        for (let i = 0; i < newLength; i++) {
            const index = i * ratio;
            const indexFloor = Math.floor(index);
            const indexCeil = Math.min(indexFloor + 1, samples.length - 1);
            const fraction = index - indexFloor;
            
            result[i] = samples[indexFloor] * (1 - fraction) + samples[indexCeil] * fraction;
        }
        
        return result;
    }

    // Configuration methods
    setModel(modelName) {
        if (['tiny', 'base', 'small'].includes(modelName)) {
            this.modelName = modelName;
            console.log(`Model set to: ${modelName}`);
        } else {
            console.warn(`Unknown model: ${modelName}`);
        }
    }

    setLanguage(language) {
        this.currentLanguage = language;
        console.log(`Language set to: ${language}`);
    }

    // Event handling
    addTranscriptionCallback(callback) {
        this.transcriptionCallbacks.push(callback);
    }

    removeTranscriptionCallback(callback) {
        const index = this.transcriptionCallbacks.indexOf(callback);
        if (index > -1) {
            this.transcriptionCallbacks.splice(index, 1);
        }
    }

    // Status methods
    isModelDownloaded(modelName = this.modelName) {
        return this.modelCache.has(modelName);
    }

    getDownloadProgress() {
        return this.downloadProgress;
    }

    isDownloadInProgress() {
        return this.isDownloading;
    }

    getAvailableModels() {
        return [
            { name: 'tiny', size: '39MB', description: 'Rapide, précision correcte' },
            { name: 'base', size: '74MB', description: 'Équilibré vitesse/précision' },
            { name: 'small', size: '244MB', description: 'Précis, plus lent' }
        ];
    }

    // Cleanup
    cleanup() {
        this.transcriptionCallbacks = [];
        this.modelCache.clear();
        console.log('WhisperLocal cleaned up');
    }
}

// Export for use in other modules
window.WhisperLocal = WhisperLocal;
