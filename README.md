# AutoChar - Animated Stickman Generator

AutoChar is a modern web application that automatically generates animated stickman characters from audio files. Upload an audio file, and watch as the app analyzes the audio content to create synchronized animated stickman characters with emotions, poses, and movements.

## ✨ Features

### 🎵 Audio Analysis
- **Automatic Transcription**: Upload audio files and get automatic transcription
- **Emotion Detection**: Advanced AI analysis to detect emotions in speech
- **Audio Visualization**: Real-time audio waveform and frequency analysis
- **Synchronization**: Perfect sync between audio and animation

### 🎨 Advanced Animation
- **Emotion-Based Animation**: Stickman poses change based on detected emotions
- **Custom Poses**: Create and edit custom stickman poses
- **Asset Management**: Upload and manage custom accessories and visual elements
- **Smooth Transitions**: Fluid animations with customizable easing

### 🎬 Professional Tools
- **Advanced Editor**: Full-featured editor for fine-tuning animations
- **Asset Library**: Organize and reuse visual assets
- **Emotion Sets**: Create reusable sets of emotions and poses
- **Export Options**: Export animations as video files

### 🌙 Modern UI
- **Dark Theme**: Beautiful dark theme optimized for long working sessions
- **Responsive Design**: Works perfectly on desktop and tablet devices
- **Intuitive Interface**: Clean, modern interface built with React and Tailwind CSS

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/autochar.git
   cd autochar
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

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
