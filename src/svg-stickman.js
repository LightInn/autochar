/**
 * Module de génération et d'animation de stickman SVG
 * Gère la création du stickman, l'animation basée sur les intentions,
 * et la génération de keyframes SVG
 */

export class SVGStickman {
    constructor(container) {
        this.container = container;
        this.svg = null;
        this.stickman = {};
        this.animations = [];
        this.currentPose = 'neutral';
        
        // Définition des poses de base
        this.poses = {
            neutral: {
                head: { x: 150, y: 50, r: 20 },
                body: { x1: 150, y1: 70, x2: 150, y2: 180 },
                leftArm: { x1: 150, y1: 100, x2: 120, y2: 150 },
                rightArm: { x1: 150, y1: 100, x2: 180, y2: 150 },
                leftLeg: { x1: 150, y1: 180, x2: 130, y2: 250 },
                rightLeg: { x1: 150, y1: 180, x2: 170, y2: 250 }
            },
            excited: {
                head: { x: 150, y: 50, r: 20 },
                body: { x1: 150, y1: 70, x2: 150, y2: 180 },
                leftArm: { x1: 150, y1: 100, x2: 100, y2: 80 },
                rightArm: { x1: 150, y1: 100, x2: 200, y2: 80 },
                leftLeg: { x1: 150, y1: 180, x2: 120, y2: 230 },
                rightLeg: { x1: 150, y1: 180, x2: 180, y2: 230 }
            },
            sad: {
                head: { x: 150, y: 55, r: 20 },
                body: { x1: 150, y1: 75, x2: 145, y2: 185 },
                leftArm: { x1: 150, y1: 105, x2: 130, y2: 170 },
                rightArm: { x1: 150, y1: 105, x2: 170, y2: 170 },
                leftLeg: { x1: 145, y1: 185, x2: 125, y2: 255 },
                rightLeg: { x1: 145, y1: 185, x2: 165, y2: 255 }
            },
            angry: {
                head: { x: 150, y: 50, r: 20 },
                body: { x1: 150, y1: 70, x2: 150, y2: 180 },
                leftArm: { x1: 150, y1: 100, x2: 100, y2: 120 },
                rightArm: { x1: 150, y1: 100, x2: 200, y2: 120 },
                leftLeg: { x1: 150, y1: 180, x2: 120, y2: 240 },
                rightLeg: { x1: 150, y1: 180, x2: 180, y2: 240 }
            },
            thinking: {
                head: { x: 150, y: 50, r: 20 },
                body: { x1: 150, y1: 70, x2: 150, y2: 180 },
                leftArm: { x1: 150, y1: 100, x2: 125, y2: 140 },
                rightArm: { x1: 150, y1: 100, x2: 170, y2: 70 },
                leftLeg: { x1: 150, y1: 180, x2: 135, y2: 250 },
                rightLeg: { x1: 150, y1: 180, x2: 165, y2: 250 }
            },
            dancing: {
                head: { x: 155, y: 45, r: 20 },
                body: { x1: 155, y1: 65, x2: 155, y2: 175 },
                leftArm: { x1: 155, y1: 95, x2: 110, y2: 110 },
                rightArm: { x1: 155, y1: 95, x2: 200, y2: 110 },
                leftLeg: { x1: 155, y1: 175, x2: 140, y2: 220 },
                rightLeg: { x1: 155, y1: 175, x2: 190, y2: 235 }
            }
        };
        
        this.initSVG();
    }
    
    initSVG() {
        // Création du SVG principal
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '300');
        this.svg.setAttribute('height', '300');
        this.svg.setAttribute('viewBox', '0 0 300 300');
        this.svg.style.background = '#f8f9fa';
        this.svg.style.border = '1px solid #dee2e6';
        this.svg.style.borderRadius = '8px';
        
        // Création du groupe pour le stickman
        const stickmanGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        stickmanGroup.setAttribute('id', 'stickman');
        
        // Création des éléments du stickman
        this.stickman = {
            head: this.createElement('circle', { 
                id: 'head', 
                fill: 'none', 
                stroke: '#333', 
                'stroke-width': '3' 
            }),
            body: this.createElement('line', { 
                id: 'body', 
                stroke: '#333', 
                'stroke-width': '3' 
            }),
            leftArm: this.createElement('line', { 
                id: 'leftArm', 
                stroke: '#333', 
                'stroke-width': '3' 
            }),
            rightArm: this.createElement('line', { 
                id: 'rightArm', 
                stroke: '#333', 
                'stroke-width': '3' 
            }),
            leftLeg: this.createElement('line', { 
                id: 'leftLeg', 
                stroke: '#333', 
                'stroke-width': '3' 
            }),
            rightLeg: this.createElement('line', { 
                id: 'rightLeg', 
                stroke: '#333', 
                'stroke-width': '3' 
            })
        };
        
        // Ajout des éléments au groupe
        Object.values(this.stickman).forEach(element => {
            stickmanGroup.appendChild(element);
        });
        
        this.svg.appendChild(stickmanGroup);
        this.container.appendChild(this.svg);
        
        // Pose initiale
        this.setPose('neutral');
    }
    
    createElement(type, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    }
    
    setPose(poseName, duration = 500) {
        if (!this.poses[poseName]) {
            console.warn(`Pose "${poseName}" not found`);
            return;
        }
        
        const pose = this.poses[poseName];
        this.currentPose = poseName;
        
        // Animation de la tête
        this.animateElement(this.stickman.head, {
            cx: pose.head.x,
            cy: pose.head.y,
            r: pose.head.r
        }, duration);
        
        // Animation du corps
        this.animateElement(this.stickman.body, {
            x1: pose.body.x1,
            y1: pose.body.y1,
            x2: pose.body.x2,
            y2: pose.body.y2
        }, duration);
        
        // Animation des bras
        this.animateElement(this.stickman.leftArm, {
            x1: pose.leftArm.x1,
            y1: pose.leftArm.y1,
            x2: pose.leftArm.x2,
            y2: pose.leftArm.y2
        }, duration);
        
        this.animateElement(this.stickman.rightArm, {
            x1: pose.rightArm.x1,
            y1: pose.rightArm.y1,
            x2: pose.rightArm.x2,
            y2: pose.rightArm.y2
        }, duration);
        
        // Animation des jambes
        this.animateElement(this.stickman.leftLeg, {
            x1: pose.leftLeg.x1,
            y1: pose.leftLeg.y1,
            x2: pose.leftLeg.x2,
            y2: pose.leftLeg.y2
        }, duration);
        
        this.animateElement(this.stickman.rightLeg, {
            x1: pose.rightLeg.x1,
            y1: pose.rightLeg.y1,
            x2: pose.rightLeg.x2,
            y2: pose.rightLeg.y2
        }, duration);
    }
    
    animateElement(element, targetAttributes, duration) {
        const startTime = performance.now();
        const startAttributes = {};
        
        // Récupération des valeurs de départ
        Object.keys(targetAttributes).forEach(attr => {
            startAttributes[attr] = parseFloat(element.getAttribute(attr)) || 0;
        });
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Fonction d'easing (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            // Interpolation des valeurs
            Object.entries(targetAttributes).forEach(([attr, target]) => {
                const start = startAttributes[attr];
                const current = start + (target - start) * easedProgress;
                element.setAttribute(attr, current);
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // Génération d'animation basée sur la timeline
    generateAnimation(timeline, duration) {
        this.animations = [];
        
        timeline.forEach((keyframe, index) => {
            const time = (keyframe.time / duration) * 100; // Pourcentage
            const pose = this.mapIntentionToPose(keyframe.intention);
            
            this.animations.push({
                time: time,
                pose: pose,
                duration: keyframe.duration || 500
            });
        });
        
        return this.animations;
    }
    
    mapIntentionToPose(intention) {
        const intentionToPoseMap = {
            'joie': 'excited',
            'tristesse': 'sad',
            'colère': 'angry',
            'réflexion': 'thinking',
            'danse': 'dancing',
            'neutre': 'neutral',
            'surprise': 'excited',
            'peur': 'sad',
            'dégoût': 'angry',
            'anticipation': 'thinking'
        };
        
        return intentionToPoseMap[intention] || 'neutral';
    }
    
    // Lecture de l'animation
    playAnimation(timeline, audioDuration) {
        if (!timeline || timeline.length === 0) {
            console.warn('Timeline is empty');
            return;
        }
        
        const startTime = performance.now();
        let currentKeyframe = 0;
        
        const playStep = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = elapsed / (audioDuration * 1000); // Progress en pourcentage
            
            // Trouver le keyframe actuel
            while (currentKeyframe < timeline.length - 1 && 
                   timeline[currentKeyframe + 1].time <= elapsed) {
                currentKeyframe++;
            }
            
            if (currentKeyframe < timeline.length) {
                const keyframe = timeline[currentKeyframe];
                const pose = this.mapIntentionToPose(keyframe.intention);
                
                if (pose !== this.currentPose) {
                    this.setPose(pose, keyframe.duration || 300);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(playStep);
                }
            }
        };
        
        requestAnimationFrame(playStep);
    }
    
    // Export SVG
    exportSVG() {
        const svgData = new XMLSerializer().serializeToString(this.svg);
        return svgData;
    }
    
    // Export SVG animé avec keyframes CSS
    exportAnimatedSVG(timeline, duration) {
        const svgClone = this.svg.cloneNode(true);
        
        // Génération des keyframes CSS
        let cssKeyframes = '@keyframes stickman-animation {\n';
        
        timeline.forEach((keyframe, index) => {
            const time = (keyframe.time / (duration * 1000)) * 100;
            const pose = this.poses[this.mapIntentionToPose(keyframe.intention)];
            
            cssKeyframes += `  ${time}% {\n`;
            cssKeyframes += `    /* ${keyframe.intention} */\n`;
            cssKeyframes += `  }\n`;
        });
        
        cssKeyframes += '}';
        
        // Ajout du style d'animation
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = `
            ${cssKeyframes}
            #stickman {
                animation: stickman-animation ${duration}s linear infinite;
            }
        `;
        
        svgClone.insertBefore(style, svgClone.firstChild);
        
        return new XMLSerializer().serializeToString(svgClone);
    }
    
    // Prévisualisation d'une pose
    previewPose(intention) {
        const pose = this.mapIntentionToPose(intention);
        this.setPose(pose, 200);
    }
    
    // Reset à la pose neutre
    reset() {
        this.setPose('neutral');
        this.animations = [];
    }
    
    // Destruction et nettoyage
    destroy() {
        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
        this.stickman = {};
        this.animations = [];
    }
}

// Export de la classe
export default SVGStickman;
