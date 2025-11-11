# Technology Stack

## Core Technologies

- **Game Engine**: Phaser 3.90.0 (JavaScript game framework)
- **Build Tool**: Vite 7.2.2 (fast ES module bundler)
- **Module System**: ES6 modules (`type: "module"`)
- **Language**: JavaScript (no TypeScript)
- **Storage**: Browser localStorage for persistence
- **API**: Pollinations API (image.pollinations.ai) for AI generation

## Project Structure

```
src/
├── main.js              # Entry point, Phaser config
├── config/              # Centralized configuration
│   └── gameConfig.js    # All game constants
├── scenes/              # Phaser scenes
│   ├── BootScene.js     # Initialization
│   ├── MainMenuScene.js # Menu
│   ├── GameScene.js     # Main gameplay
│   └── UIScene.js       # UI overlay
├── managers/            # Core systems
│   ├── AssetManager.js  # Asset library & generation
│   ├── WorldManager.js  # World state & placement
│   ├── UIManager.js     # UI components
│   └── SpritePool.js    # Performance optimization
├── controllers/         # Input handling
│   └── InputController.js
├── services/            # External integrations
│   ├── PollinationsAPIService.js
│   └── StorageService.js
└── utils/               # Helpers
    ├── helpers.js       # UUID, etc.
    └── PerformanceMonitor.js
```

## Common Commands

```bash
# Development server (port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Build Configuration

- **Entry**: `index.html` (Vite convention)
- **Dev Server**: Port 3000
- **Output**: `dist/` directory
- **Hot Reload**: Enabled in dev mode

## Environment Variables

Optional `.env` configuration:

```
VITE_WORLD_WIDTH=4000
VITE_WORLD_HEIGHT=600
VITE_MAX_ASSETS=500
VITE_MIN_FPS=30
VITE_AUTO_SAVE_INTERVAL=2000
```

## Testing

Test files are standalone HTML files in project root:
- `test-*.html` - Individual feature tests
- Open directly in browser (no test runner)
- Use for manual verification and debugging
