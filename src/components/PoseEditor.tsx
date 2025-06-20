import React, { useState } from 'react';
import type { StickmanPose } from '../utils/stickmanPoses';
import type { EmotionType } from '../utils/intentionAnalyzer';
import StickmanViewer from './StickmanViewer';
import { EMOTION_POSES } from '../utils/stickmanPoses';
import { getEmotionColor, getEmotionEmoji } from '../utils/intentionAnalyzer';

interface PoseEditorProps {
  emotion: EmotionType;
  pose: StickmanPose;
  onPoseChange: (emotion: EmotionType, newPose: StickmanPose) => void;
}

const PoseEditor: React.FC<PoseEditorProps> = ({ emotion, pose, onPoseChange }) => {
  const [activeTab, setActiveTab] = useState<'head' | 'body' | 'arms' | 'legs'>('head');

  const updatePose = (updates: Partial<StickmanPose>) => {
    const newPose = { ...pose, ...updates };
    onPoseChange(emotion, newPose);
  };

  const resetToDefault = () => {
    const defaultPose = EMOTION_POSES[emotion];
    onPoseChange(emotion, defaultPose);
  };

  const SliderControl = ({ 
    label, 
    value, 
    min, 
    max, 
    step = 1, 
    onChange,
    unit = '°'
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    unit?: string;
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-xs text-gray-400">{value.toFixed(1)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{getEmotionEmoji(emotion)}</span>
        <h3 className="text-2xl font-bold text-white capitalize">{emotion}</h3>
        <div 
          className="px-3 py-1 rounded-full text-sm font-semibold ml-auto"
          style={{ 
            backgroundColor: getEmotionColor(emotion) + '20',
            color: getEmotionColor(emotion)
          }}
        >
          Édition Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview en temps réel */}
        <div className="bg-gray-700 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-white mb-4">Aperçu</h4>
          <div className="flex justify-center">
            <StickmanViewer pose={pose} size={250} />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={resetToDefault}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              🔄 Reset
            </button>
            <button
              onClick={() => {
                const randomPose = {
                  ...pose,
                  head: { ...pose.head, rotation: (Math.random() - 0.5) * 40 },
                  leftArm: { ...pose.leftArm, rotation: Math.random() * 180 },
                  rightArm: { ...pose.rightArm, rotation: Math.random() * 180 },
                };
                onPoseChange(emotion, randomPose);
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              🎲 Random
            </button>
          </div>
        </div>

        {/* Contrôles d'édition */}
        <div className="bg-gray-700 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-white mb-4">Contrôles</h4>
          
          {/* Onglets */}
          <div className="flex mb-6 bg-gray-600 rounded-lg p-1">
            {[
              { key: 'head', label: '🗣️ Tête', icon: '🗣️' },
              { key: 'body', label: '🫶 Corps', icon: '🫶' },
              { key: 'arms', label: '💪 Bras', icon: '💪' },
              { key: 'legs', label: '🦵 Jambes', icon: '🦵' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-500'
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </div>

          {/* Contrôles par onglet */}
          <div className="space-y-4">
            {activeTab === 'head' && (
              <>
                <SliderControl
                  label="Rotation de la tête"
                  value={pose.head.rotation}
                  min={-30}
                  max={30}
                  onChange={(value) => updatePose({ head: { ...pose.head, rotation: value } })}
                />
                <div className="bg-gray-600 p-3 rounded-lg">
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Expression</label>
                  <select
                    value={pose.head.expression}
                    onChange={(e) => updatePose({ head: { ...pose.head, expression: e.target.value as EmotionType } })}
                    className="w-full bg-gray-500 text-white rounded px-3 py-2 border border-gray-400 focus:border-blue-400 focus:outline-none"
                  >
                    {Object.keys(EMOTION_POSES).map(emotionKey => (
                      <option key={emotionKey} value={emotionKey}>
                        {getEmotionEmoji(emotionKey as EmotionType)} {emotionKey}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {activeTab === 'body' && (
              <SliderControl
                label="Inclinaison du corps"
                value={pose.body.lean}
                min={-20}
                max={20}
                onChange={(value) => updatePose({ body: { lean: value } })}
              />
            )}

            {activeTab === 'arms' && (
              <>
                <div className="bg-gray-600 p-3 rounded-lg">
                  <h5 className="text-md font-semibold text-white mb-3">🫲 Bras Gauche</h5>
                  <SliderControl
                    label="Rotation"
                    value={pose.leftArm.rotation}
                    min={0}
                    max={180}
                    onChange={(value) => updatePose({ leftArm: { ...pose.leftArm, rotation: value } })}
                  />
                  <SliderControl
                    label="Courbure (coude)"
                    value={pose.leftArm.bend}
                    min={0}
                    max={90}
                    onChange={(value) => updatePose({ leftArm: { ...pose.leftArm, bend: value } })}
                  />
                </div>
                
                <div className="bg-gray-600 p-3 rounded-lg">
                  <h5 className="text-md font-semibold text-white mb-3">🫱 Bras Droit</h5>
                  <SliderControl
                    label="Rotation"
                    value={pose.rightArm.rotation}
                    min={0}
                    max={180}
                    onChange={(value) => updatePose({ rightArm: { ...pose.rightArm, rotation: value } })}
                  />
                  <SliderControl
                    label="Courbure (coude)"
                    value={pose.rightArm.bend}
                    min={0}
                    max={90}
                    onChange={(value) => updatePose({ rightArm: { ...pose.rightArm, bend: value } })}
                  />
                </div>
              </>
            )}

            {activeTab === 'legs' && (
              <>
                <div className="bg-gray-600 p-3 rounded-lg">
                  <h5 className="text-md font-semibold text-white mb-3">🦵 Jambe Gauche</h5>
                  <SliderControl
                    label="Rotation"
                    value={pose.leftLeg.rotation}
                    min={-30}
                    max={30}
                    onChange={(value) => updatePose({ leftLeg: { ...pose.leftLeg, rotation: value } })}
                  />
                  <SliderControl
                    label="Courbure (genou)"
                    value={pose.leftLeg.bend}
                    min={0}
                    max={45}
                    onChange={(value) => updatePose({ leftLeg: { ...pose.leftLeg, bend: value } })}
                  />
                </div>
                
                <div className="bg-gray-600 p-3 rounded-lg">
                  <h5 className="text-md font-semibold text-white mb-3">🦵 Jambe Droite</h5>
                  <SliderControl
                    label="Rotation"
                    value={pose.rightLeg.rotation}
                    min={-30}
                    max={30}
                    onChange={(value) => updatePose({ rightLeg: { ...pose.rightLeg, rotation: value } })}
                  />
                  <SliderControl
                    label="Courbure (genou)"
                    value={pose.rightLeg.bend}
                    min={0}
                    max={45}
                    onChange={(value) => updatePose({ rightLeg: { ...pose.rightLeg, bend: value } })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoseEditor;
