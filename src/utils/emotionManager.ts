// Gestionnaire d'émotions dynamiques
export interface CustomEmotion {
  id: string;
  name: string;
  displayName: string;
  color: string;
  description: string;
  assets: EmotionAssets;
  animationSettings: AnimationSettings;
  created: Date;
  modified: Date;
}

export interface EmotionAssets {
  head?: string; // URL ou base64 de l'image
  face?: string;
  body?: string;
  leftArm?: string;
  rightArm?: string;
  leftLeg?: string;
  rightLeg?: string;
  background?: string;
  // Assets additionnels
  accessories?: string[];
  effects?: string[];
}

export interface AnimationSettings {
  // Intensité de l'animation liée au son
  audioReactivity: number; // 0-1
  // Parties du corps qui bougent avec le son
  reactiveElements: {
    head: boolean;
    face: boolean;
    body: boolean;
    arms: boolean;
    legs: boolean;
  };
  // Paramètres de mouvement
  movement: {
    frequency: number; // Hz
    amplitude: number; // pixels
    phase: number; // déphasage
  };
  // Transitions
  transitionDuration: number; // ms
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
}

// Émotions par défaut
export const DEFAULT_EMOTIONS: CustomEmotion[] = [
  {
    id: 'neutral',
    name: 'neutral',
    displayName: 'Neutre',
    color: '#6B7280',
    description: 'État neutre, calme',
    assets: {},
    animationSettings: {
      audioReactivity: 0.2,
      reactiveElements: { head: true, face: false, body: false, arms: false, legs: false },
      movement: { frequency: 1, amplitude: 2, phase: 0 },
      transitionDuration: 500,
      easing: 'ease-out'
    },
    created: new Date(),
    modified: new Date()
  },
  {
    id: 'happy',
    name: 'happy',
    displayName: 'Joyeux',
    color: '#10B981',
    description: 'Joie, bonheur, excitation positive',
    assets: {},
    animationSettings: {
      audioReactivity: 0.8,
      reactiveElements: { head: true, face: true, body: true, arms: true, legs: false },
      movement: { frequency: 3, amplitude: 8, phase: 0 },
      transitionDuration: 300,
      easing: 'bounce'
    },
    created: new Date(),
    modified: new Date()
  },
  {
    id: 'angry',
    name: 'angry',
    displayName: 'Colère',
    color: '#EF4444',
    description: 'Colère, frustration, agacement',
    assets: {},
    animationSettings: {
      audioReactivity: 0.9,
      reactiveElements: { head: true, face: true, body: true, arms: true, legs: false },
      movement: { frequency: 8, amplitude: 6, phase: 0 },
      transitionDuration: 200,
      easing: 'ease-in'
    },
    created: new Date(),
    modified: new Date()
  },
  {
    id: 'sad',
    name: 'sad',
    displayName: 'Triste',
    color: '#3B82F6',
    description: 'Tristesse, mélancolie',
    assets: {},
    animationSettings: {
      audioReactivity: 0.3,
      reactiveElements: { head: true, face: false, body: false, arms: false, legs: false },
      movement: { frequency: 0.5, amplitude: 3, phase: 0 },
      transitionDuration: 800,
      easing: 'ease-out'
    },
    created: new Date(),
    modified: new Date()
  },
  {
    id: 'surprised',
    name: 'surprised',
    displayName: 'Surpris',
    color: '#F59E0B',
    description: 'Surprise, étonnement',
    assets: {},
    animationSettings: {
      audioReactivity: 0.7,
      reactiveElements: { head: true, face: true, body: false, arms: false, legs: false },
      movement: { frequency: 5, amplitude: 12, phase: 0 },
      transitionDuration: 150,
      easing: 'ease-in-out'
    },
    created: new Date(),
    modified: new Date()
  },
  {
    id: 'confused',
    name: 'confused',
    displayName: 'Confus',
    color: '#8B5CF6',
    description: 'Confusion, questionnement',
    assets: {},
    animationSettings: {
      audioReactivity: 0.4,
      reactiveElements: { head: true, face: false, body: false, arms: false, legs: false },
      movement: { frequency: 2, amplitude: 4, phase: 90 },
      transitionDuration: 600,
      easing: 'ease-in-out'
    },
    created: new Date(),
    modified: new Date()
  }
];

// Gestionnaire d'émotions
export class EmotionManager {
  private emotions: Map<string, CustomEmotion> = new Map();
  private storageKey = 'autochar-emotions';

  constructor() {
    this.loadEmotions();
  }

  // Charger les émotions depuis le localStorage
  loadEmotions(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const emotionsArray = JSON.parse(stored);
        emotionsArray.forEach((emotion: CustomEmotion) => {
          this.emotions.set(emotion.id, {
            ...emotion,
            created: new Date(emotion.created),
            modified: new Date(emotion.modified)
          });
        });
      } else {
        // Charger les émotions par défaut
        DEFAULT_EMOTIONS.forEach(emotion => {
          this.emotions.set(emotion.id, emotion);
        });
        this.saveEmotions();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des émotions:', error);
      // Fallback : charger les émotions par défaut
      DEFAULT_EMOTIONS.forEach(emotion => {
        this.emotions.set(emotion.id, emotion);
      });
    }
  }

  // Sauvegarder les émotions dans le localStorage
  saveEmotions(): void {
    try {
      const emotionsArray = Array.from(this.emotions.values());
      localStorage.setItem(this.storageKey, JSON.stringify(emotionsArray));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des émotions:', error);
    }
  }

  // Obtenir toutes les émotions
  getAllEmotions(): CustomEmotion[] {
    return Array.from(this.emotions.values());
  }

  // Obtenir une émotion par ID
  getEmotion(id: string): CustomEmotion | undefined {
    return this.emotions.get(id);
  }

  // Ajouter une nouvelle émotion
  addEmotion(emotion: Omit<CustomEmotion, 'created' | 'modified'>): CustomEmotion {
    const newEmotion: CustomEmotion = {
      ...emotion,
      created: new Date(),
      modified: new Date()
    };
    
    this.emotions.set(emotion.id, newEmotion);
    this.saveEmotions();
    return newEmotion;
  }

  // Modifier une émotion existante
  updateEmotion(id: string, updates: Partial<Omit<CustomEmotion, 'id' | 'created' | 'modified'>>): CustomEmotion | null {
    const existing = this.emotions.get(id);
    if (!existing) return null;

    const updated: CustomEmotion = {
      ...existing,
      ...updates,
      modified: new Date()
    };

    this.emotions.set(id, updated);
    this.saveEmotions();
    return updated;
  }

  // Supprimer une émotion
  deleteEmotion(id: string): boolean {
    // Empêcher la suppression des émotions par défaut
    const defaultIds = DEFAULT_EMOTIONS.map(e => e.id);
    if (defaultIds.includes(id)) {
      console.warn('Impossible de supprimer une émotion par défaut');
      return false;
    }

    const deleted = this.emotions.delete(id);
    if (deleted) {
      this.saveEmotions();
    }
    return deleted;
  }

  // Dupliquer une émotion
  duplicateEmotion(id: string, newName: string): CustomEmotion | null {
    const original = this.emotions.get(id);
    if (!original) return null;

    const duplicated: CustomEmotion = {
      ...original,
      id: newName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: newName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      displayName: newName,
      created: new Date(),
      modified: new Date()
    };

    this.emotions.set(duplicated.id, duplicated);
    this.saveEmotions();
    return duplicated;
  }

  // Exporter les émotions
  exportEmotions(): string {
    const emotionsArray = Array.from(this.emotions.values());
    return JSON.stringify(emotionsArray, null, 2);
  }

  // Importer des émotions
  importEmotions(jsonString: string): { success: number; errors: string[] } {
    const results = { success: 0, errors: [] as string[] };
    
    try {
      const imported = JSON.parse(jsonString);
      if (!Array.isArray(imported)) {
        results.errors.push('Le fichier doit contenir un tableau d\'émotions');
        return results;
      }

      imported.forEach((emotionData, index) => {
        try {
          const emotion: CustomEmotion = {
            ...emotionData,
            created: new Date(emotionData.created || new Date()),
            modified: new Date()
          };
          
          this.emotions.set(emotion.id, emotion);
          results.success++;
        } catch (error) {
          results.errors.push(`Erreur émotion ${index + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      });

      this.saveEmotions();
    } catch (error) {
      results.errors.push(`Erreur de parsing JSON: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    return results;
  }

  // Réinitialiser aux émotions par défaut
  resetToDefault(): void {
    this.emotions.clear();
    DEFAULT_EMOTIONS.forEach(emotion => {
      this.emotions.set(emotion.id, { ...emotion });
    });
    this.saveEmotions();
  }
}

// Instance globale
export const emotionManager = new EmotionManager();
