import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setTranscript(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("audio", file);

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe audio.");
      }

      const data = await response.json();
      setTranscript(data.transcript);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

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
            <div className="flex items-center text-gray-500">
              <div className="rounded-full border-2 border-gray-500 w-8 h-8 flex items-center justify-center">
                2
              </div>
              <p className="ml-2 text-lg">Transcription</p>
            </div>
            <div className="flex-auto border-t-2 border-gray-700 mx-4"></div>
            <div className="flex items-center text-gray-500">
              <div className="rounded-full border-2 border-gray-500 w-8 h-8 flex items-center justify-center">
                3
              </div>
              <p className="ml-2 text-lg">Animation</p>
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
                {isLoading ? 'Transcription en cours...' : 'Transcrire l\'audio'}
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
              <div className="text-left">
                {transcript.text}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
