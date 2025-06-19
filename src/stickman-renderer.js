class StickmanRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Base measurements for the stickman
        this.scale = 1;
        this.baseHeight = 300;
        this.headRadius = 30;
        this.bodyHeight = 80;
        this.armLength = 60;
        this.legLength = 80;
        
        // Current pose and expression
        this.currentPose = this.getDefaultPose();
        this.currentExpression = this.getDefaultExpression();
        
        // Animation properties
        this.animationOffset = 0;
        this.breathingPhase = 0;
        this.blinkTimer = 0;
        
        // Colors
        this.colors = {
            head: '#FFE0BD',
            body: '#333333',
            limbs: '#333333',
            eyes: '#000000',
            mouth: '#000000',
            eyebrows: '#8B4513',
            background: 'rgba(255, 255, 255, 0)'
        };
    }

    getDefaultPose() {
        return {
            // Head
            headX: this.width / 2,
            headY: this.height / 2 - 100,
            headTilt: 0,
            
            // Body
            bodyTopX: this.width / 2,
            bodyTopY: this.height / 2 - 60,
            bodyBottomX: this.width / 2,
            bodyBottomY: this.height / 2 + 20,
            bodyLean: 0,
            
            // Arms
            leftShoulderX: this.width / 2,
            leftShoulderY: this.height / 2 - 50,
            leftElbowX: this.width / 2 - 40,
            leftElbowY: this.height / 2 - 30,
            leftHandX: this.width / 2 - 50,
            leftHandY: this.height / 2,
            
            rightShoulderX: this.width / 2,
            rightShoulderY: this.height / 2 - 50,
            rightElbowX: this.width / 2 + 40,
            rightElbowY: this.height / 2 - 30,
            rightHandX: this.width / 2 + 50,
            rightHandY: this.height / 2,
            
            // Legs
            leftHipX: this.width / 2,
            leftHipY: this.height / 2 + 20,
            leftKneeX: this.width / 2 - 20,
            leftKneeY: this.height / 2 + 60,
            leftFootX: this.width / 2 - 30,
            leftFootY: this.height / 2 + 100,
            
            rightHipX: this.width / 2,
            rightHipY: this.height / 2 + 20,
            rightKneeX: this.width / 2 + 20,
            rightKneeY: this.height / 2 + 60,
            rightFootX: this.width / 2 + 30,
            rightFootY: this.height / 2 + 100
        };
    }

    getDefaultExpression() {
        return {
            eyebrowPosition: 0, // -1 to 1
            eyeSize: 1, // 0.5 to 1.5
            eyeShape: 'normal', // normal, sad, happy, surprised
            mouthCurve: 0, // -1 (sad) to 1 (happy)
            mouthOpen: 0, // 0 to 1
            blinkState: 0 // 0 to 1
        };
    }

    updatePose(emotionData, animationPhase = 0) {
        const pose = { ...this.getDefaultPose() };
        const bodyLanguage = emotionData.bodyLanguage;
        const expressions = emotionData.expressions;
        
        // Apply head tilt
        pose.headTilt = expressions.headTilt * Math.PI / 180;
        
        // Apply body posture
        switch (bodyLanguage.bodyPosture) {
            case 'excited':
                pose.bodyLean = Math.sin(animationPhase * 0.1) * 5;
                pose.headY -= 5;
                break;
            case 'leaning':
                pose.bodyLean = -10;
                pose.headTilt += -0.1;
                break;
        }
        
        // Apply arm positions
        switch (bodyLanguage.armPosition) {
            case 'up':
                pose.leftHandY -= 60;
                pose.rightHandY -= 60;
                pose.leftElbowY -= 30;
                pose.rightElbowY -= 30;
                break;
            case 'crossed':
                pose.leftHandX = this.width / 2 + 20;
                pose.rightHandX = this.width / 2 - 20;
                pose.leftHandY = this.height / 2 - 10;
                pose.rightHandY = this.height / 2 - 10;
                break;
            case 'gesturing':
                pose.leftHandY += Math.sin(animationPhase * 0.15) * 10;
                pose.rightHandY += Math.cos(animationPhase * 0.15) * 10;
                pose.leftHandX += Math.cos(animationPhase * 0.12) * 15;
                pose.rightHandX += Math.sin(animationPhase * 0.12) * 15;
                break;
        }
        
        // Apply leg stance
        switch (bodyLanguage.legStance) {
            case 'wide':
                pose.leftFootX -= 15;
                pose.rightFootX += 15;
                pose.leftKneeX -= 10;
                pose.rightKneeX += 10;
                break;
            case 'dancing':
                const danceOffset = Math.sin(animationPhase * 0.2) * 20;
                pose.leftFootY += Math.abs(danceOffset);
                pose.rightFootY += Math.abs(-danceOffset);
                pose.leftKneeX += danceOffset / 2;
                pose.rightKneeX -= danceOffset / 2;
                break;
        }
        
        // Add breathing animation
        const breathingOffset = Math.sin(animationPhase * 0.05) * 2;
        pose.bodyTopY += breathingOffset;
        pose.leftShoulderY += breathingOffset;
        pose.rightShoulderY += breathingOffset;
        
        this.currentPose = pose;
    }

    updateExpression(emotionData) {
        const expressions = emotionData.expressions;
        
        this.currentExpression = {
            eyebrowPosition: expressions.eyebrows,
            eyeSize: expressions.eyes > 0 ? 1 + expressions.eyes * 0.3 : 1 + expressions.eyes * 0.2,
            eyeShape: this.getEyeShape(expressions.eyes),
            mouthCurve: expressions.mouth,
            mouthOpen: Math.abs(expressions.mouth) * 0.3,
            blinkState: this.updateBlink()
        };
    }

    getEyeShape(eyeValue) {
        if (eyeValue > 0.5) return 'happy';
        if (eyeValue < -0.5) return 'sad';
        if (Math.abs(eyeValue) > 0.8) return 'surprised';
        return 'normal';
    }

    updateBlink() {
        this.blinkTimer += 0.1;
        if (this.blinkTimer > 100) {
            this.blinkTimer = 0;
            return 1;
        }
        return Math.max(0, 1 - this.blinkTimer * 10);
    }

    render(animationPhase = 0) {
        // Clear canvas with transparent background
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Set drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        const pose = this.currentPose;
        
        // Draw body
        this.drawBody(pose);
        
        // Draw limbs
        this.drawArms(pose);
        this.drawLegs(pose);
        
        // Draw head
        this.drawHead(pose);
        
        // Draw face
        this.drawFace(pose);
    }

    drawBody(pose) {
        this.ctx.strokeStyle = this.colors.body;
        this.ctx.lineWidth = 8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(pose.bodyTopX + pose.bodyLean, pose.bodyTopY);
        this.ctx.lineTo(pose.bodyBottomX + pose.bodyLean, pose.bodyBottomY);
        this.ctx.stroke();
    }

    drawArms(pose) {
        this.ctx.strokeStyle = this.colors.limbs;
        this.ctx.lineWidth = 6;
        
        // Left arm
        this.ctx.beginPath();
        this.ctx.moveTo(pose.leftShoulderX, pose.leftShoulderY);
        this.ctx.lineTo(pose.leftElbowX, pose.leftElbowY);
        this.ctx.lineTo(pose.leftHandX, pose.leftHandY);
        this.ctx.stroke();
        
        // Right arm
        this.ctx.beginPath();
        this.ctx.moveTo(pose.rightShoulderX, pose.rightShoulderY);
        this.ctx.lineTo(pose.rightElbowX, pose.rightElbowY);
        this.ctx.lineTo(pose.rightHandX, pose.rightHandY);
        this.ctx.stroke();
        
        // Hands
        this.ctx.fillStyle = this.colors.head;
        this.ctx.beginPath();
        this.ctx.arc(pose.leftHandX, pose.leftHandY, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(pose.rightHandX, pose.rightHandY, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawLegs(pose) {
        this.ctx.strokeStyle = this.colors.limbs;
        this.ctx.lineWidth = 6;
        
        // Left leg
        this.ctx.beginPath();
        this.ctx.moveTo(pose.leftHipX, pose.leftHipY);
        this.ctx.lineTo(pose.leftKneeX, pose.leftKneeY);
        this.ctx.lineTo(pose.leftFootX, pose.leftFootY);
        this.ctx.stroke();
        
        // Right leg
        this.ctx.beginPath();
        this.ctx.moveTo(pose.rightHipX, pose.rightHipY);
        this.ctx.lineTo(pose.rightKneeX, pose.rightKneeY);
        this.ctx.lineTo(pose.rightFootX, pose.rightFootY);
        this.ctx.stroke();
        
        // Feet
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(pose.leftFootX - 10, pose.leftFootY);
        this.ctx.lineTo(pose.leftFootX + 5, pose.leftFootY);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(pose.rightFootX - 5, pose.rightFootY);
        this.ctx.lineTo(pose.rightFootX + 10, pose.rightFootY);
        this.ctx.stroke();
    }

    drawHead(pose) {
        this.ctx.save();
        this.ctx.translate(pose.headX, pose.headY);
        this.ctx.rotate(pose.headTilt);
        
        // Head circle
        this.ctx.fillStyle = this.colors.head;
        this.ctx.strokeStyle = this.colors.body;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.headRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawFace(pose) {
        this.ctx.save();
        this.ctx.translate(pose.headX, pose.headY);
        this.ctx.rotate(pose.headTilt);
        
        const expr = this.currentExpression;
        
        // Eyebrows
        this.drawEyebrows(expr);
        
        // Eyes
        this.drawEyes(expr);
        
        // Mouth
        this.drawMouth(expr);
        
        this.ctx.restore();
    }

    drawEyebrows(expr) {
        this.ctx.strokeStyle = this.colors.eyebrows;
        this.ctx.lineWidth = 3;
        
        const eyebrowY = -15 + expr.eyebrowPosition * 8;
        const eyebrowAngle = expr.eyebrowPosition * 0.3;
        
        // Left eyebrow
        this.ctx.beginPath();
        this.ctx.moveTo(-18, eyebrowY);
        this.ctx.lineTo(-8, eyebrowY - eyebrowAngle * 10);
        this.ctx.stroke();
        
        // Right eyebrow
        this.ctx.beginPath();
        this.ctx.moveTo(8, eyebrowY - eyebrowAngle * 10);
        this.ctx.lineTo(18, eyebrowY);
        this.ctx.stroke();
    }

    drawEyes(expr) {
        this.ctx.fillStyle = this.colors.eyes;
        
        const eyeSize = this.headRadius * 0.15 * expr.eyeSize;
        const eyeY = -5;
        
        if (expr.blinkState < 0.1) {
            // Normal eyes
            switch (expr.eyeShape) {
                case 'happy':
                    this.drawHappyEyes(eyeY, eyeSize);
                    break;
                case 'sad':
                    this.drawSadEyes(eyeY, eyeSize);
                    break;
                case 'surprised':
                    this.drawSurprisedEyes(eyeY, eyeSize);
                    break;
                default:
                    this.drawNormalEyes(eyeY, eyeSize);
            }
        } else {
            // Blinking
            this.drawBlinkingEyes(eyeY);
        }
    }

    drawNormalEyes(eyeY, eyeSize) {
        this.ctx.beginPath();
        this.ctx.arc(-12, eyeY, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(12, eyeY, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawHappyEyes(eyeY, eyeSize) {
        this.ctx.strokeStyle = this.colors.eyes;
        this.ctx.lineWidth = 2;
        
        // Curved happy eyes
        this.ctx.beginPath();
        this.ctx.arc(-12, eyeY - 2, eyeSize + 2, 0.2, Math.PI - 0.2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(12, eyeY - 2, eyeSize + 2, 0.2, Math.PI - 0.2);
        this.ctx.stroke();
    }

    drawSadEyes(eyeY, eyeSize) {
        this.ctx.strokeStyle = this.colors.eyes;
        this.ctx.lineWidth = 2;
        
        // Curved sad eyes
        this.ctx.beginPath();
        this.ctx.arc(-12, eyeY + 2, eyeSize + 2, Math.PI + 0.2, 2 * Math.PI - 0.2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(12, eyeY + 2, eyeSize + 2, Math.PI + 0.2, 2 * Math.PI - 0.2);
        this.ctx.stroke();
    }

    drawSurprisedEyes(eyeY, eyeSize) {
        this.ctx.strokeStyle = this.colors.eyes;
        this.ctx.lineWidth = 2;
        
        // Large surprised eyes
        this.ctx.beginPath();
        this.ctx.arc(-12, eyeY, eyeSize * 1.5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(12, eyeY, eyeSize * 1.5, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawBlinkingEyes(eyeY) {
        this.ctx.strokeStyle = this.colors.eyes;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-18, eyeY);
        this.ctx.lineTo(-6, eyeY);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(6, eyeY);
        this.ctx.lineTo(18, eyeY);
        this.ctx.stroke();
    }

    drawMouth(expr) {
        this.ctx.strokeStyle = this.colors.mouth;
        this.ctx.lineWidth = 2;
        
        const mouthY = 12;
        const mouthWidth = 16;
        const mouthHeight = expr.mouthCurve * 8;
        
        if (expr.mouthOpen > 0) {
            // Open mouth
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.ellipse(0, mouthY, mouthWidth / 2, expr.mouthOpen * 8, 0, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Closed mouth with curve
            this.ctx.beginPath();
            this.ctx.moveTo(-mouthWidth / 2, mouthY);
            this.ctx.quadraticCurveTo(0, mouthY + mouthHeight, mouthWidth / 2, mouthY);
            this.ctx.stroke();
        }
    }

    // Utility methods
    setScale(scale) {
        this.scale = scale;
    }

    setColors(colors) {
        this.colors = { ...this.colors, ...colors };
    }

    getCanvasDataURL() {
        return this.canvas.toDataURL('image/png');
    }
}

// Export for use in other modules
window.StickmanRenderer = StickmanRenderer;
