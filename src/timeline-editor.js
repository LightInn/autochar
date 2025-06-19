/**
 * Module d'édition de timeline interactive
 * Permet de créer, éditer, et gérer une timeline avec des keyframes
 * Support du drag & drop, zoom, et édition manuelle
 */

export class TimelineEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            height: 150,
            pixelsPerSecond: 100,
            snapToGrid: true,
            gridSize: 10,
            maxZoom: 5,
            minZoom: 0.5,
            ...options
        };
        
        this.timeline = [];
        this.audioDuration = 0;
        this.currentTime = 0;
        this.zoom = 1;
        this.offsetX = 0;
        this.isDragging = false;
        this.dragData = null;
        this.selectedKeyframe = null;
        
        this.callbacks = {
            onKeyframeSelect: null,
            onKeyframeMove: null,
            onKeyframeAdd: null,
            onKeyframeDelete: null,
            onTimelineChange: null
        };
        
        this.initDOM();
        this.bindEvents();
    }
    
    initDOM() {
        // Container principal
        this.container.innerHTML = '';
        this.container.className = 'timeline-editor';
        
        // Toolbar
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'timeline-toolbar';
        this.toolbar.innerHTML = `
            <div class="timeline-controls">
                <button id="zoom-out" title="Zoom arrière">−</button>
                <span class="zoom-level">${Math.round(this.zoom * 100)}%</span>
                <button id="zoom-in" title="Zoom avant">+</button>
                <button id="fit-timeline" title="Ajuster à la timeline">Ajuster</button>
                <label class="snap-toggle">
                    <input type="checkbox" id="snap-grid" checked>
                    Grille
                </label>
            </div>
            <div class="timeline-info">
                <span class="current-time">0.00s</span>
                <span class="duration">/ 0.00s</span>
            </div>
        `;
        
        // Canvas de la timeline
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'timeline-canvas';
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.options.height;
        this.ctx = this.canvas.getContext('2d');
        
        // Overlay pour les interactions
        this.overlay = document.createElement('div');
        this.overlay.className = 'timeline-overlay';
        this.overlay.style.position = 'absolute';
        this.overlay.style.top = '40px';
        this.overlay.style.left = '0';
        this.overlay.style.right = '0';
        this.overlay.style.height = this.options.height + 'px';
        this.overlay.style.cursor = 'crosshair';
        
        // Assemblage
        this.container.style.position = 'relative';
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.overlay);
        
        this.updateCanvas();
    }
    
    bindEvents() {
        // Contrôles de zoom
        this.toolbar.querySelector('#zoom-in').addEventListener('click', () => {
            this.setZoom(this.zoom * 1.2);
        });
        
        this.toolbar.querySelector('#zoom-out').addEventListener('click', () => {
            this.setZoom(this.zoom / 1.2);
        });
        
        this.toolbar.querySelector('#fit-timeline').addEventListener('click', () => {
            this.fitToTimeline();
        });
        
        this.toolbar.querySelector('#snap-grid').addEventListener('change', (e) => {
            this.options.snapToGrid = e.target.checked;
        });
        
        // Événements de canvas
        this.overlay.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.overlay.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.overlay.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.overlay.addEventListener('dblclick', this.onDoubleClick.bind(this));
        this.overlay.addEventListener('contextmenu', this.onContextMenu.bind(this));
        
        // Événements de fenêtre
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (this.container.contains(document.activeElement) || this.selectedKeyframe) {
                this.onKeyDown(e);
            }
        });
    }
    
    onMouseDown(e) {
        const rect = this.overlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const keyframe = this.getKeyframeAt(x, y);
        
        if (keyframe) {
            // Sélection et début de drag
            this.selectedKeyframe = keyframe;
            this.isDragging = true;
            this.dragData = {
                startX: x,
                startTime: keyframe.time,
                keyframe: keyframe
            };
            this.overlay.style.cursor = 'grabbing';
        } else {
            // Désélection
            this.selectedKeyframe = null;
            this.isDragging = false;
        }
        
        this.updateCanvas();
        this.triggerCallback('onKeyframeSelect', this.selectedKeyframe);
    }
    
    onMouseMove(e) {
        const rect = this.overlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDragging && this.dragData) {
            // Calcul de la nouvelle position temporelle
            const deltaX = x - this.dragData.startX;
            const deltaTime = deltaX / (this.options.pixelsPerSecond * this.zoom);
            let newTime = this.dragData.startTime + deltaTime;
            
            // Snap to grid
            if (this.options.snapToGrid) {
                const snapInterval = this.options.gridSize / (this.options.pixelsPerSecond * this.zoom);
                newTime = Math.round(newTime / snapInterval) * snapInterval;
            }
            
            // Contraintes
            newTime = Math.max(0, Math.min(newTime, this.audioDuration));
            
            // Mise à jour du keyframe
            this.dragData.keyframe.time = newTime;
            this.updateCanvas();
            
            this.triggerCallback('onKeyframeMove', this.dragData.keyframe);
        } else {
            // Mise à jour du curseur
            const keyframe = this.getKeyframeAt(x, y);
            this.overlay.style.cursor = keyframe ? 'grab' : 'crosshair';
        }
    }
    
    onMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragData = null;
            this.overlay.style.cursor = 'crosshair';
            
            // Tri des keyframes par temps
            this.timeline.sort((a, b) => a.time - b.time);
            this.updateCanvas();
            
            this.triggerCallback('onTimelineChange', this.timeline);
        }
    }
    
    onDoubleClick(e) {
        const rect = this.overlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = this.pixelToTime(x);
        
        if (time >= 0 && time <= this.audioDuration) {
            this.addKeyframe(time, 'neutre');
        }
    }
    
    onContextMenu(e) {
        e.preventDefault();
        
        const rect = this.overlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const keyframe = this.getKeyframeAt(x, y);
        
        if (keyframe) {
            this.showContextMenu(e.clientX, e.clientY, keyframe);
        }
    }
    
    onKeyDown(e) {
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                if (this.selectedKeyframe) {
                    this.removeKeyframe(this.selectedKeyframe);
                }
                break;
            case 'Escape':
                this.selectedKeyframe = null;
                this.updateCanvas();
                break;
            case '+':
                this.setZoom(this.zoom * 1.2);
                break;
            case '-':
                this.setZoom(this.zoom / 1.2);
                break;
        }
    }
    
    getKeyframeAt(x, y) {
        const tolerance = 10;
        
        for (const keyframe of this.timeline) {
            const keyframeX = this.timeToPixel(keyframe.time);
            const keyframeY = this.options.height / 2;
            
            if (Math.abs(x - keyframeX) <= tolerance && 
                Math.abs(y - keyframeY) <= tolerance) {
                return keyframe;
            }
        }
        
        return null;
    }
    
    timeToPixel(time) {
        return (time * this.options.pixelsPerSecond * this.zoom) - this.offsetX;
    }
    
    pixelToTime(pixel) {
        return (pixel + this.offsetX) / (this.options.pixelsPerSecond * this.zoom);
    }
    
    setZoom(newZoom) {
        this.zoom = Math.max(this.options.minZoom, Math.min(this.options.maxZoom, newZoom));
        this.toolbar.querySelector('.zoom-level').textContent = Math.round(this.zoom * 100) + '%';
        this.updateCanvas();
    }
    
    fitToTimeline() {
        if (this.audioDuration > 0) {
            const availableWidth = this.canvas.width - 40;
            this.zoom = availableWidth / (this.audioDuration * this.options.pixelsPerSecond);
            this.offsetX = 0;
            this.setZoom(this.zoom);
        }
    }
    
    resizeCanvas() {
        this.canvas.width = this.container.clientWidth;
        this.updateCanvas();
    }
    
    updateCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Arrière-plan
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grille
        this.drawGrid();
        
        // Ligne de temps principale
        this.drawTimeline();
        
        // Keyframes
        this.drawKeyframes();
        
        // Curseur de temps actuel
        this.drawCurrentTimeIndicator();
    }
    
    drawGrid() {
        if (!this.options.snapToGrid) return;
        
        this.ctx.strokeStyle = '#e9ecef';
        this.ctx.lineWidth = 1;
        
        const gridSpacing = this.options.gridSize * this.zoom;
        const startX = this.offsetX % gridSpacing;
        
        for (let x = startX; x < this.canvas.width; x += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    drawTimeline() {
        const y = this.canvas.height / 2;
        
        // Ligne principale
        this.ctx.strokeStyle = '#6c757d';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
        
        // Marqueurs de temps
        this.ctx.fillStyle = '#495057';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        const timeInterval = 1; // Seconde
        const pixelInterval = this.options.pixelsPerSecond * this.zoom;
        
        for (let time = 0; time <= this.audioDuration; time += timeInterval) {
            const x = this.timeToPixel(time);
            
            if (x >= 0 && x <= this.canvas.width) {
                // Marqueur
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - 5);
                this.ctx.lineTo(x, y + 5);
                this.ctx.stroke();
                
                // Texte
                this.ctx.fillText(time.toFixed(1) + 's', x, y - 10);
            }
        }
    }
    
    drawKeyframes() {
        this.timeline.forEach(keyframe => {
            const x = this.timeToPixel(keyframe.time);
            const y = this.canvas.height / 2;
            
            if (x >= -20 && x <= this.canvas.width + 20) {
                const isSelected = keyframe === this.selectedKeyframe;
                
                // Diamant pour le keyframe
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(Math.PI / 4);
                
                // Couleur selon l'intention
                const color = this.getIntentionColor(keyframe.intention);
                this.ctx.fillStyle = color;
                this.ctx.strokeStyle = isSelected ? '#007bff' : '#343a40';
                this.ctx.lineWidth = isSelected ? 3 : 2;
                
                // Dessin du diamant
                const size = isSelected ? 8 : 6;
                this.ctx.fillRect(-size, -size, size * 2, size * 2);
                this.ctx.strokeRect(-size, -size, size * 2, size * 2);
                
                this.ctx.restore();
                
                // Label d'intention
                this.ctx.fillStyle = '#343a40';
                this.ctx.font = '11px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(keyframe.intention, x, y - 15);
            }
        });
    }
    
    drawCurrentTimeIndicator() {
        const x = this.timeToPixel(this.currentTime);
        
        if (x >= 0 && x <= this.canvas.width) {
            this.ctx.strokeStyle = '#dc3545';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
            
            // Triangle en haut
            this.ctx.fillStyle = '#dc3545';
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x - 5, 10);
            this.ctx.lineTo(x + 5, 10);
            this.ctx.fill();
        }
    }
    
    getIntentionColor(intention) {
        const colors = {
            'joie': '#28a745',
            'tristesse': '#6f42c1',
            'colère': '#dc3545',
            'réflexion': '#ffc107',
            'surprise': '#fd7e14',
            'peur': '#6c757d',
            'dégoût': '#20c997',
            'anticipation': '#17a2b8',
            'neutre': '#868e96'
        };
        
        return colors[intention] || colors['neutre'];
    }
    
    // API publique
    setTimeline(timeline) {
        this.timeline = [...timeline];
        this.updateCanvas();
    }
    
    getTimeline() {
        return [...this.timeline];
    }
    
    setAudioDuration(duration) {
        this.audioDuration = duration;
        this.toolbar.querySelector('.duration').textContent = `/ ${duration.toFixed(2)}s`;
        this.updateCanvas();
    }
    
    setCurrentTime(time) {
        this.currentTime = time;
        this.toolbar.querySelector('.current-time').textContent = `${time.toFixed(2)}s`;
        this.updateCanvas();
    }
    
    addKeyframe(time, intention = 'neutre', duration = 500) {
        const keyframe = {
            id: Date.now() + Math.random(),
            time: time,
            intention: intention,
            duration: duration
        };
        
        this.timeline.push(keyframe);
        this.timeline.sort((a, b) => a.time - b.time);
        this.selectedKeyframe = keyframe;
        
        this.updateCanvas();
        this.triggerCallback('onKeyframeAdd', keyframe);
        this.triggerCallback('onTimelineChange', this.timeline);
        
        return keyframe;
    }
    
    removeKeyframe(keyframe) {
        const index = this.timeline.indexOf(keyframe);
        if (index !== -1) {
            this.timeline.splice(index, 1);
            if (this.selectedKeyframe === keyframe) {
                this.selectedKeyframe = null;
            }
            
            this.updateCanvas();
            this.triggerCallback('onKeyframeDelete', keyframe);
            this.triggerCallback('onTimelineChange', this.timeline);
        }
    }
    
    updateKeyframe(keyframe, updates) {
        Object.assign(keyframe, updates);
        this.timeline.sort((a, b) => a.time - b.time);
        this.updateCanvas();
        this.triggerCallback('onTimelineChange', this.timeline);
    }
    
    showContextMenu(x, y, keyframe) {
        // Création du menu contextuel
        const menu = document.createElement('div');
        menu.className = 'timeline-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.background = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '4px';
        menu.style.padding = '8px 0';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        menu.style.zIndex = '1000';
        
        const intentions = ['joie', 'tristesse', 'colère', 'réflexion', 'surprise', 'peur', 'dégoût', 'anticipation', 'neutre'];
        
        intentions.forEach(intention => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.style.padding = '6px 16px';
            item.style.cursor = 'pointer';
            item.style.borderLeft = `4px solid ${this.getIntentionColor(intention)}`;
            item.textContent = intention.charAt(0).toUpperCase() + intention.slice(1);
            
            if (intention === keyframe.intention) {
                item.style.background = '#f8f9fa';
                item.style.fontWeight = 'bold';
            }
            
            item.addEventListener('click', () => {
                this.updateKeyframe(keyframe, { intention });
                document.body.removeChild(menu);
            });
            
            item.addEventListener('mouseenter', () => {
                item.style.background = '#e9ecef';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = intention === keyframe.intention ? '#f8f9fa' : 'transparent';
            });
            
            menu.appendChild(item);
        });
        
        // Séparateur
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.background = '#dee2e6';
        separator.style.margin = '4px 0';
        menu.appendChild(separator);
        
        // Option de suppression
        const deleteItem = document.createElement('div');
        deleteItem.className = 'context-menu-item';
        deleteItem.style.padding = '6px 16px';
        deleteItem.style.cursor = 'pointer';
        deleteItem.style.color = '#dc3545';
        deleteItem.textContent = 'Supprimer';
        
        deleteItem.addEventListener('click', () => {
            this.removeKeyframe(keyframe);
            document.body.removeChild(menu);
        });
        
        deleteItem.addEventListener('mouseenter', () => {
            deleteItem.style.background = '#f8d7da';
        });
        
        deleteItem.addEventListener('mouseleave', () => {
            deleteItem.style.background = 'transparent';
        });
        
        menu.appendChild(deleteItem);
        
        // Ajout au DOM
        document.body.appendChild(menu);
        
        // Suppression au clic à l'extérieur
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', removeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
        }, 0);
    }
    
    // Gestion des callbacks
    on(event, callback) {
        this.callbacks[event] = callback;
    }
    
    triggerCallback(event, ...args) {
        if (this.callbacks[event]) {
            this.callbacks[event](...args);
        }
    }
    
    // Nettoyage
    destroy() {
        this.container.innerHTML = '';
        this.timeline = [];
        this.callbacks = {};
    }
}

export default TimelineEditor;
