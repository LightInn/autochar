import { useState } from "react";
import "./App.css";
import { analyzeIntention } from "./utils/intentionAnalyzer";
import type { EmotionSegment } from "./utils/intentionAnalyzer";
import type { StickmanPose } from "./utils/stickmanPoses";
import type { EmotionType } from "./utils/intentionAnalyzer";
import { EMOTION_POSES } from "./utils/stickmanPoses";
import IntentionAnalysis from "./components/IntentionAnalysis";
import StickmanPreview from "./components/StickmanPreview";
import StickmanEditorPage from "./components/StickmanEditorPage";
import VideoExporter from "./components/VideoExporter";
import VideoExporterTest from "./components/VideoExporterTest";
import AdvancedEditor from "./components/AdvancedEditor";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [intentionAnalysis, setIntentionAnalysis] = useState<EmotionSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [currentPage, setCurrentPage] = useState<'main' | 'editor' | 'test' | 'advanced'>('main');
  const [customPoses, setCustomPoses] = useState<Record<EmotionType, StickmanPose>>(EMOTION_POSES);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setTranscript(null);
      setIntentionAnalysis([]);
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
      const response = await fetch("http://localhost:3001/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader.');
      }

      const decoder = new TextDecoder();
      setTranscriptionStatus('Transcription in progress...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const events = chunk.split('\n\n').filter(event => event.trim());

        for (const event of events) {
          const lines = event.split('\n');
          const eventType = lines.find(line => line.startsWith('event:'))?.replace('event: ', '');
          const dataLine = lines.find(line => line.startsWith('data:'))?.replace('data: ', '');

          if (!eventType || !dataLine) continue;

          try {
            if (eventType === 'result') {
              const result = JSON.parse(dataLine);
              setTranscript(result);
              setTranscriptionStatus('Transcription complete!');
              
              // Analyser l'intention si on a une transcription structurée
              if (result.transcription && Array.isArray(result.transcription)) {
                console.log('Analyzing intention for segments:', result.transcription);
                const analysis = analyzeIntention(result.transcription);
                console.log('Intention analysis result:', analysis);
                setIntentionAnalysis(analysis);
              }
            } else if (eventType === 'error') {
              const errorResult = JSON.parse(dataLine);
              setError(errorResult.message || 'An unknown error occurred.');
              setTranscriptionStatus('An error occurred.');
            } else if (eventType === 'done') {
              setIsLoading(false);
              reader.cancel();
              return;
            }
          } catch (parseError) {
            console.error('Failed to parse SSE data:', parseError, 'Data:', dataLine);
          }
        }
      }

    } catch (err: any) {
      setError(err.message);
      setTranscriptionStatus('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Si on est sur la page d'édition, afficher cette page
  if (currentPage === 'editor') {
    return (
      <StickmanEditorPage
        onBackToMain={() => setCurrentPage('main')}
        onSaveChanges={(newPoses) => {
          setCustomPoses(newPoses);
          setCurrentPage('main');
        }}
        initialPoses={customPoses}
      />
    );
  }

  // Si on est sur la page de test, afficher cette page
  if (currentPage === 'test') {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">🧪 Test Export Vidéo</h1>
              <button
                onClick={() => setCurrentPage('main')}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>
        <VideoExporterTest />
      </div>
    );
  }

  // Si on est sur l'éditeur avancé
  if (currentPage === 'advanced') {
    return (
      <AdvancedEditor
        onBackToMain={() => setCurrentPage('main')}
        onSave={(emotions) => {
          console.log('Émotions sauvegardées:', emotions);
          setCurrentPage('main');
        }}
      />
    );
  }

  return (
    <>
      {/* Header avec Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">🤖 AutoStickman</h1>
              <span className="text-gray-400 text-sm">Audio → Intention → Animation</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage('test')}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                🧪 Test Export
              </button>
              <button
                onClick={() => setCurrentPage('advanced')}
                className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                🚀 Éditeur Avancé
              </button>
              <button
                onClick={() => setCurrentPage('editor')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                🎨 Éditeur Simple
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="w-full max-w-2xl mx-auto p-4">
          {/* Stepper */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center text-blue-500">
              <div className="rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center">
                1
              </div>
              <p className="ml-2 text-lg font-semibold">Upload Audio</p>
            </div>
            <div className="flex-auto border-t-2 border-gray-700 mx-4"></div>
            <div className={`flex items-center ${transcript ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`rounded-full ${transcript ? 'bg-blue-500 text-white' : 'border-2 border-gray-500'} w-8 h-8 flex items-center justify-center`}>
                2
              </div>
              <p className="ml-2 text-lg">Transcription</p>
            </div>
            <div className="flex-auto border-t-2 border-gray-700 mx-4"></div>
            <div className={`flex items-center ${intentionAnalysis.length > 0 ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`rounded-full ${intentionAnalysis.length > 0 ? 'bg-blue-500 text-white' : 'border-2 border-gray-500'} w-8 h-8 flex items-center justify-center`}>
                3
              </div>
              <p className="ml-2 text-lg">Intention</p>
            </div>
            <div className="flex-auto border-t-2 border-gray-700 mx-4"></div>
            <div className={`flex items-center ${intentionAnalysis.length > 0 ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`rounded-full ${intentionAnalysis.length > 0 ? 'bg-blue-500 text-white' : 'border-2 border-gray-500'} w-8 h-8 flex items-center justify-center`}>
                4
              </div>
              <p className="ml-2 text-lg">Preview</p>
            </div>
            <div className="flex-auto border-t-2 border-gray-700 mx-4"></div>
            <div className={`flex items-center ${intentionAnalysis.length > 0 ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`rounded-full ${intentionAnalysis.length > 0 ? 'bg-blue-500 text-white' : 'border-2 border-gray-500'} w-8 h-8 flex items-center justify-center`}>
                5
              </div>
              <p className="ml-2 text-lg">Export</p>
            </div>
          </div>

          {/* Step 1: Upload */}
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Upload your .wav file</h2>
            <p className="mb-6 text-gray-400">
              Select a .wav audio file to start the process.
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
                  <p className="text-lg text-green-400">{file.name}</p>
                ) : (
                  <p className="text-lg text-gray-400">
                    Drag and drop or click to upload
                  </p>
                )}
              </label>
            </div>
            {file && (
              <button 
                onClick={handleUpload} 
                disabled={isLoading}
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500">
                {isLoading ? (transcriptionStatus || 'Transcription en cours...') : 'Transcrire l\'audio'}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-800 p-4 rounded-lg">
              <p className="text-white">{error}</p>
            </div>
          )}

          {transcript && (
            <div className="mt-8 bg-gray-800 p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Transcription</h2>
              
              {transcript.transcription ? (
                // Display structured transcription with timestamps
                <div className="text-left space-y-2">
                  {transcript.transcription.map((segment: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 py-2 border-b border-gray-700">
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
                // Fallback to plain text display
                <div className="text-left whitespace-pre-wrap text-white">
                  {transcript.text || transcript}
                </div>
              )}
              
              {transcript.model && (
                <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
                  <p>Modèle: {transcript.model.type} | Langue: {transcript.result?.language || 'fr'}</p>
                </div>
              )}
            </div>
          )}

          {/* Analyse d'intention */}
          {intentionAnalysis.length > 0 && (
            <div className="mt-8">
              <IntentionAnalysis 
                segments={intentionAnalysis}
                onSegmentClick={(segment) => {
                  console.log('Segment clicked:', segment);
                }}
                onEmotionChange={(segmentIndex, newEmotion) => {
                  const updatedAnalysis = [...intentionAnalysis];
                  updatedAnalysis[segmentIndex] = {
                    ...updatedAnalysis[segmentIndex],
                    emotion: newEmotion
                  };
                  setIntentionAnalysis(updatedAnalysis);
                }}
              />
            </div>
          )}

          {/* Préview Stickman */}
          {intentionAnalysis.length > 0 && (
            <div className="mt-8">
              <StickmanPreview 
                segments={intentionAnalysis}
                audioFile={file}
                customPoses={customPoses}
              />
            </div>
          )}

          {/* Export Vidéo */}
          {intentionAnalysis.length > 0 && (
            <div className="mt-8">
              <VideoExporter 
                segments={intentionAnalysis}
                customPoses={customPoses}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
