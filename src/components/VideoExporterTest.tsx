import React, { useState } from 'react';
import VideoExporter from './VideoExporter';
import type { EmotionSegment } from '../utils/intentionAnalyzer';

const VideoExporterTest: React.FC = () => {
  const [testSegments] = useState<EmotionSegment[]>([
    { 
      start: 0, end: 2, text: "Salut tout le monde !", emotion: "happy", 
      intensity: 0.8, confidence: 0.9, triggers: ["salut"] 
    },
    { 
      start: 2, end: 4, text: "Oh non, pas encore !", emotion: "angry", 
      intensity: 0.9, confidence: 0.8, triggers: ["oh", "non"] 
    },
    { 
      start: 4, end: 6, text: "Hmm, je réfléchis...", emotion: "thinking", 
      intensity: 0.6, confidence: 0.7, triggers: ["hmm"] 
    },
    { 
      start: 6, end: 8, text: "Ah ! Quelle surprise !", emotion: "surprised", 
      intensity: 0.85, confidence: 0.9, triggers: ["ah", "surprise"] 
    },
    { 
      start: 8, end: 12, text: "Bon, on va voir ce que ça donne maintenant.", emotion: "neutral", 
      intensity: 0.3, confidence: 0.6, triggers: [] 
    }
  ]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">🧪 Test de l'Exporteur Vidéo</h1>
      <div className="bg-blue-600/20 border border-blue-500/30 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-2">📊 Segments de test</h3>
        <div className="text-sm text-gray-300">
          <div>Durée totale: {Math.max(...testSegments.map(s => s.end))}s</div>
          <div>Nombre de segments: {testSegments.length}</div>
          <div>Émotions: {testSegments.map(s => s.emotion).join(', ')}</div>
        </div>
      </div>
      <VideoExporter segments={testSegments} />
    </div>
  );
};

export default VideoExporterTest;
