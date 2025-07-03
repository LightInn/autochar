import { useState } from "react";
import "../App.css";
import type { EmotionSegment } from "../utils/intentionAnalyzer";
import { type CustomEmotion } from "../utils/emotionManager";
import { audioAnalyzer, type AudioAnalysisData } from "../utils/audioAnalyzer";

// Extension du type EmotionSegment pour inclure l'émotion personnalisée
interface ExtendedEmotionSegment extends EmotionSegment {
  customEmotion?: CustomEmotion;
}

interface MainPageProps {
  setCurrentPage: (page: 'main' | 'editor' | 'preview') => void;
  setIntentionAnalysis: (analysis: ExtendedEmotionSegment[]) => void;
  setAudioAnalysis: (analysis: AudioAnalysisData[]) => void;
  setFile: (file: File | null) => void;
  file: File | null;
  transcript: any;
  setTranscript: (transcript: any) => void;
  intentionAnalysis: ExtendedEmotionSegment[];
  emotions: CustomEmotion[];
  selectedEmotion: CustomEmotion | null;
  setSelectedEmotion: (emotion: CustomEmotion | null) => void;
}

function MainPage({ 
  setCurrentPage,
  setIntentionAnalysis,
  setAudioAnalysis,
  setFile,
  file,
  transcript,
  setTranscript,
  intentionAnalysis,
  emotions,
  selectedEmotion,
  setSelectedEmotion
}: Readonly<MainPageProps>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setTranscript(null);
      setIntentionAnalysis([]);
      setAudioAnalysis([]);
      setError(null);
      setTranscriptionStatus('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("audio", file);

    setIsLoading(true);
    setError(null);
    setTranscript(null);
    setIntentionAnalysis([]);
    setTranscriptionStatus('Uploading file...');

    try {
      // Analyser l'audio en parallèle
      audioAnalyzer.loadAudioFile(file).then(async () => {
        const analysis = await audioAnalyzer.analyzeFullAudio();
        setAudioAnalysis(analysis);
      }).catch(err => {
        console.error('Erreur analyse audio:', err);
      });

      const response = await fetch("http://localhost:3001/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Set the transcription result
      setTranscript(result.transcription);
      setTranscriptionStatus('Transcription completed. Analyzing intentions...');

      // For now, create a simple segment analysis since we have plain text
      // We can improve this later to use actual timestamps from whisper
      const simpleSegment = {
        start: 0,
        end: 10, // Default duration
        text: result.transcription,
        emotion: 'neutral' as const,
        intensity: 0.5,
        confidence: 0.8,
        triggers: []
      };
      setIntentionAnalysis([simpleSegment]);
      setTranscriptionStatus('Analysis completed!');

    } catch (err: any) {
      setError(err.message);
      setTranscriptionStatus('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header avec Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">🎭 AutoChar Studio</h1>
              <span className="text-gray-400 text-sm">Audio → Intention → Animation Personnalisée</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage('editor')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                🎨 Éditeur Émotions
              </button>
              {intentionAnalysis.length > 0 && selectedEmotion && (
                <button
                  onClick={() => setCurrentPage('preview')}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  🎬 Preview & Export
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-900 text-white">
        <div className="w-full max-w-4xl mx-auto p-4 min-h-full flex flex-col justify-center">
          {/* Stepper */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center text-blue-500">
              <div className="rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center">
                1
              </div>
              <p className="ml-2 text-lg font-semibold">Setup Characters</p>
            </div>
            <div className="flex-auto border-t-2 border-gray-700 mx-4"></div>
            <div className={`flex items-center ${file ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`rounded-full ${file ? 'bg-blue-500 text-white' : 'border-2 border-gray-500'} w-8 h-8 flex items-center justify-center`}>
                2
              </div>
              <p className="ml-2 text-lg">Upload Audio</p>
            </div>
            <div className="flex-auto border-t-2 border-gray-700 mx-4"></div>
            <div className={`flex items-center ${transcript ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`rounded-full ${transcript ? 'bg-blue-500 text-white' : 'border-2 border-gray-500'} w-8 h-8 flex items-center justify-center`}>
                3
              </div>
              <p className="ml-2 text-lg">Analysis</p>
            </div>
            <div className="flex-auto border-t-2 border-gray-700 mx-4"></div>
            <div className={`flex items-center ${intentionAnalysis.length > 0 ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`rounded-full ${intentionAnalysis.length > 0 ? 'bg-blue-500 text-white' : 'border-2 border-gray-500'} w-8 h-8 flex items-center justify-center`}>
                4
              </div>
              <p className="ml-2 text-lg">Export</p>
            </div>
          </div>

          {/* Gestion des personnages */}
          {emotions.length === 0 && (
            <div className="bg-yellow-800/50 border border-yellow-600 p-6 rounded-lg mb-8 text-center">
              <h3 className="text-lg font-bold text-yellow-200 mb-2">🎭 Aucun personnage configuré</h3>
              <p className="text-yellow-100 mb-4">
                Vous devez d'abord créer vos personnages avec leurs émotions et assets
              </p>
              <button
                onClick={() => setCurrentPage('editor')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200"
              >
                🎨 Créer mes personnages
              </button>
            </div>
          )}

          {/* Résumé des personnages créés */}
          {emotions.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">🎭 Personnages disponibles ({emotions.length})</h3>
                <button
                  onClick={() => setCurrentPage('editor')}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Modifier
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emotions.map((emotion) => (
                  <button 
                    key={emotion.id}
                    type="button"
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-left ${
                      selectedEmotion?.id === emotion.id 
                        ? 'border-blue-500 bg-blue-900/30' 
                        : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedEmotion(emotion)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: emotion.color }}
                      ></div>
                      <h4 className="font-bold text-white">{emotion.displayName}</h4>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{emotion.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(emotion.assets).map(asset => (
                        <span key={asset} className="bg-gray-600 text-xs px-2 py-1 rounded">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload Audio */}
          {emotions.length > 0 && (
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4">📁 Upload your audio file</h2>
              <p className="mb-6 text-gray-400">
                Sélectionnez un fichier audio pour analyser les émotions et générer l'animation.
              </p>
              <div className="flex items-center justify-center bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg p-12">
                <input
                  type="file"
                  accept=".wav, .mp3, .ogg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    className="w-12 h-12 text-gray-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  {file ? (
                    <p className="text-lg text-green-400">✅ {file.name}</p>
                  ) : (
                    <p className="text-lg text-gray-400">
                      Glissez-déposez ou cliquez pour uploader
                    </p>
                  )}
                </label>
              </div>
              {file && (
                <button 
                  onClick={handleUpload} 
                  disabled={isLoading}
                  className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:bg-gray-500 w-full">
                  {isLoading ? (transcriptionStatus || 'Analyse en cours...') : '🎵 Analyser l\'audio'}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-800 p-4 rounded-lg">
              <p className="text-white">❌ {error}</p>
            </div>
          )}

          {/* Résultats de transcription */}
          {transcript && (
            <div className="mt-8 bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">📝 Transcription</h2>
                <button
                  onClick={() => setIsTranscriptionExpanded(!isTranscriptionExpanded)}
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                >
                  {isTranscriptionExpanded ? '▼ Masquer' : '▶ Afficher'}
                  <span className="text-sm text-gray-400">
                    ({transcript.transcription?.length ?? 1} segment{transcript.transcription?.length > 1 ? 's' : ''})
                  </span>
                </button>
              </div>
              
              {isTranscriptionExpanded && (
                <>
                  {transcript.transcription ? (
                    <div className="text-left space-y-2 mb-6">
                      {transcript.transcription.map((segment: any) => (
                        <div key={`${segment.timestamps.from}-${segment.text}`} className="flex items-start space-x-3 py-2 border-b border-gray-700">
                          <span className="text-blue-400 text-sm font-mono min-w-[100px]">
                            {segment.timestamps.from}
                          </span>
                          <span className="text-white flex-1">
                            {segment.text.trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-left whitespace-pre-wrap text-white mb-6">
                      {transcript.text ?? transcript}
                    </div>
                  )}
                  
                  {transcript.model && (
                    <div className="pt-4 border-t border-gray-700 text-sm text-gray-400">
                      <p>Modèle: {transcript.model.type} | Langue: {transcript.result?.language ?? 'fr'}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Analyse d'intention avec gestion des triggers */}
          {intentionAnalysis.length > 0 && (
            <div className="mt-8 bg-gray-800 p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-6">🧠 Analyse des émotions</h2>
              <div className="space-y-4">
                {intentionAnalysis.map((segment, index) => (
                  <div key={`${segment.start}-${segment.text}`} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-blue-400 font-mono text-sm">
                          {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                        </span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: segment.customEmotion?.color ?? '#6B7280' }}
                          ></div>
                          <span className="font-bold text-white">
                            {segment.customEmotion?.displayName ?? segment.emotion}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                          {Math.round(segment.confidence * 100)}%
                        </span>
                        <select
                          value={segment.customEmotion?.id ?? ''}
                          onChange={(e) => {
                            const newEmotionId = e.target.value;
                            const newEmotion = emotions.find(em => em.id === newEmotionId);
                            const updatedAnalysis = intentionAnalysis.map((seg, idx) => 
                              idx === index ? { ...seg, customEmotion: newEmotion } : seg
                            );
                            setIntentionAnalysis(updatedAnalysis);
                          }}
                          className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                        >
                          <option value="">Auto</option>
                          {emotions.map(emotion => (
                            <option key={emotion.id} value={emotion.id}>
                              {emotion.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-2">"{segment.text}"</p>
                    <div className="flex flex-wrap gap-1">
                      {segment.triggers.map((trigger) => (
                        <span key={trigger} className="text-xs bg-purple-600 px-2 py-1 rounded">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MainPage;
