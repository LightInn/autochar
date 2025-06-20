import React, { useRef, useEffect, useState } from 'react';
import { type CustomEmotion } from '../utils/emotionManager';
import { type AudioAnalysisData } from '../utils/audioAnalyzer';

interface AssetBasedRendererProps {
  emotion: CustomEmotion;
  audioData?: AudioAnalysisData;
  width?: number;
  height?: number;
  className?: string;
  showDebugInfo?: boolean;
}

interface AssetPosition {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface LoadedAsset {
  image: HTMLImageElement;
  loaded: boolean;
  error: boolean;
}

const AssetBasedRenderer: React.FC<AssetBasedRendererProps> = ({
  emotion,
  audioData,
  width = 400,
  height = 300,
  className = '',
  showDebugInfo = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedAssets, setLoadedAssets] = useState<Map<string, LoadedAsset>>(new Map());
  const [renderTime, setRenderTime] = useState(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Positions par défaut des éléments
  const defaultPositions: Record<string, AssetPosition> = {
    background: { x: 0, y: 0, rotation: 0, scale: 1, offsetX: 0, offsetY: 0 },
    body: { x: width/2, y: height/2 + 30, rotation: 0, scale: 1, offsetX: 0, offsetY: 0 },
    head: { x: width/2, y: height/2 - 50, rotation: 0, scale: 1, offsetX: 0, offsetY: 0 },
    face: { x: width/2, y: height/2 - 50, rotation: 0, scale: 1, offsetX: 0, offsetY: 0 },
    leftArm: { x: width/2 - 60, y: height/2, rotation: -15, scale: 1, offsetX: 0, offsetY: 0 },
    rightArm: { x: width/2 + 60, y: height/2, rotation: 15, scale: 1, offsetX: 0, offsetY: 0 },
    leftLeg: { x: width/2 - 30, y: height/2 + 80, rotation: 0, scale: 1, offsetX: 0, offsetY: 0 },
    rightLeg: { x: width/2 + 30, y: height/2 + 80, rotation: 0, scale: 1, offsetX: 0, offsetY: 0 }
  };

  // Charger les assets de l'émotion
  useEffect(() => {
    const loadAssets = async () => {
      const newLoadedAssets = new Map<string, LoadedAsset>();

      for (const [category, assetData] of Object.entries(emotion.assets)) {
        if (assetData) {
          const asset: LoadedAsset = {
            image: new Image(),
            loaded: false,
            error: false
          };

          asset.image.onload = () => {
            asset.loaded = true;
            setLoadedAssets(prev => new Map(prev.set(`${emotion.id}_${category}`, asset)));
          };

          asset.image.onerror = () => {
            asset.error = true;
            setLoadedAssets(prev => new Map(prev.set(`${emotion.id}_${category}`, asset)));
          };

          asset.image.src = assetData;
          newLoadedAssets.set(`${emotion.id}_${category}`, asset);
        }
      }

      setLoadedAssets(newLoadedAssets);
    };

    loadAssets();
  }, [emotion]);

  // Calcul de l'animation basée sur l'audio
  const calculateAudioAnimation = (time: number, category: string): { offsetX: number; offsetY: number; rotation: number; scale: number } => {
    if (!audioData || !emotion.animationSettings.reactiveElements[category as keyof typeof emotion.animationSettings.reactiveElements]) {
      return { offsetX: 0, offsetY: 0, rotation: 0, scale: 1 };
    }

    const { audioReactivity, movement } = emotion.animationSettings;
    const { frequency, amplitude, phase } = movement;

    // Utiliser les données audio pour moduler l'animation
    const audioIntensity = (audioData.volume + audioData.energy) / 2;
    const audioModulation = audioIntensity * audioReactivity;

    // Oscillation basée sur le temps et les paramètres d'émotion
    const timeOffset = time * frequency + (phase * Math.PI / 180);
    
    // Différents types de mouvement selon l'élément
    let offsetX = 0;
    let offsetY = 0;
    let rotation = 0;
    let scale = 1;

    switch (category) {
      case 'head':
        offsetX = Math.sin(timeOffset) * amplitude * audioModulation;
        offsetY = Math.cos(timeOffset * 0.7) * amplitude * 0.5 * audioModulation;
        rotation = Math.sin(timeOffset * 1.3) * 5 * audioModulation;
        break;
      
      case 'face':
        scale = 1 + Math.sin(timeOffset * 2) * 0.1 * audioModulation;
        break;
      
      case 'body':
        offsetY = Math.sin(timeOffset * 0.5) * amplitude * 0.3 * audioModulation;
        rotation = Math.sin(timeOffset * 0.8) * 3 * audioModulation;
        break;
      
      case 'leftArm':
      case 'rightArm':
        const armMultiplier = category === 'leftArm' ? 1 : -1;
        rotation = Math.sin(timeOffset * 1.5) * 10 * audioModulation * armMultiplier;
        offsetY = Math.cos(timeOffset * 1.2) * amplitude * 0.4 * audioModulation;
        break;
      
      case 'leftLeg':
      case 'rightLeg':
        const legMultiplier = category === 'leftLeg' ? 1 : -1;
        offsetX = Math.sin(timeOffset * 2) * amplitude * 0.2 * audioModulation * legMultiplier;
        break;
    }

    return { offsetX, offsetY, rotation, scale };
  };

  // Fonction de rendu
  const render = (timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;

    // Nettoyer le canvas
    ctx.clearRect(0, 0, width, height);
    
    const currentTime = timestamp / 1000; // Convertir en secondes
    setRenderTime(currentTime);

    // Ordre de rendu des éléments (arrière vers avant)
    const renderOrder = ['background', 'body', 'leftLeg', 'rightLeg', 'leftArm', 'rightArm', 'head', 'face'];

    renderOrder.forEach(category => {
      const assetKey = `${emotion.id}_${category}`;
      const loadedAsset = loadedAssets.get(assetKey);
      
      if (loadedAsset?.loaded) {
        const basePosition = defaultPositions[category] || defaultPositions.body;
        const animation = calculateAudioAnimation(currentTime, category);
        
        ctx.save();
        
        // Appliquer les transformations
        const finalX = basePosition.x + basePosition.offsetX + animation.offsetX;
        const finalY = basePosition.y + basePosition.offsetY + animation.offsetY;
        const finalRotation = basePosition.rotation + animation.rotation;
        const finalScale = basePosition.scale * animation.scale;
        
        ctx.translate(finalX, finalY);
        ctx.rotate((finalRotation * Math.PI) / 180);
        ctx.scale(finalScale, finalScale);
        
        // Dessiner l'asset centré
        const img = loadedAsset.image;
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        ctx.restore();
      } else if (category !== 'background') {
        // Fallback : dessiner une forme basique si l'asset n'est pas chargé
        drawFallbackShape(ctx, category, defaultPositions[category], calculateAudioAnimation(currentTime, category));
      }
    });

    // Informations de debug
    if (showDebugInfo) {
      drawDebugInfo(ctx, currentTime);
    }

    // Continuer l'animation
    animationFrameRef.current = requestAnimationFrame(render);
  };

  // Formes de fallback
  const drawFallbackShape = (
    ctx: CanvasRenderingContext2D, 
    category: string, 
    position: AssetPosition,
    animation: { offsetX: number; offsetY: number; rotation: number; scale: number }
  ) => {
    ctx.save();
    
    const finalX = position.x + position.offsetX + animation.offsetX;
    const finalY = position.y + position.offsetY + animation.offsetY;
    const finalRotation = position.rotation + animation.rotation;
    const finalScale = position.scale * animation.scale;
    
    ctx.translate(finalX, finalY);
    ctx.rotate((finalRotation * Math.PI) / 180);
    ctx.scale(finalScale, finalScale);
    
    ctx.fillStyle = emotion.color;
    ctx.strokeStyle = emotion.color;
    ctx.lineWidth = 2;
    
    switch (category) {
      case 'head':
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        break;
      
      case 'face':
        // Yeux
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-7, -5, 2, 0, Math.PI * 2);
        ctx.arc(7, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bouche selon l'émotion
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        if (emotion.name === 'happy') {
          ctx.arc(0, 5, 8, 0, Math.PI);
        } else if (emotion.name === 'sad') {
          ctx.arc(0, 10, 8, Math.PI, 0);
        } else {
          ctx.moveTo(-5, 8);
          ctx.lineTo(5, 8);
        }
        ctx.stroke();
        break;
      
      case 'body':
        ctx.beginPath();
        ctx.rect(-15, -30, 30, 60);
        ctx.fill();
        break;
      
      case 'leftArm':
      case 'rightArm':
        ctx.beginPath();
        ctx.rect(-5, -25, 10, 50);
        ctx.fill();
        break;
      
      case 'leftLeg':
      case 'rightLeg':
        ctx.beginPath();
        ctx.rect(-8, -25, 16, 50);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  };

  // Informations de debug
  const drawDebugInfo = (ctx: CanvasRenderingContext2D, currentTime: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, 5, 180, 100);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`Émotion: ${emotion.displayName}`, 10, 20);
    ctx.fillText(`Temps: ${currentTime.toFixed(2)}s`, 10, 35);
    ctx.fillText(`Assets chargés: ${Array.from(loadedAssets.values()).filter(a => a.loaded).length}`, 10, 50);
    
    if (audioData) {
      ctx.fillText(`Volume: ${audioData.volume.toFixed(3)}`, 10, 65);
      ctx.fillText(`Énergie: ${audioData.energy.toFixed(3)}`, 10, 80);
      ctx.fillText(`Réactivité: ${emotion.animationSettings.audioReactivity.toFixed(2)}`, 10, 95);
    }
  };

  // Démarrer l'animation
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [emotion, audioData, loadedAssets]);

  // Mettre à jour les dimensions du canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
  }, [width, height]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-500 rounded bg-gray-600"
        style={{ backgroundColor: 'transparent' }}
      />
      
      {/* Indicateur de chargement */}
      {Array.from(loadedAssets.values()).some(asset => !asset.loaded && !asset.error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
          <div className="text-white text-sm">Chargement des assets...</div>
        </div>
      )}
      
      {/* Erreurs de chargement */}
      {Array.from(loadedAssets.values()).some(asset => asset.error) && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
          Erreur de chargement
        </div>
      )}
    </div>
  );
};

export default AssetBasedRenderer;
