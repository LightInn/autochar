class VideoExporter {
    constructor(canvas) {
        this.canvas = canvas;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingStartTime = 0;
        this.recordingDuration = 0;
        
        // Export settings
        this.settings = {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 2500000,
            audioBitsPerSecond: 128000,
            fps: 30,
            transparent: true
        };
        
        // Fallback mime types
        this.supportedMimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4;codecs=h264,aac',
            'video/mp4'
        ];
        
        this.initializeMimeType();
    }

    initializeMimeType() {
        // Find the first supported mime type
        for (const mimeType of this.supportedMimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                this.settings.mimeType = mimeType;
                console.log(`Using mime type: ${mimeType}`);
                break;
            }
        }
        
        if (!MediaRecorder.isTypeSupported(this.settings.mimeType)) {
            console.warn('No supported video mime type found. Video export may not work.');
        }
    }

    async startRecording(audioElement = null, duration = null) {
        if (this.isRecording) {
            console.warn('Recording already in progress');
            return false;
        }

        try {
            // Get canvas stream
            const canvasStream = this.canvas.captureStream(this.settings.fps);
            
            let combinedStream = canvasStream;
            
            // Add audio if provided
            if (audioElement && audioElement.srcObject) {
                const audioStream = audioElement.srcObject;
                const audioTracks = audioStream.getAudioTracks();
                
                if (audioTracks.length > 0) {
                    // Combine video and audio streams
                    combinedStream = new MediaStream([
                        ...canvasStream.getVideoTracks(),
                        ...audioTracks
                    ]);
                }
            } else if (audioElement && audioElement.src) {
                // Create audio context to capture audio from audio element
                try {
                    const audioContext = new AudioContext();
                    const source = audioContext.createMediaElementSource(audioElement);
                    const dest = audioContext.createMediaStreamDestination();
                    source.connect(dest);
                    source.connect(audioContext.destination);
                    
                    combinedStream = new MediaStream([
                        ...canvasStream.getVideoTracks(),
                        ...dest.stream.getAudioTracks()
                    ]);
                } catch (audioError) {
                    console.warn('Could not capture audio:', audioError);
                    // Continue with video-only recording
                }
            }
            
            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: this.settings.mimeType,
                videoBitsPerSecond: this.settings.videoBitsPerSecond,
                audioBitsPerSecond: this.settings.audioBitsPerSecond
            });
            
            // Set up event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.handleRecordingStop();
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.isRecording = false;
            };
            
            // Start recording
            this.recordedChunks = [];
            this.recordingStartTime = Date.now();
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            
            console.log('Recording started');
            
            // Auto-stop after duration if specified
            if (duration) {
                setTimeout(() => {
                    this.stopRecording();
                }, duration * 1000);
            }
            
            return true;
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.isRecording = false;
            return false;
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            console.warn('No recording in progress');
            return;
        }
        
        this.mediaRecorder.stop();
        this.recordingDuration = (Date.now() - this.recordingStartTime) / 1000;
        this.isRecording = false;
        
        console.log(`Recording stopped. Duration: ${this.recordingDuration.toFixed(2)}s`);
    }

    handleRecordingStop() {
        if (this.recordedChunks.length === 0) {
            console.error('No recorded data available');
            return;
        }
        
        // Create blob from recorded chunks
        const blob = new Blob(this.recordedChunks, {
            type: this.settings.mimeType
        });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const filename = this.generateFilename();
        
        this.downloadVideo(url, filename);
        
        // Clean up
        this.recordedChunks = [];
        this.mediaRecorder = null;
        
        console.log(`Video exported: ${filename}`);
    }

    generateFilename() {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const extension = this.getFileExtension();
        return `stickman-animation-${timestamp}.${extension}`;
    }

    getFileExtension() {
        if (this.settings.mimeType.includes('webm')) {
            return 'webm';
        } else if (this.settings.mimeType.includes('mp4')) {
            return 'mp4';
        }
        return 'webm'; // default
    }

    downloadVideo(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up URL after download
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    // Export single frame as image
    exportFrame(format = 'png') {
        const dataURL = this.canvas.toDataURL(`image/${format}`);
        const filename = `stickman-frame-${Date.now()}.${format}`;
        
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log(`Frame exported: ${filename}`);
    }

    // Export animation as GIF (requires additional library)
    async exportGIF(duration = 5, fps = 10) {
        console.warn('GIF export not implemented. Consider using a library like gif.js');
        // This would require implementing GIF encoding
        // or using a library like gif.js
    }

    // Configuration methods
    setVideoQuality(quality) {
        const qualities = {
            low: { videoBitsPerSecond: 1000000, fps: 24 },
            medium: { videoBitsPerSecond: 2500000, fps: 30 },
            high: { videoBitsPerSecond: 5000000, fps: 60 },
            ultra: { videoBitsPerSecond: 8000000, fps: 60 }
        };
        
        if (qualities[quality]) {
            this.settings = { ...this.settings, ...qualities[quality] };
            console.log(`Video quality set to: ${quality}`);
        }
    }

    setCustomSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        console.log('Custom export settings applied:', settings);
    }

    // Utility methods
    isRecordingActive() {
        return this.isRecording;
    }

    getRecordingDuration() {
        if (this.isRecording) {
            return (Date.now() - this.recordingStartTime) / 1000;
        }
        return this.recordingDuration;
    }

    getSupportedMimeTypes() {
        return this.supportedMimeTypes.filter(type => 
            MediaRecorder.isTypeSupported(type)
        );
    }

    getSettings() {
        return { ...this.settings };
    }

    // Preview methods
    createPreviewBlob() {
        if (this.recordedChunks.length === 0) {
            return null;
        }
        
        return new Blob(this.recordedChunks, {
            type: this.settings.mimeType
        });
    }

    createPreviewURL() {
        const blob = this.createPreviewBlob();
        return blob ? URL.createObjectURL(blob) : null;
    }

    // Batch export for multiple animations
    async exportBatch(animations, settings = {}) {
        const results = [];
        
        for (let i = 0; i < animations.length; i++) {
            const animation = animations[i];
            console.log(`Exporting animation ${i + 1}/${animations.length}`);
            
            // This would need to be implemented based on how animations are structured
            // For now, it's a placeholder for future functionality
            results.push({
                index: i,
                success: false,
                error: 'Batch export not yet implemented'
            });
        }
        
        return results;
    }

    // Memory cleanup
    cleanup() {
        if (this.isRecording) {
            this.stopRecording();
        }
        
        this.recordedChunks = [];
        this.mediaRecorder = null;
        
        console.log('VideoExporter cleaned up');
    }
}

// Export for use in other modules
window.VideoExporter = VideoExporter;
