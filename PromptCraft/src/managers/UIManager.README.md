# UIManager Documentation

The UIManager handles all user interface elements for the AI Sandbox Builder game, including toolbars, modals, HUD elements, and tooltips.

## Features

### Main Toolbar
- **Generate Button**: Opens asset generation modal
- **Library Button**: Opens asset library modal
- **Settings Button**: Opens settings modal
- **Help Button**: Opens help and guide modal
- **Credits Display**: Shows remaining API credits and generations

### Modals

#### Asset Generation Modal
- Text input for asset description
- Category selection (character, object, terrain, decoration, building)
- Parameter controls:
  - Text Guidance Scale (slider 1-20)
  - Outline style (none, thin, medium, thick)
  - Shading style (none, flat, soft, hard)
  - Detail level (low, medium, high)
  - View angle (side, front, back, top-down, 3/4)
  - Direction (optional: left, right, up, down)
  - Image size (width/height 16-400px)
  - Isometric checkbox
  - No background checkbox
  - Seed input (optional)

#### Asset Library Modal
- Scrollable grid layout of asset thumbnails
- Category filter dropdown
- Asset cards showing:
  - Thumbnail preview
  - Asset name
  - Category badge
  - Animation indicator (for animated assets)
  - Place button
  - Delete button
- Empty state message when no assets

#### Settings Modal
- API token input (password field)
- Keyboard shortcuts reference
- World size configuration:
  - Width input (1000-10000 pixels)
  - Height input (600-2000 pixels)
  - Note: Requires game reload to take effect
- World management buttons:
  - Export World
  - Import World
  - Clear World (with confirmation)

#### Help Modal
- Welcome message
- Getting started guide
- Pro tips for asset generation

#### Error Modal
- Error icon with shake animation
- Error message display
- OK button to dismiss

#### Loading Modal
- Spinning loader animation
- Loading message
- Non-dismissible (must be closed programmatically)

### HUD Elements
- **Asset Count Display**: Shows current/max placed assets (bottom right)
  - Changes color based on count (blue → yellow → red)
  - Pulses when approaching/at limit

### Tooltip System
- Shows contextual information on hover
- Auto-positions to stay on screen
- Fade-in animation

## Usage

### Basic Setup

```javascript
import UIManager from './managers/UIManager.js';

class GameScene extends Phaser.Scene {
  create() {
    // Initialize UI Manager
    this.uiManager = new UIManager(this);
    
    // Create main toolbar
    this.uiManager.createMainToolbar();
    
    // Set up event listeners
    this._setupEventListeners();
  }
}
```

### Event Handling

The UIManager emits events that your scene should handle:

```javascript
_setupEventListeners() {
  // Asset generation
  this.events.on('generate-asset', async (params, callback) => {
    try {
      this.uiManager.showLoadingModal('Generating...');
      const result = await this.assetManager.generateAsset(params);
      this.uiManager.hideLoadingModal();
      callback(true);
    } catch (error) {
      this.uiManager.hideLoadingModal();
      callback(false, error.message);
    }
  });

  // Asset placement
  this.events.on('place-asset', (asset) => {
    // Enter placement mode
  });

  // Asset deletion
  this.events.on('delete-asset', (assetId) => {
    this.assetManager.removeAsset(assetId);
  });

  // Settings save
  this.events.on('save-settings', (settings) => {
    this.storageService.saveAPIToken(settings.apiToken);
    this.storageService.saveSettings({
      worldWidth: settings.worldWidth,
      worldHeight: settings.worldHeight
    });
  });

  // World management
  this.events.on('export-world', () => { /* ... */ });
  this.events.on('import-world', () => { /* ... */ });
  this.events.on('clear-world', () => { /* ... */ });
}
```

### Updating Displays

```javascript
// Update credits display
this.uiManager.updateCreditsDisplay(credits, generations);

// Update asset count
this.uiManager.updateAssetCountDisplay(count);
```

### Showing Modals

```javascript
// Show generation modal
this.uiManager.showGenerationModal();

// Show library modal with assets
const assets = this.assetManager.getAssets();
this.uiManager.showLibraryModal(assets);

// Show settings modal with current settings
const savedSettings = this.storageService.loadSettings();
const settings = { 
  apiToken: this.storageService.getAPIToken(),
  worldWidth: savedSettings.worldWidth || 4000,
  worldHeight: savedSettings.worldHeight || 600
};
this.uiManager.showSettingsModal(settings);

// Show help modal
this.uiManager.showHelpModal();

// Show error modal
this.uiManager.showErrorModal('Something went wrong!');

// Show loading modal
this.uiManager.showLoadingModal('Processing...');

// Hide all modals
this.uiManager.hideAllModals();
```

### Tooltips

```javascript
// Show tooltip
this.uiManager.showTooltip('Asset name', x, y);

// Hide tooltip
this.uiManager.hideTooltip();
```

### Keyboard Shortcuts

Register keyboard shortcuts in your InputController:

```javascript
// G - Open generator
this.scene.input.keyboard.on('keydown-G', () => {
  this.scene.uiManager.showGenerationModal();
});

// L - Open library
this.scene.input.keyboard.on('keydown-L', () => {
  const assets = this.scene.assetManager.getAssets();
  this.scene.uiManager.showLibraryModal(assets);
});

// ESC - Close modals
this.scene.input.keyboard.on('keydown-ESC', () => {
  this.scene.uiManager.hideAllModals();
});
```

## Styling

The UIManager uses a pixel art aesthetic with:
- Dark theme (grays and blacks)
- Accent colors: cyan (#87ceeb), gold (#ffd700)
- Gradient backgrounds
- Smooth transitions and animations
- Pixel-perfect rendering for images

## Cleanup

Always destroy the UIManager when the scene shuts down:

```javascript
shutdown() {
  if (this.uiManager) {
    this.uiManager.destroy();
  }
}
```

## Dependencies

- Phaser 3 Scene (for event system)
- Modern browser with ES6+ support
- DOM manipulation APIs

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Notes

- All modals are modal (block interaction with game)
- Loading modal cannot be dismissed by clicking backdrop
- Error modal auto-focuses OK button
- Asset library supports filtering by category
- HUD elements are positioned to not block gameplay
- Tooltips auto-position to stay on screen
