import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { EmotionSegment } from '../../utils/intentionAnalyzer';
import type { CustomEmotion } from '../../utils/emotionManager';
import { AssetManager, type AssetFile } from '../../utils/assetManager';
import type { AudioAnalysisData } from '../../utils/audioAnalyzer';
import JSZip from 'jszip';
import * as UPNG from 'upng-js';

// Helper for 2D transformation matrices (future feature)
// type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number };
// TODO: Matrix functions for future transformation features
// const identityMatrix = (): Matrix => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
// const multiplyMatrices = (m1: Matrix, m2: Matrix): Matrix => ({
//   a: m1.a * m2.a + m1.c * m2.b,
//   b: m1.b * m2.a + m1.d * m2.b,
//   c: m1.a * m2.c + m1.c * m2.d,
//   d: m1.b * m2.c + m1.d * m2.d,
//   e: m1.a * m2.e + m1.c * m2.f + m1.e,
//   f: m1.b * m2.e + m1.d * m2.f + m1.f,
// });
// const translateMatrix = (m: Matrix, tx: number, ty: number): Matrix => multiplyMatrices(m, { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty });
// const rotateMatrix = (m: Matrix, rad: number): Matrix => {
//   const cos = Math.cos(rad);
//   const sin = Math.sin(rad);
//   return multiplyMatrices(m, { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
// };
// const scaleMatrix = (m: Matrix, sx: number, sy: number): Matrix => multiplyMatrices(m, { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 });

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
  timingMethod: 'precise' | 'manual';
  frameDelay: number;
}

const VideoExporter: React.FC<VideoExporterProps> = ({ 
  segments, 
  audioFile,
  audioAnalysis = []
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [transparencyWarning, setTransparencyWarning] = useState<string | null>(null);
  const [allAssets, setAllAssets] = useState<AssetFile[]>([]);

  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    width: 800,
    height: 600,
    fps: 30,
    backgroundColor: 'transparent',
    quality: 'high',
    timingMethod: 'precise',
    frameDelay: 0, 
  });

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);

  const [isExportingPng, setIsExportingPng] = useState(false);
  const [pngExportProgress, setPngExportProgress] = useState(0);
  const [pngExportStatus, setPngExportStatus] = useState('');

  const [isExportingApng, setIsExportingApng] = useState(false);
  const [_apngExportProgress, _setApngExportProgress] = useState(0);
  const [_apngExportStatus, _setApngExportStatus] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const loadedAssets = useRef<Map<string, HTMLImageElement>>(new Map());
  const assetManager = useRef(new AssetManager()).current;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force reload assets from localStorage to ensure we have the latest transforms
    const loadAssets = async () => {
      await assetManager.loadAssets();
      const loadedAssets = assetManager.getAllAssets();
      console.log('VideoExporter - Assets loaded:', loadedAssets.map(a => ({ 
        id: a.id, 
        name: a.name, 
        transform: a.transform 
      })));
      setAllAssets(loadedAssets);
    };
    loadAssets();
  }, [segments, assetManager]);

  // Créer une URL pour l'audio si disponible
  useEffect(() => {
    if (audioFile && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioFile);
      audioRef.current.src = audioUrl;
      
      return () => {
        URL.revokeObjectURL(audioUrl);
      };
    }
  }, [audioFile]);

  // Précharger tous les assets des émotions
  useEffect(() => {
    const loadAssetImages = async () => {
      if (!allAssets.length) return;

      const assetFilesToLoad = new Set<AssetFile>();

      // Collect all unique assets from all segments
      for (const segment of segments) {
        if (segment.customEmotion?.assets) {
          for (const assetId of Object.values(segment.customEmotion.assets).flat()) {
            if (assetId && typeof assetId === 'string') {
              const assetFile = allAssets.find(a => a.id === assetId);
              if (assetFile) {
                assetFilesToLoad.add(assetFile);
              }
            }
          }
        }
      }

      // Load images for the collected assets
      for (const assetFile of assetFilesToLoad) {
        if (!loadedAssets.current.has(assetFile.data)) {
          const img = new Image();
          img.src = assetFile.data;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Don't let one failed image stop others
          });
          loadedAssets.current.set(assetFile.data, img);
        }
      }
    };
    
    loadAssetImages();
  }, [segments, allAssets]);

  // Fonction pour détecter les codecs supportés avec priorité pour la transparence
  const getSupportedMimeType = () => {
    // Priorité aux codecs qui supportent la transparence
    const typesWithAlpha = [
      'video/webm;codecs=vp9,opus', // VP9 avec audio
      'video/webm;codecs=vp9',      // VP9 sans audio (meilleur pour transparence)
      'video/webm;codecs=vp8,vorbis', // VP8 avec audio
      'video/webm;codecs=vp8',      // VP8 sans audio
    ];
    
    const fallbackTypes = [
      'video/webm',
      'video/mp4;codecs=h264',
      'video/mp4'
    ];
    
    // Tester d'abord les codecs avec support alpha
    for (const type of typesWithAlpha) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using codec with alpha support:', type);
        return type;
      }
    }
    
    // Fallback si aucun codec avec alpha n'est disponible
    for (const type of fallbackTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using fallback codec (no alpha):', type);
        return type;
      }
    }
    
    console.warn('No supported codec found, using default webm');
    return 'video/webm';
  };

  // Calculer la durée totale
  const getTotalDuration = () => {
    if (segments.length === 0) return 0;
    return Math.max(...segments.map(s => s.end));
  };

  // Rendu d'un personnage basé sur les assets
  const drawCharacterFromAssets = useCallback((
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

    // Rendre les assets de base
    for (const category of renderOrder) {
      const assetId = emotion.assets[category as keyof typeof emotion.assets] as string;
      if (!assetId) continue;

      const assetFile = allAssets.find(a => a.id === assetId);
      const img = assetFile ? loadedAssets.current.get(assetFile.data) : undefined;
      const position = positions[category as keyof typeof positions];
      
      if (img && position && img.complete && assetFile) {
        const transform = assetFile.transform;
        ctx.save();
        
        // Appliquer les transformations personnalisées si elles existent
        const finalX = position.x + (transform?.offsetX || 0);
        const finalY = position.y + (transform?.offsetY || 0);
        const finalScale = position.scale * (transform?.scale || 1);
        const finalRotation = (position.rotation + (transform?.rotation || 0)) * Math.PI / 180;
        
        ctx.translate(finalX, finalY);
        ctx.rotate(finalRotation);
        ctx.scale(finalScale, finalScale);
        
        // Dessiner l'image centrée
        const width = category === 'background' ? exportSettings.width : img.width;
        const height = category === 'background' ? exportSettings.height : img.height;
        
        if (category === 'background') {
          ctx.drawImage(img, -exportSettings.width/2, -exportSettings.height/2, exportSettings.width, exportSettings.height);
        } else {
          ctx.drawImage(img, -width/2, -height/2, width, height);
        }
        
        ctx.restore();
      }
    }

    // Rendre les accessories avec animation audio intégrée
    if (emotion.assets.accessories && Array.isArray(emotion.assets.accessories)) {
      const headAnim = positions.head; // Position animée de la tête

      for (const assetId of emotion.assets.accessories) {
        const assetFile = allAssets.find(a => a.id === assetId);
        if (!assetFile) continue;

        const img = loadedAssets.current.get(assetFile.data);
        
        if (img && img.complete) {
          const transform = assetFile.transform || { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };

          // Facteurs d'échelle pour correspondre à l'éditeur  
          const POSITION_SCALE_FACTOR = 2.5;
          const SIZE_SCALE_FACTOR = 0.5;

          ctx.save();
          
          // 1. Se positionner à la position animée de la tête
          ctx.translate(headAnim.x, headAnim.y);
          
          // 2. Appliquer l'animation de la tête (rotation et échelle)
          ctx.rotate(headAnim.rotation);
          ctx.scale(headAnim.scale, headAnim.scale);
          
          // 3. Appliquer le décalage de l'asset (relatif à la tête)
          const scaledOffsetX = transform.offsetX * POSITION_SCALE_FACTOR;
          const scaledOffsetY = transform.offsetY * POSITION_SCALE_FACTOR;
          ctx.translate(scaledOffsetX, scaledOffsetY);
          
          // 4. Appliquer la rotation de l'asset
          ctx.rotate(transform.rotation * Math.PI / 180);
          
          // 5. Appliquer l'échelle de l'asset
          const scaledScale = transform.scale * SIZE_SCALE_FACTOR;
          ctx.scale(scaledScale, scaledScale);
          
          // 6. Dessiner l'image centrée
          const width = img.width || 50;
          const height = img.height || 50;
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          
          ctx.restore();
        }
      }
    }
  }, [allAssets, exportSettings]);

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
  const drawFrame = useCallback((time: number, onFrameDrawn?: () => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: true, // Important pour toBlob
      colorSpace: 'srgb'
    });
    if (!ctx) return;

    // Configurer le canvas avec support alpha approprié
    canvas.width = exportSettings.width;
    canvas.height = exportSettings.height;

    // Nettoyer le canvas selon le mode de transparence
    if (exportSettings.backgroundColor === 'transparent') {
      // Pour la transparence, utiliser clearRect qui préserve l'alpha
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // S'assurer que le contexte utilise l'alpha correctement
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      
      // Vérifier que le canvas a bien un canal alpha
      const imageData = ctx.getImageData(0, 0, 1, 1);
      if (imageData.data.length !== 4) {
        console.warn('Canvas may not support alpha channel properly');
      }
    } else {
      // Pour les fonds opaques, utiliser fillRect
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

    // Callback pour signaler que le dessin est terminé
    onFrameDrawn?.();

    // Debug info overlay disabled for video export
  }, [segments, exportSettings, audioAnalysis, allAssets, drawCharacterFromAssets]);

  // Animation de preview - logique simplifiée et corrigée
  useEffect(() => {
    if (!isPreviewPlaying) return;

    const totalDuration = getTotalDuration();
    if (totalDuration === 0) return;

    let animationId: number;
    let startTime = performance.now() - previewTime * 1000;

    const animate = (now: number) => {
      const newTime = Math.min((now - startTime) / 1000, totalDuration);
      
      setPreviewTime(newTime);
      drawFrame(newTime);
      
      if (newTime < totalDuration) {
        animationId = requestAnimationFrame(animate);
      } else {
        setIsPreviewPlaying(false);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPreviewPlaying, drawFrame]);

  // Auto-scroll for timeline
  useEffect(() => {
    if (activeSegmentRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = activeSegmentRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();

      if (elementRect.bottom > containerRect.bottom || elementRect.top < containerRect.top) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [previewTime]);

  // Dessiner la première frame au montage et quand les segments changent
  useEffect(() => {
    drawFrame(previewTime);
  }, [drawFrame, previewTime, segments]);

  // Redessiner quand le temps change (pour le scrubbing manuel)
  useEffect(() => {
    if (!isPreviewPlaying) {
      drawFrame(previewTime);
    }
  }, [previewTime, drawFrame, isPreviewPlaying]);

  // Test de support de la transparence par le navigateur
  const testTransparencySupport = useCallback(() => {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 10;
    testCanvas.height = 10;
    
    const ctx = testCanvas.getContext('2d', { alpha: true });
    if (!ctx) return false;
    
    // Dessiner un pixel transparent
    ctx.clearRect(0, 0, 10, 10);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(5, 5, 1, 1);
    
    // Tenter de capturer le stream
    try {
      const stream = testCanvas.captureStream(1);
      const track = stream.getVideoTracks()[0];
      
      if (!track) return false;
      
      // Tester différents codecs
      const supportedCodecs = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      
      for (const codec of supportedCodecs) {
        if (MediaRecorder.isTypeSupported(codec)) {
          console.log(`Transparency test: ${codec} is supported`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Transparency test failed:', error);
      return false;
    }
  }, []);

  // Export vidéo
  const startExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Initialisation...');
    chunksRef.current = [];

    try {
      // Vérifier que le canvas supporte bien l'alpha
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas non disponible');
      }

      const ctx = canvas.getContext('2d', { 
        alpha: true,
        willReadFrequently: false,
        colorSpace: 'srgb'
      });
      
      if (!ctx) {
        throw new Error('Impossible d\'obtenir le contexte 2D avec alpha');
      }

      // Configurer explicitement le canvas pour l'alpha
      canvas.width = exportSettings.width;
      canvas.height = exportSettings.height;

      // Test préliminaire de l'alpha
      if (exportSettings.backgroundColor === 'transparent') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const testData = ctx.getImageData(0, 0, 1, 1);
        console.log('Canvas alpha test - pixel data length:', testData.data.length);
        console.log('Canvas alpha test - alpha value:', testData.data[3]);
      }

      // Capturer le stream du canvas avec alpha activé pour la transparence
      const stream = canvas.captureStream(exportSettings.fps);
      
      // Vérifier que le stream supporte l'alpha
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log('Video track settings:', settings);
      }

      const mimeType = getSupportedMimeType();
      console.log('Using MIME type for export:', mimeType);
      
      // Configuration optimisée pour la transparence
      const getBitrate = () => {
        switch (exportSettings.quality) {
          case 'high': return 10000000; // Augmenté pour préserver l'alpha
          case 'medium': return 6000000;
          default: return 3000000;
        }
      };

      const recorderOptions: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: getBitrate(),
      };

      // Options spéciales pour VP9 avec transparence
      if (mimeType.includes('vp9') && exportSettings.backgroundColor === 'transparent') {
        // VP9 supportant l'alpha - augmenter le bitrate
        recorderOptions.videoBitsPerSecond = getBitrate() * 1.5;
        console.log('Enhanced VP9 configuration for alpha channel');
      }

      console.log('MediaRecorder options:', recorderOptions);
      mediaRecorderRef.current = new MediaRecorder(stream, recorderOptions);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setExportedVideoUrl(url);
        
        // Diagnostic pour la transparence
        if (exportSettings.backgroundColor === 'transparent') {
          console.log('Transparent video export completed');
          console.log('Blob size:', blob.size, 'bytes');
          console.log('MIME type used:', blob.type);
          
          // Créer un élément vidéo temporaire pour tester
          const testVideo = document.createElement('video');
          testVideo.src = url;
          testVideo.onloadedmetadata = () => {
            console.log('Video dimensions:', testVideo.videoWidth, 'x', testVideo.videoHeight);
            console.log('Video duration:', testVideo.duration, 'seconds');
          };
        }
        
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

  const startPngExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    setIsExportingPng(true);
    setPngExportProgress(0);
    setPngExportStatus('Initialisation de l\'export PNG...');

    try {
      const zip = new JSZip();
      const totalDuration = getTotalDuration();
      const totalFrames = Math.ceil(totalDuration * exportSettings.fps);

      setPngExportStatus(`Génération de ${totalFrames} images...`);

      for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame / exportSettings.fps;
        
        const blob = await new Promise<Blob | null>(resolve => {
          drawFrame(time, () => {
            canvas.toBlob(resolve, 'image/png');
          });
        });

        if (blob) {
          zip.file(`frame-${String(frame).padStart(5, '0')}.png`, blob);
        }

        setPngExportProgress((frame / totalFrames) * 100);
        if (frame % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      setPngExportStatus('Compression en ZIP...');
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autochar-png-sequence-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setPngExportStatus('Export PNG terminé !');
    } catch (error) {
      console.error('Erreur durant l\'export PNG:', error);
      setPngExportStatus(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsExportingPng(false);
    }
  }, [segments, exportSettings, drawFrame]);

  const startApngExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    setIsExportingApng(true);
    _setApngExportProgress(0);
    _setApngExportStatus('Initialisation de l\'export APNG...');

    try {
      const totalDuration = getTotalDuration();
      const totalFrames = Math.ceil(totalDuration * exportSettings.fps);
      const frameDelay = 1000 / exportSettings.fps;

      const frameBuffers: ArrayBuffer[] = [];
      const frameDelays: number[] = [];

      _setApngExportStatus(`Génération de ${totalFrames} images...`);

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error("Impossible d'obtenir le contexte 2D pour l'export APNG");
      }

      for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame / exportSettings.fps;
        
        drawFrame(time);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frameBuffers.push(imageData.data.buffer);
        frameDelays.push(frameDelay);

        _setApngExportProgress((frame / totalFrames) * 100);
        if (frame % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      _setApngExportStatus('Encodage en APNG...');
      const apngBlob = UPNG.encode(frameBuffers, canvas.width, canvas.height, 0, frameDelays);

      const url = URL.createObjectURL(new Blob([apngBlob], { type: 'image/png' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `autochar-animation-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      _setApngExportStatus('Export APNG terminé !');
    } catch (error) {
      console.error('Erreur durant l\'export APNG:', error);
      _setApngExportStatus(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsExportingApng(false);
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
      
      // Déterminer l'extension basée sur le codec utilisé
      const usedMimeType = getSupportedMimeType();
      const extension = usedMimeType.includes('mp4') ? 'mp4' : 'webm';
      const isTransparent = exportSettings.backgroundColor === 'transparent';
      
      let transparencyNote = '';
      if (isTransparent) {
        if (usedMimeType.includes('vp9') || usedMimeType.includes('vp8')) {
          transparencyNote = '-transparent';
          console.log('✅ Video exported with alpha channel support');
        } else {
          transparencyNote = '-no-alpha';
          console.log('⚠️ Video exported without alpha channel support (codec limitation)');
        }
      }
      
      a.download = `autochar-animation${transparencyNote}-${Date.now()}.${extension}`;
      
      // Logging pour debug
      console.log('Download info:', {
        filename: a.download,
        mimeType: usedMimeType,
        isTransparent,
        supportsAlpha: usedMimeType.includes('vp9') || usedMimeType.includes('vp8')
      });
      
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
    const newPlayingState = !isPreviewPlaying;
    setIsPreviewPlaying(newPlayingState);
    
    // Synchroniser l'audio avec la preview
    if (audioRef.current) {
      if (newPlayingState) {
        audioRef.current.currentTime = previewTime;
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  };

  const seekPreview = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, getTotalDuration()));
    setPreviewTime(clampedTime);
    
    // Synchroniser l'audio
    if (audioRef.current) {
      audioRef.current.currentTime = clampedTime;
    }
    
    // Mettre en pause si on scrub manuellement
    if (isPreviewPlaying) {
      setIsPreviewPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  // Initialiser le canvas avec support alpha dès le montage
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Force canvas configuration for alpha support
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: false,
      colorSpace: 'srgb',
      desynchronized: false
    });
    
    if (!ctx) {
      console.error('Failed to get canvas context with alpha support');
      return;
    }

    // Vérifier que l'alpha est bien supporté
    console.log('Canvas context created with alpha support');
    
    // Test initial de l'alpha
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const testData = ctx.getImageData(0, 0, 1, 1);
    console.log('Initial alpha test - data length:', testData.data.length);
    
    if (testData.data.length === 4) {
      console.log('✅ Canvas alpha channel confirmed');
    } else {
      console.warn('⚠️ Canvas may not support alpha properly');
    }

    // Dessiner la première frame
    drawFrame(0);
  }, [drawFrame]);

  // Vérifier le support de la transparence au montage
  useEffect(() => {
    const isSupported = testTransparencySupport();
    if (!isSupported && exportSettings.backgroundColor === 'transparent') {
      setTransparencyWarning('Votre navigateur pourrait ne pas supporter la transparence vidéo. Utilisez Chrome/Edge pour de meilleurs résultats.');
    } else {
      setTransparencyWarning(null);
    }
  }, [testTransparencySupport, exportSettings.backgroundColor]);

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
      {/* Audio element caché pour la lecture synchronisée */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={(e) => {
          if (isPreviewPlaying) {
            const currentTime = (e.target as HTMLAudioElement).currentTime;
            setPreviewTime(currentTime);
          }
        }}
        onEnded={() => setIsPreviewPlaying(false)}
      />
      
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">🎬 Export Vidéo</h3>
        <div className="text-sm text-gray-400 flex items-center gap-4">
          <span>{segments.length} segment(s) | {getTotalDuration().toFixed(1)}s</span>
          {audioFile && (
            <span className="text-green-400 flex items-center gap-1">
              🔊 Audio disponible
            </span>
          )}
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
            style={{ 
              maxHeight: '300px',
              // Crucial for alpha preservation
              imageRendering: 'crisp-edges'
            }}
            // Force alpha channel support at the DOM level
            data-alpha="true"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">Width</label>
          <input 
            type="number" 
            value={exportSettings.width}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => setExportSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">Height</label>
          <input 
            type="number" 
            value={exportSettings.height}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => setExportSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">FPS</label>
          <select 
            value={exportSettings.fps}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
          >
            <option value="24">24</option>
            <option value="30">30</option>
            <option value="60">60</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">Background</label>
          <select 
            value={exportSettings.backgroundColor}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => setExportSettings(prev => ({ ...prev, backgroundColor: e.target.value as ExportSettings['backgroundColor'] }))}
          >
            <option value="transparent">Transparent</option>
            <option value="white">White</option>
            <option value="black">Black</option>
            <option value="green">Green Screen</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">Quality</label>
          <select 
            value={exportSettings.quality}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => setExportSettings(prev => ({ ...prev, quality: e.target.value as ExportSettings['quality'] }))}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Avertissement de transparence */}
      {transparencyWarning && (
        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xl">⚠️</span>
            <p className="text-yellow-200 text-sm">{transparencyWarning}</p>
          </div>
        </div>
      )}

      {/* Diagnostic de transparence pour le débogage */}
      {exportSettings.backgroundColor === 'transparent' && (
        <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400 text-xl">🔍</span>
            <h4 className="text-blue-200 font-medium">Diagnostic de transparence</h4>
          </div>
          <div className="text-blue-200 text-sm space-y-1">
            <p>Codec sélectionné: <span className="font-mono text-blue-100">{getSupportedMimeType()}</span></p>
            <p>Support VP9: {MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? '✅' : '❌'}</p>
            <p>Support VP8: {MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? '✅' : '❌'}</p>
            <p>Note: Seuls VP9 et VP8 WebM supportent la transparence alpha.</p>
          </div>
        </div>
      )}

      {/* Boutons d'export */}
      <div className="flex items-center gap-4">
        {!isExporting && !exportedVideoUrl && !isExportingPng && (
          <>
            <button
              onClick={startExport}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              🎬 Exporter Vidéo
            </button>
            <button
              onClick={startPngExport}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              🖼️ Exporter PNGs
            </button>
            <button
              onClick={startApngExport}
              className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              🌈 Exporter APNG
            </button>
          </>
        )}

        {(isExporting || isExportingPng || isExportingApng) && (
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={stopExport} // Note: stopExport ne gère pas l'arrêt du PNG
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors"
              disabled={isExportingPng} // Désactiver l'arrêt pour l'export PNG pour l'instant
            >
              ⏹️ Arrêter
            </button>
            <div className="flex-1">
              <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full transition-all duration-300 bg-gradient-to-r from-green-400 to-blue-500"
                  style={{ width: `${isExporting ? exportProgress : pngExportProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">{isExporting ? exportStatus : pngExportStatus}</p>
            </div>
          </div>
        )}


        {exportedVideoUrl && !isExporting && !isExportingPng && (
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

      {/* Avertissement de transparence */}
      {transparencyWarning && (
        <div className="bg-yellow-800 p-4 rounded-lg">
          <p className="text-yellow-100 text-sm">
            ⚠️ {transparencyWarning}
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoExporter;
