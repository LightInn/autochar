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
  timingMethod: 'realtime' | 'precise' | 'manual';
  frameDelay: number; // délai supplémentaire en ms entre les frames
}

const VideoExporter: React.FC<VideoExporterProps> = ({ 
  segments, 
  customPoses = EMOTION_POSES 
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
    console.log(`getPoseAtTime(${currentTime}), segments:`, segments.length);
    
    const segment = segments.find(s => currentTime >= s.start && currentTime <= s.end);
    
    if (segment) {
      console.log(`Found segment for time ${currentTime}:`, segment.emotion);
      return getCustomPose(segment.emotion, segment.intensity);
    } else {
      // Interpolation entre segments
      const nextSegment = segments.find(s => s.start > currentTime);
      const prevSegment = [...segments].reverse().find(s => s.end < currentTime);
      
      if (nextSegment && prevSegment) {
        const transitionDuration = nextSegment.start - prevSegment.end;
        const transitionProgress = (currentTime - prevSegment.end) / transitionDuration;
        
        console.log(`Interpolating between ${prevSegment.emotion} and ${nextSegment.emotion}, progress:`, transitionProgress);
        
        const prevPose = getCustomPose(prevSegment.emotion, prevSegment.intensity);
        const nextPose = getCustomPose(nextSegment.emotion, nextSegment.intensity);
        
        return interpolatePoses(prevPose, nextPose, transitionProgress);
      } else {
        console.log(`Using neutral pose for time ${currentTime}`);
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
        
        if (isPreviewPlaying) {
          // Animation de preview
          const totalDuration = Math.max(...segments.map(s => s.end), 0);
          const pose = getPoseAtTime(previewTime);
          drawStickman(ctx, pose);
          
          // Avancer le temps de preview
          const nextTime = previewTime + 0.1; // 10 FPS pour le preview
          if (nextTime <= totalDuration) {
            setTimeout(() => setPreviewTime(nextTime), 100);
          } else {
            // Redémarrer l'animation en boucle
            setPreviewTime(0);
          }
        } else {
          // Afficher la première pose ou une pose au milieu
          const midTime = Math.max(...segments.map(s => s.end)) / 2;
          const pose = getPoseAtTime(midTime);
          drawStickman(ctx, pose);
        }
      }
    }
  }, [segments, customPoses, exportSettings.backgroundColor, isExporting, isPreviewPlaying, previewTime]);

  // Contrôles de preview
  const togglePreview = () => {
    if (isPreviewPlaying) {
      setIsPreviewPlaying(false);
    } else {
      setPreviewTime(0);
      setIsPreviewPlaying(true);
    }
  };

  // Démarrer l'export
  const startExport = useCallback(async () => {
    if (!canvasRef.current) return;

    // Vérification des segments
    if (segments.length === 0) {
      setExportStatus('Aucun segment à exporter');
      return;
    }

    const totalDuration = Math.max(...segments.map(s => s.end), 0);
    if (totalDuration <= 0) {
      setExportStatus('Durée invalide dans les segments');
      return;
    }

    console.log('Starting export with', segments.length, 'segments, total duration:', totalDuration);
    console.log('Segments:', segments);

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

    const frameInterval = 1000 / exportSettings.fps; // en millisecondes

    try {
      // Configuration MediaRecorder avec détection automatique  
      const stream = canvas.captureStream(exportSettings.fps);
      const mimeType = getSupportedMimeType();
      
      console.log('Using MIME type:', mimeType);
      console.log('Total duration:', totalDuration, 'seconds');
      console.log('Frame interval:', frameInterval, 'ms');
      
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
      
      console.log('MediaRecorder started, stream tracks:', stream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState
      })));

      if (exportSettings.timingMethod === 'realtime') {
        // Animation en temps réel avec requestAnimationFrame
        let startTime = performance.now();
        let currentTime = 0;
        let frameCount = 0;
        let isAnimating = true; // Flag local pour éviter les conflits avec le state

        const animateFrame = (timestamp: number) => {
          if (!isAnimating) {
            console.log('Animation stopped by flag');
            return;
          }
          
          // Calculer le temps écoulé en secondes
          currentTime = (timestamp - startTime) / 1000;
          
          console.log(`Frame ${frameCount}: ${currentTime.toFixed(2)}s / ${totalDuration.toFixed(2)}s`);
          
          if (currentTime <= totalDuration) {
            // Dessiner la frame actuelle
            const pose = getPoseAtTime(currentTime);
            drawStickman(ctx, pose);
            
            // Mise à jour du progrès
            frameCount++;
            const progress = (currentTime / totalDuration) * 100;
            setExportProgress(progress);
            setExportStatus(`${currentTime.toFixed(2)}s / ${totalDuration.toFixed(2)}s`);
            
            // Continuer l'animation
            requestAnimationFrame(animateFrame);
          } else {
            // Animation terminée, arrêter l'enregistrement
            console.log('Animation completed after', currentTime, 'seconds');
            isAnimating = false;
            setExportStatus('Finalisation...');
            setTimeout(() => {
              mediaRecorder.stop();
            }, 500); // Petit délai pour s'assurer que la dernière frame est capturée
          }
        };

        // Override du cancel pour stopper l'animation
        window.addEventListener('beforeunload', () => {
          isAnimating = false;
        });

        // Commencer l'animation
        console.log('Starting realtime animation, duration:', totalDuration);
        requestAnimationFrame(animateFrame);
      } else if (exportSettings.timingMethod === 'precise') {
        // Méthode précise avec interval exact
        let currentTime = 0;
        let frameCount = 0;
        let isAnimating = true;
        const frameInterval = 1000 / exportSettings.fps; // en millisecondes
        const actualDelay = frameInterval + exportSettings.frameDelay;
        
        console.log('Starting precise animation, frame interval:', actualDelay, 'ms');
        
        const renderFrame = () => {
          if (!isAnimating) {
            console.log('Precise animation stopped by flag');
            return;
          }
          
          console.log(`Precise frame ${frameCount}: ${currentTime.toFixed(2)}s / ${totalDuration.toFixed(2)}s`);
          
          if (currentTime <= totalDuration) {
            // Dessiner la frame actuelle
            const pose = getPoseAtTime(currentTime);
            drawStickman(ctx, pose);
            
            // Mise à jour du progrès
            frameCount++;
            const progress = (currentTime / totalDuration) * 100;
            setExportProgress(progress);
            setExportStatus(`${currentTime.toFixed(2)}s / ${totalDuration.toFixed(2)}s (${frameCount} frames)`);
            
            // Passer à la frame suivante
            currentTime += 1 / exportSettings.fps;
            
            // Programmer la prochaine frame avec le délai configuré
            setTimeout(renderFrame, actualDelay);
          } else {
            // Animation terminée, arrêter l'enregistrement
            console.log('Precise animation completed after', currentTime, 'seconds, rendered', frameCount, 'frames');
            isAnimating = false;
            setExportStatus('Finalisation...');
            setTimeout(() => {
              mediaRecorder.stop();
            }, 500);
          }
        };
        
        // Commencer le rendu précis
        renderFrame();
      } else if (exportSettings.timingMethod === 'manual') {
        // Méthode manuelle - génération frame par frame
        console.log('Starting manual frame generation');
        let currentFrame = 0;
        let isAnimating = true;
        const totalFrames = Math.ceil(totalDuration * exportSettings.fps);
        
        const generateNextFrame = async () => {
          if (!isAnimating || currentFrame >= totalFrames) {
            if (currentFrame >= totalFrames) {
              console.log('Manual generation completed,', currentFrame, 'frames generated');
              isAnimating = false;
              setExportStatus('Finalisation...');
              setTimeout(() => {
                mediaRecorder.stop();
              }, 500);
            }
            return;
          }
          
          const currentTime = currentFrame / exportSettings.fps;
          console.log(`Manual frame ${currentFrame}: ${currentTime.toFixed(2)}s / ${totalDuration.toFixed(2)}s`);
          
          // Dessiner la frame actuelle
          const pose = getPoseAtTime(currentTime);
          drawStickman(ctx, pose);
          
          // Mise à jour du progrès
          const progress = (currentFrame / totalFrames) * 100;
          setExportProgress(progress);
          setExportStatus(`Frame ${currentFrame + 1}/${totalFrames} (${currentTime.toFixed(2)}s)`);
          
          currentFrame++;
          
          // Attendre avant la prochaine frame pour laisser MediaRecorder capturer
          setTimeout(generateNextFrame, Math.max(50, exportSettings.frameDelay + (1000 / exportSettings.fps)));
        };
        
        // Commencer la génération manuelle
        generateNextFrame();
      }

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

  // Annuler l'export
  const cancelExport = useCallback(() => {
    if (mediaRecorderRef.current && isExporting) {
      mediaRecorderRef.current.stop();
      setIsExporting(false);
      setExportProgress(0);
      setExportStatus('Export annulé');
      setTimeout(() => setExportStatus(''), 3000);
    }
  }, [isExporting]);

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

            {/* Méthode de timing */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Méthode de timing
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="realtime"
                    checked={exportSettings.timingMethod === 'realtime'}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      timingMethod: e.target.value as 'realtime' | 'precise' | 'manual'
                    }))}
                    className="mr-3"
                  />
                  <span className="text-white">
                    ⚡ Temps réel
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="precise"
                    checked={exportSettings.timingMethod === 'precise'}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      timingMethod: e.target.value as 'realtime' | 'precise' | 'manual'
                    }))}
                    className="mr-3"
                  />
                  <span className="text-white">
                    🎯 Précis
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={exportSettings.timingMethod === 'manual'}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      timingMethod: e.target.value as 'realtime' | 'precise' | 'manual'
                    }))}
                    className="mr-3"
                  />
                  <span className="text-white">
                    🔧 Manuel (Recommandé pour déboguer)
                  </span>
                </label>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {exportSettings.timingMethod === 'realtime' 
                  ? 'Utilise requestAnimationFrame pour un timing naturel'
                  : exportSettings.timingMethod === 'precise'
                  ? 'Utilise des intervals précis pour un timing exact'
                  : 'Génère chaque frame manuellement avec contrôle total'
                }
              </div>
            </div>

            {/* Délai supplémentaire (mode précis/manuel seulement) */}
            {(exportSettings.timingMethod === 'precise' || exportSettings.timingMethod === 'manual') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Délai supplémentaire par frame (ms)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={exportSettings.frameDelay}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    frameDelay: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0ms (Plus rapide)</span>
                  <span className="text-white font-semibold">{exportSettings.frameDelay}ms</span>
                  <span>100ms (Plus stable)</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Augmentez si la vidéo exportée est trop courte. Délai actuel entre frames: {(1000/exportSettings.fps + exportSettings.frameDelay).toFixed(0)}ms
                </div>
              </div>
            )}

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
              <div>Méthode timing: {exportSettings.timingMethod === 'realtime' ? 'Temps réel' : 'Précis'}</div>
              <div>Taille estimée: ~{Math.ceil((exportSettings.quality === 'high' ? 8 : exportSettings.quality === 'medium' ? 4 : 2) * Math.max(...segments.map(s => s.end), 0) / 8)}MB</div>
              <div>Segments: {segments.length}</div>
            </div>
            <button
              onClick={() => {
                const debugInfo = {
                  duration: Math.max(...segments.map(s => s.end), 0),
                  fps: exportSettings.fps,
                  totalFrames: Math.ceil(Math.max(...segments.map(s => s.end), 0) * exportSettings.fps),
                  codec: getSupportedMimeType(),
                  timingMethod: exportSettings.timingMethod,
                  segments: segments.map(s => ({
                    start: s.start,
                    end: s.end,
                    duration: s.end - s.start,
                    emotion: s.emotion,
                    text: s.text
                  })),
                  browserInfo: {
                    userAgent: navigator.userAgent,
                    mediaRecorderSupported: typeof MediaRecorder !== 'undefined',
                    webmSupport: MediaRecorder.isTypeSupported('video/webm'),
                    mp4Support: MediaRecorder.isTypeSupported('video/mp4')
                  }
                };
                const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'debug-info.json';
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-3 w-full text-xs bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded transition-colors"
            >
              📊 Export Debug Info
            </button>
          </div>
        </div>

        {/* Preview et export */}
        <div className="space-y-6">
          {/* Canvas preview */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white">👁️ Aperçu</h3>
              <button
                onClick={togglePreview}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm transition-colors"
                disabled={segments.length === 0}
              >
                {isPreviewPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
            </div>
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
            {isPreviewPlaying && (
              <div className="mt-2">
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all duration-100"
                    style={{ 
                      width: `${(previewTime / Math.max(...segments.map(s => s.end), 0)) * 100}%` 
                    }}
                  />
                </div>
                <div className="text-center text-xs text-gray-400 mt-1">
                  {previewTime.toFixed(1)}s / {Math.max(...segments.map(s => s.end), 0).toFixed(1)}s
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">🚀 Export</h3>
            
            {!isExporting && !exportedVideoUrl && (
              <div className="space-y-2">
                <button
                  onClick={startExport}
                  disabled={segments.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  🎬 Démarrer l'Export
                </button>
                
                {/* Bouton de test avec données d'exemple */}
                {segments.length === 0 && (
                  <button
                    onClick={() => {
                      // Test avec des segments d'exemple
                      const testSegments: EmotionSegment[] = [
                        { 
                          start: 0, end: 2, text: "Salut !", emotion: "happy", 
                          intensity: 0.8, confidence: 0.9, triggers: ["salut"] 
                        },
                        { 
                          start: 2, end: 4, text: "Oh non !", emotion: "angry", 
                          intensity: 0.9, confidence: 0.8, triggers: ["oh", "non"] 
                        },
                        { 
                          start: 4, end: 6, text: "Hmm...", emotion: "confused", 
                          intensity: 0.6, confidence: 0.7, triggers: ["hmm"] 
                        }
                      ];
                      console.log('Testing with example segments:', testSegments);
                      // On ne peut pas modifier segments directement, donc on affiche un message
                      alert('Test: Ajoutez d\'abord des segments via l\'analyse audio pour tester l\'export');
                    }}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm"
                  >
                    🧪 Test avec données d'exemple
                  </button>
                )}
              </div>
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
                <button
                  onClick={cancelExport}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  ❌ Annuler l'Export
                </button>
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

          {/* Guide de dépannage */}
          <div className="bg-gradient-to-r from-red-800/20 to-orange-800/20 border border-red-500/30 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-red-300 mb-3">🔧 Problème de timing ?</h4>
            <div className="text-sm text-gray-300 space-y-2">
              <div><strong className="text-orange-300">Vidéo trop courte ?</strong></div>
              <div className="ml-4">• Essayez le mode "Précis" au lieu de "Temps réel"</div>
              <div className="ml-4">• Augmentez le délai supplémentaire (mode précis)</div>
              <div className="ml-4">• Réduisez les FPS (24 au lieu de 30/60)</div>
              <div className="mt-2"><strong className="text-orange-300">Vidéo saccadée ?</strong></div>
              <div className="ml-4">• Essayez le mode "Temps réel"</div>
              <div className="ml-4">• Réduisez la résolution</div>
              <div className="ml-4">• Baissez la qualité</div>
              <div className="mt-2"><strong className="text-orange-300">Export échoue ?</strong></div>
              <div className="ml-4">• Vérifiez les infos de debug</div>
              <div className="ml-4">• Testez un autre navigateur (Chrome/Firefox)</div>
              <div className="ml-4">• Réduisez la durée/complexité</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoExporter;
