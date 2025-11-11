/**
 * Example: Settings Modal Integration
 * 
 * This example shows how to integrate the settings modal with your GameScene
 * and handle all settings-related events.
 */

import Phaser from 'phaser';
import UIManager from './UIManager.js';
import StorageService from '../services/StorageService.js';
import PollinationsAPIService from '../services/PollinationsAPIService.js';

class GameSceneWithSettings extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Initialize services
    this.storageService = new StorageService();
    this.apiService = new PollinationsAPIService();
    
    // Initialize UI Manager
    this.uiManager = new UIManager(this);
    this.uiManager.createMainToolbar();
    
    // Load saved settings
    this._loadSettings();
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Set up keyboard shortcuts
    this._setupKeyboardShortcuts();
  }

  /**
   * Load saved settings from storage
   * @private
   */
  _loadSettings() {
    // Load settings (no API token needed for Pollinations)
    const settings = this.storageService.loadSettings();
    this.worldWidth = settings.worldWidth || 4000;
    this.worldHeight = settings.worldHeight || 600;
    
    console.log('Settings loaded:', settings);
  }

  /**
   * Set up event listeners for UI interactions
   * @private
   */
  _setupEventListeners() {
    // Settings save event
    this.events.on('save-settings', (settings) => {
      this._handleSaveSettings(settings);
    });
    
    // Export world event
    this.events.on('export-world', () => {
      this._handleExportWorld();
    });
    
    // Import world event
    this.events.on('import-world', () => {
      this._handleImportWorld();
    });
    
    // Clear world event
    this.events.on('clear-world', () => {
      this._handleClearWorld();
    });
  }

  /**
   * Set up keyboard shortcuts
   * @private
   */
  _setupKeyboardShortcuts() {
    // Settings shortcut (could be any key, e.g., S)
    this.input.keyboard.on('keydown-S', (event) => {
      if (event.ctrlKey) {
        // Ctrl+S is for save world
        return;
      }
      this._openSettings();
    });
    
    // ESC to close modals
    this.input.keyboard.on('keydown-ESC', () => {
      this.uiManager.hideAllModals();
    });
  }

  /**
   * Open settings modal
   * @private
   */
  _openSettings() {
    // Load current settings
    const savedSettings = this.storageService.loadSettings();
    
    const currentSettings = {
      worldWidth: savedSettings.worldWidth || 4000,
      worldHeight: savedSettings.worldHeight || 600
    };
    
    // Show settings modal
    this.uiManager.showSettingsModal(currentSettings);
  }

  /**
   * Handle settings save
   * @private
   */
  _handleSaveSettings(settings) {
    console.log('Saving settings:', settings);
    
    // Save world size settings
    const savedSettings = this.storageService.loadSettings();
    const newSettings = {
      ...savedSettings,
      worldWidth: settings.worldWidth,
      worldHeight: settings.worldHeight
    };
    
    this.storageService.saveSettings(newSettings);
    console.log('World size settings saved');
    
    // Check if world size changed
    if (settings.worldWidth !== this.worldWidth || 
        settings.worldHeight !== this.worldHeight) {
      // Show notification that reload is required
      this.uiManager.showErrorModal(
        'World size has been updated.\n\n' +
        'Please reload the page for changes to take effect.'
      );
    }
  }

  /**
   * Handle world export
   * @private
   */
  _handleExportWorld() {
    console.log('Exporting world...');
    
    // Get world state (this would come from WorldManager)
    const worldState = this.storageService.loadWorldState();
    
    if (!worldState || !worldState.placedAssets || worldState.placedAssets.length === 0) {
      this.uiManager.showErrorModal('No world to export. Place some assets first!');
      return;
    }
    
    // Export to file
    const filename = `world_${new Date().toISOString().split('T')[0]}.json`;
    const success = this.storageService.exportToFile(worldState, filename);
    
    if (success) {
      console.log('World exported successfully');
    } else {
      this.uiManager.showErrorModal('Failed to export world. Please try again.');
    }
  }

  /**
   * Handle world import
   * @private
   */
  async _handleImportWorld() {
    console.log('Importing world...');
    
    try {
      const worldData = await this.storageService.importFromFile();
      
      // Validate world data
      if (!worldData.version || !worldData.placedAssets) {
        this.uiManager.showErrorModal('Invalid world file format.');
        return;
      }
      
      // Save imported world
      this.storageService.saveWorldState(worldData);
      
      // Reload the scene to apply imported world
      this.scene.restart();
      
      console.log('World imported successfully');
    } catch (error) {
      console.error('Failed to import world:', error);
      this.uiManager.showErrorModal(`Failed to import world: ${error.message}`);
    }
  }

  /**
   * Handle clear world
   * @private
   */
  _handleClearWorld() {
    console.log('Clearing world...');
    
    // Clear world state from storage
    this.storageService.clearWorldState();
    
    // Reload the scene to clear placed assets
    this.scene.restart();
    
    console.log('World cleared');
  }

  /**
   * Clean up when scene shuts down
   */
  shutdown() {
    if (this.uiManager) {
      this.uiManager.destroy();
    }
  }
}

export default GameSceneWithSettings;

/**
 * USAGE NOTES:
 * 
 * 1. The settings modal includes:
 *    - Keyboard shortcuts reference panel
 *    - World size configuration (width/height)
 *    - World management buttons (Export, Import, Clear)
 * 
 * 2. World size changes require a page reload to take effect
 * 
 * 3. The Clear World button shows a confirmation dialog before clearing
 * 
 * 4. All settings are persisted to localStorage via StorageService
 * 
 * 5. Event flow:
 *    User clicks Settings button → showSettingsModal() → User edits → 
 *    User clicks Save → 'save-settings' event → _handleSaveSettings() →
 *    Save to storage
 * 
 * 6. Keyboard shortcuts shown in the modal:
 *    - G: Open Asset Generator
 *    - L: Open Asset Library
 *    - ESC: Close Modals / Deselect
 *    - Delete: Remove Selected Asset
 *    - Ctrl+S: Save World
 *    - Ctrl+E: Export World
 *    - Arrow Keys / WASD: Move Player
 *    - Space: Jump
 *    - Mouse Wheel: Zoom Camera
 *    - Middle Mouse Drag: Pan Camera
 */
