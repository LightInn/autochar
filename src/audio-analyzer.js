class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.bufferLength = null;
        this.isAnalyzing = false;
        this.features = {
            rms: 0,
            spectralCentroid: 0,
            zcr: 0,
            tempo: 0,
            loudness: 0,
            pitch: 0
        };
        this.emotionHistory = [];
        this.analysisCallbacks = [];
    }

    async initialize(audioElement) {
        try {
            // Wait for Meyda to be loaded
            if (typeof Meyda === 'undefined') {
                console.log('Waiting for Meyda to load...');
                await this.waitForMeyda();
            }
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.source = this.audioContext.createMediaElementSource(audioElement);
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = 2048;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Initialize Meyda for advanced audio features
            Meyda.audioContext = this.audioContext;
            Meyda.source = this.source;
            Meyda.bufferSize = 512;
            Meyda.hopSize = 256;
            Meyda.windowingFunction = 'hamming';
            
            console.log('Audio analyzer initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize audio analyzer:', error);
            return false;
        }
    }

    startAnalysis() {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        
        // Start Meyda analysis
        Meyda.start(['rms', 'spectralCentroid', 'zcr', 'loudness', 'chroma', 'mfcc']);
        
        this.analyzeLoop();
    }

    stopAnalysis() {
        this.isAnalyzing = false;
        if (Meyda) {
            Meyda.stop();
        }
    }

    analyzeLoop() {
        if (!this.isAnalyzing) return;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Get Meyda features
        const meydaFeatures = Meyda.get(['rms', 'spectralCentroid', 'zcr', 'loudness', 'chroma', 'mfcc']);
        
        if (meydaFeatures) {
            this.features = {
                rms: meydaFeatures.rms || 0,
                spectralCentroid: meydaFeatures.spectralCentroid || 0,
                zcr: meydaFeatures.zcr || 0,
                loudness: meydaFeatures.loudness || 0,
                pitch: this.estimatePitch(),
                tempo: this.estimateTempo(),
                energy: this.calculateEnergy(),
                brightness: this.calculateBrightness(),
                harmonicity: this.calculateHarmonicity()
            };
            
            // Notify callbacks
            this.analysisCallbacks.forEach(callback => {
                callback(this.features, this.dataArray);
            });
        }
        
        requestAnimationFrame(() => this.analyzeLoop());
    }

    estimatePitch() {
        // Simple pitch estimation using autocorrelation
        const timeData = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(timeData);
        
        const correlations = new Array(timeData.length / 2);
        for (let i = 0; i < correlations.length; i++) {
            let correlation = 0;
            for (let j = 0; j < timeData.length - i; j++) {
                correlation += timeData[j] * timeData[j + i];
            }
            correlations[i] = correlation;
        }
        
        // Find the first peak after the center
        let maxCorrelation = 0;
        let bestOffset = 0;
        for (let i = 20; i < correlations.length; i++) {
            if (correlations[i] > maxCorrelation) {
                maxCorrelation = correlations[i];
                bestOffset = i;
            }
        }
        
        return bestOffset > 0 ? this.audioContext.sampleRate / bestOffset : 0;
    }

    estimateTempo() {
        // Simple tempo estimation based on energy peaks
        const energy = this.calculateEnergy();
        const threshold = energy * 0.7;
        
        // This is a simplified tempo detection
        // In a real implementation, you'd use more sophisticated algorithms
        return energy > threshold ? 120 : 80; // Mock tempo
    }

    calculateEnergy() {
        let energy = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            energy += this.dataArray[i] * this.dataArray[i];
        }
        return Math.sqrt(energy / this.dataArray.length);
    }

    calculateBrightness() {
        // Spectral centroid normalized
        return Math.min(1, this.features.spectralCentroid / 4000);
    }

    calculateHarmonicity() {
        // Simple harmonicity measure based on spectral regularity
        let harmonicity = 0;
        const step = Math.floor(this.dataArray.length / 10);
        
        for (let i = step; i < this.dataArray.length - step; i += step) {
            const prev = this.dataArray[i - step];
            const curr = this.dataArray[i];
            const next = this.dataArray[i + step];
            
            // Measure how smooth the spectrum is
            const smoothness = 1 - Math.abs(prev + next - 2 * curr) / 255;
            harmonicity += smoothness;
        }
        
        return harmonicity / 9; // Normalize
    }

    addAnalysisCallback(callback) {
        this.analysisCallbacks.push(callback);
    }

    removeAnalysisCallback(callback) {
        const index = this.analysisCallbacks.indexOf(callback);
        if (index > -1) {
            this.analysisCallbacks.splice(index, 1);
        }
    }

    getFrequencyData() {
        return this.dataArray;
    }

    getCurrentFeatures() {
        return { ...this.features };
    }

    // Utility method to get dominant frequency
    getDominantFrequency() {
        let maxValue = 0;
        let maxIndex = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            if (this.dataArray[i] > maxValue) {
                maxValue = this.dataArray[i];
                maxIndex = i;
            }
        }
        
        return maxIndex * this.audioContext.sampleRate / (2 * this.dataArray.length);
    }

    // Get overall volume level
    getVolumeLevel() {
        return this.features.rms * 100;
    }

    // Wait for Meyda library to load
    waitForMeyda(maxWait = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkMeyda = () => {
                if (typeof Meyda !== 'undefined') {
                    resolve();
                } else if (Date.now() - startTime > maxWait) {
                    reject(new Error('Meyda library failed to load within timeout'));
                } else {
                    setTimeout(checkMeyda, 100);
                }
            };
            checkMeyda();
        });
    }
}

// Export for use in other modules
window.AudioAnalyzer = AudioAnalyzer;
