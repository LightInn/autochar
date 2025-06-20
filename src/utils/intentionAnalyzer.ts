// Types pour l'analyse d'intention
export interface EmotionSegment {
  start: number;
  end: number;
  text: string;
  emotion: EmotionType;
  intensity: number; // 0-1
  confidence: number; // 0-1
  triggers: string[]; // Mots/patterns qui ont déclenché cette émotion
}

export type EmotionType = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'surprised' 
  | 'confused' 
  | 'excited' 
  | 'worried'
  | 'thinking'
  | 'disappointed';

// Configuration des patterns d'émotions
const EMOTION_PATTERNS = {
  happy: {
    keywords: ['haha', 'hihi', 'super', 'génial', 'parfait', 'excellent', 'bien', 'cool', 'top', 'youpi', 'yes', 'ouais'],
    patterns: [/\b(ha)+\b/i, /\b(hi)+\b/i, /\b(he)+\b/i],
    punctuation: ['!'],
    intensity: 0.7
  },
  excited: {
    keywords: ['wow', 'incroyable', 'fantastique', 'amazing', 'extraordinaire', 'ouf'],
    patterns: [/!{2,}/],
    punctuation: ['!!', '!!!'],
    intensity: 0.9
  },
  angry: {
    keywords: ['putain', 'merde', 'chiant', 'nul', 'con', 'bordel', 'damn', 'shit', 'fuck', 'enerve', 'énervé'],
    patterns: [/\b(grr)+\b/i, /\b(arg)+\b/i],
    punctuation: ['!'],
    intensity: 0.8
  },
  surprised: {
    keywords: ['quoi', 'what', 'vraiment', 'sérieux', 'oh', 'ah', 'ooh', 'waow', 'wow', 'hein'],
    patterns: [/\boh+\b/i, /\bah+\b/i, /\booh+\b/i],
    punctuation: ['?!', '!?', '?'],
    intensity: 0.7
  },
  confused: {
    keywords: ['comprends', 'comment', 'pourquoi', 'hein', 'euh', 'hmm', 'bah', 'alors'],
    patterns: [/\b(euh)+\b/i, /\b(hmm)+\b/i, /\b(heu)+\b/i],
    punctuation: ['?', '...'],
    intensity: 0.6
  },
  thinking: {
    keywords: ['voyons', 'réfléchir', 'penser', 'voir', 'donc', 'alors', 'bon'],
    patterns: [/\.{3,}/, /\b(hmm)+\b/i],
    punctuation: ['...'],
    intensity: 0.5
  },
  worried: {
    keywords: ['inquiet', 'peur', 'problème', 'attention', 'danger', 'risque'],
    patterns: [/\b(oh non)+\b/i],
    punctuation: [],
    intensity: 0.7
  },
  sad: {
    keywords: ['triste', 'dommage', 'malheureusement', 'hélas', 'snif', 'bah'],
    patterns: [/\b(snif)+\b/i, /\b(ouin)+\b/i],
    punctuation: [],
    intensity: 0.6
  },
  disappointed: {
    keywords: ['déçu', 'nul', 'pas terrible', 'bof', 'mouais', 'tant pis'],
    patterns: [],
    punctuation: [],
    intensity: 0.6
  }
};

// Analyse d'un segment de texte
function analyzeTextSegment(text: string): { emotion: EmotionType; intensity: number; confidence: number; triggers: string[] } {
  const lowerText = text.toLowerCase();
  const results: Array<{ emotion: EmotionType; score: number; triggers: string[] }> = [];

  // Test chaque émotion
  for (const [emotionKey, config] of Object.entries(EMOTION_PATTERNS)) {
    const emotion = emotionKey as EmotionType;
    let score = 0;
    const triggers: string[] = [];

    // Test des mots-clés
    for (const keyword of config.keywords) {
      if (lowerText.includes(keyword)) {
        score += 1;
        triggers.push(keyword);
      }
    }

    // Test des patterns regex
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        score += 1.5; // Les patterns valent plus
        triggers.push(`pattern:${pattern.source}`);
      }
    }

    // Test de la ponctuation
    for (const punct of config.punctuation) {
      if (text.includes(punct)) {
        score += 0.5;
        triggers.push(`punct:${punct}`);
      }
    }

    if (score > 0) {
      results.push({ emotion, score, triggers });
    }
  }

  // Si aucune émotion détectée, retourner neutral
  if (results.length === 0) {
    return { emotion: 'neutral', intensity: 0.3, confidence: 0.8, triggers: [] };
  }

  // Trier par score et prendre la meilleure
  results.sort((a, b) => b.score - a.score);
  const best = results[0];
  
  const emotionConfig = EMOTION_PATTERNS[best.emotion as keyof typeof EMOTION_PATTERNS];
  const intensity = Math.min(best.score * 0.3 + (emotionConfig?.intensity || 0.5), 1);
  const confidence = Math.min(best.score * 0.4, 1);

  return {
    emotion: best.emotion,
    intensity,
    confidence,
    triggers: best.triggers
  };
}

// Analyse complète d'une transcription
export function analyzeIntention(transcriptionSegments: Array<{ timestamps: { from: string; to: string }; text: string }>): EmotionSegment[] {
  return transcriptionSegments.map(segment => {
    const timeStart = parseTimeToSeconds(segment.timestamps.from);
    const timeEnd = parseTimeToSeconds(segment.timestamps.to);
    
    const analysis = analyzeTextSegment(segment.text);
    
    return {
      start: timeStart,
      end: timeEnd,
      text: segment.text.trim(),
      emotion: analysis.emotion,
      intensity: analysis.intensity,
      confidence: analysis.confidence,
      triggers: analysis.triggers
    };
  });
}

// Convertir le format de temps en secondes
function parseTimeToSeconds(timeString: string): number {
  // Format: "00:00:02,500" ou "00:02.500"
  const parts = timeString.replace(',', '.').split(':');
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    // MM:SS.mmm
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else {
    // SS.mmm
    return parseFloat(timeString) || 0;
  }
}

// Fonction utilitaire pour obtenir la couleur d'une émotion
export function getEmotionColor(emotion: EmotionType): string {
  const colors = {
    neutral: '#6B7280', // gray
    happy: '#10B981', // green
    excited: '#F59E0B', // amber
    sad: '#3B82F6', // blue
    angry: '#EF4444', // red
    surprised: '#8B5CF6', // violet
    confused: '#F97316', // orange
    thinking: '#06B6D4', // cyan
    worried: '#DC2626', // red-600
    disappointed: '#6366F1' // indigo
  };
  
  return colors[emotion] || colors.neutral;
}

// Fonction utilitaire pour obtenir l'emoji d'une émotion
export function getEmotionEmoji(emotion: EmotionType): string {
  const emojis = {
    neutral: '😐',
    happy: '😊',
    excited: '🤩',
    sad: '😢',
    angry: '😠',
    surprised: '😲',
    confused: '🤔',
    thinking: '🧠',
    worried: '😰',
    disappointed: '😔'
  };
  
  return emojis[emotion] || emojis.neutral;
}

// Export des types et fonctions utilitaires
export { EMOTION_PATTERNS };
