class EmotionMapper {
    constructor(whisperAnalyzer = null) {
        this.whisperAnalyzer = whisperAnalyzer;
        this.audioWeight = 0.6; // Poids pour l'analyse audio
        this.speechWeight = 0.4; // Poids pour l'analyse vocale/Whisper

        this.emotionThresholds = {
            energy: { low: 0.3, medium: 0.6, high: 0.8 },
            brightness: { low: 0.3, medium: 0.6, high: 0.8 },
            tempo: { slow: 80, medium: 120, fast: 160 },
            pitch: { low: 200, medium: 400, high: 800 },
            loudness: { quiet: 0.2, normal: 0.5, loud: 0.8 }
        };

        this.emotions = {
            neutral: {
                name: 'Neutre',
                emoji: '😐',
                color: '#95a5a6',
                expressions: {
                    eyebrows: 0, // -1 angry, 0 neutral, 1 surprised
                    eyes: 0, // -1 sad, 0 neutral, 1 happy
                    mouth: 0, // -1 sad, 0 neutral, 1 happy
                    headTilt: 0 // -15 to 15 degrees
                },
                bodyLanguage: {
                    armPosition: 'relaxed', // relaxed, up, crossed, gesturing
                    bodyPosture: 'straight', // straight, leaning, excited
                    legStance: 'normal' // normal, wide, dancing
                }
            },
            happy: {
                name: 'Joyeux',
                emoji: '😊',
                color: '#f1c40f',
                expressions: {
                    eyebrows: 0.5,
                    eyes: 1,
                    mouth: 1,
                    headTilt: 2
                },
                bodyLanguage: {
                    armPosition: 'up',
                    bodyPosture: 'excited',
                    legStance: 'dancing'
                }
            },
            excited: {
                name: 'Excité',
                emoji: '🤩',
                color: '#e74c3c',
                expressions: {
                    eyebrows: 1,
                    eyes: 1,
                    mouth: 1,
                    headTilt: 5
                },
                bodyLanguage: {
                    armPosition: 'gesturing',
                    bodyPosture: 'excited',
                    legStance: 'dancing'
                }
            },
            sad: {
                name: 'Triste',
                emoji: '😢',
                color: '#3498db',
                expressions: {
                    eyebrows: -0.5,
                    eyes: -1,
                    mouth: -1,
                    headTilt: -3
                },
                bodyLanguage: {
                    armPosition: 'relaxed',
                    bodyPosture: 'leaning',
                    legStance: 'normal'
                }
            },
            angry: {
                name: 'En colère',
                emoji: '😠',
                color: '#e74c3c',
                expressions: {
                    eyebrows: -1,
                    eyes: -0.5,
                    mouth: -0.5,
                    headTilt: 0
                },
                bodyLanguage: {
                    armPosition: 'crossed',
                    bodyPosture: 'straight',
                    legStance: 'wide'
                }
            },
            surprised: {
                name: 'Surpris',
                emoji: '😲',
                color: '#9b59b6',
                expressions: {
                    eyebrows: 1,
                    eyes: 0.8,
                    mouth: 0.5,
                    headTilt: 0
                },
                bodyLanguage: {
                    armPosition: 'gesturing',
                    bodyPosture: 'straight',
                    legStance: 'normal'
                }
            },
            calm: {
                name: 'Calme',
                emoji: '😌',
                color: '#2ecc71',
                expressions: {
                    eyebrows: 0,
                    eyes: 0.3,
                    mouth: 0.2,
                    headTilt: 0
                },
                bodyLanguage: {
                    armPosition: 'relaxed',
                    bodyPosture: 'straight',
                    legStance: 'normal'
                }
            },
            dancing: {
                name: 'Dansant',
                emoji: '💃',
                color: '#ff6b6b',
                expressions: {
                    eyebrows: 0.5,
                    eyes: 1,
                    mouth: 1,
                    headTilt: 8
                },
                bodyLanguage: {
                    armPosition: 'gesturing',
                    bodyPosture: 'excited',
                    legStance: 'dancing'
                }
            }
        };

        this.currentEmotion = 'neutral';
        this.emotionHistory = [];
        this.smoothingFactor = 0.3; // For emotion transitions
    }

    analyzeEmotion(audioFeatures, speechIntention = null) {
        const {
            rms,
            spectralCentroid,
            loudness,
            pitch,
            energy,
            brightness,
            tempo,
            harmonicity
        } = audioFeatures;

        // Normalize values
        const normalizedEnergy = Math.min(1, energy / 100);
        const normalizedBrightness = Math.min(1, brightness);
        const normalizedLoudness = Math.min(1, Math.abs(loudness) / 60);
        const normalizedPitch = Math.min(1, pitch / 1000);

        // Emotion scoring from audio
        const audioEmotionScores = {
            neutral: this.calculateNeutralScore(normalizedEnergy, normalizedBrightness, normalizedLoudness),
            happy: this.calculateHappyScore(normalizedEnergy, normalizedBrightness, normalizedLoudness, tempo),
            excited: this.calculateExcitedScore(normalizedEnergy, normalizedBrightness, normalizedLoudness, tempo),
            sad: this.calculateSadScore(normalizedEnergy, normalizedBrightness, normalizedLoudness, normalizedPitch),
            angry: this.calculateAngryScore(normalizedEnergy, normalizedBrightness, normalizedLoudness, harmonicity),
            surprised: this.calculateSurprisedScore(normalizedEnergy, normalizedBrightness, normalizedPitch),
            calm: this.calculateCalmScore(normalizedEnergy, normalizedBrightness, normalizedLoudness, harmonicity),
            dancing: this.calculateDancingScore(normalizedEnergy, tempo, normalizedLoudness)
        };

        // Combine with speech intention if available
        let finalScores = { ...audioEmotionScores };
        
        if (speechIntention && speechIntention.confidence > 0.3) {
            finalScores = this.combineAudioAndSpeech(audioEmotionScores, speechIntention);
        }

        // Find the dominant emotion
        const dominantEmotion = Object.keys(finalScores).reduce((a, b) => 
            finalScores[a] > finalScores[b] ? a : b
        );

        // Smooth emotion transitions
        this.updateEmotionHistory(dominantEmotion, finalScores[dominantEmotion]);
        
        return {
            emotion: dominantEmotion,
            confidence: finalScores[dominantEmotion],
            scores: finalScores,
            emotionData: this.emotions[dominantEmotion],
            speechIntention: speechIntention
        };
    }

    combineAudioAndSpeech(audioScores, speechIntention) {
        const combined = { ...audioScores };
        
        // Boost the emotion detected from speech
        if (speechIntention.emotion && combined[speechIntention.emotion] !== undefined) {
            const speechBoost = speechIntention.confidence * this.speechWeight;
            combined[speechIntention.emotion] = Math.min(1.0, 
                combined[speechIntention.emotion] * this.audioWeight + speechBoost
            );
            
            console.log(`🎤 Boosting ${speechIntention.emotion} from speech analysis (+${(speechBoost * 100).toFixed(1)}%)`);
        }
        
        return combined;
    }

    // Set the balance between audio and speech analysis
    setAnalysisWeights(audioWeight = 0.6, speechWeight = 0.4) {
        this.audioWeight = audioWeight;
        this.speechWeight = speechWeight;
        console.log(`Analysis weights updated: Audio ${audioWeight}, Speech ${speechWeight}`);
    }

    calculateNeutralScore(energy, brightness, loudness) {
        // Neutral when everything is moderate
        const energyScore = 1 - Math.abs(energy - 0.4);
        const brightnessScore = 1 - Math.abs(brightness - 0.5);
        const loudnessScore = 1 - Math.abs(loudness - 0.3);
        return (energyScore + brightnessScore + loudnessScore) / 3;
    }

    calculateHappyScore(energy, brightness, loudness, tempo) {
        // Happy: moderate to high energy, bright, moderate tempo
        const energyScore = energy > 0.4 ? energy : 0;
        const brightnessScore = brightness > 0.5 ? brightness : 0;
        const tempoScore = tempo > 100 && tempo < 140 ? 1 : 0.5;
        const loudnessScore = loudness > 0.3 ? loudness : 0;
        return (energyScore + brightnessScore + tempoScore + loudnessScore) / 4;
    }

    calculateExcitedScore(energy, brightness, loudness, tempo) {
        // Excited: high energy, very bright, fast tempo
        const energyScore = energy > 0.6 ? energy * 1.5 : 0;
        const brightnessScore = brightness > 0.7 ? brightness * 1.3 : 0;
        const tempoScore = tempo > 130 ? 1.2 : 0.3;
        const loudnessScore = loudness > 0.5 ? loudness * 1.2 : 0;
        return Math.min(1, (energyScore + brightnessScore + tempoScore + loudnessScore) / 4);
    }

    calculateSadScore(energy, brightness, loudness, pitch) {
        // Sad: low energy, low brightness, low pitch
        const energyScore = energy < 0.4 ? (1 - energy) : 0;
        const brightnessScore = brightness < 0.4 ? (1 - brightness) : 0;
        const pitchScore = pitch < 0.3 ? (1 - pitch) : 0;
        const loudnessScore = loudness < 0.4 ? (1 - loudness) : 0;
        return (energyScore + brightnessScore + pitchScore + loudnessScore) / 4;
    }

    calculateAngryScore(energy, brightness, loudness, harmonicity) {
        // Angry: high energy, moderate brightness, loud, low harmonicity (harsh)
        const energyScore = energy > 0.6 ? energy : 0;
        const loudnessScore = loudness > 0.6 ? loudness : 0;
        const harshScore = harmonicity < 0.5 ? (1 - harmonicity) : 0;
        const brightnessScore = brightness > 0.3 && brightness < 0.7 ? 1 : 0.5;
        return (energyScore + loudnessScore + harshScore + brightnessScore) / 4;
    }

    calculateSurprisedScore(energy, brightness, pitch) {
        // Surprised: sudden energy spike, high pitch, bright
        const energyScore = energy > 0.5 ? energy : 0;
        const pitchScore = pitch > 0.6 ? pitch : 0;
        const brightnessScore = brightness > 0.6 ? brightness : 0;
        return (energyScore + pitchScore + brightnessScore) / 3;
    }

    calculateCalmScore(energy, brightness, loudness, harmonicity) {
        // Calm: low to moderate energy, harmonious, quiet
        const energyScore = energy > 0.2 && energy < 0.5 ? 1 : 0.5;
        const loudnessScore = loudness < 0.4 ? (1 - loudness) : 0;
        const harmonyScore = harmonicity > 0.6 ? harmonicity : 0;
        const brightnessScore = brightness > 0.3 && brightness < 0.6 ? 1 : 0.5;
        return (energyScore + loudnessScore + harmonyScore + brightnessScore) / 4;
    }

    calculateDancingScore(energy, tempo, loudness) {
        // Dancing: rhythmic, high energy, good tempo
        const energyScore = energy > 0.5 ? energy : 0;
        const tempoScore = tempo > 120 && tempo < 180 ? 1 : 0.3;
        const loudnessScore = loudness > 0.4 ? loudness : 0;
        const rhythmScore = this.detectRhythm(tempo) ? 1 : 0.5;
        return (energyScore + tempoScore + loudnessScore + rhythmScore) / 4;
    }

    detectRhythm(tempo) {
        // Simple rhythm detection (mock implementation)
        return tempo > 100 && tempo < 200;
    }

    updateEmotionHistory(emotion, confidence) {
        this.emotionHistory.push({
            emotion,
            confidence,
            timestamp: Date.now()
        });

        // Keep only recent history (last 10 entries)
        if (this.emotionHistory.length > 10) {
            this.emotionHistory.shift();
        }

        // Smooth emotion transitions
        if (this.emotionHistory.length >= 3) {
            const recentEmotions = this.emotionHistory.slice(-3);
            const emotionCounts = {};
            
            recentEmotions.forEach(entry => {
                emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + entry.confidence;
            });

            const smoothedEmotion = Object.keys(emotionCounts).reduce((a, b) => 
                emotionCounts[a] > emotionCounts[b] ? a : b
            );

            this.currentEmotion = smoothedEmotion;
        } else {
            this.currentEmotion = emotion;
        }
    }

    getCurrentEmotion() {
        return this.currentEmotion;
    }

    getEmotionData(emotionName = null) {
        const emotion = emotionName || this.currentEmotion;
        return this.emotions[emotion] || this.emotions.neutral;
    }

    getAllEmotions() {
        return { ...this.emotions };
    }

    getEmotionHistory() {
        return [...this.emotionHistory];
    }

    // Utility method to interpolate between emotions for smooth transitions
    interpolateEmotions(fromEmotion, toEmotion, factor) {
        const from = this.emotions[fromEmotion];
        const to = this.emotions[toEmotion];
        
        if (!from || !to) return this.emotions.neutral;

        const interpolated = {
            name: `${from.name} → ${to.name}`,
            emoji: factor > 0.5 ? to.emoji : from.emoji,
            color: this.interpolateColor(from.color, to.color, factor),
            expressions: {
                eyebrows: from.expressions.eyebrows + (to.expressions.eyebrows - from.expressions.eyebrows) * factor,
                eyes: from.expressions.eyes + (to.expressions.eyes - from.expressions.eyes) * factor,
                mouth: from.expressions.mouth + (to.expressions.mouth - from.expressions.mouth) * factor,
                headTilt: from.expressions.headTilt + (to.expressions.headTilt - from.expressions.headTilt) * factor
            },
            bodyLanguage: factor > 0.5 ? to.bodyLanguage : from.bodyLanguage
        };

        return interpolated;
    }

    interpolateColor(color1, color2, factor) {
        // Simple color interpolation (hex colors)
        const c1 = parseInt(color1.slice(1), 16);
        const c2 = parseInt(color2.slice(1), 16);
        
        const r1 = (c1 >> 16) & 0xff;
        const g1 = (c1 >> 8) & 0xff;
        const b1 = c1 & 0xff;
        
        const r2 = (c2 >> 16) & 0xff;
        const g2 = (c2 >> 8) & 0xff;
        const b2 = c2 & 0xff;
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
}

// Export for use in other modules
window.EmotionMapper = EmotionMapper;
