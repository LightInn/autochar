import { type CustomEmotion } from "../utils/emotionManager";
import { type AudioAnalysisData } from "../utils/audioAnalyzer";
import { type EmotionSegment } from "../utils/intentionAnalyzer";
import VideoExporter from "../components/renderer/VideoExporter";

interface ExtendedEmotionSegment extends EmotionSegment {
  customEmotion?: CustomEmotion;
}

interface PreviewPageProps {
  onBackToMain: () => void;
  segments: ExtendedEmotionSegment[];
  audioFile: File | null;
  audioAnalysis: AudioAnalysisData[];
}

function PreviewPage({ 
  onBackToMain, 
  segments, 
  audioFile, 
  audioAnalysis 
}: Readonly<PreviewPageProps>) {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">🎭 Preview Animation</h1>
            <button
              onClick={onBackToMain}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">📊 Informations de Séquence</h3>
              
              {/* Informations générales */}
              <div className="space-y-4">
                <div className="bg-gray-700 rounded p-4">
                  <h4 className="font-semibold text-white mb-2">Séquence Globale</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Durée totale:</span>
                      <span className="text-white">
                        {segments.length > 0 ? Math.max(...segments.map(s => s.end)).toFixed(1) : 0}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Segments:</span>
                      <span className="text-white">{segments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Émotions uniques:</span>
                      <span className="text-white">
                        {new Set(segments.map(s => s.emotion)).size}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Liste des segments */}
                <div className="bg-gray-700 rounded p-4">
                  <h4 className="font-semibold text-white mb-2">Segments d'Émotions</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {segments.map((segment, index) => (
                      <div key={`${segment.start}-${segment.text}-${index}`} className="bg-gray-600 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-white">{segment.emotion}</span>
                          <span className="text-xs text-gray-300">
                            {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 italic">
                          "{segment.text}"
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: segment.customEmotion?.color ?? '#6B7280' }}
                          ></div>
                          <span className="text-xs text-gray-400">
                            {segment.customEmotion?.displayName ?? segment.emotion}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({Object.values(segment.customEmotion?.assets ?? {}).flat().length} assets)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statistiques audio */}
                {audioAnalysis.length > 0 && (
                  <div className="bg-gray-700 rounded p-4">
                    <h4 className="font-semibold text-white mb-2">Analyse Audio</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Points d'analyse:</span>
                        <span className="text-white">{audioAnalysis.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Volume moyen:</span>
                        <span className="text-white">
                          {(audioAnalysis.reduce((acc, curr) => acc + curr.volume, 0) / audioAnalysis.length * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Export Vidéo</h3>
              <VideoExporter 
                segments={segments}
                audioFile={audioFile}
                audioAnalysis={audioAnalysis}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewPage;