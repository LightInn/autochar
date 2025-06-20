import React, { useState } from 'react';
import type { StickmanPose } from '../utils/stickmanPoses';
import type { EmotionType } from '../utils/intentionAnalyzer';
import { EMOTION_POSES } from '../utils/stickmanPoses';
import StickmanViewer from './StickmanViewer';
import { getEmotionEmoji } from '../utils/intentionAnalyzer';

interface StickmanStylesProps {
  poses: Record<EmotionType, StickmanPose>;
  onPosesChange: (poses: Record<EmotionType, StickmanPose>) => void;
}

const StickmanStyles: React.FC<StickmanStylesProps> = ({ poses, onPosesChange }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Presets prédéfinis
  const presets = {
    default: {
      name: "🎭 Classique",
      description: "Style équilibré et expressif",
      poses: EMOTION_POSES
    },
    dramatic: {
      name: "🎪 Dramatique", 
      description: "Mouvements exagérés et théâtraux",
      poses: Object.fromEntries(
        Object.entries(EMOTION_POSES).map(([emotion, pose]) => [
          emotion,
          {
            ...pose,
            head: { ...pose.head, rotation: pose.head.rotation * 1.5 },
            leftArm: { ...pose.leftArm, rotation: Math.min(pose.leftArm.rotation * 1.3, 180) },
            rightArm: { ...pose.rightArm, rotation: Math.min(pose.rightArm.rotation * 1.3, 180) },
            body: { ...pose.body, lean: pose.body.lean * 1.8 }
          }
        ])
      ) as Record<EmotionType, StickmanPose>
    },
    subtle: {
      name: "😌 Subtil",
      description: "Mouvements discrets et raffinés", 
      poses: Object.fromEntries(
        Object.entries(EMOTION_POSES).map(([emotion, pose]) => [
          emotion,
          {
            ...pose,
            head: { ...pose.head, rotation: pose.head.rotation * 0.6 },
            leftArm: { ...pose.leftArm, rotation: pose.leftArm.rotation * 0.7, bend: pose.leftArm.bend * 0.5 },
            rightArm: { ...pose.rightArm, rotation: pose.rightArm.rotation * 0.7, bend: pose.rightArm.bend * 0.5 },
            body: { ...pose.body, lean: pose.body.lean * 0.5 }
          }
        ])
      ) as Record<EmotionType, StickmanPose>
    },
    energetic: {
      name: "⚡ Énergique",
      description: "Plein de vie et de mouvement",
      poses: Object.fromEntries(
        Object.entries(EMOTION_POSES).map(([emotion, pose]) => [
          emotion,
          {
            ...pose,
            leftArm: { rotation: Math.random() * 120 + 30, bend: Math.random() * 40 + 10 },
            rightArm: { rotation: Math.random() * 120 + 30, bend: Math.random() * 40 + 10 },
            leftLeg: { ...pose.leftLeg, bend: Math.random() * 20 + 5 },
            rightLeg: { ...pose.rightLeg, bend: Math.random() * 20 + 5 }
          }
        ])
      ) as Record<EmotionType, StickmanPose>
    }
  };

  const applyPreset = (presetKey: string) => {
    if (presets[presetKey as keyof typeof presets]) {
      onPosesChange(presets[presetKey as keyof typeof presets].poses);
      setSelectedPreset(presetKey);
    }
  };

  const exportPoses = () => {
    const dataStr = JSON.stringify(poses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stickman-poses.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importPoses = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedPoses = JSON.parse(e.target?.result as string);
          onPosesChange(importedPoses);
        } catch (error) {
          alert('Erreur lors de l\'importation du fichier JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  const createRandomVariation = () => {
    const newPoses = { ...poses };
    Object.keys(newPoses).forEach(emotion => {
      const pose = newPoses[emotion as EmotionType];
      newPoses[emotion as EmotionType] = {
        ...pose,
        head: { ...pose.head, rotation: pose.head.rotation + (Math.random() - 0.5) * 10 },
        leftArm: { 
          rotation: Math.max(0, Math.min(180, pose.leftArm.rotation + (Math.random() - 0.5) * 30)),
          bend: Math.max(0, Math.min(90, pose.leftArm.bend + (Math.random() - 0.5) * 20))
        },
        rightArm: { 
          rotation: Math.max(0, Math.min(180, pose.rightArm.rotation + (Math.random() - 0.5) * 30)),
          bend: Math.max(0, Math.min(90, pose.rightArm.bend + (Math.random() - 0.5) * 20))
        }
      };
    });
    onPosesChange(newPoses);
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-white mb-6">🎨 Styles Prédéfinis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Object.entries(presets).map(([key, preset]) => (
            <div
              key={key}
              onClick={() => applyPreset(key)}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedPreset === key
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <h4 className="text-lg font-semibold text-white mb-2">{preset.name}</h4>
              <p className="text-gray-400 text-sm mb-3">{preset.description}</p>
              
              {/* Mini preview */}
              <div className="flex justify-center space-x-2">
                {['happy', 'angry', 'surprised'].map(emotion => (
                  <div key={emotion} className="scale-50 transform-gpu">
                    <StickmanViewer 
                      pose={preset.poses[emotion as EmotionType]} 
                      size={80} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={createRandomVariation}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            🎲 Variation Aléatoire
          </button>
          
          <button
            onClick={exportPoses}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            💾 Exporter
          </button>
          
          <label className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2">
            📁 Importer
            <input
              type="file"
              accept=".json"
              onChange={importPoses}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Aperçu de toutes les poses */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-white mb-6">👁️ Aperçu Complet</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(poses).map(([emotion, pose]) => (
            <div key={emotion} className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="mb-2">
                <span className="text-2xl">{getEmotionEmoji(emotion as EmotionType)}</span>
              </div>
              <div className="mb-3">
                <StickmanViewer pose={pose} size={120} />
              </div>
              <p className="text-white text-sm font-medium capitalize">{emotion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-white mb-6">📊 Statistiques</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-400">{Object.keys(poses).length}</div>
            <div className="text-gray-400 text-sm">Poses Total</div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-400">
              {Math.round(Object.values(poses).reduce((acc, pose) => 
                acc + Math.abs(pose.head.rotation) + Math.abs(pose.body.lean), 0
              ) / Object.keys(poses).length)}°
            </div>
            <div className="text-gray-400 text-sm">Mouvement Moyen</div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-400">
              {Object.values(poses).filter(pose => 
                pose.leftArm.bend > 30 || pose.rightArm.bend > 30
              ).length}
            </div>
            <div className="text-gray-400 text-sm">Poses Dynamiques</div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {selectedPreset ? presets[selectedPreset as keyof typeof presets]?.name.split(' ')[0] : '🎭'}
            </div>
            <div className="text-gray-400 text-sm">Style Actuel</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickmanStyles;
