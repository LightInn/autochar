// Analyseur audio pour animation réactive au son
export interface AudioAnalysisData {
  timestamp: number; // en secondes
  volume: number; // 0-1
  pitch: number; // Hz
  energy: number; // énergie spectrale 0-1
  frequencies: {
    bass: number; // 0-1
    mid: number; // 0-1
    treble: number; // 0-1
  };
  features: {
    spectralCentroid: number;
    spectralRolloff: number;
    zeroCrossingRate: number;
  };
}

export interface AudioReactiveSettings {
  sensitivity: number; // 0-1
  smoothing: number; // 0-1
  frequencyBands: {
    bassRange: [number, number]; // Hz
    midRange: [number, number];
    trebleRange: [number, number];
  };
  updateRate: number; // Hz
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  
  private isAnalyzing = false;
  private analysisData: AudioAnalysisData[] = [];
  private currentTime = 0;
  
  private settings: AudioReactiveSettings = {
    sensitivity: 0.7,
    smoothing: 0.8,
    frequencyBands: {
      bassRange: [20, 250],
      midRange: [250, 4000],
      trebleRange: [4000, 20000]
    },
    updateRate: 60
  };

  constructor() {
    this.initAudioContext();
  }

  // Initialiser le contexte audio
  private async initAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Créer l'analyseur
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = this.settings.smoothing;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du contexte audio:', error);
    }
  }

  // Charger un fichier audio
  async loadAudioFile(file: File): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Contexte audio non initialisé');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      throw new Error(`Erreur lors du chargement audio: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Analyser tout le fichier audio
  async analyzeFullAudio(
    onProgress?: (progress: number) => void,
    onData?: (data: AudioAnalysisData) => void
  ): Promise<AudioAnalysisData[]> {
    
    if (!this.audioBuffer || !this.audioContext || !this.analyser) {
      throw new Error('Audio non chargé ou contexte non initialisé');
    }

    const audioBuffer = this.audioBuffer; // Pour éviter les null checks répétés

    return new Promise((resolve, reject) => {
      try {
        this.analysisData = [];
        this.currentTime = 0;
        this.isAnalyzing = true;

        const sampleRate = audioBuffer.sampleRate;
        const frameSize = 1024;
        const hopSize = frameSize / 2;
        const frameCount = Math.floor((audioBuffer.length - frameSize) / hopSize);

        // Récupérer les données audio
        const channelData = audioBuffer.getChannelData(0);

        for (let frame = 0; frame < frameCount; frame++) {
          const startSample = frame * hopSize;
          const timestamp = startSample / sampleRate;
          
          // Analyser cette frame
          const frameData = channelData.slice(startSample, startSample + frameSize);
          const analysisData = this.analyzeFrame(frameData, timestamp, sampleRate);
          
          this.analysisData.push(analysisData);
          
          if (onData) onData(analysisData);
          if (onProgress) onProgress((frame / frameCount) * 100);
        }

        this.isAnalyzing = false;
        resolve(this.analysisData);
      } catch (error) {
        this.isAnalyzing = false;
        reject(error);
      }
    });
  }

  // Analyser une frame audio
  private analyzeFrame(frameData: Float32Array, timestamp: number, sampleRate: number): AudioAnalysisData {
    // Calculer le volume (RMS)
    const volume = this.calculateRMS(frameData);
    
    // Calculer l'énergie
    const energy = this.calculateEnergy(frameData);
    
    // Analyse fréquentielle basique (sans FFT complexe)
    const frequencies = this.analyzeFrequencies(frameData, sampleRate);
    
    // Calcul du pitch approximatif
    const pitch = this.estimatePitch(frameData, sampleRate);
    
    // Features spectrales basiques
    const features = this.calculateSpectralFeatures(frameData, sampleRate);

    return {
      timestamp,
      volume: Math.min(volume * this.settings.sensitivity, 1),
      pitch,
      energy: Math.min(energy * this.settings.sensitivity, 1),
      frequencies,
      features
    };
  }

  // Calculer RMS (volume)
  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  // Calculer l'énergie spectrale
  private calculateEnergy(data: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < data.length; i++) {
      energy += Math.abs(data[i]);
    }
    return energy / data.length;
  }

  // Analyse fréquentielle simplifiée
  private analyzeFrequencies(data: Float32Array, sampleRate: number): AudioAnalysisData['frequencies'] {
    // Implémentation simplifiée sans FFT
    // On utilise des filtres passe-bande approximatifs
    
    const bass = this.bandpassFilter(data, this.settings.frequencyBands.bassRange, sampleRate);
    const mid = this.bandpassFilter(data, this.settings.frequencyBands.midRange, sampleRate);
    const treble = this.bandpassFilter(data, this.settings.frequencyBands.trebleRange, sampleRate);

    return {
      bass: this.calculateRMS(bass),
      mid: this.calculateRMS(mid),
      treble: this.calculateRMS(treble)
    };
  }

  // Filtre passe-bande simplifié
  private bandpassFilter(data: Float32Array, range: [number, number], sampleRate: number): Float32Array {
    // Implémentation très simplifiée - dans un vrai projet, utiliser une vraie FFT
    const filtered = new Float32Array(data.length);
    const [lowFreq, highFreq] = range;
    
    // Coefficient approximatif basé sur la fréquence
    const lowCoeff = (lowFreq / sampleRate) * 2;
    const highCoeff = (highFreq / sampleRate) * 2;
    
    for (let i = 1; i < data.length - 1; i++) {
      // Filtre très basique - améliorer avec une vraie implémentation
      const highpass = data[i] - data[i-1] * lowCoeff;
      const lowpass = highpass * highCoeff + filtered[i-1] * (1 - highCoeff);
      filtered[i] = lowpass;
    }
    
    return filtered;
  }

  // Estimation du pitch (fréquence fondamentale)
  private estimatePitch(data: Float32Array, sampleRate: number): number {
    // Autocorrélation simple pour estimer le pitch
    const minPeriod = Math.floor(sampleRate / 800); // ~800Hz max
    const maxPeriod = Math.floor(sampleRate / 80);  // ~80Hz min
    
    let bestPeriod = minPeriod;
    let bestCorrelation = 0;
    
    for (let period = minPeriod; period < maxPeriod && period < data.length / 2; period++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < data.length - period; i++) {
        correlation += data[i] * data[i + period];
        count++;
      }
      
      correlation /= count;
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestCorrelation > 0.3 ? sampleRate / bestPeriod : 0;
  }

  // Calculer les features spectrales
  private calculateSpectralFeatures(data: Float32Array, sampleRate: number): AudioAnalysisData['features'] {
    // Implémentation simplifiée
    
    // Centroïde spectral approximatif
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < data.length; i++) {
      const magnitude = Math.abs(data[i]);
      const frequency = (i / data.length) * (sampleRate / 2);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    
    // Rolloff spectral (90% de l'énergie)
    let energySum = 0;
    let totalEnergy = 0;
    
    for (let i = 0; i < data.length; i++) {
      totalEnergy += data[i] * data[i];
    }
    
    const targetEnergy = totalEnergy * 0.9;
    let rolloffIndex = 0;
    
    for (let i = 0; i < data.length; i++) {
      energySum += data[i] * data[i];
      if (energySum >= targetEnergy) {
        rolloffIndex = i;
        break;
      }
    }
    
    const spectralRolloff = (rolloffIndex / data.length) * (sampleRate / 2);
    
    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i] >= 0) !== (data[i-1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / data.length;

    return {
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate
    };
  }

  // Obtenir les données d'analyse pour un timestamp donné
  getAnalysisDataAtTime(timestamp: number): AudioAnalysisData | null {
    if (this.analysisData.length === 0) return null;
    
    // Trouver la frame la plus proche
    let closestIndex = 0;
    let closestDistance = Math.abs(this.analysisData[0].timestamp - timestamp);
    
    for (let i = 1; i < this.analysisData.length; i++) {
      const distance = Math.abs(this.analysisData[i].timestamp - timestamp);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
    
    return this.analysisData[closestIndex];
  }

  // Interpoler les données entre deux points
  interpolateAnalysisData(timestamp: number): AudioAnalysisData | null {
    if (this.analysisData.length === 0) return null;
    
    // Trouver les deux points encadrants
    let beforeIndex = -1;
    let afterIndex = -1;
    
    for (let i = 0; i < this.analysisData.length - 1; i++) {
      if (this.analysisData[i].timestamp <= timestamp && this.analysisData[i + 1].timestamp >= timestamp) {
        beforeIndex = i;
        afterIndex = i + 1;
        break;
      }
    }
    
    if (beforeIndex === -1) {
      return this.getAnalysisDataAtTime(timestamp);
    }
    
    const before = this.analysisData[beforeIndex];
    const after = this.analysisData[afterIndex];
    const factor = (timestamp - before.timestamp) / (after.timestamp - before.timestamp);
    
    // Interpolation linéaire
    return {
      timestamp,
      volume: before.volume + (after.volume - before.volume) * factor,
      pitch: before.pitch + (after.pitch - before.pitch) * factor,
      energy: before.energy + (after.energy - before.energy) * factor,
      frequencies: {
        bass: before.frequencies.bass + (after.frequencies.bass - before.frequencies.bass) * factor,
        mid: before.frequencies.mid + (after.frequencies.mid - before.frequencies.mid) * factor,
        treble: before.frequencies.treble + (after.frequencies.treble - before.frequencies.treble) * factor
      },
      features: {
        spectralCentroid: before.features.spectralCentroid + (after.features.spectralCentroid - before.features.spectralCentroid) * factor,
        spectralRolloff: before.features.spectralRolloff + (after.features.spectralRolloff - before.features.spectralRolloff) * factor,
        zeroCrossingRate: before.features.zeroCrossingRate + (after.features.zeroCrossingRate - before.features.zeroCrossingRate) * factor
      }
    };
  }

  // Configurer les paramètres
  updateSettings(newSettings: Partial<AudioReactiveSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.settings.smoothing;
    }
  }

  // Obtenir toutes les données d'analyse
  getAllAnalysisData(): AudioAnalysisData[] {
    return [...this.analysisData];
  }

  // Exporter les données d'analyse
  exportAnalysisData(): string {
    return JSON.stringify(this.analysisData, null, 2);
  }

  // Importer des données d'analyse
  importAnalysisData(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        this.analysisData = imported;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Nettoyer
  cleanup(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.analysisData = [];
    this.isAnalyzing = false;
  }
}

// Instance globale
export const audioAnalyzer = new AudioAnalyzer();
