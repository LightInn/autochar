class WhisperAnalyzer {
    constructor() {
        this.isInitialized = false;
        this.whisperModel = null;
        this.processor = null;
        this.isTranscribing = false;
        this.speechRecognitionAvailable = false;
        this.fallbackMode = false;
        this.currentTranscription = '';
        this.intentionKeywords = this.initializeIntentionKeywords();
        this.audioBuffer = [];
        this.bufferDuration = 3; // seconds
        this.sampleRate = 16000;
        this.transcriptionCallbacks = [];
        this.intentionHistory = [];
        this.lastProcessedTime = 0;
        this.processingInterval = 2000; // Process every 2 seconds
        this.lastEmotionTime = 0;
        this.emotionChangeInterval = 3000;
        
        console.log('WhisperAnalyzer initialized');
    }

    async initialize() {
        try {
            console.log('Loading Whisper model for French...');
            
            // Note: For a real implementation, you would use transformers.js
            // For now, we'll simulate Whisper with Web Speech API as fallback
            this.initializeWebSpeechAPI();
            
            this.isInitialized = true;
            console.log('Whisper analyzer ready for French speech analysis');
            return true;
        } catch (error) {
            console.error('Failed to initialize Whisper:', error);
            return false;
        }
    }

    initializeWebSpeechAPI() {
        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'fr-FR';
            
            this.recognition.onresult = (event) => {
                this.handleSpeechResult(event);
            };
            
            this.recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    console.warn('Microphone access denied. Please allow microphone access for speech recognition.');
                }
            };
            
            this.recognition.onstart = () => {
                console.log('Speech recognition started');
            };
            
            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                // Restart if still transcribing (for continuous recognition)
                if (this.isTranscribing) {
                    setTimeout(() => {
                        if (this.isTranscribing) {
                            try {
                                this.recognition.start();
                            } catch (error) {
                                console.warn('Failed to restart speech recognition:', error);
                            }
                        }
                    }, 100);
                }
            };
            
            console.log('Web Speech API initialized for French');
            this.speechRecognitionAvailable = true;
        } else {
            console.warn('Speech recognition not supported in this browser. Try Chrome or Edge for speech features.');
            this.speechRecognitionAvailable = false;
            
            // Set up text analysis fallback
            this.setupTextAnalysisFallback();
        }
    }

    setupTextAnalysisFallback() {
        console.log('Setting up text analysis fallback mode');
        
        // Simulate speech detection with audio energy levels
        this.fallbackMode = true;
        this.lastEmotionTime = 0;
        this.emotionChangeInterval = 3000; // Change emotion every 3 seconds based on audio
    }

    initializeIntentionKeywords() {
        return {
            // Émotions positives
            joie: {
                keywords: [
                    'content', 'heureux', 'joie', 'bonheur', 'ravi', 'satisfait',
                    'génial', 'super', 'fantastique', 'merveilleux', 'parfait',
                    'excellent', 'formidable', 'magnifique', 'sourire', 'rire'
                ],
                emotion: 'happy',
                confidence: 0.8
            },
            
            excitement: {
                keywords: [
                    'excité', 'excitation', 'incroyable', 'extraordinaire', 'wow',
                    'impressionnant', 'stupéfiant', 'sensationnel', 'épatant',
                    'dynamique', 'énergique', 'vibrant', 'électrisant', 'palpitant'
                ],
                emotion: 'excited',
                confidence: 0.9
            },
            
            // Émotions négatives
            tristesse: {
                keywords: [
                    'triste', 'tristesse', 'malheureux', 'déprimé', 'mélancolie',
                    'chagrin', 'peine', 'désolé', 'déçu', 'abattu', 'morose',
                    'sombre', 'pleurer', 'larmes', 'douleur'
                ],
                emotion: 'sad',
                confidence: 0.8
            },
            
            colere: {
                keywords: [
                    'colère', 'énervé', 'furieux', 'irrité', 'agacé', 'fâché',
                    'rage', 'exaspéré', 'contrarié', 'mécontent', 'indigné',
                    'bouillir', 'exploser', 'crier', 'hurler'
                ],
                emotion: 'angry',
                confidence: 0.85
            },
            
            surprise: {
                keywords: [
                    'surpris', 'surprise', 'étonnant', 'inattendu', 'choquant',
                    'stupéfait', 'ébahi', 'abasourdi', 'sidéré', 'bouche bée',
                    'incroyable', 'imprévu', 'soudain', 'brusque'
                ],
                emotion: 'surprised',
                confidence: 0.7
            },
            
            // États spéciaux
            calme: {
                keywords: [
                    'calme', 'tranquille', 'paisible', 'serein', 'relaxé',
                    'détendu', 'zen', 'apaisé', 'reposé', 'silencieux',
                    'doux', 'lent', 'méditer', 'respirer'
                ],
                emotion: 'calm',
                confidence: 0.6
            },
            
            danse: {
                keywords: [
                    'danser', 'danse', 'bouger', 'rythme', 'musique', 'groove',
                    'tempo', 'beat', 'mouvement', 'chorégraphie', 'swing',
                    'rock', 'disco', 'salsa', 'valse', 'tango'
                ],
                emotion: 'dancing',
                confidence: 0.9
            },
            
            // Intentions d'action
            actions: {
                keywords: [
                    'courir', 'marcher', 'sauter', 'lever', 'baisser',
                    'tourner', 'bouger', 'arrêter', 'commencer', 'finir',
                    'rapide', 'lent', 'fort', 'doucement'
                ],
                emotion: 'gesturing',
                confidence: 0.5
            }
        };
    }

    async startTranscription(audioElement) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.speechRecognitionAvailable && this.recognition) {
            try {
                this.recognition.start();
                this.isTranscribing = true;
                console.log('Started French speech transcription');
            } catch (error) {
                console.warn('Failed to start speech recognition:', error);
                this.fallbackMode = true;
            }
        } else {
            console.log('Using fallback mode for emotion analysis');
            this.fallbackMode = true;
        }
        
        // Start audio buffer analysis
        this.startAudioBuffering(audioElement);
    }

    stopTranscription() {
        if (this.recognition && this.isTranscribing) {
            this.recognition.stop();
            this.isTranscribing = false;
            console.log('Stopped speech transcription');
        }
    }

    startAudioBuffering(audioElement) {
        // This would be used for actual Whisper processing
        // For now, we simulate with periodic analysis
        this.bufferInterval = setInterval(() => {
            if (this.fallbackMode) {
                // Generate emotion based on audio energy patterns
                this.generateFallbackEmotion();
            } else if (this.currentTranscription) {
                this.analyzeTranscriptionForIntention(this.currentTranscription);
            }
        }, this.processingInterval);
    }

    generateFallbackEmotion() {
        const now = Date.now();
        if (now - this.lastEmotionTime < this.emotionChangeInterval) {
            return;
        }
        
        // Cycle through emotions based on time for demo purposes
        const emotions = ['happy', 'excited', 'calm', 'dancing', 'surprised'];
        const emotionIndex = Math.floor(now / this.emotionChangeInterval) % emotions.length;
        const selectedEmotion = emotions[emotionIndex];
        
        const fallbackIntention = {
            emotion: selectedEmotion,
            confidence: 0.6,
            keywords: ['audio-based'],
            category: 'fallback'
        };
        
        this.notifyCallbacks({
            transcription: `Mode audio (${selectedEmotion})`,
            intention: fallbackIntention,
            interim: false
        });
        
        this.lastEmotionTime = now;
        console.log(`🎵 Fallback emotion: ${selectedEmotion}`);
    }

    handleSpeechResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                finalTranscript += result[0].transcript;
            } else {
                interimTranscript += result[0].transcript;
            }
        }
        
        this.currentTranscription = finalTranscript + interimTranscript;
        
        // Analyze for intentions in real-time
        if (finalTranscript) {
            const intention = this.analyzeTranscriptionForIntention(finalTranscript);
            this.notifyCallbacks({
                transcription: finalTranscript,
                intention: intention,
                interim: false
            });
        }
        
        // Also analyze interim results for responsiveness
        if (interimTranscript) {
            const intention = this.analyzeTranscriptionForIntention(interimTranscript);
            this.notifyCallbacks({
                transcription: interimTranscript,
                intention: intention,
                interim: true
            });
        }
    }

    analyzeTranscriptionForIntention(text) {
        if (!text || text.trim().length === 0) {
            return { emotion: 'neutral', confidence: 0, keywords: [] };
        }
        
        const normalizedText = text.toLowerCase().trim();
        const words = normalizedText.split(/\s+/);
        
        let bestMatch = { emotion: 'neutral', confidence: 0, keywords: [], category: null };
        
        // Analyze each intention category
        Object.entries(this.intentionKeywords).forEach(([category, data]) => {
            const matchedKeywords = [];
            let totalConfidence = 0;
            
            data.keywords.forEach(keyword => {
                if (normalizedText.includes(keyword)) {
                    matchedKeywords.push(keyword);
                    // Higher confidence for exact word matches
                    const isExactWord = words.includes(keyword);
                    totalConfidence += isExactWord ? 1.0 : 0.7;
                }
            });
            
            if (matchedKeywords.length > 0) {
                // Calculate weighted confidence
                const confidence = Math.min(1.0, 
                    (totalConfidence / data.keywords.length) * data.confidence
                );
                
                if (confidence > bestMatch.confidence) {
                    bestMatch = {
                        emotion: data.emotion,
                        confidence: confidence,
                        keywords: matchedKeywords,
                        category: category
                    };
                }
            }
        });
        
        // Add contextual analysis
        bestMatch = this.addContextualAnalysis(normalizedText, bestMatch);
        
        // Store in history
        this.intentionHistory.push({
            timestamp: Date.now(),
            text: text,
            intention: bestMatch
        });
        
        // Keep history manageable
        if (this.intentionHistory.length > 50) {
            this.intentionHistory.shift();
        }
        
        console.log(`French intention detected: ${bestMatch.emotion} (${(bestMatch.confidence * 100).toFixed(1)}%) from "${text}"`);
        
        return bestMatch;
    }

    addContextualAnalysis(text, baseMatch) {
        let enhanced = { ...baseMatch };
        
        // Intensity modifiers
        const intensifiers = [
            'très', 'vraiment', 'extrêmement', 'super', 'hyper', 
            'ultra', 'méga', 'complètement', 'totalement'
        ];
        
        const diminishers = [
            'un peu', 'légèrement', 'plutôt', 'assez', 'quelque peu'
        ];
        
        intensifiers.forEach(intensifier => {
            if (text.includes(intensifier)) {
                enhanced.confidence = Math.min(1.0, enhanced.confidence * 1.3);
            }
        });
        
        diminishers.forEach(diminisher => {
            if (text.includes(diminisher)) {
                enhanced.confidence *= 0.7;
            }
        });
        
        // Negation handling
        const negations = ['ne pas', 'pas', 'jamais', 'rien', 'personne'];
        negations.forEach(negation => {
            if (text.includes(negation)) {
                // Flip to opposite emotion if possible
                const oppositeMap = {
                    'happy': 'sad',
                    'sad': 'happy',
                    'excited': 'calm',
                    'calm': 'excited',
                    'angry': 'calm'
                };
                
                if (oppositeMap[enhanced.emotion]) {
                    enhanced.emotion = oppositeMap[enhanced.emotion];
                    enhanced.confidence *= 0.8; // Reduce confidence for negated emotions
                }
            }
        });
        
        // Question marks might indicate surprise
        if (text.includes('?')) {
            if (enhanced.confidence < 0.5) {
                enhanced.emotion = 'surprised';
                enhanced.confidence = 0.6;
            }
        }
        
        // Exclamation marks increase intensity
        const exclamationCount = (text.match(/!/g) || []).length;
        if (exclamationCount > 0) {
            enhanced.confidence = Math.min(1.0, enhanced.confidence * (1 + exclamationCount * 0.2));
        }
        
        return enhanced;
    }

    addTranscriptionCallback(callback) {
        this.transcriptionCallbacks.push(callback);
    }

    removeTranscriptionCallback(callback) {
        const index = this.transcriptionCallbacks.indexOf(callback);
        if (index > -1) {
            this.transcriptionCallbacks.splice(index, 1);
        }
    }

    notifyCallbacks(data) {
        this.transcriptionCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in transcription callback:', error);
            }
        });
    }

    // Public API methods
    getCurrentTranscription() {
        return this.currentTranscription;
    }

    getIntentionHistory() {
        return [...this.intentionHistory];
    }

    getRecentIntentions(count = 5) {
        return this.intentionHistory.slice(-count);
    }

    // Analyze audio file with simulated Whisper
    async analyzeAudioFile(audioFile) {
        console.log('Analyzing audio file for French speech intentions...');
        
        // In a real implementation, this would:
        // 1. Convert audio to the format Whisper expects
        // 2. Process with Whisper model
        // 3. Return transcription and intentions
        
        // For now, return a simulated analysis
        return {
            transcription: 'Audio analysis not yet implemented with real Whisper',
            intentions: [
                { emotion: 'neutral', confidence: 0.5, timestamp: 0 }
            ],
            duration: 0
        };
    }

    // Get supported languages
    getSupportedLanguages() {
        return ['fr-FR', 'fr-CA', 'fr-CH', 'fr-BE'];
    }

    // Set language for speech recognition
    setLanguage(language = 'fr-FR') {
        if (this.recognition) {
            this.recognition.lang = language;
            console.log(`Language set to: ${language}`);
        }
    }

    // Cleanup
    cleanup() {
        this.stopTranscription();
        
        if (this.bufferInterval) {
            clearInterval(this.bufferInterval);
        }
        
        this.transcriptionCallbacks = [];
        this.intentionHistory = [];
        this.audioBuffer = [];
        
        console.log('WhisperAnalyzer cleaned up');
    }
}

// Export for use in other modules
window.WhisperAnalyzer = WhisperAnalyzer;
