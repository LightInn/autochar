import { useState, useEffect } from "react";
import "./App.css";
import { emotionManager, type CustomEmotion } from "./utils/emotionManager";
import { type AudioAnalysisData } from "./utils/audioAnalyzer";
import { type EmotionSegment } from "./utils/intentionAnalyzer";
import MainPage from "./pages/MainPage";
import EditorPage from "./pages/EditorPage";
import PreviewPage from "./pages/PreviewPage";

// Extension du type EmotionSegment pour inclure l'émotion personnalisée
interface ExtendedEmotionSegment extends EmotionSegment {
  customEmotion?: CustomEmotion;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [intentionAnalysis, setIntentionAnalysis] = useState<ExtendedEmotionSegment[]>([]);
  const [currentPage, setCurrentPage] = useState<'main' | 'editor' | 'preview'>('main');
  const [emotions, setEmotions] = useState<CustomEmotion[]>([]);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysisData[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<CustomEmotion | null>(null);

  // Load emotions on startup
  useEffect(() => {
    const loadedEmotions = emotionManager.getAllEmotions();
    setEmotions(loadedEmotions);
    if (loadedEmotions.length > 0) {
      setSelectedEmotion(loadedEmotions[0]);
    }
  }, []);

  // Editor page
  if (currentPage === 'editor') {
    return (
      <EditorPage
        onBackToMain={() => setCurrentPage('main')}
        onSave={(savedEmotions) => {
          setEmotions(savedEmotions);
          setCurrentPage('main');
        }}
      />
    );
  }

  // Preview page
  if (currentPage === 'preview' && selectedEmotion) {
    return (
      <PreviewPage
        onBackToMain={() => setCurrentPage('main')}
        segments={intentionAnalysis}
        audioFile={file}
        audioAnalysis={audioAnalysis}
      />
    );
  }

  // Main page
  return (
    <MainPage
      setCurrentPage={setCurrentPage}
      setIntentionAnalysis={setIntentionAnalysis}
      setAudioAnalysis={setAudioAnalysis}
      setFile={setFile}
      file={file}
      transcript={transcript}
      setTranscript={setTranscript}
      intentionAnalysis={intentionAnalysis}
      emotions={emotions}
      selectedEmotion={selectedEmotion}
      setSelectedEmotion={setSelectedEmotion}
    />
  );
}

export default App;
