import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { EmotionSegment, EmotionType } from '../utils/intentionAnalyzer';
import type { StickmanPose } from '../utils/stickmanPoses';
import { EMOTION_POSES, interpolatePoses } from '../utils/stickmanPoses';

interface VideoExporterProps {
  segments: EmotionSegment[];
  audioFile?: File | null;
  customPoses?: Record<EmotionType, StickmanPose>;
}

interface ExportSettings {
  width: number;
  height: number;
  fps: number;
  backgroundColor: 'transparent' | 'white' | 'black' | 'green';
  quality: 'high' | 'medium' | 'low';
}

const VideoExporter: React.FC<VideoExporterProps> = ({ 
  segments, 
  customPoses = EMOTION_POSES 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    width: 800,
    height: 600,
    fps: 30,
    backgroundColor: 'transparent',
    quality: 'high'
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
    
    // Fallback
    return 'video/webm';
  };

  // Fonction pour obtenir une pose personnalisée
  const getCustomPose = (emotion: EmotionType, intensity: number) => {
    const basePose = customPoses[emotion];
    const neutralPose = customPoses.neutral;
    return interpolatePoses(neutralPose, basePose, intensity);
  };

  // Dessiner le stickman sur le canvas
  const drawStickman = (ctx: CanvasRenderingContext2D, pose: StickmanPose) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Nettoyer le canvas
    if (exportSettings.backgroundColor === 'transparent') {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
      ctx.fillStyle = exportSettings.backgroundColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    
    // Configuration du style
    ctx.strokeStyle = '#333333';
    ctx.fillStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Positions
    const headY = centerY - 60;
    const bodyStartY = headY + 20;
    const bodyEndY = bodyStartY + 60;
    const shoulderY = bodyStartY + 15;
    const hipY = bodyEndY;
    const armLength = 40;
    const legLength = 50;

    // Conversion des angles
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    // Corps
    ctx.beginPath();
    ctx.moveTo(centerX, bodyStartY);
    ctx.lineTo(centerX + Math.sin(toRad(pose.body.lean)) * 30, bodyEndY);
    ctx.stroke();

    // Tête
    ctx.save();
    ctx.translate(centerX + Math.sin(toRad(pose.body.lean)) * 10, headY);
    ctx.rotate(toRad(pose.head.rotation));
    
    // Cercle de la tête
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Expression faciale simplifiée
    ctx.fillStyle = '#333333';
    // Yeux
    ctx.beginPath();
    ctx.arc(-5, -3, 1.5, 0, Math.PI * 2);
    ctx.arc(5, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Bouche (variant selon l'émotion)
    ctx.beginPath();
    if (pose.head.expression === 'happy' || pose.head.expression === 'excited') {
      ctx.arc(0, 4, 4, 0, Math.PI); // Sourire
    } else if (pose.head.expression === 'sad' || pose.head.expression === 'disappointed') {
      ctx.arc(0, 6, 4, Math.PI, 0); // Tristesse
    } else {
      ctx.moveTo(-3, 4);
      ctx.lineTo(3, 4); // Neutre
    }
    ctx.stroke();
    
    ctx.restore();

    // Bras
    const leftArmEndX = centerX + Math.cos(toRad(pose.leftArm.rotation)) * armLength;
    const leftArmEndY = shoulderY + Math.sin(toRad(pose.leftArm.rotation)) * armLength;
    const rightArmEndX = centerX + Math.cos(toRad(180 - pose.rightArm.rotation)) * armLength;
    const rightArmEndY = shoulderY + Math.sin(toRad(180 - pose.rightArm.rotation)) * armLength;

    // Bras gauche
    ctx.beginPath();
    ctx.moveTo(centerX, shoulderY);
    ctx.lineTo(leftArmEndX, leftArmEndY);
    ctx.stroke();

    // Bras droit
    ctx.beginPath();
    ctx.moveTo(centerX, shoulderY);
    ctx.lineTo(rightArmEndX, rightArmEndY);
    ctx.stroke();

    // Jambes
    const leftLegEndX = centerX + Math.cos(toRad(90 + pose.leftLeg.rotation)) * legLength;
    const leftLegEndY = hipY + Math.sin(toRad(90 + pose.leftLeg.rotation)) * legLength;
    const rightLegEndX = centerX + Math.cos(toRad(90 - pose.rightLeg.rotation)) * legLength;
    const rightLegEndY = hipY + Math.sin(toRad(90 - pose.rightLeg.rotation)) * legLength;

    // Jambe gauche
    ctx.beginPath();
    ctx.moveTo(centerX, hipY);
    ctx.lineTo(leftLegEndX, leftLegEndY);
    ctx.stroke();

    // Jambe droite
    ctx.beginPath();
    ctx.moveTo(centerX, hipY);
    ctx.lineTo(rightLegEndX, rightLegEndY);
    ctx.stroke();

    // Articulations
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(centerX, shoulderY, 3, 0, Math.PI * 2);
    ctx.arc(centerX, hipY, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  // Calculer la pose à un moment donné
  const getPoseAtTime = (currentTime: number): StickmanPose => {
    const segment = segments.find(s => currentTime >= s.start && currentTime <= s.end);
    
    if (segment) {
      return getCustomPose(segment.emotion, segment.intensity);
    } else {
      // Interpolation entre segments
      const nextSegment = segments.find(s => s.start > currentTime);
      const prevSegment = [...segments].reverse().find(s => s.end < currentTime);
      
      if (nextSegment && prevSegment) {
        const transitionDuration = nextSegment.start - prevSegment.end;
        const transitionProgress = (currentTime - prevSegment.end) / transitionDuration;
        
        const prevPose = getCustomPose(prevSegment.emotion, prevSegment.intensity);
        const nextPose = getCustomPose(nextSegment.emotion, nextSegment.intensity);
        
        return interpolatePoses(prevPose, nextPose, transitionProgress);
      } else {
        return customPoses.neutral;
      }
    }
  };

  // Preview automatique
  useEffect(() => {
    if (!isExporting && canvasRef.current && segments.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 400;
        canvas.height = 300;
        
        // Afficher la première pose ou une pose au milieu
        const midTime = Math.max(...segments.map(s => s.end)) / 2;
        const pose = getPoseAtTime(midTime);
        drawStickman(ctx, pose);
      }
    }
  }, [segments, customPoses, exportSettings.backgroundColor, isExporting]);

  // Démarrer l'export
  const startExport = useCallback(async () => {
    if (!canvasRef.current) return;

    // Demander permission pour les notifications
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Initialisation...');
    chunksRef.current = [];

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du canvas
    canvas.width = exportSettings.width;
    canvas.height = exportSettings.height;

    // Durée totale
    const totalDuration = Math.max(...segments.map(s => s.end), 0);
    const frameCount = Math.ceil(totalDuration * exportSettings.fps);
    const frameInterval = 1 / exportSettings.fps;

    try {
      // Configuration MediaRecorder avec détection automatique
      const stream = canvas.captureStream(exportSettings.fps);
      const mimeType = getSupportedMimeType();
      
      console.log('Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: exportSettings.quality === 'high' ? 8000000 : 
                           exportSettings.quality === 'medium' ? 4000000 : 2000000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setExportedVideoUrl(url);
        setExportStatus('Export terminé !');
        setIsExporting(false);
        
        // Notification de succès
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('AutoStickman', {
            body: 'Votre vidéo est prête à télécharger !',
            icon: '/vite.svg'
          });
        }
      };

      // Démarrer l'enregistrement
      mediaRecorder.start();
      setExportStatus('Génération des frames...');

      // Générer chaque frame
      for (let frame = 0; frame < frameCount; frame++) {
        const currentTime = frame * frameInterval;
        const pose = getPoseAtTime(currentTime);
        
        drawStickman(ctx, pose);
        
        // Mise à jour du progrès
        const progress = (frame / frameCount) * 100;
        setExportProgress(progress);
        setExportStatus(`Frame ${frame + 1}/${frameCount}`);
        
        // Laisser le temps au navigateur de traiter
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Arrêter l'enregistrement
      setExportStatus('Finalisation...');
      mediaRecorder.stop();

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      
      let errorMessage = 'Erreur lors de l\'export';
      if (error instanceof Error) {
        if (error.message.includes('codec')) {
          errorMessage = 'Codec vidéo non supporté par votre navigateur';
        } else if (error.message.includes('MediaRecorder')) {
          errorMessage = 'Enregistrement vidéo non supporté par votre navigateur';
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      setExportStatus(errorMessage);
      setIsExporting(false);
    }
  }, [segments, customPoses, exportSettings]);

  const downloadVideo = () => {
    if (exportedVideoUrl) {
      const link = document.createElement('a');
      link.href = exportedVideoUrl;
      
      // Déterminer l'extension selon le type supporté
      const mimeType = getSupportedMimeType();
      const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
      
      link.download = `stickman-animation.${extension}`;
      link.click();
    }
  };

  const qualityOptions = [
    { value: 'high', label: 'Haute (8 Mbps)', icon: '🎬' },
    { value: 'medium', label: 'Moyenne (4 Mbps)', icon: '📹' },
    { value: 'low', label: 'Basse (2 Mbps)', icon: '📱' }
  ];

  const backgroundOptions = [
    { value: 'transparent', label: 'Transparent', icon: '🫥' },
    { value: 'white', label: 'Blanc', icon: '⚪' },
    { value: 'black', label: 'Noir', icon: '⚫' },
    { value: 'green', label: 'Vert (Chroma)', icon: '🟢' }
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">🎬 Export Vidéo</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres d'export */}
        <div className="space-y-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">⚙️ Paramètres</h3>
            
            {/* Résolution */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Résolution
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={exportSettings.width}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev, 
                    width: parseInt(e.target.value) || 800
                  }))}
                  className="bg-gray-600 text-white rounded px-3 py-2 w-full"
                  placeholder="Largeur"
                />
                <input
                  type="number"
                  value={exportSettings.height}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev, 
                    height: parseInt(e.target.value) || 600
                  }))}
                  className="bg-gray-600 text-white rounded px-3 py-2 w-full"
                  placeholder="Hauteur"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[
                  { w: 1920, h: 1080, label: 'Full HD' },
                  { w: 1280, h: 720, label: 'HD' },
                  { w: 800, h: 600, label: 'Standard' }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setExportSettings(prev => ({
                      ...prev,
                      width: preset.w,
                      height: preset.h
                    }))}
                    className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FPS */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Images par seconde (FPS)
              </label>
              <select
                value={exportSettings.fps}
                onChange={(e) => setExportSettings(prev => ({
                  ...prev, 
                  fps: parseInt(e.target.value)
                }))}
                className="w-full bg-gray-600 text-white rounded px-3 py-2"
              >
                <option value={24}>24 FPS (Cinéma)</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (Fluide)</option>
              </select>
            </div>

            {/* Qualité */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Qualité
              </label>
              <div className="grid grid-cols-1 gap-2">
                {qualityOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      value={option.value}
                      checked={exportSettings.quality === option.value}
                      onChange={(e) => setExportSettings(prev => ({
                        ...prev,
                        quality: e.target.value as 'high' | 'medium' | 'low'
                      }))}
                      className="mr-3"
                    />
                    <span className="text-white">
                      {option.icon} {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fond */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Arrière-plan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {backgroundOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      value={option.value}
                      checked={exportSettings.backgroundColor === option.value}
                      onChange={(e) => setExportSettings(prev => ({
                        ...prev,
                        backgroundColor: e.target.value as any
                      }))}
                      className="mr-2"
                    />
                    <span className="text-white text-sm">
                      {option.icon} {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">📊 Informations</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <div>Durée: {Math.max(...segments.map(s => s.end), 0).toFixed(1)}s</div>
              <div>Frames totales: {Math.ceil(Math.max(...segments.map(s => s.end), 0) * exportSettings.fps)}</div>
              <div>Résolution: {exportSettings.width}×{exportSettings.height}</div>
              <div>Codec supporté: {getSupportedMimeType()}</div>
              <div>Taille estimée: ~{Math.ceil((exportSettings.quality === 'high' ? 8 : exportSettings.quality === 'medium' ? 4 : 2) * Math.max(...segments.map(s => s.end), 0) / 8)}MB</div>
            </div>
          </div>
        </div>

        {/* Preview et export */}
        <div className="space-y-6">
          {/* Canvas preview */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">👁️ Aperçu</h3>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="border border-gray-500 rounded bg-gray-600"
                style={{ 
                  backgroundColor: exportSettings.backgroundColor === 'transparent' ? 'transparent' : exportSettings.backgroundColor 
                }}
              />
            </div>
          </div>

          {/* Export */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">🚀 Export</h3>
            
            {!isExporting && !exportedVideoUrl && (
              <button
                onClick={startExport}
                disabled={segments.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                🎬 Démarrer l'Export
              </button>
            )}

            {isExporting && (
              <div className="space-y-4">
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{exportProgress.toFixed(1)}%</div>
                  <div className="text-gray-400 text-sm">{exportStatus}</div>
                </div>
              </div>
            )}

            {exportedVideoUrl && (
              <div className="space-y-4">
                <div className="text-center text-green-400 font-semibold">
                  ✅ Export terminé !
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadVideo}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    💾 Télécharger
                  </button>
                  <button
                    onClick={() => {
                      setExportedVideoUrl(null);
                      setExportProgress(0);
                      setExportStatus('');
                    }}
                    className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    🔄
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Conseils d'export */}
          <div className="bg-gradient-to-r from-blue-800/20 to-green-800/20 border border-blue-500/30 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-300 mb-3">💡 Conseils d'Export</h4>
            <div className="text-sm text-gray-300 space-y-2">
              <div><strong className="text-white">🎬 Codec :</strong> Auto-détection du meilleur codec supporté</div>
              <div><strong className="text-white">🌟 Transparent :</strong> Parfait pour intégrer dans d'autres vidéos</div>
              <div><strong className="text-white">⚡ Performance :</strong> Réduisez la résolution pour un export plus rapide</div>
              <div><strong className="text-white">🎯 Qualité :</strong> Haute qualité = fichier plus lourd mais meilleur rendu</div>
              <div><strong className="text-white">🔄 Format :</strong> WebM supporte la transparence, MP4 est plus compatible</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoExporter;
