class Animator {
    constructor(renderer, emotionMapper) {
        this.renderer = renderer;
        this.emotionMapper = emotionMapper;
        this.isAnimating = false;
        this.animationFrame = null;
        this.startTime = 0;
        this.currentTime = 0;
        this.animationSpeed = 1;
        this.emotionSensitivity = 1;
        
        // Animation state
        this.previousEmotion = 'neutral';
        this.currentEmotion = 'neutral';
        this.emotionTransitionProgress = 0;
        this.transitionDuration = 1000; // ms
        
        // Animation callbacks
        this.onEmotionChange = null;
        this.onAnimationUpdate = null;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFpsTime = 0;
        this.fps = 0;
    }

    start() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.startTime = performance.now();
        this.frameCount = 0;
        this.lastFpsTime = this.startTime;
        
        this.animate();
        console.log('Animation started');
    }

    stop() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        console.log('Animation stopped');
    }

    pause() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        console.log('Animation paused');
    }

    resume() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animate();
        console.log('Animation resumed');
    }

    animate() {
        if (!this.isAnimating) return;
        
        const now = performance.now();
        this.currentTime = (now - this.startTime) * this.animationSpeed;
        
        // Update FPS
        this.updateFPS(now);
        
        // Get current emotion from mapper
        const newEmotion = this.emotionMapper.getCurrentEmotion();
        
        // Handle emotion transitions
        if (newEmotion !== this.currentEmotion) {
            this.startEmotionTransition(newEmotion);
        }
        
        // Update emotion transition
        this.updateEmotionTransition();
        
        // Get current emotion data (possibly interpolated)
        const emotionData = this.getCurrentEmotionData();
        
        // Update renderer with current emotion and animation phase
        this.renderer.updatePose(emotionData, this.currentTime);
        this.renderer.updateExpression(emotionData);
        
        // Render the frame
        this.renderer.render(this.currentTime);
        
        // Trigger callbacks
        if (this.onAnimationUpdate) {
            this.onAnimationUpdate({
                time: this.currentTime,
                emotion: this.currentEmotion,
                fps: this.fps,
                emotionData: emotionData
            });
        }
        
        // Schedule next frame
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    updateFPS(now) {
        this.frameCount++;
        if (now - this.lastFpsTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
            this.frameCount = 0;
            this.lastFpsTime = now;
        }
    }

    startEmotionTransition(newEmotion) {
        this.previousEmotion = this.currentEmotion;
        this.currentEmotion = newEmotion;
        this.emotionTransitionProgress = 0;
        
        console.log(`Emotion transition: ${this.previousEmotion} → ${this.currentEmotion}`);
        
        if (this.onEmotionChange) {
            this.onEmotionChange({
                from: this.previousEmotion,
                to: this.currentEmotion,
                emotionData: this.emotionMapper.getEmotionData(this.currentEmotion)
            });
        }
    }

    updateEmotionTransition() {
        if (this.emotionTransitionProgress < 1) {
            const deltaTime = 16.67; // Assume 60fps for consistent transitions
            this.emotionTransitionProgress += (deltaTime / this.transitionDuration) * this.emotionSensitivity;
            this.emotionTransitionProgress = Math.min(1, this.emotionTransitionProgress);
        }
    }

    getCurrentEmotionData() {
        if (this.emotionTransitionProgress >= 1 || this.previousEmotion === this.currentEmotion) {
            return this.emotionMapper.getEmotionData(this.currentEmotion);
        }
        
        // Interpolate between previous and current emotion
        return this.emotionMapper.interpolateEmotions(
            this.previousEmotion,
            this.currentEmotion,
            this.easeInOutCubic(this.emotionTransitionProgress)
        );
    }

    // Easing function for smooth transitions
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Configuration methods
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(5, speed));
        console.log(`Animation speed set to: ${this.animationSpeed}x`);
    }

    setEmotionSensitivity(sensitivity) {
        this.emotionSensitivity = Math.max(0.1, Math.min(3, sensitivity));
        this.transitionDuration = 1000 / this.emotionSensitivity;
        console.log(`Emotion sensitivity set to: ${this.emotionSensitivity}x`);
    }

    // Event handlers
    onEmotionChangeHandler(callback) {
        this.onEmotionChange = callback;
    }

    onAnimationUpdateHandler(callback) {
        this.onAnimationUpdate = callback;
    }

    // Utility methods
    getCurrentTime() {
        return this.currentTime;
    }

    getCurrentEmotion() {
        return this.currentEmotion;
    }

    getFPS() {
        return this.fps;
    }

    isRunning() {
        return this.isAnimating;
    }

    // Advanced animation features
    addEmotionKeyframe(time, emotion, duration = 1000) {
        // This could be used for scripted animations
        setTimeout(() => {
            this.emotionMapper.currentEmotion = emotion;
        }, time);
    }

    // Synchronization with audio
    syncWithAudio(audioCurrentTime) {
        // Adjust animation time to match audio time
        const audioTimeMs = audioCurrentTime * 1000;
        this.startTime = performance.now() - audioTimeMs / this.animationSpeed;
    }

    // Export current frame as image
    captureFrame() {
        return this.renderer.getCanvasDataURL();
    }

    // Animation statistics
    getAnimationStats() {
        return {
            isRunning: this.isAnimating,
            currentTime: this.currentTime,
            fps: this.fps,
            currentEmotion: this.currentEmotion,
            emotionTransitionProgress: this.emotionTransitionProgress,
            animationSpeed: this.animationSpeed,
            emotionSensitivity: this.emotionSensitivity
        };
    }

    // Reset animation state
    reset() {
        this.stop();
        this.currentTime = 0;
        this.startTime = 0;
        this.frameCount = 0;
        this.currentEmotion = 'neutral';
        this.previousEmotion = 'neutral';
        this.emotionTransitionProgress = 0;
        
        // Reset renderer to default state
        this.renderer.currentPose = this.renderer.getDefaultPose();
        this.renderer.currentExpression = this.renderer.getDefaultExpression();
        this.renderer.render(0);
        
        console.log('Animation reset');
    }

    // Batch emotion updates for performance
    batchEmotionUpdates(emotions, timestamps) {
        // This could be used to pre-calculate emotion sequences
        const emotionQueue = emotions.map((emotion, index) => ({
            emotion,
            timestamp: timestamps[index] || index * 100
        }));
        
        // Process emotion queue during animation
        this.emotionQueue = emotionQueue;
        this.emotionQueueIndex = 0;
    }

    processEmotionQueue() {
        if (!this.emotionQueue || this.emotionQueueIndex >= this.emotionQueue.length) {
            return;
        }
        
        const nextEmotion = this.emotionQueue[this.emotionQueueIndex];
        if (this.currentTime >= nextEmotion.timestamp) {
            this.emotionMapper.currentEmotion = nextEmotion.emotion;
            this.emotionQueueIndex++;
        }
    }
}

// Export for use in other modules
window.Animator = Animator;
