import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EmotionManager } from '../utils/emotionManager';
import { AssetManager, type AssetFile } from '../utils/assetManager';
import StickmanViewer from './StickmanViewer';
import VideoExporter from './VideoExporter';

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

  const selectedEmotionData = emotions.find(e => e.id === selectedEmotion);
  const selectedAssetData = assets.find(a => a.id === selectedAsset);

  const renderEmotionsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Emotions</h3>
        <button
          onClick={handleCreateEmotion}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Emotion
        </button>
      </div>

      <div className="grid gap-2">
        {emotions.map(emotion => (
          <div
            key={emotion.id}
            className={`p-3 border rounded cursor-pointer ${
              selectedEmotion === emotion.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
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
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Intensity: {emotion.intensity || 'N/A'}, Pose: {emotion.pose || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              Assets: {Object.values(emotion.assets || {}).flat().length || 0}
            </div>
          </div>
        ))}
      </div>

      {selectedEmotionData && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Edit Emotion: {selectedEmotionData.name}</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={selectedEmotionData.displayName || selectedEmotionData.name}
                onChange={(e) => handleEmotionChange(selectedEmotion!, 'displayName', e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={selectedEmotionData.description || ''}
                onChange={(e) => handleEmotionChange(selectedEmotion!, 'description', e.target.value)}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={selectedEmotionData.color || '#6B7280'}
                onChange={(e) => handleEmotionChange(selectedEmotion!, 'color', e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Assets</label>
                <button
                  onClick={() => setShowAssetPicker(true)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Add Asset
                </button>
              </div>
              
              <div className="space-y-2">
                {(selectedEmotionData.assets?.accessories || []).map((assetId: string) => {
                  const asset = assets.find(a => a.id === assetId);
                  return asset ? (
                    <div key={assetId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{asset.name}</span>
                      <button
                        onClick={() => handleRemoveAssetFromEmotion(selectedEmotion!, assetId)}
                        className="text-red-600 hover:text-red-800 text-sm"
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
        <h3 className="text-lg font-semibold">Emotion Sets</h3>
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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Set
        </button>
      </div>

      <div className="grid gap-2">
        {emotionSets.map(set => (
          <div
            key={set.id}
            className={`p-3 border rounded cursor-pointer ${
              selectedSet === set.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
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
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Emotions: {set.emotions.length}
            </div>
          </div>
        ))}
      </div>

      {selectedSet && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Edit Set</h4>
          <p className="text-gray-600">Set management functionality coming soon...</p>
        </div>
      )}
    </div>
  );

  const renderAssetsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Assets</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Upload Asset
        </button>
      </div>

      {uploadProgress !== null && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {uploadError}
        </div>
      )}

      <div className="grid gap-2">
        {assets.map(asset => (
          <div
            key={asset.id}
            className={`p-3 border rounded cursor-pointer ${
              selectedAsset === asset.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onClick={() => handleAssetSelect(asset.id)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{asset.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAsset(asset.id);
                }}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Type: {asset.type}
            </div>
          </div>
        ))}
      </div>

      {selectedAssetData && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Edit Asset: {selectedAssetData.name}</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Offset X</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={selectedAssetData.transform?.offsetX || 0}
                onChange={(e) => handleAssetTransformChange(selectedAsset!, { offsetX: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{selectedAssetData.transform?.offsetX || 0}px</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Offset Y</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={selectedAssetData.transform?.offsetY || 0}
                onChange={(e) => handleAssetTransformChange(selectedAsset!, { offsetY: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{selectedAssetData.transform?.offsetY || 0}px</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Scale</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={selectedAssetData.transform?.scale || 1}
                onChange={(e) => handleAssetTransformChange(selectedAsset!, { scale: parseFloat(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{selectedAssetData.transform?.scale || 1}x</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rotation</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedAssetData.transform?.rotation || 0}
                onChange={(e) => handleAssetTransformChange(selectedAsset!, { rotation: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{selectedAssetData.transform?.rotation || 0}°</span>
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
    <div className="h-screen flex bg-gray-100">
      {/* Left Panel - Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Navigation */}
        <div className="bg-white border-b">
          <div className="flex items-center">
            {onBackToMain && (
              <button
                onClick={onBackToMain}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 border-r"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => setActiveTab('emotions')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'emotions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Emotions
            </button>
            <button
              onClick={() => setActiveTab('sets')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'sets'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sets
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'assets'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Assets
            </button>
            {onSave && (
              <div className="ml-auto pr-4 py-3">
                <button
                  onClick={() => onSave(emotions)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save & Close
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'emotions' && renderEmotionsTab()}
          {activeTab === 'sets' && renderSetsTab()}
          {activeTab === 'assets' && renderAssetsTab()}
        </div>

        {/* Audio Controls */}
        <div className="bg-white border-t p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => audioInputRef.current?.click()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Upload Audio
            </button>
            
            {audioFile && (
              <>
                <span className="text-sm text-gray-600">{audioFile.name}</span>
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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

      {/* Right Panel - Sticky Preview */}
      <div className="w-96 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Preview</h3>
        </div>
        
        <div className="flex-1 p-4">
          <div className="aspect-square bg-gray-50 rounded-lg mb-4">
            <StickmanViewer
              pose={{
                head: { expression: 'neutral', rotation: 0 },
                body: { lean: 0 },
                leftArm: { rotation: 45, bend: 30 },
                rightArm: { rotation: -45, bend: 30 },
                leftLeg: { rotation: 0, bend: 15 },
                rightLeg: { rotation: 0, bend: 15 }
              }}
              size={300}
            />
          </div>
          
          <VideoExporter
            segments={[]}
            audioFile={audioFile}
          />
        </div>
      </div>

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Select Asset</h3>
            
            <div className="max-h-64 overflow-auto space-y-2">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => {
                    if (selectedEmotion) {
                      handleAssignAssetToEmotion(selectedEmotion, asset.id);
                    }
                    setShowAssetPicker(false);
                  }}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-sm text-gray-600">Type: {asset.type}</div>
                </button>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAssetPicker(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
