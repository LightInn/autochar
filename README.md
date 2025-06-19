# 🎭 Stickman Auto-Animator

Une application web qui génère automatiquement des animations de stickman 2D à partir de fichiers audio, en analysant les émotions et le rythme pour créer des expressions et mouvements dynamiques.

## ✨ Fonctionnalités

- **Analyse audio avancée** : Détection automatique d'émotions à partir de l'audio
- **🎤 Analyse vocale Whisper** : Détection d'intention en français via reconnaissance vocale
- **Animation dynamique** : Stickman expressif avec 8 émotions différentes
- **Fusion audio + voix** : Combine l'analyse spectrale et l'intention vocale
- **Rendu temps réel** : Animation fluide sur Canvas HTML5
- **Export vidéo** : Génération de vidéos transparentes (WebM/MP4)
- **Interface intuitive** : Contrôles simples et visualisations audio
- **Support français** : Reconnaissance vocale optimisée pour le français
- **Responsive** : Compatible desktop et mobile

## 🚀 Démarrage rapide

### Installation

1. Clonez ou téléchargez le projet
2. Ouvrez un terminal dans le dossier du projet
3. Installez les dépendances (optionnel pour le développement) :

```bash
npm install
```

### Utilisation

1. **Méthode simple** : Ouvrez `index.html` directement dans votre navigateur
2. **Serveur local** (recommandé pour éviter les restrictions CORS) :

```bash
# Avec live-server (si installé)
npm run dev

# Ou avec serve
npm start

# Ou avec Python
python -m http.server 3000

# Ou avec Node.js
npx serve .
```

3. Ouvrez votre navigateur sur `http://localhost:3000`

## 🎯 Guide d'utilisation

### 1. Charger un fichier audio
- Cliquez sur "🎵 Charger un fichier audio"
- Sélectionnez un fichier `.mp3`, `.wav`, `.m4a`, etc.
- Les informations du fichier s'affichent automatiquement

### 2. Ajuster les paramètres
- **Sensibilité émotionnelle** : Contrôle la rapidité des changements d'émotion
- **Vitesse d'animation** : Accélère/ralentit l'animation générale

### 3. Lancer l'animation
- Cliquez sur "▶️ Jouer" pour démarrer l'animation
- **🎤 Parlez en français** : Votre voix sera analysée pour détecter les intentions
- L'analyse audio se fait en temps réel
- Le stickman s'anime automatiquement selon les émotions détectées
- Les transcriptions apparaissent sous l'animation

### Exemples d'intentions vocales détectées :
- **"Je suis content"** → 😊 Animation joyeuse
- **"C'est fantastique !"** → 🤩 Animation excitée  
- **"Je suis triste"** → 😢 Animation mélancolique
- **"Allons danser !"** → 💃 Animation dansante
- **"Quelle surprise !"** → 😲 Animation surprise

### 4. Exporter la vidéo
- Cliquez sur "📹 Exporter Vidéo" pendant ou après la lecture
- La vidéo se télécharge automatiquement avec fond transparent

## 🎨 Émotions supportées

| Émotion | Emoji | Caractéristiques |
|---------|-------|------------------|
| Neutre | 😐 | Position relaxée, expression neutre |
| Joyeux | 😊 | Bras levés, sourire, corps animé |
| Excité | 🤩 | Mouvements dynamiques, expressions vives |
| Triste | 😢 | Position affaissée, expression mélancolique |
| En colère | 😠 | Bras croisés, sourcils froncés |
| Surpris | 😲 | Yeux écarquillés, bouche ouverte |
| Calme | 😌 | Position détendue, sourire léger |
| Dansant | 💃 | Mouvements rythmés, poses dynamiques |

## 🔧 Architecture technique

### Structure du projet
```
autostickman/
├── index.html              # Page principale
├── package.json            # Configuration npm
├── src/
│   ├── styles.css          # Styles de l'interface
│   ├── main.js             # Application principale
│   ├── audio-analyzer.js   # Analyse audio avec Meyda
│   ├── emotion-mapper.js   # Mapping audio → émotions
│   ├── stickman-renderer.js # Rendu Canvas du stickman
│   ├── animator.js         # Moteur d'animation
│   └── video-exporter.js   # Export vidéo WebM/MP4
```

### Technologies utilisées
- **HTML5 Canvas** : Rendu graphique 2D
- **Web Audio API** : Capture et analyse audio
- **🎤 Web Speech API** : Reconnaissance vocale en français (fallback pour Whisper)
- **Meyda.js** : Extraction de features audio avancées
- **GSAP** : Animations fluides (transitions)
- **MediaRecorder API** : Capture vidéo avec transparence
- **Whisper-style Analysis** : Détection d'intention vocale en français
- **Vanilla JavaScript** : Pas de framework lourd

### Algorithme d'analyse

1. **Extraction audio** : RMS, centroïde spectral, ZCR, loudness
2. **🎤 Analyse vocale** : Transcription + détection d'intention en français
3. **Détection d'émotion** : Algorithmes de scoring basés sur :
   - Énergie (intensité générale)
   - Brillance (fréquences hautes)
   - **Intentions vocales** (mots-clés français analysés)
   - Harmonicité (régularité spectrale)
   - Tempo (détection rythmique)
4. **Fusion des données** : Combine audio (60%) + voix (40%)
5. **Lissage temporel** : Transitions fluides entre émotions
6. **Mapping corporel** : Association émotion → pose du stickman

## 🎥 Format de sortie

- **Vidéo** : WebM (VP9) ou MP4 (H.264) selon le navigateur
- **Transparence** : Canal alpha préservé pour incrustation
- **Qualité** : 30/60 FPS, bitrate adaptatif
- **Audio** : Synchronisé avec l'animation si présent

## 🌐 Compatibilité navigateur

| Navigateur | Support | Notes |
|------------|---------|-------|
| Chrome 80+ | ✅ Complet | Meilleur support WebM + transparence |
| Firefox 75+ | ✅ Complet | Support WebM limité |
| Safari 14+ | ⚠️ Partiel | Pas de WebM, MP4 uniquement |
| Edge 80+ | ✅ Complet | Basé sur Chromium |

## 🔍 Dépannage

### L'audio ne se charge pas
- Vérifiez le format du fichier (MP3, WAV supportés)
- Utilisez un serveur local (pas `file://`)
- Autorisez l'accès microphone si demandé

### L'animation est saccadée
- Réduisez la sensibilité émotionnelle
- Fermez d'autres onglets consommateurs
- Vérifiez les performances GPU de votre navigateur

### L'export vidéo échoue
- Utilisez Chrome/Edge pour de meilleurs résultats
- Vérifiez l'espace disque disponible
- Réduisez la durée audio si le fichier est trop long

### Le microphone ne fonctionne pas
- Autorisez l'accès microphone dans votre navigateur
- Vérifiez les paramètres de confidentialité
- La reconnaissance vocale fonctionne mieux avec Chrome/Edge
- Parlez clairement en français

### Les intentions vocales ne sont pas détectées
- Utilisez des phrases simples en français
- Parlez distinctement et pas trop rapidement  
- Essayez des mots-clés comme : "content", "triste", "excité", "danser"
- La détection fonctionne mieux avec Chrome

## 🚧 Développement

### Ajout d'émotions
Modifiez `emotion-mapper.js` :
```javascript
nouvelleEmotion: {
    name: 'Nom',
    emoji: '😀',
    color: '#hexcolor',
    expressions: { /* ... */ },
    bodyLanguage: { /* ... */ }
}
```

### Personnalisation du stickman
Modifiez `stickman-renderer.js` pour :
- Changer les couleurs
- Ajuster les proportions
- Ajouter des accessoires

### Algorithmes audio
Améliorez `audio-analyzer.js` pour :
- Ajouter des features audio
- Optimiser la détection de tempo
- Intégrer d'autres librairies d'analyse

## 📝 Licence

MIT License - Utilisez librement pour vos projets personnels et commerciaux.

## 🤝 Contribution

Les contributions sont les bienvenues ! 
- Fork le projet
- Créez une branche feature
- Commitez vos changements
- Ouvrez une Pull Request

## 📧 Support

Pour toute question ou problème, ouvrez un issue sur le repository.

---

**Créé avec ❤️ pour automatiser l'animation de stickman 2D**
