/**
 * Module principal de Stickman Auto-Animator Pro
 * Orchestre tous les modules et gère l'interface utilisateur
 */

import WhisperLocal from './whisper-local.js';
import IntentionDetector from './intention-detector.js';
import SVGStickman from './svg-stickman.js';
import TimelineEditor from './timeline-editor.js';
import ProjectManager from './project-manager.js';

class StickmanAutoAnimatorPro {
    constructor() {
        this.modules = {
            whisper: null,
            intentionDetector: null,
            stickman: null,
            timeline: null,
            projectManager: null
        };
        
        this.ui = {
            elements: {},
            state: {
                isProcessing: false,
                isPlaying: false,
                currentView: 'import'
            }
        };
        
        this.audio = {
            element: null,
            context: null,
            analyser: null
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Initialisation de Stickman Auto-Animator Pro...');
            
            // Initialisation des modules
            await this.initModules();
            
            // Initialisation de l'interface
            this.initUI();
            
            // Liaison des événements
            this.bindEvents();
            
            // Chargement des projets récents
            this.loadRecentProjects();
            
            console.log('✅ Stickman Auto-Animator Pro initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur d\'initialisation: ' + error.message);
        }
    }
    
    async initModules() {
        // Gestionnaire de projet
        this.modules.projectManager = new ProjectManager();
        this.modules.projectManager.on('onProjectChange', (project) => {
            this.onProjectChange(project);
        });
        this.modules.projectManager.on('onError', (error) => {
            this.showError(error.message);
        });
        
        // Whisper local
        this.modules.whisper = new WhisperLocal();
        
        // Détecteur d'intention
        this.modules.intentionDetector = new IntentionDetector();
        
        // Timeline editor
        const timelineContainer = document.getElementById('timeline-container');
        if (timelineContainer) {
            this.modules.timeline = new TimelineEditor(timelineContainer);
            this.modules.timeline.on('onKeyframeSelect', (keyframe) => {
                this.onKeyframeSelect(keyframe);
            });
            this.modules.timeline.on('onTimelineChange', (timeline) => {
                this.modules.projectManager.setTimeline(timeline);
                this.updateStickmanPreview();
            });
        }
        
        // Stickman SVG
        const previewContainer = document.getElementById('stickman-preview');
        if (previewContainer) {
            this.modules.stickman = new SVGStickman(previewContainer);
        }
    }
    
    initUI() {
        // Récupération des éléments UI
        this.ui.elements = {
            // Contrôles de fichier
            audioFileInput: document.getElementById('audio-file'),
            projectFileInput: document.getElementById('project-file'),
            
            // Boutons d'action
            processBtn: document.getElementById('process-audio'),
            playBtn: document.getElementById('play-animation'),
            exportBtn: document.getElementById('export-animation'),
            
            // Panneaux
            importPanel: document.getElementById('import-panel'),
            timelinePanel: document.getElementById('timeline-panel'),
            previewPanel: document.getElementById('preview-panel'),
            exportPanel: document.getElementById('export-panel'),
            
            // Informations
            transcriptionText: document.getElementById('transcription-text'),
            projectInfo: document.getElementById('project-info'),
            progressBar: document.getElementById('progress-bar'),
            statusText: document.getElementById('status-text'),
            
            // Paramètres
            languageSelect: document.getElementById('language-select'),
            sensitivitySlider: document.getElementById('sensitivity-slider'),
            speedSlider: document.getElementById('speed-slider'),
            
            // Export
            formatSelect: document.getElementById('export-format'),
            exportSettings: document.getElementById('export-settings'),
            
            // Projets récents
            recentProjects: document.getElementById('recent-projects')
        };
        
        // Configuration initiale
        this.updateUI();
    }
    
    bindEvents() {
        // Gestion des fichiers
        if (this.ui.elements.audioFileInput) {
            this.ui.elements.audioFileInput.addEventListener('change', (e) => {
                this.handleAudioFileSelect(e.target.files[0]);
            });
        }
        
        if (this.ui.elements.projectFileInput) {
            this.ui.elements.projectFileInput.addEventListener('change', (e) => {
                this.handleProjectFileSelect(e.target.files[0]);
            });
        }
        
        // Boutons d'action
        if (this.ui.elements.processBtn) {
            this.ui.elements.processBtn.addEventListener('click', () => {
                this.processAudio();
            });
        }
        
        if (this.ui.elements.playBtn) {
            this.ui.elements.playBtn.addEventListener('click', () => {
                this.togglePlayback();
            });
        }
        
        if (this.ui.elements.exportBtn) {
            this.ui.elements.exportBtn.addEventListener('click', () => {
                this.exportAnimation();
            });
        }
        
        // Paramètres
        if (this.ui.elements.sensitivitySlider) {
            this.ui.elements.sensitivitySlider.addEventListener('input', (e) => {
                this.modules.projectManager.updateSettings({
                    intentionSensitivity: parseFloat(e.target.value)
                });
            });
        }
        
        if (this.ui.elements.speedSlider) {
            this.ui.elements.speedSlider.addEventListener('input', (e) => {
                this.modules.projectManager.updateSettings({
                    animationSpeed: parseFloat(e.target.value)
                });
            });
        }
        
        if (this.ui.elements.languageSelect) {
            this.ui.elements.languageSelect.addEventListener('change', (e) => {
                this.modules.projectManager.updateSettings({
                    language: e.target.value
                });
            });
        }
        
        // Drag & Drop
        this.setupDragAndDrop();
        
        // Raccourcis clavier
        this.setupKeyboardShortcuts();
    }
    
    setupDragAndDrop() {
        const dropZone = document.getElementById('app');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            const audioFile = files.find(f => f.type.startsWith('audio/'));
            const projectFile = files.find(f => f.name.endsWith('.json'));
            
            if (audioFile) {
                this.handleAudioFileSelect(audioFile);
            } else if (projectFile) {
                this.handleProjectFileSelect(projectFile);
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'o':
                        e.preventDefault();
                        this.ui.elements.audioFileInput?.click();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveProject();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportAnimation();
                        break;
                }
            }
            
            switch (e.key) {
                case ' ':
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        this.togglePlayback();
                    }
                    break;
            }
        });
    }
    
    // Gestion des fichiers
    async handleAudioFileSelect(file) {
        if (!file) return;
        
        try {
            this.setStatus('Chargement du fichier audio...', true);
            
            const audioData = await this.modules.projectManager.loadAudioFile(file);
            
            // Mise à jour de l'interface
            this.updateProjectInfo();
            this.ui.elements.processBtn.disabled = false;
            
            // Passage à l'étape suivante
            this.showPanel('timeline');
            
            this.setStatus('Fichier audio chargé avec succès');
            
        } catch (error) {
            this.showError('Erreur lors du chargement du fichier audio: ' + error.message);
        }
    }
    
    async handleProjectFileSelect(file) {
        if (!file) return;
        
        try {
            this.setStatus('Chargement du projet...', true);
            
            const project = await this.modules.projectManager.loadProject(file);
            
            // Mise à jour de l'interface
            this.updateProjectInfo();
            this.modules.timeline.setTimeline(project.timeline);
            this.modules.timeline.setAudioDuration(project.audioDuration);
            
            if (project.transcription) {
                this.ui.elements.transcriptionText.textContent = project.transcription;
            }
            
            this.showPanel('timeline');
            this.setStatus('Projet chargé avec succès');
            
        } catch (error) {
            this.showError('Erreur lors du chargement du projet: ' + error.message);
        }
    }
    
    // Traitement audio principal
    async processAudio() {
        if (!this.modules.projectManager.currentProject.audio) {
            this.showError('Aucun fichier audio sélectionné');
            return;
        }
        
        try {
            this.setStatus('Traitement en cours...', true);
            this.ui.elements.processBtn.disabled = true;
            
            // Étape 1: Transcription avec Whisper
            this.setStatus('Transcription avec Whisper...', true);
            this.updateProgress(20);
            
            const transcriptionResult = await this.modules.whisper.transcribe(
                this.modules.projectManager.currentProject.audio,
                this.modules.projectManager.currentProject.settings.language
            );
            
            this.modules.projectManager.setTranscription(
                transcriptionResult.text,
                transcriptionResult.segments
            );
            
            // Affichage de la transcription
            if (this.ui.elements.transcriptionText) {
                this.ui.elements.transcriptionText.textContent = transcriptionResult.text;
            }
            
            this.updateProgress(50);
            
            // Étape 2: Analyse des intentions
            this.setStatus('Analyse des intentions...', true);
            
            const intentionResult = await this.modules.intentionDetector.analyzeTranscription(
                transcriptionResult.text,
                transcriptionResult.segments,
                this.modules.projectManager.currentProject.settings.intentionSensitivity
            );
            
            this.updateProgress(80);
            
            // Étape 3: Génération de la timeline
            this.setStatus('Génération de la timeline...', true);
            
            const timeline = this.modules.intentionDetector.generateTimeline(
                intentionResult.intentions,
                this.modules.projectManager.currentProject.audioDuration
            );
            
            this.modules.projectManager.setTimeline(timeline);
            this.modules.timeline.setTimeline(timeline);
            this.modules.timeline.setAudioDuration(this.modules.projectManager.currentProject.audioDuration);
            
            this.updateProgress(100);
            
            // Finalisation
            this.setStatus('Traitement terminé avec succès');
            this.ui.elements.playBtn.disabled = false;
            this.ui.elements.exportBtn.disabled = false;
            
            // Mise à jour du preview
            this.updateStickmanPreview();
            
        } catch (error) {
            this.showError('Erreur lors du traitement: ' + error.message);
        } finally {
            this.ui.elements.processBtn.disabled = false;
            this.ui.state.isProcessing = false;
            this.updateProgress(0);
        }
    }
    
    // Lecture de l'animation
    async togglePlayback() {
        if (this.ui.state.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }
    
    async startPlayback() {
        if (!this.modules.projectManager.currentProject.audioUrl) {
            this.showError('Aucun fichier audio disponible');
            return;
        }
        
        try {
            // Création de l'élément audio si nécessaire
            if (!this.audio.element) {
                this.audio.element = new Audio(this.modules.projectManager.currentProject.audioUrl);
            }
            
            this.ui.state.isPlaying = true;
            this.ui.elements.playBtn.textContent = '⏸️ Pause';
            
            // Démarrage de l'animation
            this.modules.stickman.playAnimation(
                this.modules.projectManager.currentProject.timeline,
                this.modules.projectManager.currentProject.audioDuration
            );
            
            // Démarrage de l'audio
            await this.audio.element.play();
            
            // Synchronisation du curseur de timeline
            this.startTimelineSync();
            
        } catch (error) {
            this.showError('Erreur lors de la lecture: ' + error.message);
            this.stopPlayback();
        }
    }
    
    stopPlayback() {
        this.ui.state.isPlaying = false;
        this.ui.elements.playBtn.textContent = '▶️ Lecture';
        
        if (this.audio.element) {
            this.audio.element.pause();
            this.audio.element.currentTime = 0;
        }
        
        this.stopTimelineSync();
        this.modules.stickman.reset();
    }
    
    startTimelineSync() {
        this.timelineSyncInterval = setInterval(() => {
            if (this.audio.element && this.modules.timeline) {
                this.modules.timeline.setCurrentTime(this.audio.element.currentTime);
            }
            
            if (this.audio.element && this.audio.element.ended) {
                this.stopPlayback();
            }
        }, 100);
    }
    
    stopTimelineSync() {
        if (this.timelineSyncInterval) {
            clearInterval(this.timelineSyncInterval);
            this.timelineSyncInterval = null;
        }
    }
    
    // Export de l'animation
    async exportAnimation() {
        if (!this.modules.projectManager.currentProject.timeline.length) {
            this.showError('Aucune timeline à exporter');
            return;
        }
        
        try {
            const format = this.ui.elements.formatSelect?.value || 'svg';
            const exportOptions = this.getExportOptions();
            
            this.setStatus('Export en cours...', true);
            
            const result = await this.modules.projectManager.exportAnimation(format, exportOptions);
            
            // Téléchargement automatique
            this.modules.projectManager.downloadExport(result);
            
            this.setStatus('Export terminé avec succès');
            
        } catch (error) {
            this.showError('Erreur lors de l\'export: ' + error.message);
        }
    }
    
    getExportOptions() {
        return {
            width: parseInt(document.getElementById('export-width')?.value) || 800,
            height: parseInt(document.getElementById('export-height')?.value) || 600,
            fps: parseInt(document.getElementById('export-fps')?.value) || 30,
            quality: parseFloat(document.getElementById('export-quality')?.value) || 0.8,
            background: document.getElementById('export-background')?.value || '#ffffff'
        };
    }
    
    // Sauvegarde de projet
    async saveProject(filename = null) {
        try {
            await this.modules.projectManager.saveProject(filename);
            this.setStatus('Projet sauvegardé');
        } catch (error) {
            this.showError('Erreur lors de la sauvegarde: ' + error.message);
        }
    }
    
    // Gestion des événements de projet
    onProjectChange(project) {
        this.updateProjectInfo();
        this.updateUI();
    }
    
    onKeyframeSelect(keyframe) {
        if (keyframe && this.modules.stickman) {
            this.modules.stickman.previewPose(keyframe.intention);
        }
    }
    
    // Mise à jour de l'interface
    updateUI() {
        const project = this.modules.projectManager.currentProject;
        const hasAudio = !!project.audio;
        const hasTimeline = project.timeline.length > 0;
        
        // Activation/désactivation des boutons
        if (this.ui.elements.processBtn) {
            this.ui.elements.processBtn.disabled = !hasAudio || this.ui.state.isProcessing;
        }
        
        if (this.ui.elements.playBtn) {
            this.ui.elements.playBtn.disabled = !hasTimeline;
        }
        
        if (this.ui.elements.exportBtn) {
            this.ui.elements.exportBtn.disabled = !hasTimeline;
        }
        
        // Mise à jour des paramètres
        if (this.ui.elements.sensitivitySlider) {
            this.ui.elements.sensitivitySlider.value = project.settings.intentionSensitivity;
        }
        
        if (this.ui.elements.speedSlider) {
            this.ui.elements.speedSlider.value = project.settings.animationSpeed;
        }
        
        if (this.ui.elements.languageSelect) {
            this.ui.elements.languageSelect.value = project.settings.language;
        }
    }
    
    updateProjectInfo() {
        const project = this.modules.projectManager.currentProject;
        
        if (this.ui.elements.projectInfo) {
            this.ui.elements.projectInfo.innerHTML = `
                <h3>${project.name}</h3>
                <p><strong>Durée audio:</strong> ${project.audioDuration.toFixed(2)}s</p>
                <p><strong>Keyframes:</strong> ${project.timeline.length}</p>
                <p><strong>Modifié:</strong> ${new Date(project.metadata.modified).toLocaleString()}</p>
                ${project.transcription ? `<p><strong>Transcription:</strong> ${project.transcription.substring(0, 100)}...</p>` : ''}
            `;
        }
    }
    
    updateStickmanPreview() {
        if (this.modules.stickman && this.modules.projectManager.currentProject.timeline.length > 0) {
            // Preview de la première intention
            const firstKeyframe = this.modules.projectManager.currentProject.timeline[0];
            if (firstKeyframe) {
                this.modules.stickman.previewPose(firstKeyframe.intention);
            }
        }
    }
    
    updateProgress(percent) {
        if (this.ui.elements.progressBar) {
            this.ui.elements.progressBar.style.width = percent + '%';
            this.ui.elements.progressBar.setAttribute('aria-valuenow', percent);
        }
    }
    
    setStatus(message, isLoading = false) {
        if (this.ui.elements.statusText) {
            this.ui.elements.statusText.textContent = message;
        }
        
        if (isLoading) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
        
        console.log('Status:', message);
    }
    
    showError(message) {
        console.error('Error:', message);
        
        // Affichage d'une notification d'erreur
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>Erreur:</strong> ${message}
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-suppression après 5 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Bouton de fermeture
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.parentNode.removeChild(notification);
        });
    }
    
    showPanel(panelName) {
        // Masquer tous les panneaux
        ['import', 'timeline', 'preview', 'export'].forEach(name => {
            const panel = document.getElementById(name + '-panel');
            if (panel) {
                panel.style.display = 'none';
            }
        });
        
        // Afficher le panneau demandé
        const targetPanel = document.getElementById(panelName + '-panel');
        if (targetPanel) {
            targetPanel.style.display = 'block';
        }
        
        this.ui.state.currentView = panelName;
    }
    
    loadRecentProjects() {
        if (!this.ui.elements.recentProjects) return;
        
        const recentProjects = this.modules.projectManager.getRecentProjects();
        
        if (recentProjects.length === 0) {
            this.ui.elements.recentProjects.innerHTML = '<p>Aucun projet récent</p>';
            return;
        }
        
        this.ui.elements.recentProjects.innerHTML = recentProjects.map(project => `
            <div class="recent-project" data-project="${project.name}">
                <h4>${project.name}</h4>
                <p>Modifié: ${new Date(project.modified).toLocaleString()}</p>
            </div>
        `).join('');
        
        // Événements de clic sur les projets récents
        this.ui.elements.recentProjects.querySelectorAll('.recent-project').forEach(element => {
            element.addEventListener('click', () => {
                const projectName = element.dataset.project;
                this.loadRecentProject(projectName);
            });
        });
    }
    
    async loadRecentProject(projectName) {
        try {
            await this.modules.projectManager.loadProject(projectName);
            this.showPanel('timeline');
        } catch (error) {
            this.showError('Erreur lors du chargement du projet: ' + error.message);
        }
    }
    
    // Nettoyage
    destroy() {
        this.stopPlayback();
        
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.modules = {};
        this.ui = {};
    }
}

// Initialisation automatique au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.stickmanApp = new StickmanAutoAnimatorPro();
});

// Export pour utilisation en module
export default StickmanAutoAnimatorPro;
