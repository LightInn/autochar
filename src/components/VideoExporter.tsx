import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { EmotionSegment } from '../utils/intentionAnalyzer';
import type { CustomEmotion } from '../utils/emotionManager';
import { AssetManager } from '../utils/assetManager';
import type { AudioAnalysisData } from '../utils/audioAnalyzer';

// Extension du type EmotionSegment pour inclure l'émotion personnalisée
interface ExtendedEmotionSegment extends EmotionSegment {
  customEmotion?: CustomEmotion;
}

interface VideoExporterProps {
  segments: ExtendedEmotionSegment[];
  audioFile?: File | null;
  audioAnalysis?: AudioAnalysisData[];
}

interface ExportSettings {
  width: number;
  height: number;
  fps: number;
  backgroundColor: 'transparent' | 'white' | 'black' | 'green';
  quality: 'high' | 'medium' | 'low';
  timingMethod: 'realtime' | 'precise' | 'manual';
  frameDelay: number;
}

const VideoExporter: React.FC<VideoExporterProps> = ({ 
  segments, 
  audioAnalysis = []
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    width: 800,
    height: 600,
    fps: 30,
    backgroundColor: 'transparent',
    quality: 'high',
    timingMethod: 'manual',
    frameDelay: 0
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const loadedAssets = useRef<Map<string, HTMLImageElement>>(new Map());
  const assetManager = useRef(new AssetManager()).current;

  // Précharger tous les assets des émotions
  useEffect(() => {
    const loadAssets = async () => {
      const allAssets = assetManager.getAllAssets();
      
      for (const segment of segments) {
        if (segment.customEmotion?.assets) {
          // Parcourir les assets de l'émotion (nouvelle structure)
          for (const [category, assetIds] of Object.entries(segment.customEmotion.assets)) {
            if (Array.isArray(assetIds)) {
              // Pour les catégories avec plusieurs assets (accessories, effects)
              for (const assetId of assetIds) {
                const assetFile = allAssets.find(a => a.id === assetId);
                if (assetFile) {
                  const key = `${segment.customEmotion.id}_${category}_${assetId}`;
                  if (!loadedAssets.current.has(key)) {
                    const img = new Image();
                    img.src = assetFile.data;
                    await new Promise((resolve) => {
                      img.onload = resolve;
                      img.onerror = resolve;
                    });
                    loadedAssets.current.set(key, img);
                  }
                }
              }
            } else if (typeof assetIds === 'string') {
              // Pour les catégories avec un seul asset (head, body, etc.)
              const assetFile = allAssets.find(a => a.id === assetIds);
              if (assetFile) {
                const key = `${segment.customEmotion.id}_${category}`;
                if (!loadedAssets.current.has(key)) {
                  const img = new Image();
                  img.src = assetFile.data;
                  await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                  loadedAssets.current.set(key, img);
                }
              }
            }
          }
        }
      }
    };
    
    loadAssets();
  }, [segments, assetManager]);

  // Fonction pour détecter les codecs supportés
  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4;codecs=h264',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'video/webm';
  };

  // Calculer la durée totale
  const getTotalDuration = () => {
    if (segments.length === 0) return 0;
    return Math.max(...segments.map(s => s.end));
  };

  // Rendu d'un personnage basé sur les assets
  const drawCharacterFromAssets = (
    ctx: CanvasRenderingContext2D, 
    emotion: CustomEmotion, 
    audioData?: AudioAnalysisData,
    time = 0
  ) => {
    const centerX = exportSettings.width / 2;
    const centerY = exportSettings.height / 2;
    
    // Calculer l'animation basée sur l'audio
    const animationIntensity = audioData ? audioData.volume * emotion.animationSettings.audioReactivity : 0;
    const frequency = emotion.animationSettings.movement.frequency;
    const amplitude = emotion.animationSettings.movement.amplitude * animationIntensity;
    
    // Positions par défaut avec animation
    const positions = {
      background: { x: 0, y: 0, rotation: 0, scale: 1 },
      body: { x: centerX, y: centerY + 30, rotation: 0, scale: 1 },
      head: { 
        x: centerX + (emotion.animationSettings.reactiveElements.head ? Math.sin(time * frequency) * amplitude : 0), 
        y: centerY - 50 + (emotion.animationSettings.reactiveElements.head ? Math.cos(time * frequency) * amplitude * 0.5 : 0), 
        rotation: emotion.animationSettings.reactiveElements.head ? Math.sin(time * frequency * 0.5) * amplitude * 0.1 : 0, 
        scale: 1 + (emotion.animationSettings.reactiveElements.head ? animationIntensity * 0.1 : 0)
      },
      face: { 
        x: centerX + (emotion.animationSettings.reactiveElements.face ? Math.sin(time * frequency * 1.2) * amplitude * 0.3 : 0), 
        y: centerY - 50, 
        rotation: 0, 
        scale: 1 + (emotion.animationSettings.reactiveElements.face ? animationIntensity * 0.05 : 0)
      },
      leftArm: { 
        x: centerX - 60 + (emotion.animationSettings.reactiveElements.arms ? Math.sin(time * frequency * 0.8) * amplitude * 0.5 : 0), 
        y: centerY + (emotion.animationSettings.reactiveElements.arms ? Math.cos(time * frequency * 0.8) * amplitude * 0.3 : 0), 
        rotation: -15 + (emotion.animationSettings.reactiveElements.arms ? Math.sin(time * frequency * 0.8) * amplitude * 0.2 : 0), 
        scale: 1 
      },
      rightArm: { 
        x: centerX + 60 + (emotion.animationSettings.reactiveElements.arms ? Math.sin(time * frequency * 0.7) * amplitude * 0.5 : 0), 
        y: centerY + (emotion.animationSettings.reactiveElements.arms ? Math.cos(time * frequency * 0.7) * amplitude * 0.3 : 0), 
        rotation: 15 + (emotion.animationSettings.reactiveElements.arms ? Math.sin(time * frequency * 0.7) * amplitude * 0.2 : 0), 
        scale: 1 
      },
      leftLeg: { 
        x: centerX - 30, 
        y: centerY + 80 + (emotion.animationSettings.reactiveElements.legs ? Math.sin(time * frequency * 0.6) * amplitude * 0.2 : 0), 
        rotation: emotion.animationSettings.reactiveElements.legs ? Math.sin(time * frequency * 0.6) * amplitude * 0.1 : 0, 
        scale: 1 
      },
      rightLeg: { 
        x: centerX + 30, 
        y: centerY + 80 + (emotion.animationSettings.reactiveElements.legs ? Math.sin(time * frequency * 0.5) * amplitude * 0.2 : 0), 
        rotation: emotion.animationSettings.reactiveElements.legs ? Math.sin(time * frequency * 0.5) * amplitude * 0.1 : 0, 
        scale: 1 
      }
    };

    // Ordre de rendu (arrière vers avant)
    const renderOrder = ['background', 'body', 'leftLeg', 'rightLeg', 'leftArm', 'rightArm', 'head', 'face'];
    const allAssets = assetManager.getAllAssets();

    for (const category of renderOrder) {
      const assetKey = `${emotion.id}_${category}`;
      const img = loadedAssets.current.get(assetKey);
      const position = positions[category as keyof typeof positions];
      
      // Get transform from asset file instead of emotion
      let transform = null;
      if (emotion.assets[category as keyof typeof emotion.assets]) {
        const assetId = emotion.assets[category as keyof typeof emotion.assets] as string;
        const assetFile = allAssets.find(a => a.id === assetId);
        transform = assetFile?.transform;
      }
      
      if (img && position && img.complete) {
        ctx.save();
        
        // Appliquer les transformations personnalisées si elles existent
        const finalX = position.x + (transform?.offsetX || 0);
        const finalY = position.y + (transform?.offsetY || 0);
        const finalScale = position.scale * (transform?.scale || 1);
        const finalRotation = position.rotation + (transform?.rotation || 0);
        
        ctx.translate(finalX, finalY);
        ctx.rotate(finalRotation);
        ctx.scale(finalScale, finalScale);
        
        // Dessiner l'image centrée
        const width = category === 'background' ? exportSettings.width : img.width || 50;
        const height = category === 'background' ? exportSettings.height : img.height || 50;
        
        if (category === 'background') {
          ctx.drawImage(img, -exportSettings.width/2, -exportSettings.height/2, exportSettings.width, exportSettings.height);
        } else {
          ctx.drawImage(img, -width/2, -height/2, width, height);
        }
        
        ctx.restore();
      }
    }
  };

  // Obtenir l'émotion active à un moment donné
  const getEmotionAtTime = (currentTime: number): CustomEmotion | null => {
    for (const segment of segments) {
      if (currentTime >= segment.start && currentTime <= segment.end) {
        return segment.customEmotion || null;
      }
    }
    return segments[0]?.customEmotion || null;
  };

  // Obtenir les données audio à un moment donné
  const getAudioDataAtTime = (currentTime: number): AudioAnalysisData | undefined => {
    if (audioAnalysis.length === 0) return undefined;
    
    const totalDuration = getTotalDuration();
    const index = Math.floor((currentTime / totalDuration) * audioAnalysis.length);
    return audioAnalysis[Math.min(index, audioAnalysis.length - 1)];
  };

  // Dessiner une frame
  const drawFrame = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurer le canvas
    canvas.width = exportSettings.width;
    canvas.height = exportSettings.height;

    // Nettoyer le canvas
    if (exportSettings.backgroundColor === 'transparent') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = exportSettings.backgroundColor === 'green' ? '#00FF00' : exportSettings.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Obtenir l'émotion et les données audio pour ce moment
    const emotion = getEmotionAtTime(time);
    const audioData = getAudioDataAtTime(time);

    if (emotion) {
      drawCharacterFromAssets(ctx, emotion, audioData, time);
    } else {
      // Dessiner un placeholder si pas d'émotion
      ctx.fillStyle = '#666';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Aucune émotion définie', canvas.width / 2, canvas.height / 2);
    }

    // Debug info overlay disabled for video export
  }, [segments, exportSettings, audioAnalysis]);

  // Animation de preview - logique simplifiée et corrigée
  useEffect(() => {
    if (!isPreviewPlaying) return;

    const totalDuration = getTotalDuration();
    if (totalDuration === 0) return;

    let animationId: number;
    let startTime = Date.now();
    let lastTime = previewTime;

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      const newTime = lastTime + elapsed;

      if (newTime >= totalDuration) {
        setPreviewTime(0);
        setIsPreviewPlaying(false);
        return;
      }

      setPreviewTime(newTime);
      drawFrame(newTime);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPreviewPlaying, exportSettings.fps, getTotalDuration]);

  // Redessiner quand le temps change (pour le scrubbing manuel)
  useEffect(() => {
    if (!isPreviewPlaying) {
      drawFrame(previewTime);
    }
  }, [previewTime, drawFrame, isPreviewPlaying]);

  // Export vidéo
  const startExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Initialisation...');
    chunksRef.current = [];

    try {
      const stream = canvas.captureStream(exportSettings.fps);
      const mimeType = getSupportedMimeType();
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: exportSettings.quality === 'high' ? 8000000 : 
                           exportSettings.quality === 'medium' ? 4000000 : 2000000
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setExportedVideoUrl(url);
        setExportStatus('Export terminé !');
        setIsExporting(false);
      };

      mediaRecorderRef.current.start();

      const totalDuration = getTotalDuration();
      const totalFrames = Math.ceil(totalDuration * exportSettings.fps);
      const frameDelay = 1000 / exportSettings.fps + exportSettings.frameDelay;

      setExportStatus('Génération des frames...');

      for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame / exportSettings.fps;
        
        // Dessiner la frame
        drawFrame(time);
        
        // Mettre à jour le progrès
        setExportProgress((frame / totalFrames) * 100);
        setExportStatus(`Frame ${frame + 1}/${totalFrames}`);
        
        // Attendre entre les frames selon la méthode de timing
        if (exportSettings.timingMethod === 'manual' || exportSettings.timingMethod === 'precise') {
          await new Promise(resolve => setTimeout(resolve, frameDelay));
        }
        
        // Permettre au navigateur de respirer
        if (frame % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      // Arrêter l'enregistrement
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 1000);

    } catch (error) {
      console.error('Erreur durant l\'export:', error);
      setExportStatus(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setIsExporting(false);
    }
  }, [segments, exportSettings, drawFrame]);

  const stopExport = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsExporting(false);
    setExportStatus('Export annulé');
  };

  const downloadVideo = () => {
    if (exportedVideoUrl) {
      const a = document.createElement('a');
      a.href = exportedVideoUrl;
      a.download = `autochar-animation-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const resetExport = () => {
    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
    }
    setExportedVideoUrl(null);
    setExportProgress(0);
    setExportStatus('');
  };

  const togglePreview = () => {
    setIsPreviewPlaying(!isPreviewPlaying);
  };

  const seekPreview = (time: number) => {
    setPreviewTime(Math.max(0, Math.min(time, getTotalDuration())));
    if (isPreviewPlaying) {
      setIsPreviewPlaying(false);
    }
  };

  if (segments.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <p className="text-gray-400 text-center">
          Aucun segment d'émotion à exporter. Veuillez d'abord analyser un fichier audio.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">🎬 Export Vidéo</h3>
        <div className="text-sm text-gray-400">
          {segments.length} segment(s) | {getTotalDuration().toFixed(1)}s
        </div>
      </div>

      {/* Canvas de preview */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-white">Preview</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePreview}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {isPreviewPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button
              onClick={() => seekPreview(0)}
              className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              ⏮️ Reset
            </button>
          </div>
        </div>
        
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={exportSettings.width}
            height={exportSettings.height}
            className="border border-gray-600 rounded max-w-full h-auto"
            style={{ maxHeight: '300px' }}
          />
        </div>

        {/* Timeline */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-400 min-w-12">
              {previewTime.toFixed(1)}s
            </span>
            <input
              type="range"
              min={0}
              max={getTotalDuration()}
              step={0.1}
              value={previewTime}
              onChange={(e) => seekPreview(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-400 min-w-12">
              {getTotalDuration().toFixed(1)}s
            </span>
          </div>
          
          {/* Segments visualization */}
          <div className="h-4 bg-gray-700 rounded relative overflow-hidden">
            {segments.map((segment, index) => {
              const startPercent = (segment.start / getTotalDuration()) * 100;
              const widthPercent = ((segment.end - segment.start) / getTotalDuration()) * 100;
              
              return (
                <div
                  key={index}
                  className="absolute h-full opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: segment.customEmotion?.color || '#6B7280'
                  }}
                  onClick={() => seekPreview(segment.start)}
                  title={`${segment.customEmotion?.displayName || segment.emotion} (${segment.start.toFixed(1)}s - ${segment.end.toFixed(1)}s)`}
                />
              );
            })}
            
            {/* Current time indicator */}
            <div
              className="absolute top-0 w-0.5 h-full bg-white z-10"
              style={{ left: `${(previewTime / getTotalDuration()) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Paramètres d'export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Résolution</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={exportSettings.width}
              onChange={(e) => setExportSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-20"
            />
            <span className="text-gray-400 self-center">×</span>
            <input
              type="number"
              value={exportSettings.height}
              onChange={(e) => setExportSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">FPS</label>
          <select
            value={exportSettings.fps}
            onChange={(e) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-full"
          >
            <option value={24}>24 FPS</option>
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Arrière-plan</label>
          <select
            value={exportSettings.backgroundColor}
            onChange={(e) => setExportSettings(prev => ({ ...prev, backgroundColor: e.target.value as ExportSettings['backgroundColor'] }))}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-full"
          >
            <option value="transparent">Transparent</option>
            <option value="white">Blanc</option>
            <option value="black">Noir</option>
            <option value="green">Vert (Chroma Key)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Qualité</label>
          <select
            value={exportSettings.quality}
            onChange={(e) => setExportSettings(prev => ({ ...prev, quality: e.target.value as ExportSettings['quality'] }))}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-full"
          >
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>
      </div>

      {/* Boutons d'export */}
      <div className="flex items-center gap-4">
        {!isExporting && !exportedVideoUrl && (
          <button
            onClick={startExport}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            🎬 Commencer l'Export
          </button>
        )}

        {isExporting && (
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={stopExport}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors"
            >
              ⏹️ Arrêter
            </button>
            <div className="flex-1">
              <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-green-600 h-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">{exportStatus}</p>
            </div>
          </div>
        )}

        {exportedVideoUrl && (
          <div className="flex items-center gap-4">
            <button
              onClick={downloadVideo}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              💾 Télécharger
            </button>
            <button
              onClick={resetExport}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
            >
              🔄 Nouveau
            </button>
            <span className="text-green-400 text-sm">✅ Export terminé</span>
          </div>
        )}
      </div>

      {/* Vidéo exportée */}
      {exportedVideoUrl && (
        <div className="bg-gray-900 p-4 rounded-lg">
          <h4 className="font-bold text-white mb-4">Vidéo exportée</h4>
          <video
            src={exportedVideoUrl}
            controls
            className="w-full max-w-md mx-auto rounded"
          />
        </div>
      )}
    </div>
  );
};

export default VideoExporter;
