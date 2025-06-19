/**
 * Gestionnaire de projet pour l'outil Stickman Auto-Animator Pro
 * Gère l'import/export, la sauvegarde, et l'orchestration des modules
 */

export class ProjectManager {
    constructor() {
        this.currentProject = {
            name: 'Nouveau Projet',
            audio: null,
            audioUrl: null,
            audioDuration: 0,
            transcription: '',
            timeline: [],
            settings: {
                language: 'fr',
                intentionSensitivity: 0.7,
                animationSpeed: 1.0,
                exportFormat: 'svg'
            },
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        
        this.hasUnsavedChanges = false;
        this.autoSaveInterval = null;
        this.callbacks = {
            onProjectLoad: null,
            onProjectSave: null,
            onProjectChange: null,
            onExportComplete: null,
            onError: null
        };
        
        this.initAutoSave();
    }
    
    // Gestion de l'audio
    async loadAudioFile(file) {
        try {
            if (!file.type.startsWith('audio/')) {
                throw new Error('Le fichier sélectionné n\'est pas un fichier audio valide');
            }
            
            // Création de l'URL pour l'audio
            const audioUrl = URL.createObjectURL(file);
            
            // Chargement et validation de l'audio
            const audio = new Audio(audioUrl);
            
            return new Promise((resolve, reject) => {
                audio.addEventListener('loadedmetadata', () => {
                    this.currentProject.audio = file;
                    this.currentProject.audioUrl = audioUrl;
                    this.currentProject.audioDuration = audio.duration;
                    this.currentProject.metadata.modified = new Date().toISOString();
                    
                    this.markAsChanged();
                    this.triggerCallback('onProjectChange', this.currentProject);
                    
                    resolve({
                        file: file,
                        url: audioUrl,
                        duration: audio.duration
                    });
                });
                
                audio.addEventListener('error', (e) => {
                    URL.revokeObjectURL(audioUrl);
                    reject(new Error('Impossible de charger le fichier audio: ' + e.message));
                });
            });
        } catch (error) {
            this.triggerCallback('onError', error);
            throw error;
        }
    }
    
    // Gestion de la transcription
    setTranscription(transcription, segments = null) {
        this.currentProject.transcription = transcription;
        
        if (segments) {
            this.currentProject.transcriptionSegments = segments;
        }
        
        this.markAsChanged();
        this.triggerCallback('onProjectChange', this.currentProject);
    }
    
    // Gestion de la timeline
    setTimeline(timeline) {
        this.currentProject.timeline = [...timeline];
        this.markAsChanged();
        this.triggerCallback('onProjectChange', this.currentProject);
    }
    
    updateTimelineKeyframe(keyframe, updates) {
        const index = this.currentProject.timeline.findIndex(k => k.id === keyframe.id);
        if (index !== -1) {
            Object.assign(this.currentProject.timeline[index], updates);
            this.markAsChanged();
            this.triggerCallback('onProjectChange', this.currentProject);
        }
    }
    
    addTimelineKeyframe(keyframe) {
        this.currentProject.timeline.push(keyframe);
        this.currentProject.timeline.sort((a, b) => a.time - b.time);
        this.markAsChanged();
        this.triggerCallback('onProjectChange', this.currentProject);
    }
    
    removeTimelineKeyframe(keyframe) {
        const index = this.currentProject.timeline.findIndex(k => k.id === keyframe.id);
        if (index !== -1) {
            this.currentProject.timeline.splice(index, 1);
            this.markAsChanged();
            this.triggerCallback('onProjectChange', this.currentProject);
        }
    }
    
    // Gestion des paramètres
    updateSettings(newSettings) {
        Object.assign(this.currentProject.settings, newSettings);
        this.markAsChanged();
        this.triggerCallback('onProjectChange', this.currentProject);
    }
    
    // Sauvegarde et chargement de projets
    async saveProject(filename = null) {
        try {
            const projectData = this.getProjectData();
            const jsonData = JSON.stringify(projectData, null, 2);
            
            if (filename) {
                // Sauvegarde dans un fichier
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = filename.endsWith('.json') ? filename : filename + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.currentProject.name = filename.replace('.json', '');
            } else {
                // Sauvegarde locale (localStorage)
                const projectName = this.currentProject.name || 'projet-' + Date.now();
                localStorage.setItem('stickman-project-' + projectName, jsonData);
            }
            
            this.hasUnsavedChanges = false;
            this.currentProject.metadata.modified = new Date().toISOString();
            
            this.triggerCallback('onProjectSave', this.currentProject);
            
            return true;
        } catch (error) {
            this.triggerCallback('onError', error);
            throw error;
        }
    }
    
    async loadProject(file) {
        try {
            let projectData;
            
            if (file instanceof File) {
                // Chargement depuis un fichier
                const text = await file.text();
                projectData = JSON.parse(text);
            } else if (typeof file === 'string') {
                // Chargement depuis localStorage
                const saved = localStorage.getItem('stickman-project-' + file);
                if (!saved) {
                    throw new Error('Projet non trouvé');
                }
                projectData = JSON.parse(saved);
            } else {
                throw new Error('Type de fichier non supporté');
            }
            
            // Validation et fusion des données
            this.currentProject = {
                ...this.currentProject,
                ...projectData,
                metadata: {
                    ...this.currentProject.metadata,
                    ...projectData.metadata,
                    loaded: new Date().toISOString()
                }
            };
            
            // Si le projet contenait un fichier audio, il faudra le recharger
            if (projectData.audioData) {
                // Reconstruction du fichier audio depuis les données base64
                const audioBlob = this.base64ToBlob(projectData.audioData, projectData.audioType);
                const audioFile = new File([audioBlob], 'audio.' + projectData.audioType.split('/')[1], {
                    type: projectData.audioType
                });
                
                await this.loadAudioFile(audioFile);
            }
            
            this.hasUnsavedChanges = false;
            this.triggerCallback('onProjectLoad', this.currentProject);
            
            return this.currentProject;
        } catch (error) {
            this.triggerCallback('onError', error);
            throw error;
        }
    }
    
    // Génération des données de projet pour la sauvegarde
    getProjectData() {
        const data = {
            ...this.currentProject,
            audioUrl: null // On ne sauvegarde pas l'URL temporaire
        };
        
        // Conversion de l'audio en base64 pour la sauvegarde
        if (this.currentProject.audio) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    data.audioData = e.target.result.split(',')[1]; // Base64 sans préfixe
                    data.audioType = this.currentProject.audio.type;
                    resolve(data);
                };
                reader.readAsDataURL(this.currentProject.audio);
            });
        }
        
        return data;
    }
    
    // Export des animations
    async exportAnimation(format = 'svg', options = {}) {
        try {
            const defaultOptions = {
                width: 800,
                height: 600,
                fps: 30,
                quality: 0.8,
                background: '#ffffff'
            };
            
            const exportOptions = { ...defaultOptions, ...options };
            
            switch (format) {
                case 'svg':
                    return await this.exportSVG(exportOptions);
                case 'svg-animated':
                    return await this.exportAnimatedSVG(exportOptions);
                case 'gif':
                    return await this.exportGIF(exportOptions);
                case 'mp4':
                    return await this.exportMP4(exportOptions);
                case 'json':
                    return await this.exportJSON(exportOptions);
                default:
                    throw new Error('Format d\'export non supporté: ' + format);
            }
        } catch (error) {
            this.triggerCallback('onError', error);
            throw error;
        }
    }
    
    async exportSVG(options) {
        // Export SVG statique (dernière pose)
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${options.width}" height="${options.height}" 
     viewBox="0 0 ${options.width} ${options.height}"
     xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${options.background}"/>
    <!-- Animation SVG sera générée par SVGStickman -->
    <g id="stickman-export">
        <!-- Contenu généré par le module SVGStickman -->
    </g>
</svg>`;
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        return {
            blob: blob,
            filename: `${this.currentProject.name}.svg`,
            url: URL.createObjectURL(blob)
        };
    }
    
    async exportAnimatedSVG(options) {
        // Export SVG avec animations CSS
        const timeline = this.currentProject.timeline;
        const duration = this.currentProject.audioDuration;
        
        // Génération des keyframes CSS
        let keyframes = '';
        timeline.forEach((keyframe, index) => {
            const percent = (keyframe.time / duration) * 100;
            keyframes += `${percent}% { /* ${keyframe.intention} */ }\n`;
        });
        
        const animatedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${options.width}" height="${options.height}" 
     viewBox="0 0 ${options.width} ${options.height}"
     xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            @keyframes stickman-animation {
                ${keyframes}
            }
            #stickman {
                animation: stickman-animation ${duration}s linear infinite;
            }
        </style>
    </defs>
    <rect width="100%" height="100%" fill="${options.background}"/>
    <g id="stickman">
        <!-- Animation SVG générée par SVGStickman -->
    </g>
</svg>`;
        
        const blob = new Blob([animatedSVG], { type: 'image/svg+xml' });
        return {
            blob: blob,
            filename: `${this.currentProject.name}_animated.svg`,
            url: URL.createObjectURL(blob)
        };
    }
    
    async exportGIF(options) {
        // Export GIF animé (nécessiterait une librairie comme gif.js)
        throw new Error('Export GIF non encore implémenté. Utilisez le format SVG animé.');
    }
    
    async exportMP4(options) {
        // Export vidéo MP4 (nécessiterait WebCodecs API ou FFmpeg.wasm)
        throw new Error('Export MP4 non encore implémenté. Utilisez le format SVG animé.');
    }
    
    async exportJSON(options) {
        // Export des données de timeline en JSON
        const exportData = {
            project: this.currentProject.name,
            duration: this.currentProject.audioDuration,
            timeline: this.currentProject.timeline,
            transcription: this.currentProject.transcription,
            metadata: {
                ...this.currentProject.metadata,
                exported: new Date().toISOString(),
                exportOptions: options
            }
        };
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        
        return {
            blob: blob,
            filename: `${this.currentProject.name}_timeline.json`,
            url: URL.createObjectURL(blob),
            data: exportData
        };
    }
    
    // Téléchargement d'un fichier d'export
    downloadExport(exportResult) {
        const a = document.createElement('a');
        a.href = exportResult.url;
        a.download = exportResult.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Nettoyage de l'URL temporaire
        setTimeout(() => {
            URL.revokeObjectURL(exportResult.url);
        }, 1000);
        
        this.triggerCallback('onExportComplete', exportResult);
    }
    
    // Gestion des projets récents
    getRecentProjects() {
        const projects = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('stickman-project-')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    projects.push({
                        name: key.replace('stickman-project-', ''),
                        modified: data.metadata.modified,
                        created: data.metadata.created
                    });
                } catch (e) {
                    console.warn('Projet corrompu:', key);
                }
            }
        }
        
        return projects.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    }
    
    deleteProject(projectName) {
        localStorage.removeItem('stickman-project-' + projectName);
    }
    
    // Nouveau projet
    newProject() {
        // Nettoyage de l'ancien projet
        if (this.currentProject.audioUrl) {
            URL.revokeObjectURL(this.currentProject.audioUrl);
        }
        
        this.currentProject = {
            name: 'Nouveau Projet',
            audio: null,
            audioUrl: null,
            audioDuration: 0,
            transcription: '',
            timeline: [],
            settings: {
                language: 'fr',
                intentionSensitivity: 0.7,
                animationSpeed: 1.0,
                exportFormat: 'svg'
            },
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        
        this.hasUnsavedChanges = false;
        this.triggerCallback('onProjectChange', this.currentProject);
    }
    
    // Utilitaires
    base64ToBlob(base64, type) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: type });
    }
    
    markAsChanged() {
        this.hasUnsavedChanges = true;
        this.currentProject.metadata.modified = new Date().toISOString();
    }
    
    // Sauvegarde automatique
    initAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges && this.currentProject.timeline.length > 0) {
                try {
                    this.saveProject(); // Sauvegarde locale
                } catch (error) {
                    console.warn('Échec de la sauvegarde automatique:', error);
                }
            }
        }, 30000); // Toutes les 30 secondes
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
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        if (this.currentProject.audioUrl) {
            URL.revokeObjectURL(this.currentProject.audioUrl);
        }
        
        this.callbacks = {};
    }
    
    // Getters
    get project() {
        return this.currentProject;
    }
    
    get hasChanges() {
        return this.hasUnsavedChanges;
    }
}

export default ProjectManager;
