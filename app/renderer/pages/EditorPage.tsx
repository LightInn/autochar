import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EmotionManager } from '../utils/emotionManager';
import { AssetManager, type AssetFile } from '../utils/assetManager';
import CanvasPreview from '../components/renderer/CanvasPreview';

type TabType = 'emotions' | 'sets' | 'assets';

interface AssetTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

interface EmotionSet {
  id: string;
  name: string;
  emotions: string[];
}

interface AdvancedEditorProps {
  onBackToMain?: () => void;
  onSave?: (emotions: any[]) => void;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ onBackToMain, onSave }) => {
  const [emotions, setEmotions] = useState<any[]>([]);
  const [assets, setAssets] = useState<AssetFile[]>([]);
  const [emotionSets, setEmotionSets] = useState<EmotionSet[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('emotions');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pinnedAssets, setPinnedAssets] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  // Create manager instances
  const emotionManager = useRef(new EmotionManager()).current;
  const assetManager = useRef(new AssetManager()).current;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [emotionsData, assetsData] = await Promise.all([
        Promise.resolve(emotionManager.getAllEmotions()),
        Promise.resolve(assetManager.getAllAssets())
      ]);
      setEmotions(emotionsData);
      setAssets(assetsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [emotionManager, assetManager]);

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId);
    setSelectedAsset(null);
  };

  const handleAssetSelect = (assetId: string) => {
    setSelectedAsset(assetId);
    setSelectedEmotion(null);
  };

  const handleSetSelect = (setId: string) => {
    setSelectedSet(setId);
  };

  const handleCreateEmotion = async () => {
    const name = prompt('Enter emotion name:');
    if (!name) return;

    try {
      emotionManager.addEmotion({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        displayName: name,
        color: '#6B7280',
        description: '',
        assets: {},
        animationSettings: {
          audioReactivity: 0.5,
          reactiveElements: { head: true, face: false, body: false, arms: false, legs: false },
          movement: { frequency: 2, amplitude: 5, phase: 0 },
          transitionDuration: 500,
          easing: 'ease-out'
        }
      });
      loadData();
    } catch (error) {
      console.error('Error creating emotion:', error);
    }
  };

  const handleDeleteEmotion = async (emotionId: string) => {
    if (!confirm('Are you sure you want to delete this emotion?')) return;

    try {
      emotionManager.deleteEmotion(emotionId);
      if (selectedEmotion === emotionId) {
        setSelectedEmotion(null);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting emotion:', error);
    }
  };

  const handleEmotionChange = async (emotionId: string, field: string, value: any) => {
    try {
      const emotion = emotions.find(e => e.id === emotionId);
      if (!emotion) return;

      const updatedEmotion = { ...emotion, [field]: value };
      emotionManager.updateEmotion(emotionId, updatedEmotion);
      loadData();
    } catch (error) {
      console.error('Error updating emotion:', error);
    }
  };

  const handleAssetUpload = async (files: FileList) => {
    setUploadError(null);
    setUploadProgress(0);

    try {
      for (const file of Array.from(files)) {
        await assetManager.uploadFile(file, 'accessory', (progress: number) => {
          setUploadProgress(progress);
        });
      }
      setUploadProgress(null);
      loadData();
    } catch (error) {
      console.error('Error uploading asset:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress(null);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      assetManager.deleteAsset(assetId);
      if (selectedAsset === assetId) {
        setSelectedAsset(null);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const handleAssetTransformChange = async (assetId: string, transform: Partial<AssetTransform>) => {
    try {
      assetManager.updateAssetTransform(assetId, transform);
      loadData();
    } catch (error) {
      console.error('Error updating asset transform:', error);
    }
  };

  const handleAssignAssetToEmotion = async (emotionId: string, assetId: string) => {
    try {
      const emotion = emotions.find(e => e.id === emotionId);
      if (!emotion) return;

      // Since assets are now stored in emotion.assets object by category, we'll add to accessories
      const updatedAssets = { ...emotion.assets };
      if (!updatedAssets.accessories) {
        updatedAssets.accessories = [];
      }
      if (!updatedAssets.accessories.includes(assetId)) {
        updatedAssets.accessories.push(assetId);
        emotionManager.updateEmotion(emotionId, { ...emotion, assets: updatedAssets });
        loadData();
      }
    } catch (error) {
      console.error('Error assigning asset to emotion:', error);
    }
  };

  const handleRemoveAssetFromEmotion = async (emotionId: string, assetId: string) => {
    try {
      const emotion = emotions.find(e => e.id === emotionId);
      if (!emotion) return;

      const updatedAssets = { ...emotion.assets };
      if (updatedAssets.accessories) {
        updatedAssets.accessories = updatedAssets.accessories.filter((id: string) => id !== assetId);
      }
      emotionManager.updateEmotion(emotionId, { ...emotion, assets: updatedAssets });
      loadData();
    } catch (error) {
      console.error('Error removing asset from emotion:', error);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setIsPlaying(false);
    }
  };

  const handleTogglePinAsset = (assetId: string) => {
    setPinnedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const handleClearAllPinned = () => {
    setPinnedAssets(new Set());
  };

  const selectedEmotionData = emotions.find(e => e.id === selectedEmotion);
  const selectedAssetData = assets.find(a => a.id === selectedAsset);

  const renderEmotionsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Emotions</h3>
        <button
          onClick={handleCreateEmotion}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Add Emotion
        </button>
      </div>

      <div className="grid gap-2">
        {emotions.map(emotion => (
          <div
            key={emotion.id}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selectedEmotion === emotion.id 
                ? 'border-blue-400 bg-blue-900/30 text-white' 
                : 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
            onClick={() => handleEmotionSelect(emotion.id)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{emotion.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEmotion(emotion.id);
                }}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </div>
            <div className="text-sm text-gray-400">
              Intensity: {emotion.intensity || 'N/A'}, Pose: {emotion.pose || 'N/A'}
            </div>
            <div className="text-sm text-gray-400">
              Assets: {Object.values(emotion.assets || {}).flat().length || 0}
            </div>
          </div>
        ))}
      </div>

      {selectedEmotionData && (
        <div className="border-t border-gray-600 pt-4">
          <h4 className="font-semibold mb-3 text-white">Edit Emotion: {selectedEmotionData.name}</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Display Name</label>
              <input
                type="text"
                value={selectedEmotionData.displayName || selectedEmotionData.name}
                onChange={(e) => handleEmotionChange(selectedEmotion!, 'displayName', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
              <textarea
                value={selectedEmotionData.description || ''}
                onChange={(e) => handleEmotionChange(selectedEmotion!, 'description', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Color</label>
              <input
                type="color"
                value={selectedEmotionData.color || '#6B7280'}
                onChange={(e) => handleEmotionChange(selectedEmotion!, 'color', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded h-12"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Assets</label>
                <button
                  onClick={() => setShowAssetPicker(true)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Add Asset
                </button>
              </div>
              
              <div className="space-y-2">
                {(selectedEmotionData.assets?.accessories || []).map((assetId: string) => {
                  const asset = assets.find(a => a.id === assetId);
                  return asset ? (
                    <div key={assetId} className="flex justify-between items-center p-2 bg-gray-700 rounded border border-gray-600">
                      <span className="text-sm text-gray-200">{asset.name}</span>
                      <button
                        onClick={() => handleRemoveAssetFromEmotion(selectedEmotion!, assetId)}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSetsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Emotion Sets</h3>
        <button
          onClick={() => {
            const name = prompt('Enter set name:');
            if (name) {
              const newSet: EmotionSet = {
                id: Date.now().toString(),
                name,
                emotions: []
              };
              setEmotionSets([...emotionSets, newSet]);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Create Set
        </button>
      </div>

      <div className="grid gap-2">
        {emotionSets.map(set => (
          <div
            key={set.id}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selectedSet === set.id 
                ? 'border-blue-400 bg-blue-900/30 text-white' 
                : 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
            onClick={() => handleSetSelect(set.id)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{set.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEmotionSets(emotionSets.filter(s => s.id !== set.id));
                  if (selectedSet === set.id) setSelectedSet(null);
                }}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </div>
            <div className="text-sm text-gray-400">
              Emotions: {set.emotions.length}
            </div>
          </div>
        ))}
      </div>

      {selectedSet && (
        <div className="border-t border-gray-600 pt-4">
          <h4 className="font-semibold mb-3 text-white">Edit Set: {emotionSets.find(s => s.id === selectedSet)?.name}</h4>
          
          {/* Assets Assignment for Set */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium text-gray-300">Available Assets</h5>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                Upload New Asset
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {assets.map(asset => (
                <div
                  key={asset.id}
                  className="p-3 bg-gray-700 rounded border border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => handleAssetSelect(asset.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Asset Preview */}
                      <div className="w-8 h-8 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                        {asset.data ? (
                          <img 
                            src={asset.data} 
                            alt={asset.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">IMG</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{asset.name}</div>
                        <div className="text-xs text-gray-400">{asset.type}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAsset(asset.id);
                      }}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emotions in Set */}
          <div>
            <h5 className="font-medium text-gray-300 mb-3">Emotions in Set</h5>
            <div className="space-y-2">
              {emotions.map(emotion => (
                <div
                  key={emotion.id}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded border border-gray-600"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white">{emotion.displayName || emotion.name}</span>
                    <span className="text-xs text-gray-400">
                      ({Object.values(emotion.assets || {}).flat().length} assets)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedSet && selectedAsset) {
                        handleAssignAssetToEmotion(emotion.id, selectedAsset);
                      }
                    }}
                    disabled={!selectedAsset}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      selectedAsset
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {selectedAsset ? 'Assign Selected Asset' : 'Select Asset First'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAssetsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Assets</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Upload Asset
        </button>
      </div>

      {uploadProgress !== null && (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 rounded">
          {uploadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset List */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-300">Asset Library</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {assets.map(asset => (
              <div
                key={asset.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedAsset === asset.id 
                    ? 'border-blue-400 bg-blue-900/30 text-white' 
                    : 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
                }`}
                onClick={() => handleAssetSelect(asset.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Asset Thumbnail */}
                  <div className="w-12 h-12 bg-gray-600 rounded border border-gray-500 flex items-center justify-center flex-shrink-0">
                    {asset.data ? (
                      <img 
                        src={asset.data} 
                        alt={asset.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">IMG</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-white truncate">{asset.name}</div>
                        <div className="text-sm text-gray-400">
                          {asset.type} • {asset.category}
                        </div>
                        {asset.width && asset.height && (
                          <div className="text-xs text-gray-500">
                            {asset.width}×{asset.height}px
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinAsset(asset.id);
                          }}
                          className={`text-sm px-2 py-1 rounded transition-colors ${
                            pinnedAssets.has(asset.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                          title={pinnedAssets.has(asset.id) ? 'Unpin from preview' : 'Pin to preview'}
                        >
                          📌
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(asset.id);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Preview with Stickman */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-300">Preview</h4>
            {pinnedAssets.size > 0 && (
              <button
                onClick={handleClearAllPinned}
                className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
              >
                Clear All Pins ({pinnedAssets.size})
              </button>
            )}
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 h-80 flex items-center justify-center relative overflow-hidden">
            <CanvasPreview
              width={320}
              height={280}
              assets={assets}
              pinnedAssets={pinnedAssets}
              selectedAsset={selectedAssetData}
              showDebugMarkers={false}
            />
          </div>
          
          {/* Pinned Assets Info */}
          {pinnedAssets.size > 0 && (
            <div className="bg-gray-600 rounded p-3">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Pinned Assets ({pinnedAssets.size})</h5>
              <div className="flex flex-wrap gap-1">
                {Array.from(pinnedAssets).map(assetId => {
                  const asset = assets.find(a => a.id === assetId);
                  if (!asset) return null;
                  return (
                    <span 
                      key={assetId}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded cursor-pointer hover:bg-blue-700"
                      onClick={() => handleTogglePinAsset(assetId)}
                      title="Click to unpin"
                    >
                      {asset.name} ×
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedAssetData && (
        <div className="border-t border-gray-600 pt-4">
          <h4 className="font-semibold mb-3 text-white">Transform Asset: {selectedAssetData.name}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Offset X</label>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={selectedAssetData.transform?.offsetX || 0}
                  onChange={(e) => handleAssetTransformChange(selectedAsset!, { offsetX: parseInt(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <span className="text-sm text-gray-400">{selectedAssetData.transform?.offsetX || 0}px</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Offset Y</label>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={selectedAssetData.transform?.offsetY || 0}
                  onChange={(e) => handleAssetTransformChange(selectedAsset!, { offsetY: parseInt(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <span className="text-sm text-gray-400">{selectedAssetData.transform?.offsetY || 0}px</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Scale</label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={selectedAssetData.transform?.scale || 1}
                  onChange={(e) => handleAssetTransformChange(selectedAsset!, { scale: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <span className="text-sm text-gray-400">{selectedAssetData.transform?.scale || 1}x</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Rotation</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedAssetData.transform?.rotation || 0}
                  onChange={(e) => handleAssetTransformChange(selectedAsset!, { rotation: parseInt(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <span className="text-sm text-gray-400">{selectedAssetData.transform?.rotation || 0}°</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleAssetUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      {/* Left Panel - Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Navigation */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="flex items-center">
            {onBackToMain && (
              <button
                onClick={onBackToMain}
                className="px-4 py-3 text-gray-200 hover:text-white hover:bg-gray-700 border-r border-gray-700 transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => setActiveTab('emotions')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'emotions'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Emotions
            </button>
            <button
              onClick={() => setActiveTab('sets')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'sets'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Sets
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'assets'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Assets
            </button>
            {onSave && (
              <div className="ml-auto pr-4 py-3">
                <button
                  onClick={() => onSave(emotions)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Save & Close
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900">
          {activeTab === 'emotions' && renderEmotionsTab()}
          {activeTab === 'sets' && renderSetsTab()}
          {activeTab === 'assets' && renderAssetsTab()}
        </div>

        {/* Audio Controls */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => audioInputRef.current?.click()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Upload Audio
            </button>
            
            {audioFile && (
              <>
                <span className="text-sm text-gray-300">{audioFile.name}</span>
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              </>
            )}
          </div>
          
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Live Preview</h3>
          {selectedEmotionData && (
            <div className="mt-2">
              <span 
                className="px-2 py-1 rounded text-xs font-semibold"
                style={{ 
                  backgroundColor: selectedEmotionData.color + '20',
                  color: selectedEmotionData.color
                }}
              >
                {selectedEmotionData.displayName || selectedEmotionData.name}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 p-4 space-y-4">
          {/* Current Emotion Preview */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Current Emotion</h4>
            <div className="aspect-square bg-gray-600 rounded-lg flex items-center justify-center relative">
              {selectedEmotionData ? (
                <CanvasPreview
                  width={300}
                  height={300}
                  emotion={selectedEmotionData}
                  assets={assets}
                  pinnedAssets={pinnedAssets}
                  showDebugMarkers={false}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-2xl mb-2">🎭</div>
                  <p className="text-sm">Select an emotion</p>
                </div>
              )}
            </div>
          </div>

          {/* Asset Quick Info */}
          {selectedAssetData && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Selected Asset</h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                  <img 
                    src={selectedAssetData.data} 
                    alt={selectedAssetData.name}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div>
                  <div className="text-white font-medium">{selectedAssetData.name}</div>
                  <div className="text-sm text-gray-400">{selectedAssetData.type} • {selectedAssetData.category}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Offset: {selectedAssetData.transform?.offsetX || 0}x, {selectedAssetData.transform?.offsetY || 0}y
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Set Info */}
          {selectedSet && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Active Set</h4>
              <div className="text-white font-medium">
                {emotionSets.find(s => s.id === selectedSet)?.name}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {emotionSets.find(s => s.id === selectedSet)?.emotions.length || 0} emotions
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Statistics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Emotions:</span>
                <span className="text-white">{emotions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Assets:</span>
                <span className="text-white">{assets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sets Created:</span>
                <span className="text-white">{emotionSets.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-600">
            <h3 className="text-lg font-semibold mb-4 text-white">Select Asset to Add</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-auto">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => {
                    if (selectedEmotion) {
                      handleAssignAssetToEmotion(selectedEmotion, asset.id);
                    }
                    setShowAssetPicker(false);
                  }}
                  className="text-left p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors bg-gray-800 hover:border-blue-500"
                >
                  <div className="flex items-center gap-3">
                    {/* Asset Preview */}
                    <div className="w-16 h-16 bg-gray-600 rounded border border-gray-500 flex items-center justify-center flex-shrink-0">
                      {asset.data ? (
                        <img 
                          src={asset.data} 
                          alt={asset.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">IMG</span>
                      )}
                    </div>
                    
                    {/* Asset Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{asset.name}</div>
                      <div className="text-sm text-gray-400">
                        {asset.type} • {asset.category}
                      </div>
                      {asset.width && asset.height && (
                        <div className="text-xs text-gray-500">
                          {asset.width}×{asset.height}px
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Transform: {asset.transform?.offsetX || 0}x, {asset.transform?.offsetY || 0}y, 
                        {asset.transform?.scale || 1}×, {asset.transform?.rotation || 0}°
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {assets.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-2xl mb-2">📎</div>
                <p>No assets available</p>
                <p className="text-sm mt-1">Upload some assets first in the Assets tab</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAssetPicker(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedEditor;
