// Gestionnaire d'assets (images PNG/SVG)
export interface AssetFile {
  id: string;
  name: string;
  type: 'png' | 'svg' | 'jpg' | 'gif';
  category: 'head' | 'face' | 'body' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'background' | 'accessory' | 'effect';
  data: string; // base64 ou URL
  size: number; // en bytes
  width?: number;
  height?: number;
  uploaded: Date;
  modified: Date;
}

export interface AssetLibrary {
  [category: string]: AssetFile[];
}

export class AssetManager {
  private assets: Map<string, AssetFile> = new Map();
  private storageKey = 'autochar-assets';
  private maxFileSize = 5 * 1024 * 1024; // 5MB max par fichier

  constructor() {
    this.loadAssets();
  }

  // Charger les assets depuis le localStorage
  async loadAssets(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const assetsArray = JSON.parse(stored);
        assetsArray.forEach((asset: AssetFile) => {
          this.assets.set(asset.id, {
            ...asset,
            uploaded: new Date(asset.uploaded),
            modified: new Date(asset.modified)
          });
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des assets:', error);
    }
  }

  // Sauvegarder les assets
  private saveAssets(): void {
    try {
      const assetsArray = Array.from(this.assets.values());
      localStorage.setItem(this.storageKey, JSON.stringify(assetsArray));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des assets:', error);
      // Si le localStorage est plein, essayer de nettoyer
      this.cleanupOldAssets();
    }
  }

  // Nettoyer les anciens assets
  private cleanupOldAssets(): void {
    const assets = Array.from(this.assets.values());
    // Garder seulement les 50 assets les plus récents
    assets.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    
    if (assets.length > 50) {
      const toDelete = assets.slice(50);
      toDelete.forEach(asset => {
        this.assets.delete(asset.id);
      });
      this.saveAssets();
    }
  }

  // Uploader un fichier
  async uploadFile(
    file: File, 
    category: AssetFile['category'],
    onProgress?: (progress: number) => void
  ): Promise<AssetFile | null> {
    
    // Vérifications
    if (file.size > this.maxFileSize) {
      throw new Error(`Fichier trop volumineux (max ${this.maxFileSize / 1024 / 1024}MB)`);
    }

    const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non supporté (PNG, SVG, JPG, GIF uniquement)');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      reader.onload = async (event) => {
        try {
          const data = event.target?.result as string;
          
          // Obtenir les dimensions pour les images
          const dimensions = await this.getImageDimensions(data);
          
          const asset: AssetFile = {
            id: this.generateId(),
            name: file.name,
            type: this.getFileType(file.type),
            category,
            data,
            size: file.size,
            width: dimensions.width,
            height: dimensions.height,
            uploaded: new Date(),
            modified: new Date()
          };

          this.assets.set(asset.id, asset);
          this.saveAssets();
          resolve(asset);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };

      reader.readAsDataURL(file);
    });
  }

  // Obtenir les dimensions d'une image
  private getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = dataUrl;
    });
  }

  // Déterminer le type de fichier
  private getFileType(mimeType: string): AssetFile['type'] {
    switch (mimeType) {
      case 'image/png': return 'png';
      case 'image/svg+xml': return 'svg';
      case 'image/jpeg': return 'jpg';
      case 'image/gif': return 'gif';
      default: return 'png';
    }
  }

  // Générer un ID unique
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Obtenir tous les assets
  getAllAssets(): AssetFile[] {
    return Array.from(this.assets.values());
  }

  // Obtenir les assets par catégorie
  getAssetsByCategory(category: AssetFile['category']): AssetFile[] {
    return Array.from(this.assets.values()).filter(asset => asset.category === category);
  }

  // Obtenir un asset par ID
  getAsset(id: string): AssetFile | undefined {
    return this.assets.get(id);
  }

  // Supprimer un asset
  deleteAsset(id: string): boolean {
    const deleted = this.assets.delete(id);
    if (deleted) {
      this.saveAssets();
    }
    return deleted;
  }

  // Renommer un asset
  renameAsset(id: string, newName: string): AssetFile | null {
    const asset = this.assets.get(id);
    if (!asset) return null;

    const updated = {
      ...asset,
      name: newName,
      modified: new Date()
    };

    this.assets.set(id, updated);
    this.saveAssets();
    return updated;
  }

  // Changer la catégorie d'un asset
  changeAssetCategory(id: string, newCategory: AssetFile['category']): AssetFile | null {
    const asset = this.assets.get(id);
    if (!asset) return null;

    const updated = {
      ...asset,
      category: newCategory,
      modified: new Date()
    };

    this.assets.set(id, updated);
    this.saveAssets();
    return updated;
  }

  // Dupliquer un asset
  duplicateAsset(id: string, newName?: string): AssetFile | null {
    const original = this.assets.get(id);
    if (!original) return null;

    const duplicated: AssetFile = {
      ...original,
      id: this.generateId(),
      name: newName || `${original.name} (copie)`,
      uploaded: new Date(),
      modified: new Date()
    };

    this.assets.set(duplicated.id, duplicated);
    this.saveAssets();
    return duplicated;
  }

  // Obtenir la bibliothèque organisée par catégorie
  getLibrary(): AssetLibrary {
    const library: AssetLibrary = {};
    
    this.assets.forEach(asset => {
      if (!library[asset.category]) {
        library[asset.category] = [];
      }
      library[asset.category].push(asset);
    });

    // Trier par nom dans chaque catégorie
    Object.keys(library).forEach(category => {
      library[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return library;
  }

  // Statistiques
  getStats(): {
    totalAssets: number;
    totalSize: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  } {
    const assets = Array.from(this.assets.values());
    const stats = {
      totalAssets: assets.length,
      totalSize: assets.reduce((sum, asset) => sum + asset.size, 0),
      byCategory: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };

    assets.forEach(asset => {
      stats.byCategory[asset.category] = (stats.byCategory[asset.category] || 0) + 1;
      stats.byType[asset.type] = (stats.byType[asset.type] || 0) + 1;
    });

    return stats;
  }

  // Exporter la bibliothèque
  exportLibrary(): string {
    const assetsArray = Array.from(this.assets.values());
    return JSON.stringify(assetsArray, null, 2);
  }

  // Importer une bibliothèque
  async importLibrary(jsonString: string): Promise<{ success: number; errors: string[] }> {
    const results = { success: 0, errors: [] as string[] };
    
    try {
      const imported = JSON.parse(jsonString);
      if (!Array.isArray(imported)) {
        results.errors.push('Le fichier doit contenir un tableau d\'assets');
        return results;
      }

      for (const assetData of imported) {
        try {
          const asset: AssetFile = {
            ...assetData,
            id: this.generateId(), // Nouveau ID pour éviter les conflits
            uploaded: new Date(assetData.uploaded || new Date()),
            modified: new Date()
          };
          
          this.assets.set(asset.id, asset);
          results.success++;
        } catch (error) {
          results.errors.push(`Erreur asset ${assetData.name || 'inconnu'}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      this.saveAssets();
    } catch (error) {
      results.errors.push(`Erreur de parsing JSON: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    return results;
  }

  // Vider la bibliothèque
  clearLibrary(): void {
    this.assets.clear();
    this.saveAssets();
  }

  // Compresser une image (basique)
  async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Réduire la taille si nécessaire
        const maxWidth = 1024;
        const maxHeight = 1024;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Erreur lors de la compression'));
          }
        }, 'image/jpeg', quality);
      };

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// Instance globale
export const assetManager = new AssetManager();
