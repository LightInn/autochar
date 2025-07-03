import React, { useRef, useEffect, useCallback } from 'react';
import type { AssetFile } from '../../utils/assetManager';
import type { CustomEmotion } from '../../utils/emotionManager';

interface CanvasPreviewProps {
  width: number;
  height: number;
  emotion?: CustomEmotion | null;
  assets: AssetFile[];
  pinnedAssets?: Set<string>;
  selectedAsset?: AssetFile | null;
  showDebugMarkers?: boolean;
}

const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  width,
  height,
  emotion,
  assets,
  pinnedAssets = new Set(),
  selectedAsset,
  showDebugMarkers = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map());

  // Précharger les images
  useEffect(() => {
    const loadImages = async () => {
      const imagesToLoad = new Set<AssetFile>();

      // Collecter tous les assets à charger
      if (emotion?.assets?.accessories) {
        for (const assetId of emotion.assets.accessories) {
          const asset = assets.find(a => a.id === assetId);
          if (asset) imagesToLoad.add(asset);
        }
      }

      // Ajouter les assets épinglés
      for (const assetId of pinnedAssets) {
        const asset = assets.find(a => a.id === assetId);
        if (asset) imagesToLoad.add(asset);
      }

      // Ajouter l'asset sélectionné
      if (selectedAsset) {
        imagesToLoad.add(selectedAsset);
      }

      // Charger les images
      for (const asset of imagesToLoad) {
        if (!loadedImages.current.has(asset.data)) {
          const img = new Image();
          img.src = asset.data;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
          loadedImages.current.set(asset.data, img);
        }
      }

      // Redessiner après le chargement
      draw();
    };

    loadImages();
  }, [emotion, assets, pinnedAssets, selectedAsset]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Configurer le canvas
    canvas.width = width;
    canvas.height = height;

    // Nettoyer le canvas
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Facteurs d'échelle ajustés selon la taille du canvas
    const REFERENCE_SIZE = 800; // Taille de référence (VideoExporter par défaut)
    const canvasScale = Math.min(width, height) / REFERENCE_SIZE;
    
    const POSITION_SCALE_FACTOR = 2.5 * canvasScale;
    const SIZE_SCALE_FACTOR = 0.5 * canvasScale;

    // Fonction pour dessiner un asset
    const drawAsset = (asset: AssetFile, opacity = 1, showMarkers = false) => {
      const img = loadedImages.current.get(asset.data);
      if (!img || !img.complete) return;

      const transform = asset.transform || { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };

      ctx.save();
      ctx.globalAlpha = opacity;

      // 1. Aller au centre du canvas
      ctx.translate(centerX, centerY);

      // 2. Appliquer le décalage de l'asset avec facteur d'échelle
      const scaledOffsetX = transform.offsetX * POSITION_SCALE_FACTOR;
      const scaledOffsetY = transform.offsetY * POSITION_SCALE_FACTOR;
      ctx.translate(scaledOffsetX, scaledOffsetY);

      // Debug markers
      if (showMarkers) {
        ctx.fillStyle = 'red';
        ctx.fillRect(-2, -2, 4, 4);
      }

      // 3. Appliquer la rotation de l'asset (convertir degrés en radians)
      ctx.rotate(transform.rotation * Math.PI / 180);

      // 4. Appliquer l'échelle de l'asset avec facteur d'ajustement
      const scaledScale = transform.scale * SIZE_SCALE_FACTOR;
      ctx.scale(scaledScale, scaledScale);

      // 5. Dessiner l'image centrée sur l'origine transformée
      const imgWidth = img.width || 50;
      const imgHeight = img.height || 50;
      ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

      // Debug markers
      if (showMarkers) {
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        ctx.strokeRect(-imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
      }

      ctx.restore();
    };

    // Dessiner les assets de l'émotion
    if (emotion?.assets?.accessories) {
      for (const assetId of emotion.assets.accessories) {
        const asset = assets.find(a => a.id === assetId);
        if (asset) {
          drawAsset(asset, 1, showDebugMarkers);
        }
      }
    }

    // Dessiner les assets épinglés (semi-transparents)
    for (const assetId of pinnedAssets) {
      const asset = assets.find(a => a.id === assetId);
      if (asset && (!emotion?.assets?.accessories?.includes(assetId))) {
        drawAsset(asset, 0.6, showDebugMarkers);
      }
    }

    // Dessiner l'asset sélectionné (avec bordure)
    if (selectedAsset && (!emotion?.assets?.accessories?.includes(selectedAsset.id))) {
      drawAsset(selectedAsset, 1, showDebugMarkers);
      
      // Ajouter une bordure bleue pour l'asset sélectionné
      const transform = selectedAsset.transform || { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.translate(transform.offsetX * POSITION_SCALE_FACTOR, transform.offsetY * POSITION_SCALE_FACTOR);
      ctx.rotate(transform.rotation * Math.PI / 180);
      ctx.scale(transform.scale * SIZE_SCALE_FACTOR, transform.scale * SIZE_SCALE_FACTOR);
      
      const img = loadedImages.current.get(selectedAsset.data);
      if (img && img.complete) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.strokeRect(-img.width / 2 - 2, -img.height / 2 - 2, img.width + 4, img.height + 4);
      }
      ctx.restore();
    }

    // Dessiner un placeholder si aucun asset
    if (!emotion?.assets?.accessories?.length && pinnedAssets.size === 0 && !selectedAsset) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No assets to preview', centerX, centerY);
    }

  }, [width, height, emotion, assets, pinnedAssets, selectedAsset, showDebugMarkers]);

  // Redessiner quand les props changent
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="max-w-full h-auto"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default CanvasPreview;
