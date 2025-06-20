import React, { useState, useEffect, useRef } from 'react';
import type { EmotionSegment } from '../utils/intentionAnalyzer';
import { EMOTION_POSES, getPoseForEmotion, interpolatePoses } from '../utils/stickmanPoses';
import type { StickmanPose } from '../utils/stickmanPoses';
import StickmanViewer from './StickmanViewer';
import { getEmotionColor, getEmotionEmoji } from '../utils/intentionAnalyzer';

interface StickmanPreviewProps {
  segments: EmotionSegment[];
  audioFile?: File | null;
}

const StickmanPreview: React.FC<StickmanPreviewProps> = ({ segments, audioFile }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentPose, setCurrentPose] = useState<StickmanPose>(EMOTION_POSES.neutral);
  const [currentSegment, setCurrentSegment] = useState<EmotionSegment | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Initialiser l'audio
  useEffect(() => {
    if (audioFile && audioRef.current) {
      const url = URL.createObjectURL(audioFile);
      audioRef.current.src = url;
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      };
      
      return () => URL.revokeObjectURL(url);
    }
  }, [audioFile]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Calculer la pose actuelle basée sur le temps
  useEffect(() => {
    const segment = segments.find(s => currentTime >= s.start && currentTime <= s.end);
    setCurrentSegment(segment || null);
    
    if (segment) {
      const pose = getPoseForEmotion(segment.emotion, segment.intensity);
      setCurrentPose(pose);
    } else {
      // Transition entre segments ou pose neutre
      const nextSegment = segments.find(s => s.start > currentTime);
      const prevSegment = [...segments].reverse().find(s => s.end < currentTime);
      
      if (nextSegment && prevSegment) {
        // Interpoler entre deux segments
        const transitionDuration = nextSegment.start - prevSegment.end;
        const transitionProgress = (currentTime - prevSegment.end) / transitionDuration;
        
        const prevPose = getPoseForEmotion(prevSegment.emotion, prevSegment.intensity);
        const nextPose = getPoseForEmotion(nextSegment.emotion, nextSegment.intensity);
        
        setCurrentPose(interpolatePoses(prevPose, nextPose, transitionProgress));
      } else {
        setCurrentPose(EMOTION_POSES.neutral);
      }
    }
  }, [currentTime, segments]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current && audioRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = Math.max(duration, Math.max(...segments.map(s => s.end), 0));

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">Préview Stickman</h2>
      
      {/* Audio element (caché) */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Viewer principal */}
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 p-8 rounded-lg mb-4">
            <StickmanViewer 
              pose={currentPose} 
              size={300}
              className="mx-auto"
            />
          </div>
          
          {/* Info du segment actuel */}
          {currentSegment && (
            <div className="bg-gray-700 p-4 rounded-lg w-full">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getEmotionEmoji(currentSegment.emotion)}</span>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ 
                    backgroundColor: getEmotionColor(currentSegment.emotion) + '20',
                    color: getEmotionColor(currentSegment.emotion)
                  }}
                >
                  {currentSegment.emotion}
                </span>
                <span className="text-gray-400 text-sm">
                  Intensité: {Math.round(currentSegment.intensity * 100)}%
                </span>
              </div>
              <p className="text-white text-sm">{currentSegment.text}</p>
            </div>
          )}
        </div>

        {/* Contrôles et timeline */}
        <div>
          {/* Contrôles de lecture */}
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePlayPause}
                disabled={!audioFile}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play
                  </>
                )}
              </button>
              
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Timeline interactive */}
            <div 
              ref={timelineRef}
              className="relative h-16 bg-gray-600 rounded-lg cursor-pointer overflow-hidden"
              onClick={handleTimelineClick}
            >
              {/* Segments d'émotion */}
              {segments.map((segment, index) => {
                const left = (segment.start / totalDuration) * 100;
                const width = ((segment.end - segment.start) / totalDuration) * 100;
                
                return (
                  <div
                    key={index}
                    className="absolute top-0 h-full border-r border-gray-500 flex items-center justify-center text-white text-xs font-bold transition-opacity hover:opacity-90"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: getEmotionColor(segment.emotion),
                      opacity: 0.7 + (segment.intensity * 0.3)
                    }}
                    title={`${formatTime(segment.start)} - ${formatTime(segment.end)}: ${segment.text}`}
                  >
                    {getEmotionEmoji(segment.emotion)}
                  </div>
                );
              })}
              
              {/* Curseur de temps */}
              <div
                className="absolute top-0 w-1 h-full bg-white shadow-lg"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className="absolute -top-1 -left-2 w-5 h-5 bg-white rounded-full shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Liste des segments avec navigation */}
          <div className="bg-gray-700 p-4 rounded-lg max-h-80 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-3">Segments</h3>
            {segments.map((segment, index) => (
              <div
                key={index}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors border-l-4 ${
                  currentSegment === segment 
                    ? 'bg-gray-600 border-blue-400' 
                    : 'bg-gray-800 hover:bg-gray-650'
                }`}
                style={{ borderLeftColor: currentSegment === segment ? '#60A5FA' : getEmotionColor(segment.emotion) }}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = segment.start;
                    setCurrentTime(segment.start);
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getEmotionEmoji(segment.emotion)}</span>
                  <span className="text-blue-400 text-xs font-mono">
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </span>
                  <span 
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{ 
                      backgroundColor: getEmotionColor(segment.emotion) + '20',
                      color: getEmotionColor(segment.emotion)
                    }}
                  >
                    {segment.emotion}
                  </span>
                </div>
                <p className="text-white text-sm">{segment.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickmanPreview;
