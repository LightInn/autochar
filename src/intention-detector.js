class IntentionDetector {
    constructor() {
        this.frenchKeywords = this.initializeFrenchKeywords();
        this.emotionMappings = this.initializeEmotionMappings();
        this.contextAnalyzer = new ContextAnalyzer();
        this.temporalMapper = new TemporalMapper();
        this.intentionHistory = [];
        this.confidence_threshold = 0.3;
        this.temporal_window = 2.0; // seconds
        
        console.log('IntentionDetector initialized with French NLP');
    }

    initializeFrenchKeywords() {
        return {
            // Émotions positives
            joie: {
                primary: ['content', 'heureux', 'joie', 'bonheur', 'ravi', 'satisfait'],
                secondary: ['génial', 'super', 'fantastique', 'merveilleux', 'parfait', 'excellent'],
                expressions: ['sourire', 'rire', 'rayonner', 'jubiler', 'exulter'],
                intensity_high: ['extase', 'euphorie', 'béatitude', 'ravissement'],
                weight: 1.0
            },
            
            excitation: {
                primary: ['excité', 'excitation', 'dynamique', 'énergique', 'vibrant'],
                secondary: ['incroyable', 'extraordinaire', 'impressionnant', 'stupéfiant'],
                expressions: ['wow', 'ouah', 'waou', 'sensationnel', 'électrisant'],
                intensity_high: ['palpitant', 'éblouissant', 'saisissant', 'foudroyant'],
                weight: 1.2
            },
            
            // Émotions négatives
            tristesse: {
                primary: ['triste', 'tristesse', 'malheureux', 'déprimé', 'mélancolie'],
                secondary: ['chagrin', 'peine', 'désolé', 'déçu', 'abattu', 'morose'],
                expressions: ['pleurer', 'larmes', 'sangloter', 'gémir'],
                intensity_high: ['désespoir', 'accablement', 'détresse', 'affliction'],
                weight: 0.8
            },
            
            colère: {
                primary: ['colère', 'énervé', 'furieux', 'irrité', 'agacé', 'fâché'],
                secondary: ['rage', 'exaspéré', 'contrarié', 'mécontent', 'indigné'],
                expressions: ['crier', 'hurler', 'exploser', 'bouillir', 'fulminer'],
                intensity_high: ['furibond', 'courroucé', 'outré', 'hors de soi'],
                weight: 1.1
            },
            
            surprise: {
                primary: ['surpris', 'surprise', 'étonnant', 'inattendu', 'choquant'],
                secondary: ['stupéfait', 'ébahi', 'abasourdi', 'sidéré', 'bouche bée'],
                expressions: ['oh', 'ah', 'tiens', 'vraiment', 'pas possible'],
                intensity_high: ['stupéfaction', 'ébahissement', 'saisissement'],
                weight: 0.9
            },
            
            // États spéciaux
            calme: {
                primary: ['calme', 'tranquille', 'paisible', 'serein', 'relaxé'],
                secondary: ['détendu', 'zen', 'apaisé', 'reposé', 'silencieux'],
                expressions: ['respirer', 'méditer', 'soupirer', 'se détendre'],
                intensity_high: ['sérénité', 'quiétude', 'placidité', 'béatitude'],
                weight: 0.7
            },
            
            mouvement: {
                primary: ['danser', 'danse', 'bouger', 'mouvement', 'gesticuler'],
                secondary: ['sauter', 'bondir', 'virevolter', 'tourner', 'valser'],
                expressions: ['groove', 'swing', 'rock', 'tempo', 'rythme'],
                intensity_high: ['chorégraphie', 'acrobatie', 'pirouette', 'cabriole'],
                weight: 1.3
            },
            
            // Actions physiques
            actions: {
                primary: ['courir', 'marcher', 'sauter', 'lever', 'baisser'],
                secondary: ['tourner', 'arrêter', 'commencer', 'finir', 'accélérer'],
                expressions: ['vite', 'lent', 'fort', 'doucement', 'rapidement'],
                intensity_high: ['sprint', 'galoper', 'foncer', 'précipiter'],
                weight: 0.6
            }
        };
    }

    initializeEmotionMappings() {
        return {
            joie: { emotion: 'happy', confidence_boost: 1.2 },
            excitation: { emotion: 'excited', confidence_boost: 1.5 },
            tristesse: { emotion: 'sad', confidence_boost: 1.0 },
            colère: { emotion: 'angry', confidence_boost: 1.3 },
            surprise: { emotion: 'surprised', confidence_boost: 1.1 },
            calme: { emotion: 'calm', confidence_boost: 0.8 },
            mouvement: { emotion: 'dancing', confidence_boost: 1.4 },
            actions: { emotion: 'gesturing', confidence_boost: 0.7 }
        };
    }

    analyzeTranscriptionSegments(segments) {
        const intentions = [];
        
        for (const segment of segments) {
            const intention = this.analyzeSegment(segment);
            if (intention.confidence > this.confidence_threshold) {
                intentions.push({
                    ...intention,
                    start_time: segment.start,
                    end_time: segment.end,
                    original_text: segment.text
                });
            }
        }
        
        // Apply temporal mapping
        const mappedIntentions = this.temporalMapper.mapIntentions(intentions);
        
        // Store in history
        this.intentionHistory.push(...mappedIntentions);
        
        return mappedIntentions;
    }

    analyzeSegment(segment) {
        const text = segment.text.toLowerCase();
        const words = text.split(/\s+/);
        
        // Score each emotion category
        const scores = {};
        
        for (const [category, keywords] of Object.entries(this.frenchKeywords)) {
            scores[category] = this.calculateCategoryScore(words, text, keywords);
        }
        
        // Find best match
        const bestCategory = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        const bestScore = scores[bestCategory];
        
        if (bestScore < 0.1) {
            return {
                emotion: 'neutral',
                confidence: 0.5,
                category: 'neutral',
                keywords_found: [],
                context_factors: {}
            };
        }
        
        // Apply context analysis
        const contextFactors = this.contextAnalyzer.analyze(text, words);
        const adjustedScore = this.applyContextFactors(bestScore, contextFactors);
        
        // Get emotion mapping
        const mapping = this.emotionMappings[bestCategory];
        const finalConfidence = Math.min(1.0, adjustedScore * mapping.confidence_boost);
        
        return {
            emotion: mapping.emotion,
            confidence: finalConfidence,
            category: bestCategory,
            keywords_found: this.getMatchedKeywords(words, text, this.frenchKeywords[bestCategory]),
            context_factors: contextFactors,
            raw_scores: scores
        };
    }

    calculateCategoryScore(words, text, keywords) {
        let score = 0;
        let totalWeight = 0;
        const foundKeywords = [];
        
        // Check each keyword category
        const categories = ['primary', 'secondary', 'expressions', 'intensity_high'];
        const weights = { primary: 1.0, secondary: 0.8, expressions: 0.9, intensity_high: 1.5 };
        
        for (const category of categories) {
            if (!keywords[category]) continue;
            
            for (const keyword of keywords[category]) {
                const weight = weights[category];
                
                // Exact word match
                if (words.includes(keyword)) {
                    score += weight * 1.0;
                    foundKeywords.push({ keyword, type: 'exact', weight });
                }
                
                // Partial match in text
                else if (text.includes(keyword)) {
                    score += weight * 0.7;
                    foundKeywords.push({ keyword, type: 'partial', weight: weight * 0.7 });
                }
                
                // Fuzzy match (simple edit distance)
                else {
                    const fuzzyScore = this.calculateFuzzyMatch(keyword, words);
                    if (fuzzyScore > 0.8) {
                        score += weight * fuzzyScore * 0.5;
                        foundKeywords.push({ keyword, type: 'fuzzy', weight: weight * fuzzyScore * 0.5 });
                    }
                }
                
                totalWeight += weight;
            }
        }
        
        // Apply category weight
        score *= keywords.weight || 1.0;
        
        // Normalize by total possible weight
        return totalWeight > 0 ? Math.min(1.0, score / totalWeight) : 0;
    }

    calculateFuzzyMatch(keyword, words) {
        let maxScore = 0;
        
        for (const word of words) {
            const score = this.levenshteinSimilarity(keyword, word);
            maxScore = Math.max(maxScore, score);
        }
        
        return maxScore;
    }

    levenshteinSimilarity(str1, str2) {
        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength > 0 ? 1 - (distance / maxLength) : 1;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    getMatchedKeywords(words, text, keywords) {
        const matched = [];
        
        for (const [category, keywordList] of Object.entries(keywords)) {
            if (Array.isArray(keywordList)) {
                for (const keyword of keywordList) {
                    if (words.includes(keyword) || text.includes(keyword)) {
                        matched.push({ keyword, category });
                    }
                }
            }
        }
        
        return matched;
    }

    applyContextFactors(baseScore, contextFactors) {
        let adjustedScore = baseScore;
        
        // Intensity modifiers
        if (contextFactors.intensity_modifier) {
            adjustedScore *= contextFactors.intensity_modifier;
        }
        
        // Negation
        if (contextFactors.is_negated) {
            adjustedScore *= 0.3; // Greatly reduce confidence for negated emotions
        }
        
        // Question vs statement
        if (contextFactors.is_question) {
            adjustedScore *= 0.8; // Slightly reduce confidence for questions
        }
        
        // Exclamation boost
        if (contextFactors.exclamation_count > 0) {
            adjustedScore *= (1 + contextFactors.exclamation_count * 0.2);
        }
        
        return Math.min(1.0, adjustedScore);
    }

    // Configuration
    setConfidenceThreshold(threshold) {
        this.confidence_threshold = Math.max(0.1, Math.min(1.0, threshold));
    }

    setTemporalWindow(seconds) {
        this.temporal_window = Math.max(0.5, Math.min(10.0, seconds));
        this.temporalMapper.setWindow(seconds);
    }

    // Access methods
    getIntentionHistory() {
        return [...this.intentionHistory];
    }

    getKeywords() {
        return this.frenchKeywords;
    }

    clearHistory() {
        this.intentionHistory = [];
    }
}

// Context Analyzer for French text
class ContextAnalyzer {
    constructor() {
        this.intensifiers = [
            'très', 'vraiment', 'extrêmement', 'super', 'hyper', 'ultra', 
            'méga', 'complètement', 'totalement', 'absolument', 'parfaitement'
        ];
        
        this.diminishers = [
            'un peu', 'légèrement', 'plutôt', 'assez', 'quelque peu', 
            'vaguement', 'faiblement', 'modérément'
        ];
        
        this.negations = [
            'ne pas', 'pas', 'jamais', 'rien', 'personne', 'aucun', 
            'nulle', 'nullement', 'point', 'guère'
        ];
    }

    analyze(text, words) {
        const factors = {
            intensity_modifier: 1.0,
            is_negated: false,
            is_question: false,
            exclamation_count: 0,
            emphasis_words: []
        };
        
        // Check for intensifiers
        for (const intensifier of this.intensifiers) {
            if (text.includes(intensifier)) {
                factors.intensity_modifier *= 1.3;
                factors.emphasis_words.push(intensifier);
            }
        }
        
        // Check for diminishers
        for (const diminisher of this.diminishers) {
            if (text.includes(diminisher)) {
                factors.intensity_modifier *= 0.7;
                factors.emphasis_words.push(diminisher);
            }
        }
        
        // Check for negations
        for (const negation of this.negations) {
            if (text.includes(negation)) {
                factors.is_negated = true;
                break;
            }
        }
        
        // Check for questions
        factors.is_question = text.includes('?');
        
        // Count exclamations
        factors.exclamation_count = (text.match(/!/g) || []).length;
        
        return factors;
    }
}

// Temporal Mapper for timeline integration
class TemporalMapper {
    constructor() {
        this.window_size = 2.0; // seconds
        this.overlap_threshold = 0.5; // 50% overlap
    }

    mapIntentions(intentions) {
        // Sort by start time
        intentions.sort((a, b) => a.start_time - b.start_time);
        
        // Merge overlapping intentions
        const merged = this.mergeOverlapping(intentions);
        
        // Create temporal keyframes
        const keyframes = this.createKeyframes(merged);
        
        return keyframes;
    }

    mergeOverlapping(intentions) {
        if (intentions.length <= 1) return intentions;
        
        const merged = [];
        let current = { ...intentions[0] };
        
        for (let i = 1; i < intentions.length; i++) {
            const next = intentions[i];
            
            // Check for overlap
            const overlap = this.calculateOverlap(current, next);
            
            if (overlap > this.overlap_threshold) {
                // Merge intentions
                current = this.mergeTwo(current, next);
            } else {
                merged.push(current);
                current = { ...next };
            }
        }
        
        merged.push(current);
        return merged;
    }

    calculateOverlap(intent1, intent2) {
        const start = Math.max(intent1.start_time, intent2.start_time);
        const end = Math.min(intent1.end_time, intent2.end_time);
        
        if (start >= end) return 0;
        
        const overlapDuration = end - start;
        const totalDuration = Math.max(intent1.end_time, intent2.end_time) - 
                             Math.min(intent1.start_time, intent2.start_time);
        
        return overlapDuration / totalDuration;
    }

    mergeTwo(intent1, intent2) {
        // Choose the intention with higher confidence
        const primary = intent1.confidence >= intent2.confidence ? intent1 : intent2;
        const secondary = intent1.confidence >= intent2.confidence ? intent2 : intent1;
        
        return {
            ...primary,
            start_time: Math.min(intent1.start_time, intent2.start_time),
            end_time: Math.max(intent1.end_time, intent2.end_time),
            confidence: (intent1.confidence + intent2.confidence) / 2,
            merged_from: [intent1, intent2],
            original_text: `${intent1.original_text} ${intent2.original_text}`
        };
    }

    createKeyframes(intentions) {
        return intentions.map((intention, index) => ({
            id: `intention_${index}_${Date.now()}`,
            type: 'intention',
            start_time: intention.start_time,
            end_time: intention.end_time,
            duration: intention.end_time - intention.start_time,
            emotion: intention.emotion,
            confidence: intention.confidence,
            data: intention,
            editable: true
        }));
    }

    setWindow(seconds) {
        this.window_size = seconds;
    }
}

// Export for use in other modules
window.IntentionDetector = IntentionDetector;
window.ContextAnalyzer = ContextAnalyzer;
window.TemporalMapper = TemporalMapper;
