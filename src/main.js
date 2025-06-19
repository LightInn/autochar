// Main application class
class StickmanAutoAnimator {
    constructor() {
        this.audioAnalyzer = null;
        this.whisperAnalyzer = null;
        this.emotionMapper = null;
        this.stickmanRenderer = null;
        this.animator = null;
        this.videoExporter = null;
        
        // DOM elements
        this.elements = {};
        
        // Application state
        this.isInitialized = false;
        this.audioFile = null;
        this.audioElement = null;
        this.isPlaying = false;
        this.currentSpeechIntention = null;
        
        // Visualization
        this.waveformCanvas = null;
        this.waveformCtx = null;
        this.emotionBars = [];
    }

    async init() {
        try {
            console.log('Initializing Stickman Auto-Animator...');
            
            // Get DOM elements
            this.initializeElements();
            
            // Initialize components
            this.initializeComponents();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize visualizations
            this.initializeVisualizations();
            
            this.isInitialized = true;
            console.log('Stickman Auto-Animator initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    initializeElements() {
        const elementIds = [
            'audioFile', 'audioInfo', 'audioPlayer', 'speechInfo', 'speechStatus',
            'emotionSensitivity', 'sensitivityValue',
            'animationSpeed', 'speedValue',
            'playBtn', 'pauseBtn', 'stopBtn', 'exportBtn',
            'stickmanCanvas', 'currentEmotion',
            'waveformCanvas', 'emotionBars'
        ];
        
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
            if (!this.elements[id]) {
                console.warn(`Element with id '${id}' not found`);
            }
        });
        
        // Show speech info panel
        if (this.elements.speechInfo) {
            this.elements.speechInfo.style.display = 'block';
        }
    }

    initializeComponents() {
        // Initialize Whisper analyzer first
        this.whisperAnalyzer = new WhisperAnalyzer();
        
        // Initialize audio analyzer
        this.audioAnalyzer = new AudioAnalyzer();
        
        // Initialize emotion mapper with Whisper support
        this.emotionMapper = new EmotionMapper(this.whisperAnalyzer);
        
        // Initialize stickman renderer
        this.stickmanRenderer = new StickmanRenderer(this.elements.stickmanCanvas);
        
        // Initialize animator
        this.animator = new Animator(this.stickmanRenderer, this.emotionMapper);
        
        // Initialize video exporter
        this.videoExporter = new VideoExporter(this.elements.stickmanCanvas);
        
        // Set up audio analyzer callback
        this.audioAnalyzer.addAnalysisCallback((features, frequencyData) => {
            this.handleAudioAnalysis(features, frequencyData);
        });
        
        // Set up Whisper callback
        this.whisperAnalyzer.addTranscriptionCallback((data) => {
            this.handleSpeechAnalysis(data);
        });
        
        // Set up animator callbacks
        this.animator.onEmotionChangeHandler((emotionChange) => {
            this.handleEmotionChange(emotionChange);
        });
        
        this.animator.onAnimationUpdateHandler((animationUpdate) => {
            this.handleAnimationUpdate(animationUpdate);
        });
    }

    setupEventListeners() {
        // File upload
        this.elements.audioFile.addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });
        
        // Control buttons
        this.elements.playBtn.addEventListener('click', () => {
            this.play();
        });
        
        this.elements.pauseBtn.addEventListener('click', () => {
            this.pause();
        });
        
        this.elements.stopBtn.addEventListener('click', () => {
            this.stop();
        });
        
        this.elements.exportBtn.addEventListener('click', () => {
            this.exportVideo();
        });
        
        // Settings
        this.elements.emotionSensitivity.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.sensitivityValue.textContent = value.toFixed(1);
            this.animator.setEmotionSensitivity(value);
        });
        
        this.elements.animationSpeed.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.speedValue.textContent = value.toFixed(1);
            this.animator.setAnimationSpeed(value);
        });
        
        // Audio element events
        this.elements.audioPlayer.addEventListener('loadedmetadata', () => {
            this.updateAudioInfo();
        });
        
        this.elements.audioPlayer.addEventListener('timeupdate', () => {
            this.syncAnimation();
        });
        
        this.elements.audioPlayer.addEventListener('ended', () => {
            this.stop();
        });
    }

    initializeVisualizations() {
        // Initialize waveform canvas
        this.waveformCanvas = this.elements.waveformCanvas;
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        
        // Initial render
        this.stickmanRenderer.render(0);
        this.drawWaveform([]);
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        console.log('Loading audio file:', file.name);
        
        try {
            // Validate file type
            if (!file.type.startsWith('audio/')) {
                throw new Error('Please select a valid audio file.');
            }
            
            this.audioFile = file;
            
            // Create audio URL and load into audio element
            const audioURL = URL.createObjectURL(file);
            this.elements.audioPlayer.src = audioURL;
            
            // Initialize audio analyzer with the audio element
            const initialized = await this.audioAnalyzer.initialize(this.elements.audioPlayer);
            if (!initialized) {
                throw new Error('Failed to initialize audio analyzer.');
            }
            
            // Initialize Whisper for speech analysis
            await this.whisperAnalyzer.initialize();
            
            // Update speech status
            this.updateSpeechStatus();
            
            // Enable controls
            this.enableControls(true);
            
            console.log('Audio file loaded successfully');
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            this.showError(error.message);
        }
    }

    updateAudioInfo() {
        if (!this.elements.audioPlayer.duration) return;
        
        const duration = this.elements.audioPlayer.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        
        this.elements.audioInfo.innerHTML = `
            <strong>📁 ${this.audioFile.name}</strong><br>
            ⏱️ Durée: ${minutes}:${seconds.toString().padStart(2, '0')}<br>
            📊 Taille: ${(this.audioFile.size / 1024 / 1024).toFixed(1)} MB
        `;
    }

    async play() {
        if (!this.audioFile) {
            this.showError('Veuillez d\'abord charger un fichier audio.');
            return;
        }
        
        try {
            // Start audio
            await this.elements.audioPlayer.play();
            
            // Start analysis and animation
            this.audioAnalyzer.startAnalysis();
            this.whisperAnalyzer.startTranscription(this.elements.audioPlayer);
            this.animator.start();
            
            this.isPlaying = true;
            this.updateControlButtons();
            
            console.log('Playback started with French speech analysis');
            
        } catch (error) {
            console.error('Error starting playback:', error);
            this.showError('Erreur lors de la lecture audio.');
        }
    }

    pause() {
        if (!this.isPlaying) return;
        
        this.elements.audioPlayer.pause();
        this.audioAnalyzer.stopAnalysis();
        this.whisperAnalyzer.stopTranscription();
        this.animator.pause();
        
        this.isPlaying = false;
        this.updateControlButtons();
        
        console.log('Playback paused');
    }

    stop() {
        if (this.elements.audioPlayer) {
            this.elements.audioPlayer.pause();
            this.elements.audioPlayer.currentTime = 0;
        }
        
        this.audioAnalyzer.stopAnalysis();
        this.whisperAnalyzer.stopTranscription();
        this.animator.stop();
        
        // Reset to neutral state
        this.emotionMapper.currentEmotion = 'neutral';
        this.stickmanRenderer.render(0);
        this.updateEmotionDisplay('neutral');
        
        this.isPlaying = false;
        this.updateControlButtons();
        
        console.log('Playback stopped');
    }

    async exportVideo() {
        if (!this.audioFile) {
            this.showError('Veuillez d\'abord charger un fichier audio.');
            return;
        }
        
        try {
            console.log('Starting video export...');
            
            // Reset to beginning
            this.stop();
            
            // Start recording
            const duration = this.elements.audioPlayer.duration;
            const recordingStarted = await this.videoExporter.startRecording(
                this.elements.audioPlayer, 
                duration
            );
            
            if (!recordingStarted) {
                throw new Error('Failed to start video recording.');
            }
            
            // Start playback for recording
            await this.play();
            
            // Update export button
            this.elements.exportBtn.textContent = '🔴 Enregistrement...';
            this.elements.exportBtn.disabled = true;
            
            // Auto-stop when audio ends
            this.elements.audioPlayer.addEventListener('ended', () => {
                setTimeout(() => {
                    this.videoExporter.stopRecording();
                    this.elements.exportBtn.textContent = '📹 Exporter Vidéo';
                    this.elements.exportBtn.disabled = false;
                    console.log('Video export completed');
                }, 500);
            });
            
        } catch (error) {
            console.error('Error exporting video:', error);
            this.showError('Erreur lors de l\'export vidéo.');
            this.elements.exportBtn.textContent = '📹 Exporter Vidéo';
            this.elements.exportBtn.disabled = false;
        }
    }

    handleAudioAnalysis(features, frequencyData) {
        // Analyze emotion from audio features combined with speech
        const emotionAnalysis = this.emotionMapper.analyzeEmotion(features, this.currentSpeechIntention);
        
        // Update visualizations
        this.drawWaveform(frequencyData);
        this.updateEmotionBars(emotionAnalysis.scores);
    }

    handleSpeechAnalysis(data) {
        const { transcription, intention, interim } = data;
        
        if (!interim && intention && intention.confidence > 0.3) {
            this.currentSpeechIntention = intention;
            console.log(`🎤 French speech detected: "${transcription}" → ${intention.emotion} (${(intention.confidence * 100).toFixed(1)}%)`);
            
            // Update UI with transcription
            this.updateTranscriptionDisplay(transcription, intention);
        }
    }

    updateTranscriptionDisplay(transcription, intention) {
        // Create or update transcription display element
        let transcriptionElement = document.getElementById('transcriptionDisplay');
        if (!transcriptionElement) {
            transcriptionElement = document.createElement('div');
            transcriptionElement.id = 'transcriptionDisplay';
            transcriptionElement.className = 'transcription-display';
            
            const emotionDisplay = document.querySelector('.emotion-display');
            if (emotionDisplay) {
                emotionDisplay.appendChild(transcriptionElement);
            }
        }
        
        transcriptionElement.innerHTML = `
            <div class="transcription-text">💬 "${transcription}"</div>
            <div class="intention-result">→ ${intention.emotion} (${(intention.confidence * 100).toFixed(0)}%)</div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (transcriptionElement) {
                transcriptionElement.style.opacity = '0.5';
            }
        }, 5000);
    }

    updateSpeechStatus() {
        if (!this.elements.speechStatus) return;
        
        if (this.whisperAnalyzer.speechRecognitionAvailable) {
            this.elements.speechStatus.innerHTML = '✅ Disponible - Parlez en français pour des animations expressives !';
            this.elements.speechStatus.style.color = '#2ecc71';
        } else {
            this.elements.speechStatus.innerHTML = '⚠️ Non disponible - Animation basée sur l\'audio uniquement';
            this.elements.speechStatus.style.color = '#f39c12';
        }
    }

    handleEmotionChange(emotionChange) {
        this.updateEmotionDisplay(emotionChange.to);
        console.log(`Emotion changed: ${emotionChange.from} → ${emotionChange.to}`);
    }

    handleAnimationUpdate(animationUpdate) {
        // This could be used for additional UI updates
        // console.log('Animation update:', animationUpdate);
    }

    syncAnimation() {
        if (this.isPlaying && this.elements.audioPlayer.currentTime) {
            this.animator.syncWithAudio(this.elements.audioPlayer.currentTime);
        }
    }

    updateEmotionDisplay(emotion) {
        const emotionData = this.emotionMapper.getEmotionData(emotion);
        this.elements.currentEmotion.textContent = `${emotionData.emoji} ${emotionData.name}`;
        this.elements.currentEmotion.style.backgroundColor = emotionData.color;
    }

    drawWaveform(frequencyData) {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (!frequencyData || frequencyData.length === 0) {
            // Draw empty waveform
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
            return;
        }
        
        // Draw frequency spectrum
        ctx.fillStyle = '#667eea';
        const barWidth = width / frequencyData.length;
        
        for (let i = 0; i < frequencyData.length; i++) {
            const barHeight = (frequencyData[i] / 255) * height;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
        }
    }

    updateEmotionBars(emotionScores) {
        const container = this.elements.emotionBars;
        container.innerHTML = '';
        
        const emotions = Object.entries(emotionScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // Show top 5 emotions
        
        emotions.forEach(([emotion, score]) => {
            const emotionData = this.emotionMapper.getEmotionData(emotion);
            const bar = document.createElement('div');
            bar.className = 'emotion-bar';
            
            bar.innerHTML = `
                <div class="emotion-color" style="background-color: ${emotionData.color}"></div>
                <span>${emotionData.emoji} ${emotionData.name}</span>
                <span>${(score * 100).toFixed(0)}%</span>
            `;
            
            container.appendChild(bar);
        });
    }

    enableControls(enabled) {
        this.elements.playBtn.disabled = !enabled;
        this.elements.exportBtn.disabled = !enabled;
        this.updateControlButtons();
    }

    updateControlButtons() {
        this.elements.playBtn.disabled = this.isPlaying || !this.audioFile;
        this.elements.pauseBtn.disabled = !this.isPlaying;
        this.elements.stopBtn.disabled = !this.isPlaying;
    }

    showError(message) {
        // Simple error display - could be enhanced with a modal or toast
        alert(`❌ Erreur: ${message}`);
    }

    // Utility methods
    getApplicationState() {
        return {
            isInitialized: this.isInitialized,
            isPlaying: this.isPlaying,
            hasAudioFile: !!this.audioFile,
            currentEmotion: this.emotionMapper?.getCurrentEmotion(),
            animationStats: this.animator?.getAnimationStats()
        };
    }

    // Development/debugging methods
    enableDebugMode() {
        window.stickmanApp = this;
        console.log('Debug mode enabled. Access app via window.stickmanApp');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎭 Starting Stickman Auto-Animator...');
    
    const app = new StickmanAutoAnimator();
    await app.init();
    
    // Enable debug mode in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        app.enableDebugMode();
    }
    
    console.log('🚀 Stickman Auto-Animator ready!');
});

// Export for potential external use
window.StickmanAutoAnimator = StickmanAutoAnimator;
