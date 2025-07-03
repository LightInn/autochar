const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example IPC methods (add as needed)
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  
  // System info
  platform: process.platform,
  
  // Server communication
  transcribeAudio: async (formData) => {
    try {
      const response = await fetch('http://localhost:3001/api/transcribe', {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('Transcription request failed:', error);
      throw error;
    }
  },

  // Health check
  checkServerHealth: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      return await response.json();
    } catch (error) {
      console.error('Server health check failed:', error);
      throw error;
    }
  }
});
