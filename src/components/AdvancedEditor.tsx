import React, { useState, useRef, useEffect } from 'react';
import { emotionManager, type CustomEmotion } from '../utils/emotionManager';
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
  const [activeTab, setActiveTab] = useState<'emotions' | 'assets'>('emotions');
  const [assets, setAssets] = useState<AssetFile[]>([]);
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<AssetFile['category']>('head');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysisData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAssetUpload, setShowAssetUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetPickerCategory, setAssetPickerCategory] = useState<keyof CustomEmotion['assets']>('head');

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
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      description: 'Décrivez cette émotion et ses déclencheurs',
      assets: {},
      assetTransforms: {
        head: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
        face: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
        body: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
        leftArm: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
        rightArm: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
        leftLeg: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
        rightLeg: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 },
        background: { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }
      },
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
      const analysis = await audioAnalyzer.analyzeFullAudio();
      setAudioAnalysis(analysis);
    } catch (error) {
      alert(`Erreur analyse audio: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    onSave(emotions);
  };

  // Filtrer les assets par catégorie
  const assetsByCategory = assets.filter(asset => asset.category === selectedAssetCategory);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">🎭 Éditeur de Personnages</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                💾 Sauvegarder
              </button>
              <button
                onClick={onBackToMain}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-screen">
          {/* Sidebar - Navigation des tabs */}
          <div className="col-span-2">
            <div className="bg-gray-800 rounded-lg p-4 h-full">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('emotions')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'emotions' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  🎭 Émotions
                </button>
                <button
                  onClick={() => setActiveTab('assets')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'assets' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  🖼️ Assets
                </button>
              </nav>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="col-span-7">
            {activeTab === 'emotions' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">🎭 Gestion des Émotions</h2>
                  <button
                    onClick={handleAddEmotion}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    ➕ Nouvelle Émotion
                  </button>
                </div>

                {/* Liste des émotions */}
                <div className="space-y-4 mb-8">
                  {emotions.map((emotion) => (
                    <div
                      key={emotion.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedEmotion?.id === emotion.id 
                          ? 'border-blue-500 bg-blue-900/30' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedEmotion(emotion)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: emotion.color }}
                          ></div>
                          <h3 className="font-bold">{emotion.displayName}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateEmotion(emotion.id);
                            }}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded"
                            title="Dupliquer"
                          >
                            📋
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEmotion(emotion.id);
                            }}
                            className="text-red-400 hover:text-red-300 p-1 rounded"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mt-2">{emotion.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.keys(emotion.assets).map(asset => (
                          <span key={asset} className="bg-gray-600 text-xs px-2 py-1 rounded">
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Éditeur d'émotion sélectionnée */}
                {selectedEmotion && (
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-bold mb-4">✏️ Éditer : {selectedEmotion.displayName}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nom d'affichage</label>
                        <input
                          type="text"
                          value={selectedEmotion.displayName}
                          onChange={(e) => handleUpdateEmotion({ displayName: e.target.value })}
                          className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Couleur</label>
                        <input
                          type="color"
                          value={selectedEmotion.color}
                          onChange={(e) => handleUpdateEmotion({ color: e.target.value })}
                          className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={selectedEmotion.description}
                        onChange={(e) => handleUpdateEmotion({ description: e.target.value })}
                        className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white h-20 resize-none"
                        placeholder="Décrivez cette émotion..."
                      />
                    </div>

                    {/* Gestion des triggers */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">🎯 Déclencheurs (mots-clés)</label>
                      <div className="bg-gray-600 border border-gray-500 rounded-lg p-3">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedEmotion.description.split(',').map((trigger, index) => (
                            trigger.trim() && (
                              <span key={index} className="bg-purple-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                                {trigger.trim()}
                                <button
                                  onClick={() => {
                                    const triggers = selectedEmotion.description.split(',').map(t => t.trim()).filter(t => t);
                                    triggers.splice(index, 1);
                                    handleUpdateEmotion({ description: triggers.join(', ') });
                                  }}
                                  className="text-purple-200 hover:text-white ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            )
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ajouter un déclencheur..."
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                const newTrigger = input.value.trim();
                                if (newTrigger) {
                                  const currentTriggers = selectedEmotion.description.split(',').map(t => t.trim()).filter(t => t);
                                  if (!currentTriggers.includes(newTrigger)) {
                                    currentTriggers.push(newTrigger);
                                    handleUpdateEmotion({ description: currentTriggers.join(', ') });
                                  }
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const input = document.querySelector('input[placeholder="Ajouter un déclencheur..."]') as HTMLInputElement;
                              const newTrigger = input?.value.trim();
                              if (newTrigger) {
                                const currentTriggers = selectedEmotion.description.split(',').map(t => t.trim()).filter(t => t);
                                if (!currentTriggers.includes(newTrigger)) {
                                  currentTriggers.push(newTrigger);
                                  handleUpdateEmotion({ description: currentTriggers.join(', ') });
                                }
                                input.value = '';
                              }
                            }}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Ajouter
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Ces mots-clés déterminent quand cette émotion sera déclenchée lors de l'analyse audio
                        </p>
                      </div>
                    </div>

                    {/* Paramètres d'animation */}
                    <div className="mt-6">
                      <h4 className="font-bold mb-3">⚙️ Paramètres d'Animation</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Réactivité Audio ({selectedEmotion.animationSettings.audioReactivity})
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={selectedEmotion.animationSettings.audioReactivity}
                            onChange={(e) => handleUpdateEmotion({
                              animationSettings: {
                                ...selectedEmotion.animationSettings,
                                audioReactivity: parseFloat(e.target.value)
                              }
                            })}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Amplitude ({selectedEmotion.animationSettings.movement.amplitude}px)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={selectedEmotion.animationSettings.movement.amplitude}
                            onChange={(e) => handleUpdateEmotion({
                              animationSettings: {
                                ...selectedEmotion.animationSettings,
                                movement: {
                                  ...selectedEmotion.animationSettings.movement,
                                  amplitude: parseFloat(e.target.value)
                                }
                              }
                            })}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Éléments réactifs au son</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedEmotion.animationSettings.reactiveElements).map(([element, active]) => (
                            <button
                              key={element}
                              onClick={() => handleUpdateEmotion({
                                animationSettings: {
                                  ...selectedEmotion.animationSettings,
                                  reactiveElements: {
                                    ...selectedEmotion.animationSettings.reactiveElements,
                                    [element]: !active
                                  }
                                }
                              })}
                              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                active ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                              }`}
                            >
                              {element}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sélecteur d'assets */}
                    <div className="mt-6">
                      <h4 className="font-bold mb-3">🖼️ Assets assignés</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {['head', 'face', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'background'].map((category) => (
                          <div
                            key={category}
                            className="bg-gray-600 border border-gray-500 rounded-lg p-3 text-center min-h-24 flex flex-col items-center justify-center relative group"
                          >
                            <div className="text-xs font-medium text-gray-300 mb-1">{category}</div>
                            {selectedEmotion.assets[category as keyof CustomEmotion['assets']] ? (
                              <div className="relative flex-1 flex items-center justify-center">
                                <img
                                  src={selectedEmotion.assets[category as keyof CustomEmotion['assets']] as string}
                                  alt={category}
                                  className="max-w-full max-h-12 object-contain"
                                />
                                <button
                                  onClick={() => handleUpdateEmotion({
                                    assets: {
                                      ...selectedEmotion.assets,
                                      [category]: undefined
                                    }
                                  })}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center">
                                <button
                                  onClick={() => {
                                    setAssetPickerCategory(category as keyof CustomEmotion['assets']);
                                    setShowAssetPicker(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded transition-colors"
                                >
                                  Choisir
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ajustements de position/taille pour chaque asset */}
                    <div className="mt-6">
                      <h4 className="text-lg font-bold mb-4">⚙️ Ajustements des Assets</h4>
                      <div className="space-y-4">
                        {Object.entries(selectedEmotion.assets).map(([category, assetData]) => {
                          if (!assetData) return null;
                          
                          const transform = selectedEmotion.assetTransforms?.[category as keyof typeof selectedEmotion.assetTransforms] || {
                            offsetX: 0,
                            offsetY: 0,
                            scale: 1,
                            rotation: 0
                          };

                          return (
                            <div key={category} className="bg-gray-700 p-4 rounded-lg">
                              <div className="flex items-center gap-3 mb-3">
                                <img 
                                  src={assetData}
                                  alt={category}
                                  className="w-8 h-8 object-contain"
                                />
                                <h5 className="font-medium capitalize">{category}</h5>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Position X</label>
                                  <input
                                    type="range"
                                    min="-100"
                                    max="100"
                                    value={transform.offsetX}
                                    onChange={(e) => {
                                      const newTransforms = {
                                        ...selectedEmotion.assetTransforms,
                                        [category]: {
                                          ...transform,
                                          offsetX: parseInt(e.target.value)
                                        }
                                      };
                                      handleUpdateEmotion({ assetTransforms: newTransforms });
                                    }}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <span className="text-xs text-gray-400">{transform.offsetX}px</span>
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Position Y</label>
                                  <input
                                    type="range"
                                    min="-100"
                                    max="100"
                                    value={transform.offsetY}
                                    onChange={(e) => {
                                      const newTransforms = {
                                        ...selectedEmotion.assetTransforms,
                                        [category]: {
                                          ...transform,
                                          offsetY: parseInt(e.target.value)
                                        }
                                      };
                                      handleUpdateEmotion({ assetTransforms: newTransforms });
                                    }}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <span className="text-xs text-gray-400">{transform.offsetY}px</span>
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Taille</label>
                                  <input
                                    type="range"
                                    min="0.1"
                                    max="3"
                                    step="0.1"
                                    value={transform.scale}
                                    onChange={(e) => {
                                      const newTransforms = {
                                        ...selectedEmotion.assetTransforms,
                                        [category]: {
                                          ...transform,
                                          scale: parseFloat(e.target.value)
                                        }
                                      };
                                      handleUpdateEmotion({ assetTransforms: newTransforms });
                                    }}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <span className="text-xs text-gray-400">{transform.scale.toFixed(1)}x</span>
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Rotation</label>
                                  <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={transform.rotation}
                                    onChange={(e) => {
                                      const newTransforms = {
                                        ...selectedEmotion.assetTransforms,
                                        [category]: {
                                          ...transform,
                                          rotation: parseInt(e.target.value)
                                        }
                                      };
                                      handleUpdateEmotion({ assetTransforms: newTransforms });
                                    }}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <span className="text-xs text-gray-400">{transform.rotation}°</span>
                                </div>
                              </div>
                              
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() => {
                                    const newTransforms = {
                                      ...selectedEmotion.assetTransforms,
                                      [category]: {
                                        offsetX: 0,
                                        offsetY: 0,
                                        scale: 1,
                                        rotation: 0
                                      }
                                    };
                                    handleUpdateEmotion({ assetTransforms: newTransforms });
                                  }}
                                  className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded transition-colors"
                                >
                                  Réinitialiser
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">🖼️ Gestion des Assets</h2>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedAssetCategory}
                      onChange={(e) => setSelectedAssetCategory(e.target.value as AssetFile['category'])}
                      className="bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="head">Tête</option>
                      <option value="face">Visage</option>
                      <option value="body">Corps</option>
                      <option value="leftArm">Bras Gauche</option>
                      <option value="rightArm">Bras Droit</option>
                      <option value="leftLeg">Jambe Gauche</option>
                      <option value="rightLeg">Jambe Droite</option>
                      <option value="background">Arrière-plan</option>
                      <option value="accessory">Accessoire</option>
                      <option value="effect">Effet</option>
                    </select>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      ➕ Upload Asset
                    </button>
                  </div>
                </div>

                {/* Upload d'assets */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUploadAsset(e.target.files, selectedAssetCategory)}
                />

                {/* Grille des assets */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {assetsByCategory.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors group"
                    >
                      <div className="relative">
                        <img
                          src={asset.data}
                          alt={asset.name}
                          className="w-full h-20 object-contain rounded"
                        />
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-xs text-gray-300 mt-2 truncate">{asset.name}</p>
                      <p className="text-xs text-gray-500">{asset.category}</p>
                    </div>
                  ))}
                </div>

                {assetsByCategory.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>Aucun asset dans la catégorie "{selectedAssetCategory}"</p>
                    <p className="text-sm mt-2">Cliquez sur "Upload Asset" pour ajouter des images</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview - Panel de droite */}
          <div className="col-span-3">
            <div className="bg-gray-800 rounded-lg p-6 h-full">
              <h3 className="text-lg font-bold mb-4">🎬 Preview</h3>
              
              {selectedEmotion ? (
                <div className="space-y-4">
                  <AssetBasedRenderer
                    emotion={selectedEmotion}
                    audioData={audioAnalysis[0]}
                    width={300}
                    height={200}
                    className="border border-gray-600 rounded-lg"
                    showDebugInfo={false}
                  />
                  
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedEmotion.color }}
                      ></div>
                      <span className="font-bold">{selectedEmotion.displayName}</span>
                    </div>
                    <p className="text-gray-400 text-xs">{selectedEmotion.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(selectedEmotion.assets).map(asset => (
                        <span key={asset} className="bg-gray-600 text-xs px-2 py-1 rounded">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Test audio */}
                  <div className="mt-6">
                    <h4 className="font-bold mb-2">🎵 Test avec Audio</h4>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => e.target.files && handleAudioUpload(e.target.files[0])}
                    />
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      {isAnalyzing ? 'Analyse...' : audioFile ? `🎵 ${audioFile.name}` : 'Charger Audio'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Sélectionnez une émotion pour la prévisualiser</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de sélection d'assets */}
      {showAssetPicker && selectedEmotion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Choisir un asset pour : {assetPickerCategory}
              </h3>
              <button
                onClick={() => setShowAssetPicker(false)}
                className="text-gray-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Filtre par catégorie */}
            <div className="mb-4">
              <select
                value={selectedAssetCategory}
                onChange={(e) => setSelectedAssetCategory(e.target.value as AssetFile['category'])}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="head">Tête</option>
                <option value="face">Visage</option>
                <option value="body">Corps</option>
                <option value="leftArm">Bras Gauche</option>
                <option value="rightArm">Bras Droit</option>
                <option value="leftLeg">Jambe Gauche</option>
                <option value="rightLeg">Jambe Droite</option>
                <option value="background">Arrière-plan</option>
                <option value="accessory">Accessoire</option>
                <option value="effect">Effet</option>
              </select>
            </div>

            {/* Grille d'assets */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
              {assetsByCategory.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors border-2 border-transparent hover:border-blue-500"
                  onClick={() => {
                    handleAssignAssetToEmotion(asset.id, assetPickerCategory);
                    setShowAssetPicker(false);
                  }}
                >
                  <img
                    src={asset.data}
                    alt={asset.name}
                    className="w-full h-16 object-contain rounded mb-2"
                  />
                  <p className="text-xs text-gray-300 text-center truncate">{asset.name}</p>
                </div>
              ))}
            </div>

            {assetsByCategory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun asset dans la catégorie "{selectedAssetCategory}"</p>
                <button
                  onClick={() => {
                    setShowAssetPicker(false);
                    setActiveTab('assets');
                  }}
                  className="mt-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Aller aux assets
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAssetPicker(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'upload */}
      {showAssetUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">📤 Upload en cours...</h3>
            <div className="w-64 bg-gray-700 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">{Math.round(uploadProgress)}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedEditor;
