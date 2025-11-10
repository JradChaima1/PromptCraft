/**
 * UIManager Usage Example
 * 
 * This file demonstrates how to integrate and use the UIManager in a Phaser scene.
 */

import UIManager from './UIManager.js';
import AssetManager from './AssetManager.js';
import PixellabAPIService from '../services/PixellabAPIService.js';
import StorageService from '../services/StorageService.js';

// Example: Integrating UIManager in a Phaser Scene
class ExampleGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ExampleGameScene' });
  }

  create() {
    // Initialize services
    this.storageService = new StorageService();
    this.apiService = new PixellabAPIService();
    this.assetManager = new AssetManager(this, this.apiService, this.storageService);
    
    // Initialize UI Manager
    this.uiManager = new UIManager(this);
    
    // Create the main toolbar
    this.uiManager.createMainToolbar();
    
    // Load API token from storage
    const savedToken = this.storageService.getAPIToken();
    if (savedToken) {
      this.apiService.setApiToken(savedToken);
      this._updateCreditsDisplay();
    }
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Update initial displays
    this.uiManager.updateAssetCountDisplay(0);
  }

  _setupEventListeners() {
    // Handle asset generation
    this.events.on('generate-asset', async (params, callback) => {
      try {
        // Show loading modal
        this.uiManager.showLoadingModal('Generating asset...');
        
        // Generate asset
        const result = await this.assetManager.generateAsset(params);
        
        // Hide loading modal
        this.uiManager.hideLoadingModal();
        
        // Update credits display
        this.uiManager.updateCreditsDisplay(
          result.usage.remainingCredits,
          result.usage.remainingGenerations
        );
        
        // Success callback
        callback(true);
        
        // Show success message (optional)
        console.log('Asset generated successfully:', result.asset.name);
        
      } catch (error) {
        // Hide loading modal
        this.uiManager.hideLoadingModal();
        
        // Show error
        callback(false, error.message);
      }
    });

    // Handle asset placement
    this.events.on('place-asset', (asset) => {
      console.log('Entering placement mode for:', asset.name);
      // Implement placement logic here
      // Example: this.worldManager.enterPlacementMode(asset.id);
    });

    // Handle asset deletion
    this.events.on('delete-asset', (assetId) => {
      this.assetManager.removeAsset(assetId);
      
      // Refresh library modal if open
      const assets = this.assetManager.getAssets();
      this.uiManager.showLibraryModal(assets);
    });

    // Handle settings save
    this.events.on('save-settings', (settings) => {
      // Save API token
      this.storageService.saveAPIToken(settings.apiToken);
      this.apiService.setApiToken(settings.apiToken);
      
      // Update credits display
      this._updateCreditsDisplay();
      
      console.log('Settings saved');
    });

    // Handle world export
    this.events.on('export-world', () => {
      const worldData = {
        version: '1.0',
        worldName: 'My World',
        placedAssets: [], // Get from WorldManager
        createdAt: new Date().toISOString()
      };
      
      const filename = `world_${Date.now()}.json`;
      this.storageService.exportToFile(worldData, filename);
      
      console.log('World exported');
    });

    // Handle world import
    this.events.on('import-world', async () => {
      try {
        const worldData = await this.storageService.importFromFile();
        
        // Load world data
        console.log('World imported:', worldData);
        
        // Implement world loading logic here
        
      } catch (error) {
        this.uiManager.showErrorModal('Failed to import world: ' + error.message);
      }
    });

    // Handle clear world
    this.events.on('clear-world', () => {
      // Clear all placed assets
      // Example: this.worldManager.clearWorld();
      
      this.uiManager.updateAssetCountDisplay(0);
      console.log('World cleared');
    });

    // Handle toolbar actions
    this.events.on('toolbar-action', (action) => {
      if (action === 'library') {
        // Get assets and show library
        const assets = this.assetManager.getAssets();
        this.uiManager.showLibraryModal(assets);
      }
    });
  }

  async _updateCreditsDisplay() {
    try {
      const balance = await this.apiService.getBalance();
      this.uiManager.updateCreditsDisplay(
        balance.remainingCredits,
        balance.remainingGenerations
      );
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  }

  // Example: Show tooltip on hover
  showAssetTooltip(asset, x, y) {
    const text = `${asset.name} (${asset.category})`;
    this.uiManager.showTooltip(text, x, y);
  }

  // Example: Hide tooltip
  hideAssetTooltip() {
    this.uiManager.hideTooltip();
  }

  // Clean up on scene shutdown
  shutdown() {
    if (this.uiManager) {
      this.uiManager.destroy();
    }
  }
}

// Example: Keyboard shortcuts setup
class InputController {
  constructor(scene) {
    this.scene = scene;
    this._registerShortcuts();
  }

  _registerShortcuts() {
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
  }
}

export { ExampleGameScene, InputController };
