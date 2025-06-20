# 🚀 AutoStickman - Éditeur Avancé

## 🎯 Nouvelles Fonctionnalités

### ✨ **Système d'Émotions Dynamiques**
- **Ajout/Modification/Suppression** d'émotions personnalisées
- **Gestion complète** : nom, couleur, description, paramètres d'animation
- **Duplication** d'émotions existantes
- **Import/Export** des configurations

### 🖼️ **Gestionnaire d'Assets Personnalisés**
- **Upload d'images** PNG, SVG, JPG, GIF
- **Catégorisation** : tête, visage, corps, bras, jambes, accessoires, etc.
- **Gestion automatique** du stockage local (5MB max par fichier)
- **Preview en temps réel** des assets
- **Compression automatique** si nécessaire

### 🎵 **Animation Liée au Son**
- **Analyse audio** en temps réel
- **Extraction de features** : volume, énergie, fréquences (bass, mid, treble)
- **Animation réactive** : chaque partie du corps peut bouger selon l'audio
- **Paramètres configurables** : réactivité, fréquence, amplitude

## 🛠️ **Comment utiliser**

### 1. **Accéder à l'Éditeur Avancé**
```
Page principale → 🚀 Éditeur Avancé
```

### 2. **Gérer les Émotions**
1. **Onglet "😊 Émotions"**
2. **Ajouter** une nouvelle émotion avec ➕
3. **Sélectionner** une émotion pour l'éditer
4. **Configurer** :
   - Nom d'affichage et description
   - Couleur représentative
   - Réactivité audio (0-1)
   - Fréquence d'animation (Hz)
   - Amplitude des mouvements (pixels)
   - Éléments réactifs (tête, corps, bras, etc.)

### 3. **Uploader des Assets**
1. **Onglet "🖼️ Assets"**
2. **Sélectionner** une catégorie (tête, corps, etc.)
3. **Uploader** vos images (glisser-déposer ou clic)
4. **Gérer** votre bibliothèque d'assets

### 4. **Configurer l'Audio**
1. **Onglet "🎵 Audio"**
2. **Charger** un fichier audio
3. **Attendre** l'analyse automatique
4. **Visualiser** les données extraites

### 5. **Preview en Temps Réel**
- **Panel de droite** : aperçu de l'émotion sélectionnée
- **Animation automatique** avec les paramètres configurés
- **Debug info** pour diagnostiquer les problèmes

## 🔧 **Architecture Technique**

### **Gestionnaire d'Émotions** (`emotionManager.ts`)
```typescript
interface CustomEmotion {
  id: string;
  name: string;
  displayName: string;
  color: string;
  description: string;
  assets: EmotionAssets;
  animationSettings: AnimationSettings;
}
```

### **Gestionnaire d'Assets** (`assetManager.ts`)
```typescript
interface AssetFile {
  id: string;
  name: string;
  type: 'png' | 'svg' | 'jpg' | 'gif';
  category: 'head' | 'face' | 'body' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'background' | 'accessory' | 'effect';
  data: string; // base64
  size: number;
}
```

### **Analyseur Audio** (`audioAnalyzer.ts`)
```typescript
interface AudioAnalysisData {
  timestamp: number;
  volume: number; // 0-1
  pitch: number; // Hz
  energy: number; // 0-1
  frequencies: {
    bass: number;
    mid: number;
    treble: number;
  };
}
```

### **Renderer Basé sur Assets** (`AssetBasedRenderer.tsx`)
- **Rendu temps réel** avec canvas
- **Animation liée au son** pour chaque élément
- **Fallback** vers formes basiques si assets manquants
- **Debug info** intégré

## 🎨 **Workflow Complet**

### **Création d'un Personnage Personnalisé**
1. **Créer une nouvelle émotion** "Mon Héros"
2. **Uploader les assets** :
   - `hero_head.png` → catégorie "head"
   - `hero_body.png` → catégorie "body"
   - `hero_arm_left.png` → catégorie "leftArm"
   - etc.
3. **Configurer l'animation** :
   - Réactivité audio : 0.8
   - Fréquence : 3Hz
   - Éléments réactifs : tête, bras
4. **Tester avec audio** :
   - Charger un fichier MP3
   - Voir l'animation en preview
5. **Utiliser dans l'export vidéo**

### **Animation Audio-Réactive**
```typescript
// Calcul automatique basé sur :
const audioIntensity = (volume + energy) / 2;
const audioModulation = audioIntensity * audioReactivity;

// Types de mouvement par élément :
- Tête : oscillation X/Y + rotation
- Corps : oscillation Y + rotation légère  
- Bras : rotation + mouvement Y
- Jambes : léger mouvement X
```

## 💾 **Stockage et Persistance**

### **LocalStorage Structure**
```
autochar-emotions → Array<CustomEmotion>
autochar-assets → Array<AssetFile>
```

### **Limitations**
- **5MB max** par asset
- **50 assets max** en auto-cleanup
- **Format supportés** : PNG, SVG, JPG, GIF

## 🔍 **Debug et Diagnostics**

### **Preview Panel**
- Informations temps réel sur l'émotion
- Statistiques d'animation
- État des assets chargés

### **Console Logs**
```javascript
// Activer les logs détaillés
console.log('Animation data:', audioAnalysisData);
```

### **Export Debug Info**
- Bouton dans l'export vidéo
- JSON avec toutes les informations système
- Utile pour diagnostiquer les problèmes

## 🚀 **Prochaines Améliorations**

### **À venir**
- [ ] **Éditeur visuel** de poses
- [ ] **Timeline interactive** pour ajuster l'animation
- [ ] **Templates** d'émotions prêts à l'emploi
- [ ] **Export** des personnages complets
- [ ] **Synchronisation cloud** des assets
- [ ] **IA générative** pour créer des assets automatiquement

### **Optimisations**
- [ ] **WebGL renderer** pour de meilleures performances
- [ ] **Web Workers** pour l'analyse audio
- [ ] **Compression avancée** des assets
- [ ] **Cache intelligent** des assets fréquemment utilisés

---

## 🎯 **Résultat**

Tu peux maintenant créer des personnages **complètement personnalisés** avec tes propres images, les faire **réagir au son** de manière naturelle, et exporter des vidéos avec une **animation fluide et réaliste** ! 

Le système est **extensible** et **modulaire** - tu peux facilement ajouter de nouveaux types d'assets, de nouvelles émotions, ou de nouveaux paramètres d'animation selon tes besoins.
