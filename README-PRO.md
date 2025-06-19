# 🎭 Stickman Auto-Animator Pro

Un outil web avancé pour générer automatiquement des animations 2D de stickman à partir de fichiers audio, utilisant Whisper local pour la transcription et l'analyse d'intention en français.

## ✨ Fonctionnalités

### 🎵 Analyse Audio Avancée
- **Whisper Local** : Transcription audio haute précision (modèle téléchargé côté client)
- **Détection d'intention** : Analyse sémantique avancée en français
- **Mapping temporel** : Synchronisation précise des intentions avec l'audio

### 🎨 Animation Intelligente
- **Stickman SVG** : Rendu vectoriel fluide et personnalisable
- **Poses dynamiques** : Mapping automatique intention → pose
- **Animations fluides** : Transitions avec easing et interpolation

### ⏱️ Timeline Interactive
- **Éditeur graphique** : Timeline drag & drop avec zoom/pan
- **Édition manuelle** : Modification des keyframes et intentions
- **Prévisualisation** : Aperçu temps réel des animations

### 📤 Export Multi-Format
- **SVG statique** : Export vectoriel haute qualité
- **SVG animé** : Animations CSS intégrées
- **JSON** : Données de timeline exportables
- **Projet** : Sauvegarde/chargement de projets complets

## 🚀 Installation et Démarrage

### Prérequis
- Node.js >= 16.0.0
- npm >= 8.0.0
- Python 3.8+ (pour Whisper local)

### Installation
```bash
# Cloner le projet
git clone [repository-url]
cd autostickman

# Installer les dépendances
npm install

# Configuration optionnelle de Whisper local
npm run install-whisper
```

### Démarrage
```bash
# Démarrage du serveur de développement
npm start

# Ou avec rechargement automatique
npm run dev

# Ou serveur simple sans API
npm run serve
```

L'application sera disponible sur :
- **Version Pro** : http://localhost:3000
- **Version Simple** : http://localhost:3000/simple

## 📖 Guide d'Utilisation

### 1. Import Audio
1. Glissez-déposez ou sélectionnez un fichier audio (MP3, WAV, etc.)
2. L'audio est automatiquement chargé et analysé
3. La durée est détectée et affichée

### 2. Traitement Automatique
1. Cliquez sur "🎵 Traiter l'Audio"
2. **Transcription** : Whisper analyse l'audio et génère le texte
3. **Analyse d'intention** : Détection des émotions et intentions
4. **Timeline** : Génération automatique des keyframes

### 3. Édition Timeline
- **Sélection** : Clic sur un keyframe pour le sélectionner
- **Déplacement** : Drag & drop pour repositionner
- **Ajout** : Double-clic pour ajouter un keyframe
- **Modification** : Clic droit pour changer l'intention
- **Suppression** : Touche Suppr ou clic droit → Supprimer

### 4. Prévisualisation
- **Lecture** : Bouton ▶️ pour lancer l'animation synchronisée
- **Pose** : Sélectionner un keyframe pour prévisualiser la pose
- **Temps réel** : Curseur de progression sur la timeline

### 5. Export
- **Format** : Choisir SVG, SVG animé, JSON, etc.
- **Options** : Résolution, FPS, qualité
- **Téléchargement** : Export automatique vers fichier local

## 🎯 Intentions Supportées

L'outil reconnaît et anime les intentions suivantes :

| Intention | Pose | Description |
|-----------|------|-------------|
| 🎉 **Joie** | Excited | Bras levés, posture dynamique |
| 😢 **Tristesse** | Sad | Posture affaissée, bras tombants |
| 😠 **Colère** | Angry | Poings serrés, posture tendue |
| 🤔 **Réflexion** | Thinking | Main au menton, posture pensive |
| 😲 **Surprise** | Excited | Bras écartés, posture ouverte |
| 😰 **Peur** | Sad | Posture recroquevillée |
| 🤢 **Dégoût** | Angry | Posture de rejet |
| 📈 **Anticipation** | Thinking | Posture d'attente |
| 😶 **Neutre** | Neutral | Posture standard |

## ⚙️ Configuration

### Paramètres d'Intention
- **Sensibilité** : Seuil de détection des intentions (0.1 - 1.0)
- **Langue** : Français (support d'autres langues possible)

### Paramètres d'Animation
- **Vitesse** : Multiplicateur de vitesse d'animation (0.5 - 2.0)
- **Durée des poses** : Temps de maintien par défaut (100-1000ms)

### Paramètres d'Export
- **Résolution** : Largeur/hauteur du rendu
- **FPS** : Images par seconde pour les animations
- **Qualité** : Niveau de compression (0.1 - 1.0)

## 🔧 Architecture Technique

### Modules Principaux
```
src/
├── main-pro.js           # Orchestrateur principal
├── whisper-local.js      # Interface Whisper local
├── intention-detector.js # Analyse d'intention française
├── svg-stickman.js      # Rendu et animation SVG
├── timeline-editor.js   # Éditeur de timeline interactif
├── project-manager.js   # Gestion projets/export
└── pro-styles.css       # Styles interface pro
```

### Technologies Utilisées
- **Frontend** : Vanilla JavaScript ES6+, SVG, Canvas
- **Audio** : Web Audio API, File API
- **IA** : Whisper (local), Transformers.js
- **UI** : CSS Grid/Flexbox, animations CSS
- **Backend** : Node.js, Express (optionnel)

## 🎨 Personnalisation

### Nouvelles Poses
Ajoutez de nouvelles poses dans `svg-stickman.js` :
```javascript
this.poses.maNouvellePose = {
    head: { x: 150, y: 50, r: 20 },
    body: { x1: 150, y1: 70, x2: 150, y2: 180 },
    // ... autres membres
};
```

### Nouvelles Intentions
Étendez la détection dans `intention-detector.js` :
```javascript
this.intentionPatterns.maIntention = {
    keywords: ['mot1', 'mot2'],
    contextPatterns: [/pattern1/i, /pattern2/i],
    emotionalWeight: 0.8
};
```

## 🐛 Dépannage

### Problèmes Courants

**Audio ne se charge pas**
- Vérifiez le format (MP3, WAV, OGG supportés)
- Contrôlez la taille du fichier (<100MB recommandé)

**Whisper ne fonctionne pas**
- Vérifiez la connexion internet (téléchargement du modèle)
- Consultez la console pour les erreurs JavaScript

**Timeline ne répond pas**
- Rechargez la page
- Vérifiez que l'audio est chargé
- Essayez avec un fichier plus court

**Export échoue**
- Vérifiez que la timeline contient des keyframes
- Essayez un format différent (SVG simple)

### Logs de Debug
Ouvrez la console développeur (F12) pour voir les logs détaillés :
```javascript
// Activation des logs verbeux
window.DEBUG = true;
```

## 🤝 Contribution

### Développement
```bash
# Clone et installation
git clone [repo]
cd autostickman
npm install

# Développement avec rechargement
npm run dev

# Tests (à implémenter)
npm test
```

### Structure des Commits
- `feat:` nouvelles fonctionnalités
- `fix:` corrections de bugs
- `docs:` documentation
- `style:` formatage, CSS
- `refactor:` refactoring code
- `test:` ajout de tests

## 📝 TODO / Roadmap

### Version 2.1
- [ ] Vrai Whisper local (remplacer simulation)
- [ ] Export GIF/MP4 avec WebCodecs
- [ ] Plus de poses et transitions
- [ ] Éditeur de poses personnalisées

### Version 2.2
- [ ] Support multi-langues
- [ ] Analyse sentiment avancée
- [ ] Templates de personnages
- [ ] Mode collaboration

### Version 3.0
- [ ] IA générative pour poses
- [ ] Reconnaissance vocale temps réel
- [ ] Export vers formats 3D
- [ ] Plugin pour autres logiciels

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour les détails

## 📞 Support

- **Issues** : [GitHub Issues](issues-url)
- **Documentation** : [Wiki](wiki-url)
- **Email** : support@example.com

---

**Stickman Auto-Animator Pro** - Créé avec ❤️ pour democratiser l'animation 2D intelligente
