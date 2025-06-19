import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route principale pour la version pro
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-pro.html'));
});

// Route pour la version simple
app.get('/simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API pour la gestion des projets (optionnel, pour sauvegarde serveur)
app.post('/api/projects', (req, res) => {
    // Sauvegarde de projet côté serveur (optionnel)
    res.json({ success: true, message: 'Projet sauvegardé' });
});

app.get('/api/projects', (req, res) => {
    // Liste des projets côté serveur (optionnel)
    res.json({ projects: [] });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erreur serveur' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Stickman Auto-Animator Pro démarré sur http://localhost:${PORT}`);
    console.log(`📱 Version simple disponible sur http://localhost:${PORT}/simple`);
    console.log(`🎯 Version pro disponible sur http://localhost:${PORT}`);
    console.log(`📁 Serveur de fichiers statiques actif`);
    console.log(`🔧 API disponible sur /api/*`);
});

export default app;
