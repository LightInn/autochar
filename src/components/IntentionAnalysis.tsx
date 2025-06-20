import React from 'react';
import type { EmotionSegment, EmotionType } from '../utils/intentionAnalyzer';
import { getEmotionColor, getEmotionEmoji } from '../utils/intentionAnalyzer';

interface IntentionAnalysisProps {
  segments: EmotionSegment[];
  onSegmentClick?: (segment: EmotionSegment) => void;
  onEmotionChange?: (segmentIndex: number, newEmotion: EmotionType) => void;
}

const EMOTION_OPTIONS: { value: EmotionType; label: string; emoji: string }[] = [
  { value: 'neutral', label: 'Neutre', emoji: '😐' },
  { value: 'happy', label: 'Joyeux', emoji: '😊' },
  { value: 'excited', label: 'Excité', emoji: '🤩' },
  { value: 'sad', label: 'Triste', emoji: '😢' },
  { value: 'angry', label: 'En colère', emoji: '😠' },
  { value: 'surprised', label: 'Surpris', emoji: '😲' },
  { value: 'confused', label: 'Confus', emoji: '🤔' },
  { value: 'thinking', label: 'Réfléchi', emoji: '🧠' },
  { value: 'worried', label: 'Inquiet', emoji: '😰' },
  { value: 'disappointed', label: 'Déçu', emoji: '😔' }
];

const IntentionAnalysis: React.FC<IntentionAnalysisProps> = ({ 
  segments, 
  onSegmentClick, 
  onEmotionChange 
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">Analyse d'Intention</h2>
      
      {/* Timeline visuelle */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-300">Timeline des Émotions</h3>
        <div className="relative h-12 bg-gray-700 rounded-lg overflow-hidden">
          {segments.map((segment, index) => {
            const totalDuration = Math.max(...segments.map(s => s.end));
            const left = (segment.start / totalDuration) * 100;
            const width = ((segment.end - segment.start) / totalDuration) * 100;
            
            return (
              <div
                key={index}
                className="absolute top-0 h-full transition-all duration-200 hover:opacity-80 cursor-pointer border-r border-gray-600"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: getEmotionColor(segment.emotion),
                  opacity: 0.7 + (segment.intensity * 0.3)
                }}
                onClick={() => onSegmentClick?.(segment)}
                title={`${formatTime(segment.start)} - ${formatTime(segment.end)}: ${segment.emotion} (${Math.round(segment.confidence * 100)}%)`}
              >
                <div className="flex items-center justify-center h-full text-white text-xs font-bold">
                  {getEmotionEmoji(segment.emotion)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0:00</span>
          <span>{formatTime(Math.max(...segments.map(s => s.end)))}</span>
        </div>
      </div>

      {/* Liste des segments */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">Segments Détaillés</h3>
        {segments.map((segment, index) => (
          <div
            key={index}
            className="bg-gray-700 p-4 rounded-lg border-l-4 hover:bg-gray-650 transition-colors"
            style={{ borderLeftColor: getEmotionColor(segment.emotion) }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-blue-400 text-sm font-mono">
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getEmotionEmoji(segment.emotion)}</span>
                    {onEmotionChange ? (
                      <select
                        value={segment.emotion}
                        onChange={(e) => onEmotionChange(index, e.target.value as EmotionType)}
                        className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:border-blue-400 focus:outline-none"
                      >
                        {EMOTION_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.emoji} {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        className="text-sm font-semibold px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: getEmotionColor(segment.emotion) + '20',
                          color: getEmotionColor(segment.emotion)
                        }}
                      >
                        {EMOTION_OPTIONS.find(opt => opt.value === segment.emotion)?.label || segment.emotion}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-white mb-2">{segment.text}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>
                    Intensité: 
                    <span className="ml-1 font-semibold text-yellow-400">
                      {Math.round(segment.intensity * 100)}%
                    </span>
                  </span>
                  <span>
                    Confiance: 
                    <span className="ml-1 font-semibold text-green-400">
                      {Math.round(segment.confidence * 100)}%
                    </span>
                  </span>
                  {segment.triggers.length > 0 && (
                    <span>
                      Déclencheurs: 
                      <span className="ml-1 text-purple-300">
                        {segment.triggers.slice(0, 3).join(', ')}
                        {segment.triggers.length > 3 && '...'}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistiques */}
      <div className="mt-6 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-3">Statistiques</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {EMOTION_OPTIONS.map(emotion => {
            const count = segments.filter(s => s.emotion === emotion.value).length;
            const percentage = segments.length > 0 ? (count / segments.length) * 100 : 0;
            
            return (
              <div key={emotion.value} className="text-center">
                <div className="text-xl mb-1">{emotion.emoji}</div>
                <div className="text-gray-300 font-medium">{count}</div>
                <div className="text-gray-400 text-xs">{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IntentionAnalysis;
