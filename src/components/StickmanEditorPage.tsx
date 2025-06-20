import React, { useState } from 'react';
import type { StickmanPose } from '../utils/stickmanPoses';
import type { EmotionType } from '../utils/intentionAnalyzer';
import { EMOTION_POSES } from '../utils/stickmanPoses';
import { getEmotionEmoji } from '../utils/intentionAnalyzer';
import PoseEditor from './PoseEditor';
import StickmanStyles from './StickmanStyles';

interface StickmanEditorPageProps {
  onBackToMain: () => void;
  onSaveChanges: (poses: Record<EmotionType, StickmanPose>) => void;
  initialPoses?: Record<EmotionType, StickmanPose>;
}

const StickmanEditorPage: React.FC<StickmanEditorPageProps> = ({ 
  onBackToMain, 
  onSaveChanges, 
  initialPoses = EMOTION_POSES 
}) => {
  const [poses, setPoses] = useState<Record<EmotionType, StickmanPose>>(initialPoses);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>('happy');
  const [activeSection, setActiveSection] = useState<'styles' | 'editor'>('styles');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handlePoseChange = (emotion: EmotionType, newPose: StickmanPose) => {
    setPoses(prev => ({ ...prev, [emotion]: newPose }));
    setHasUnsavedChanges(true);
  };

  const handlePosesChange = (newPoses: Record<EmotionType, StickmanPose>) => {
    setPoses(newPoses);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    onSaveChanges(poses);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir revenir aux poses par défaut ? Toutes vos modifications seront perdues.')) {
      setPoses(EMOTION_POSES);
      setHasUnsavedChanges(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToMain}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour
              </button>
              
              <h1 className="text-2xl font-bold">🎨 Éditeur de Stickman</h1>
              
              {hasUnsavedChanges && (
                <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded-full text-xs font-medium">
                  • Modifications non sauvées
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Navigation sections */}
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveSection('styles')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === 'styles'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  🎨 Styles
                </button>
                <button
                  onClick={() => setActiveSection('editor')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === 'editor'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  ✏️ Éditeur
                </button>
              </div>

              {/* Actions */}
              <button
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Reset
              </button>
              
              <button
                onClick={handleSave}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  hasUnsavedChanges
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!hasUnsavedChanges}
              >
                💾 Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === 'styles' ? (
          <StickmanStyles 
            poses={poses}
            onPosesChange={handlePosesChange}
          />
        ) : (
          <div className="space-y-6">
            {/* Sélecteur d'émotion */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">Choisir une émotion à éditer</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.keys(poses).map(emotion => (
                  <button
                    key={emotion}
                    onClick={() => setSelectedEmotion(emotion as EmotionType)}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedEmotion === emotion
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{getEmotionEmoji(emotion as EmotionType)}</div>
                    <div className="text-white text-sm font-medium capitalize">{emotion}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Éditeur de pose */}
            <PoseEditor
              emotion={selectedEmotion}
              pose={poses[selectedEmotion]}
              onPoseChange={handlePoseChange}
            />

            {/* Conseils */}
            <div className="bg-gradient-to-r from-blue-800/20 to-purple-800/20 border border-blue-500/30 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-300 mb-3">💡 Conseils d'édition</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <strong className="text-white">🎭 Expressions :</strong> Chaque émotion a sa propre expression faciale, mais vous pouvez la changer pour créer des variations intéressantes.
                </div>
                <div>
                  <strong className="text-white">🏃 Mouvements :</strong> Des rotations plus importantes créent des poses plus dynamiques et expressives.
                </div>
                <div>
                  <strong className="text-white">⚖️ Équilibre :</strong> Attention à l'équilibre du corps - un personnage trop penché peut sembler instable.
                </div>
                <div>
                  <strong className="text-white">🎨 Cohérence :</strong> Gardez un style cohérent entre toutes les émotions pour une animation fluide.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickmanEditorPage;
