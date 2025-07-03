# 🎭 AutoChar Studio

<div align="center">

[![Build Status](https://github.com/YOUR_USERNAME/autochar/workflows/Build%20and%20Release%20Electron%20App/badge.svg)](https://github.com/YOUR_USERNAME/autochar/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Powered by Electron](https://img.shields.io/badge/Powered%20by-Electron-9feaf9.svg)](https://electronjs.org/)

**Transform audio into expressive animated characters with AI-powered emotion analysis**

[🎬 Demo](#demo) • [⚡ Quick Start](#quick-start) • [📖 Documentation](#documentation) • [🤝 Contributing](#contributing)

</div>

---

## ✨ Features

🎙️ **Audio Analysis** - Advanced voice transcription with real-time processing  
🧠 **Emotion Recognition** - AI-powered sentiment analysis with 10+ emotions  
🎨 **Character Editor** - Visual character creator with customizable assets  
🎬 **Animation Export** - Export to video with synchronized audio  
⚡ **Real-time Preview** - See your character come to life instantly  
🖥️ **Cross-platform** - Available on Windows, macOS, and Linux  

## 🚀 Demo

<div align="center">

![AutoChar Studio Demo](https://via.placeholder.com/800x450/1f2937/ffffff?text=AutoChar+Studio+Demo)

*Create engaging animated characters from your voice in minutes*

</div>

## ⚡ Quick Start

### 📦 Download Pre-built

Get the latest release for your platform:

- [🐧 Linux AppImage](https://github.com/YOUR_USERNAME/autochar/releases/latest)
- [🪟 Windows Installer](https://github.com/YOUR_USERNAME/autochar/releases/latest)

### 🛠️ Build from Source

**Prerequisites:**
- Node.js 18+ 
- pnpm 8+
- Git

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/autochar.git
cd autochar

# Install dependencies
pnpm install

# Approve Electron build script (Linux only)
pnpm approve-builds electron

# Start development server
pnpm electron:dev

# Build for production
pnpm electron:build
```

## 📖 How It Works

### 1. 🎨 Create Your Character
- Design custom emotions with the visual editor
- Upload assets (images, sprites, etc.)
- Configure animation settings and behaviors

### 2. 🎙️ Record or Upload Audio
- Record directly in the app or upload audio files
- Supports MP3, WAV, and OGG formats
- Real-time transcription with timestamp sync

### 3. 🧠 AI Emotion Analysis
- Advanced natural language processing
- Detects 10+ emotional states including:
  - 😊 Happy & Excited
  - 😢 Sad & Disappointed  
  - 😠 Angry & Frustrated
  - 😕 Confused & Worried
  - 🤔 Thinking & Neutral

### 4. � Generate Animation
- Automatic character animation based on emotions
- Audio-reactive movements and expressions
- Export to video with full audio synchronization

## 🏗️ Architecture

AutoChar Studio is built with modern web technologies:

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Electron with integrated Express server
- **AI/ML**: Whisper for transcription + custom emotion analysis
- **Animation**: Canvas-based rendering with asset management
- **Build**: Vite + Electron Builder for cross-platform distribution

## 🎯 Supported Emotions

| Emotion | Triggers | Visual Representation |
|---------|----------|----------------------|
| 😊 Happy | "super", "génial", laughter | Bright colors, upward animations |
| 🎉 Excited | "incroyable", "wow", "!!!" | Dynamic movements, vibrant effects |
| 😮 Surprised | "quoi", "vraiment", "oh" | Quick reactions, eye emphasis |
| 😠 Angry | "énervé", "marre", "grr" | Red tones, sharp movements |
| 😕 Confused | "comprends pas", "euh", "???" | Head tilts, question marks |
| 🤔 Thinking | "voyons", "hmm", "..." | Contemplative poses, thought bubbles |
| 😰 Worried | "inquiet", "problème", stress terms | Nervous animations, muted colors |
| 😢 Sad | "triste", "dommage", "snif" | Downward expressions, blue tones |
| 😞 Disappointed | "déçu", "bof", sighs | Slumped postures, gray palette |
| 😐 Neutral | Default state | Balanced, calm animations |

## 🔧 Configuration

### Emotion Settings
```typescript
interface CustomEmotion {
  id: string;
  displayName: string;
  color: string;
  assets: {
    head?: string[];
    face?: string[];
    body?: string[];
    accessories?: string[];
  };
  animationSettings: {
    audioReactivity: number;    // 0-1
    movement: {
      frequency: number;        // Hz
      amplitude: number;        // pixels
    };
    transitionDuration: number; // ms
  };
}
```

### Audio Processing
- **Transcription Model**: Whisper Base (French optimized)
- **Sample Rate**: 16kHz recommended
- **Formats**: MP3, WAV, OGG
- **Max Duration**: 30 minutes

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit**: `git commit -m 'Add amazing feature'`
5. **Push**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Workflow

```bash
# Start development environment
pnpm electron:dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## 📋 Roadmap

- [ ] 🌍 Multi-language support (English, Spanish, German)
- [ ] 🎵 Background music integration
- [ ] 🤖 Advanced AI emotion models
- [ ] 🎨 3D character support
- [ ] 📱 Mobile companion app
- [ ] 🌐 Cloud character sharing
- [ ] 🎮 Gaming SDK integration

## � Privacy & Security

- **Local Processing**: All audio analysis happens on your device
- **No Cloud Dependencies**: Works completely offline
- **Data Ownership**: Your audio and characters stay on your machine
- **Open Source**: Full transparency with MIT license

## 🆘 Support

- **📖 Documentation**: [Wiki](https://github.com/YOUR_USERNAME/autochar/wiki)
- **💬 Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/autochar/discussions)
- **🐛 Bug Reports**: [Issues](https://github.com/YOUR_USERNAME/autochar/issues)
- **💡 Feature Requests**: [Feature Board](https://github.com/YOUR_USERNAME/autochar/projects)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI Whisper** for speech recognition
- **React Team** for the amazing framework
- **Electron Team** for cross-platform capabilities
- **Tailwind CSS** for beautiful styling
- **Open source community** for inspiration and tools

---

<div align="center">

**Made with ❤️ by the AutoChar Studio team**

[⭐ Star this repo](https://github.com/YOUR_USERNAME/autochar) • [🐦 Follow us](https://twitter.com/YOUR_HANDLE) • [💬 Join Discord](https://discord.gg/YOUR_INVITE)

</div>

3. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the application.

## 📖 How to Use

### Basic Workflow

1. **Upload Audio**: Click "Choose File" and select an audio file (MP3, WAV, etc.)
2. **Process**: Click "Analyze" to start the transcription and emotion analysis
3. **Review**: Check the detected emotions and timeline
4. **Customize**: Use the Advanced Editor to fine-tune animations and add assets
5. **Export**: Generate your final animated video

### Advanced Editor

The Advanced Editor provides three main tabs:

- **Emotions**: Create, edit, and manage emotion definitions
- **Sets**: Organize emotions into reusable sets
- **Assets**: Upload and manage visual assets like accessories

### Audio Controls

- Upload background audio for your animations
- Real-time playback controls
- Waveform visualization
- Synchronization tools

## 🛠️ Development

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Audio Processing**: Web Audio API
- **Animation**: Custom animation engine
- **File Handling**: Modern File API

### Project Structure

```
src/
├── components/          # React components
│   ├── AdvancedEditor.tsx    # Main editor interface
│   ├── StickmanViewer.tsx    # Animation renderer
│   ├── VideoExporter.tsx     # Export functionality
│   └── AssetBasedRenderer.tsx # Asset rendering
├── utils/              # Utility functions
│   ├── emotionManager.ts     # Emotion management
│   ├── assetManager.ts       # Asset management
│   ├── audioAnalyzer.ts      # Audio processing
│   └── intentionAnalyzer.ts  # AI analysis
└── assets/             # Static assets
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain the existing code structure
- Add comments for complex logic
- Test your changes thoroughly

### Code Style

- Use TypeScript for all new code
- Follow the existing naming conventions
- Use meaningful variable and function names
- Keep components small and focused
- Use React hooks appropriately

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React and TypeScript
- UI components styled with Tailwind CSS
- Audio processing using Web Audio API
- Bundled with Vite for optimal performance

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/autochar/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

---

**Made with ❤️ for the animation community**
