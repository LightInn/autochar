import React, { useState, useRef, useEffect } from 'react';
import { emotionManager, type CustomEmotion, type AnimationSettings } from '../utils/emotionManager';
import { assetManager, type AssetFile } from '../utils/assetManager';
import { audioAnalyzer, type AudioAnalysisData } from '../utils/audioAnalyzer';
import AssetBasedRenderer from './AssetBasedRenderer';

interface AdvancedEditorProps {
  onBackToMain: () => void;
  onSave: (emotions: CustomEmotion[]) => void;
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ onBackToMain, onSave }) => {
  const [emotions, setEmotions] = useState<CustomEmotion[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<CustomEmotion | null>(null);
  const [activeTab, setActiveTab] = useState<'emotions' | 'assets' | 'audio'>('emotions');
  const [assets, setAssets] = useState<AssetFile[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysisData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAssetUpload, setShowAssetUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedEmotions = emotionManager.getAllEmotions();
    const loadedAssets = assetManager.getAllAssets();
    
    setEmotions(loadedEmotions);
    setAssets(loadedAssets);
    
    if (loadedEmotions.length > 0) {
      setSelectedEmotion(loadedEmotions[0]);
    }
  };

  // Gestion des émotions
  const handleAddEmotion = () => {
    const newEmotion: Omit<CustomEmotion, 'created' | 'modified'> = {
      id: `emotion_${Date.now()}`,
      name: `emotion_${Date.now()}`,
      displayName: 'Nouvelle Émotion',
      color: '#6B7280',
      description: 'Description de la nouvelle émotion',
      assets: {},
      animationSettings: {
        audioReactivity: 0.5,
        reactiveElements: { head: true, face: false, body: false, arms: false, legs: false },
        movement: { frequency: 2, amplitude: 5, phase: 0 },
        transitionDuration: 400,
        easing: 'ease-out'
      }
    };

    const created = emotionManager.addEmotion(newEmotion);
    setEmotions(emotionManager.getAllEmotions());
    setSelectedEmotion(created);
  };

  const handleUpdateEmotion = (updates: Partial<CustomEmotion>) => {
    if (!selectedEmotion) return;

    const updated = emotionManager.updateEmotion(selectedEmotion.id, updates);
    if (updated) {
      setEmotions(emotionManager.getAllEmotions());
      setSelectedEmotion(updated);
    }
  };

  const handleDeleteEmotion = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette émotion ?')) {
      emotionManager.deleteEmotion(id);
      setEmotions(emotionManager.getAllEmotions());
      setSelectedEmotion(emotions.find(e => e.id !== id) || null);
    }
  };

  const handleDuplicateEmotion = (id: string) => {
    const emotion = emotions.find(e => e.id === id);
    if (emotion) {
      const newName = prompt('Nom de la copie:', `${emotion.displayName} (copie)`);
      if (newName) {
        const duplicated = emotionManager.duplicateEmotion(id, newName);
        if (duplicated) {
          setEmotions(emotionManager.getAllEmotions());
          setSelectedEmotion(duplicated);
        }
      }
    }
  };

  // Gestion des assets
  const handleUploadAsset = async (files: FileList | null, category: AssetFile['category']) => {
    if (!files || files.length === 0) return;

    setShowAssetUpload(true);
    setUploadProgress(0);

    try {
      for (const file of Array.from(files)) {
        await assetManager.uploadFile(file, category, (progress) => {
          setUploadProgress(progress);
        });
      }
      
      const newAssets = assetManager.getAllAssets();
      setAssets(newAssets);
      setShowAssetUpload(false);
    } catch (error) {
      alert(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setShowAssetUpload(false);
    }
  };

  const handleDeleteAsset = (id: string) => {
    if (window.confirm('Supprimer cet asset ?')) {
      assetManager.deleteAsset(id);
      setAssets(assetManager.getAllAssets());
    }
  };

  const handleAssignAssetToEmotion = (assetId: string, category: keyof CustomEmotion['assets']) => {
    if (!selectedEmotion) return;

    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      const updatedAssets = {
        ...selectedEmotion.assets,
        [category]: asset.data
      };
      
      handleUpdateEmotion({ assets: updatedAssets });
    }
  };

  // Gestion de l'audio
  const handleAudioUpload = async (file: File) => {
    setAudioFile(file);
    setIsAnalyzing(true);
    
    try {
      await audioAnalyzer.loadAudioFile(file);
      const analysis = await audioAnalyzer.analyzeFullAudio((progress) => {
        console.log(`Analyse audio: ${progress.toFixed(1)}%`);
      });
      
      setAudioAnalysis(analysis);
      setIsAnalyzing(false);
    } catch (error) {
      alert(`Erreur lors de l'analyse audio: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setIsAnalyzing(false);
    }
  };

  // Gestion des paramètres d'animation
  const handleUpdateAnimationSettings = (settings: Partial<AnimationSettings>) => {
    if (!selectedEmotion) return;

    const updatedSettings = {
      ...selectedEmotion.animationSettings,
      ...settings
    };

    handleUpdateEmotion({ animationSettings: updatedSettings });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToMain}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-bold text-white">🎨 Éditeur Avancé</h1>
              <span className="text-gray-400 text-sm">Émotions • Assets • Audio</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSave(emotions)}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                💾 Sauvegarder
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'emotions', label: '😊 Émotions', icon: '😊' },
              { id: 'assets', label: '🖼️ Assets', icon: '🖼️' },
              { id: 'audio', label: '🎵 Audio', icon: '🎵' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel principal selon l'onglet actif */}
          <div className="lg:col-span-2">
            {activeTab === 'emotions' && (
              <EmotionEditor
                emotions={emotions}
                selectedEmotion={selectedEmotion}
                onSelectEmotion={setSelectedEmotion}
                onAddEmotion={handleAddEmotion}
                onUpdateEmotion={handleUpdateEmotion}
                onDeleteEmotion={handleDeleteEmotion}
                onDuplicateEmotion={handleDuplicateEmotion}
                onUpdateAnimationSettings={handleUpdateAnimationSettings}
                assets={assets}
                onAssignAsset={handleAssignAssetToEmotion}
              />
            )}

            {activeTab === 'assets' && (
              <AssetManager
                assets={assets}
                onUploadAsset={handleUploadAsset}
                onDeleteAsset={handleDeleteAsset}
                showUploadModal={showAssetUpload}
                uploadProgress={uploadProgress}
                onCloseUploadModal={() => setShowAssetUpload(false)}
              />
            )}

            {activeTab === 'audio' && (
              <AudioManager
                audioFile={audioFile}
                audioAnalysis={audioAnalysis}
                isAnalyzing={isAnalyzing}
                onUploadAudio={handleAudioUpload}
              />
            )}
          </div>

          {/* Panel de preview */}
          <div className="lg:col-span-1">
            <PreviewPanel
              selectedEmotion={selectedEmotion}
              audioAnalysis={audioAnalysis}
              assets={assets}
            />
          </div>
        </div>
      </div>

      {/* Inputs cachés */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
      />
      
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAudioUpload(file);
        }}
      />
    </div>
  );
};

// Composant pour l'édition des émotions
const EmotionEditor: React.FC<{
  emotions: CustomEmotion[];
  selectedEmotion: CustomEmotion | null;
  onSelectEmotion: (emotion: CustomEmotion) => void;
  onAddEmotion: () => void;
  onUpdateEmotion: (updates: Partial<CustomEmotion>) => void;
  onDeleteEmotion: (id: string) => void;
  onDuplicateEmotion: (id: string) => void;
  onUpdateAnimationSettings: (settings: Partial<AnimationSettings>) => void;
  assets: AssetFile[];
  onAssignAsset: (assetId: string, category: keyof CustomEmotion['assets']) => void;
}> = ({
  emotions,
  selectedEmotion,
  onSelectEmotion,
  onAddEmotion,
  onUpdateEmotion,
  onDeleteEmotion,
  onDuplicateEmotion,
  onUpdateAnimationSettings,
  assets,
  onAssignAsset
}) => {
  return (
    <div className="space-y-6">
      {/* Liste des émotions */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Émotions</h3>
          <button
            onClick={onAddEmotion}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ➕ Ajouter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emotions.map(emotion => (
            <div
              key={emotion.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedEmotion?.id === emotion.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-700'
              }`}
              onClick={() => onSelectEmotion(emotion)}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: emotion.color }}
                />
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateEmotion(emotion.id);
                    }}
                    className="text-gray-400 hover:text-white text-sm"
                    title="Dupliquer"
                  >
                    📋
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEmotion(emotion.id);
                    }}
                    className="text-gray-400 hover:text-red-400 text-sm"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="text-white font-semibold">{emotion.displayName}</div>
              <div className="text-gray-400 text-sm">{emotion.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Édition de l'émotion sélectionnée */}
      {selectedEmotion && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">
            Édition : {selectedEmotion.displayName}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paramètres généraux */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Paramètres généraux</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom d'affichage
                </label>
                <input
                  type="text"
                  value={selectedEmotion.displayName}
                  onChange={(e) => onUpdateEmotion({ displayName: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={selectedEmotion.description}
                  onChange={(e) => onUpdateEmotion({ description: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Couleur
                </label>
                <input
                  type="color"
                  value={selectedEmotion.color}
                  onChange={(e) => onUpdateEmotion({ color: e.target.value })}
                  className="w-full bg-gray-700 rounded px-3 py-2 h-10"
                />
              </div>
            </div>

            {/* Paramètres d'animation */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Animation</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Réactivité audio: {selectedEmotion.animationSettings.audioReactivity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedEmotion.animationSettings.audioReactivity}
                  onChange={(e) => onUpdateAnimationSettings({ 
                    audioReactivity: parseFloat(e.target.value) 
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fréquence: {selectedEmotion.animationSettings.movement.frequency} Hz
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={selectedEmotion.animationSettings.movement.frequency}
                  onChange={(e) => onUpdateAnimationSettings({ 
                    movement: {
                      ...selectedEmotion.animationSettings.movement,
                      frequency: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amplitude: {selectedEmotion.animationSettings.movement.amplitude}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={selectedEmotion.animationSettings.movement.amplitude}
                  onChange={(e) => onUpdateAnimationSettings({ 
                    movement: {
                      ...selectedEmotion.animationSettings.movement,
                      amplitude: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Éléments réactifs */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Éléments réactifs</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(selectedEmotion.animationSettings.reactiveElements).map(([element, active]) => (
                <label key={element} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => onUpdateAnimationSettings({
                      reactiveElements: {
                        ...selectedEmotion.animationSettings.reactiveElements,
                        [element]: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-white capitalize">{element}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour la gestion des assets
const AssetManager: React.FC<{
  assets: AssetFile[];
  onUploadAsset: (files: FileList | null, category: AssetFile['category']) => void;
  onDeleteAsset: (id: string) => void;
  showUploadModal: boolean;
  uploadProgress: number;
  onCloseUploadModal: () => void;
}> = ({ assets, onUploadAsset, onDeleteAsset, showUploadModal, uploadProgress, onCloseUploadModal }) => {
  const [selectedCategory, setSelectedCategory] = useState<AssetFile['category']>('head');
  
  const categories: { value: AssetFile['category']; label: string; icon: string }[] = [
    { value: 'head', label: 'Tête', icon: '🧠' },
    { value: 'face', label: 'Visage', icon: '😊' },
    { value: 'body', label: 'Corps', icon: '👕' },
    { value: 'leftArm', label: 'Bras Gauche', icon: '🤳' },
    { value: 'rightArm', label: 'Bras Droit', icon: '👋' },
    { value: 'leftLeg', label: 'Jambe Gauche', icon: '🦵' },
    { value: 'rightLeg', label: 'Jambe Droite', icon: '🦵' },
    { value: 'background', label: 'Arrière-plan', icon: '🌄' },
    { value: 'accessory', label: 'Accessoire', icon: '🎩' },
    { value: 'effect', label: 'Effet', icon: '✨' }
  ];

  const assetsInCategory = assets.filter(asset => asset.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Bibliothèque d'Assets</h3>
          <div className="text-sm text-gray-400">
            {assets.length} assets • {(assets.reduce((sum, a) => sum + a.size, 0) / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>

        {/* Sélection de catégorie */}
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`p-3 rounded-lg text-sm transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="mb-6">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onUploadAsset(e.target.files, selectedCategory)}
            className="hidden"
            id="asset-upload"
          />
          <label
            htmlFor="asset-upload"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            📁 Uploader vers {categories.find(c => c.value === selectedCategory)?.label}
          </label>
        </div>

        {/* Liste des assets */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {assetsInCategory.map(asset => (
            <div key={asset.id} className="bg-gray-700 rounded-lg p-3">
              <div className="aspect-square bg-gray-600 rounded mb-2 flex items-center justify-center overflow-hidden">
                <img
                  src={asset.data}
                  alt={asset.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="text-white text-xs truncate" title={asset.name}>
                {asset.name}
              </div>
              <div className="text-gray-400 text-xs">
                {(asset.size / 1024).toFixed(1)} KB
              </div>
              <button
                onClick={() => onDeleteAsset(asset.id)}
                className="w-full mt-2 text-red-400 hover:text-red-300 text-xs"
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}
        </div>

        {assetsInCategory.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Aucun asset dans cette catégorie
          </div>
        )}
      </div>

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Upload en cours...</h3>
            <div className="w-64 bg-gray-600 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-center text-gray-300 mt-2">
              {uploadProgress.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour la gestion audio
const AudioManager: React.FC<{
  audioFile: File | null;
  audioAnalysis: AudioAnalysisData[];
  isAnalyzing: boolean;
  onUploadAudio: (file: File) => void;
}> = ({ audioFile, audioAnalysis, isAnalyzing, onUploadAudio }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Analyse Audio</h3>

        {/* Upload audio */}
        <div className="mb-6">
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadAudio(file);
            }}
            className="hidden"
            id="audio-upload"
          />
          <label
            htmlFor="audio-upload"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            🎵 Charger un fichier audio
          </label>
        </div>

        {/* Informations du fichier */}
        {audioFile && (
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <div className="text-white font-semibold mb-2">Fichier chargé</div>
            <div className="text-gray-300 text-sm">Nom: {audioFile.name}</div>
            <div className="text-gray-300 text-sm">Taille: {(audioFile.size / 1024 / 1024).toFixed(2)} MB</div>
            <div className="text-gray-300 text-sm">Type: {audioFile.type}</div>
          </div>
        )}

        {/* Statut de l'analyse */}
        {isAnalyzing && (
          <div className="bg-blue-600/20 border border-blue-500/30 p-4 rounded-lg">
            <div className="text-blue-300 font-semibold">Analyse en cours...</div>
            <div className="text-blue-200 text-sm">Extraction des features audio</div>
          </div>
        )}

        {/* Résultats de l'analyse */}
        {audioAnalysis.length > 0 && (
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-white font-semibold mb-3">Résultats de l'analyse</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-300">Points d'analyse:</div>
                <div className="text-white">{audioAnalysis.length}</div>
              </div>
              <div>
                <div className="text-gray-300">Durée:</div>
                <div className="text-white">
                  {audioAnalysis.length > 0 ? audioAnalysis[audioAnalysis.length - 1].timestamp.toFixed(1) : 0}s
                </div>
              </div>
              <div>
                <div className="text-gray-300">Volume moyen:</div>
                <div className="text-white">
                  {(audioAnalysis.reduce((sum, d) => sum + d.volume, 0) / audioAnalysis.length).toFixed(3)}
                </div>
              </div>
              <div>
                <div className="text-gray-300">Énergie moyenne:</div>
                <div className="text-white">
                  {(audioAnalysis.reduce((sum, d) => sum + d.energy, 0) / audioAnalysis.length).toFixed(3)}
                </div>
              </div>
            </div>

            {/* Graphique simple */}
            <div className="mt-4 h-20 bg-gray-600 rounded relative overflow-hidden">
              {audioAnalysis.slice(0, 200).map((data, index) => (
                <div
                  key={index}
                  className="absolute bg-green-400"
                  style={{
                    left: `${(index / 200) * 100}%`,
                    bottom: 0,
                    width: '2px',
                    height: `${data.volume * 100}%`
                  }}
                />
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-1">Volume au fil du temps (aperçu)</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant de preview
const PreviewPanel: React.FC<{
  selectedEmotion: CustomEmotion | null;
  audioAnalysis: AudioAnalysisData[];
  assets: AssetFile[];
}> = ({ selectedEmotion, audioAnalysis, assets }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg sticky top-6">
      <h3 className="text-xl font-bold text-white mb-4">Preview</h3>
      
      {selectedEmotion ? (
        <div className="space-y-4">
          {/* Aperçu de l'émotion */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: selectedEmotion.color }}
              />
              <div className="text-white font-semibold">{selectedEmotion.displayName}</div>
            </div>
            
            <div className="text-gray-300 text-sm mb-3">{selectedEmotion.description}</div>
            
            {/* Canvas de preview */}
            <AssetBasedRenderer
              emotion={selectedEmotion}
              audioData={audioAnalysis.length > 0 ? audioAnalysis[0] : undefined}
              width={280}
              height={200}
              showDebugInfo={true}
            />
          </div>

          {/* Paramètres d'animation */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-white font-semibold mb-3">Animation</div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Réactivité:</span>
                <span className="text-white">{selectedEmotion.animationSettings.audioReactivity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Fréquence:</span>
                <span className="text-white">{selectedEmotion.animationSettings.movement.frequency} Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Amplitude:</span>
                <span className="text-white">{selectedEmotion.animationSettings.movement.amplitude}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Transition:</span>
                <span className="text-white">{selectedEmotion.animationSettings.transitionDuration}ms</span>
              </div>
            </div>
          </div>

          {/* Assets assignés */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-white font-semibold mb-3">Assets</div>
            <div className="text-sm space-y-1">
              {Object.entries(selectedEmotion.assets).map(([category]) => (
                <div key={category} className="flex justify-between">
                  <span className="text-gray-300 capitalize">{category}:</span>
                  <span className="text-green-400">✓</span>
                </div>
              ))}
              {Object.keys(selectedEmotion.assets).length === 0 && (
                <div className="text-gray-400 text-center">Aucun asset assigné</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          Sélectionnez une émotion pour voir le preview
        </div>
      )}
    </div>
  );
};

export default AdvancedEditor;
