import Phaser from 'phaser';
import UIManager from '../managers/UIManager.js';

/**
 * UIScene - Overlay scene for UI elements
 * Runs in parallel with GameScene to handle all UI interactions
 */
export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.uiManager = null;
        this.gameScene = null;
        this.assetManager = null;
        this.worldManager = null;
    }

    create() {
        // Get reference to GameScene
        this.gameScene = this.scene.get('GameScene');
        
        // Get managers from GameScene
        this.assetManager = this.gameScene.assetManager;
        this.worldManager = this.gameScene.worldManager;
        
        // Initialize UI Manager
        this.uiManager = new UIManager(this);
        
        // Create main toolbar
        this.uiManager.createMainToolbar();
        
        // Set up event listeners for communication with GameScene
        this.setupEventListeners();
        
        // Update input controller reference in GameScene
        if (this.gameScene.inputController) {
            this.gameScene.inputController.uiManager = this.uiManager;
        }
        
        console.log('UIScene initialized');
    }

    /**
     * Set up event listeners for cross-scene communication
     */
    setupEventListeners() {
        // Listen for asset generation requests from UIManager
        this.events.on('generate-asset', (params, callback) => {
            this.handleAssetGeneration(params, callback);
        });
        
        // Listen for asset placement requests from library
        this.events.on('place-asset', (asset) => {
            this.handleAssetPlacement(asset.id);
        });
        
        // Listen for asset deletion requests from library
        this.events.on('delete-asset', (assetId) => {
            this.handleAssetDeletion(assetId);
        });
        
        // Listen for toolbar actions
        this.events.on('toolbar-action', (action) => {
            this.handleToolbarAction(action);
        });
        
        // Listen for asset selection
        this.events.on('asset-selected', (instanceId) => {
            this.handleAssetSelection(instanceId);
        });
        
        // Listen for asset deletion
        this.events.on('asset-deleted', (instanceId) => {
            this.handleAssetDeletion(instanceId);
        });
        
        // Listen for world save events
        this.events.on('world-saved', () => {
            console.log('World saved');
        });
        
        // Listen for world export/import
        this.events.on('export-world', () => {
            this.handleWorldExport();
        });
        
        this.events.on('import-world', (data) => {
            this.handleWorldImport(data);
        });
        
        // Listen for asset limit warnings from WorldManager
        if (this.worldManager) {
            this.gameScene.events.on('asset-limit-warning', (data) => {
                this.uiManager.showToast(
                    `Warning: ${data.current}/${data.max} assets placed`,
                    'warning',
                    3000
                );
            });
            
            this.gameScene.events.on('asset-limit-reached', (data) => {
                this.uiManager.showErrorModal(
                    `Asset limit reached! Maximum ${data.max} assets allowed.`
                );
            });
        }
        
        // Update HUD when game starts
        this.gameScene.events.on('game-started', () => {
            this.updateHUD();
            
            // Show tutorial for first-time users
            this.checkAndShowTutorial();
        });
        
        // Listen for world load errors
        this.gameScene.events.on('world-load-error', (data) => {
            this.uiManager.showErrorModal(data.error);
        });
        
        // Listen for generic error display requests
        this.events.on('show-error', (message) => {
            this.uiManager.showErrorModal(message);
        });
        
        // Listen for success message requests
        this.events.on('show-success', (message) => {
            this.uiManager.showSuccessModal(message);
        });
        
        // Listen for settings save
        this.events.on('save-settings', (settings) => {
            this.handleSettingsSave(settings);
        });
        
        // Listen for clear world
        this.events.on('clear-world', () => {
            this.handleClearWorld();
        });
        
        // Listen for asset save/load errors
        if (this.assetManager) {
            this.gameScene.events.on('asset-save-error', (data) => {
                this.uiManager.showErrorModal(
                    `Failed to save asset library: ${data.error}\n\nYour assets may not be persisted.`
                );
            });
            
            this.gameScene.events.on('asset-load-error', (data) => {
                if (data.canRecover) {
                    this.uiManager.showToast(
                        'Warning: Could not load saved assets. Starting with empty library.',
                        'warning',
                        5000
                    );
                } else {
                    this.uiManager.showErrorModal(data.error);
                }
            });
        }
        
        // Listen for world save/load errors
        if (this.worldManager) {
            this.gameScene.events.on('world-save-error', (data) => {
                this.uiManager.showErrorModal(
                    `Failed to save world: ${data.error}\n\nYour world may not be persisted.`
                );
            });
        }
    }

    /**
     * Handle asset generation request
     */
    async handleAssetGeneration(params, callback) {
        try {
            // Show loading modal with appropriate message
            const loadingMessage = params.isAnimation 
                ? `Generating animation (${params.nFrames || 8} frames)...` 
                : 'Generating asset...';
            this.uiManager.showLoadingModal(loadingMessage);
            
            // Generate asset (check if animation or static)
            let result;
            if (params.isAnimation) {
                // Show progress for animations
                this.uiManager.showProgress('Generating animation frames...', 0);
                result = await this.assetManager.generateAnimatedAsset(params);
                this.uiManager.hideProgress();
            } else {
                result = await this.assetManager.generateAsset(params);
            }
            
            // Hide loading modal
            this.uiManager.hideAllModals();
            
            // Update credits display
            if (result.usage) {
                this.credits = result.usage.creditsRemaining || 0;
                this.generations = result.usage.generationsRemaining || 0;
                this.uiManager.updateCreditsDisplay(this.credits, this.generations);
            }
            
            // Show success toast
            this.uiManager.showToast(
                `Asset "${result.asset.name}" generated successfully!`,
                'success',
                3000
            );
            
            // Call callback with success
            if (callback) {
                callback(true, null);
            }
            
            // Emit event
            this.events.emit('asset-generated', result.asset);
            
        } catch (error) {
            console.error('Asset generation failed:', error);
            this.uiManager.hideAllModals();
            
            // Call callback with error
            if (callback) {
                callback(false, error.message || 'Failed to generate asset');
            } else {
                this.uiManager.showErrorModal(error.message || 'Failed to generate asset');
            }
        }
    }

    /**
     * Handle asset placement request
     */
    async handleAssetPlacement(assetId) {
        try {
            // Prepare asset for placement
            const assetData = await this.assetManager.prepareAssetForPlacement(assetId);
            
            // Enter placement mode in WorldManager
            this.worldManager.enterPlacementMode(assetData);
            
            // Show placement instructions as toast
            this.uiManager.showToast(
                'Click to place asset. Right-click or ESC to cancel.',
                'info',
                5000
            );
            
        } catch (error) {
            console.error('Failed to enter placement mode:', error);
            this.uiManager.showErrorModal('Failed to prepare asset for placement');
        }
    }

    /**
     * Handle asset selection
     */
    handleAssetSelection(instanceId) {
        console.log('Asset selected:', instanceId);
        // Update UI to show transformation controls or info
    }

    /**
     * Handle asset deletion from library
     */
    handleAssetDeletion(assetId) {
        try {
            // Remove asset from library
            const removed = this.assetManager.removeAsset(assetId);
            
            if (removed) {
                console.log('Asset deleted from library:', assetId);
                
                // Show success toast
                this.uiManager.showToast(
                    'Asset deleted successfully',
                    'success',
                    2000
                );
                
                // Refresh library modal if it's open
                const assets = this.assetManager.getAssets();
                this.uiManager.showLibraryModal(assets);
            }
        } catch (error) {
            console.error('Failed to delete asset:', error);
            this.uiManager.showErrorModal('Failed to delete asset: ' + error.message);
        }
    }
    
    /**
     * Handle toolbar actions
     */
    handleToolbarAction(action) {
        switch (action) {
            case 'library':
                // Get assets and show library modal
                const assets = this.assetManager.getAssets();
                this.uiManager.showLibraryModal(assets);
                break;
            case 'settings':
                // Get current settings and show settings modal
                const settings = this.gameScene.storageService.loadSettings();
                this.uiManager.showSettingsModal(settings);
                break;
            case 'help':
                // Show help modal
                this.uiManager.showHelpModal();
                break;
            // 'generate' is already handled by the modal itself
        }
    }

    /**
     * Handle world export
     */
    handleWorldExport() {
        try {
            const exportData = this.worldManager.exportWorld(this.assetManager);
            
            // Trigger download
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `world_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.uiManager.showToast(
                'World exported successfully!',
                'success',
                3000
            );
            
        } catch (error) {
            console.error('World export failed:', error);
            this.uiManager.showErrorModal('Failed to export world: ' + error.message);
        }
    }

    /**
     * Handle world import
     */
    async handleWorldImport(data) {
        try {
            this.uiManager.showLoadingModal('Importing world...');
            
            await this.worldManager.importWorld(data, this.assetManager);
            
            this.uiManager.hideAllModals();
            
            this.uiManager.showToast(
                'World imported successfully!',
                'success',
                3000
            );
            
            this.updateHUD();
            
        } catch (error) {
            console.error('World import failed:', error);
            this.uiManager.hideAllModals();
            this.uiManager.showErrorModal('Failed to import world: ' + error.message);
        }
    }

    /**
     * Handle settings save
     */
    handleSettingsSave(settings) {
        try {
            // Save API token
            if (settings.apiToken) {
                this.gameScene.storageService.saveAPIToken(settings.apiToken);
                this.gameScene.apiService.setApiToken(settings.apiToken);
            }
            
            // Save other settings
            this.gameScene.storageService.saveSettings({
                worldWidth: settings.worldWidth,
                worldHeight: settings.worldHeight
            });
            
            this.uiManager.showSuccessModal('Settings saved successfully!');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.uiManager.showErrorModal('Failed to save settings: ' + error.message);
        }
    }
    
    /**
     * Handle clear world
     */
    handleClearWorld() {
        try {
            this.worldManager.clearWorld(true, false);
            this.uiManager.showSuccessModal('World cleared successfully!');
            this.updateHUD();
        } catch (error) {
            console.error('Failed to clear world:', error);
            this.uiManager.showErrorModal('Failed to clear world: ' + error.message);
        }
    }
    
    /**
     * Check if user is first-time and show tutorial
     */
    checkAndShowTutorial() {
        try {
            const settings = this.gameScene.storageService.loadSettings();
            
            // Check if tutorial has been shown
            if (!settings.tutorialShown) {
                // Show tutorial after a short delay
                setTimeout(() => {
                    this.showTutorial();
                    
                    // Mark tutorial as shown
                    settings.tutorialShown = true;
                    this.gameScene.storageService.saveSettings(settings);
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to check tutorial status:', error);
        }
    }
    
    /**
     * Show tutorial for first-time users
     */
    showTutorial() {
        this.uiManager.showToast(
            'Welcome! Press G to generate your first asset, or click Help (❓) for more info.',
            'info',
            8000
        );
    }
    
    /**
     * Update HUD elements
     */
    updateHUD() {
        try {
            if (!this.worldManager) return;
            
            const assetCountInfo = this.worldManager.getAssetCountInfo();
            this.uiManager.updateAssetCountDisplay(assetCountInfo.current, assetCountInfo.max);
        } catch (error) {
            console.error('Failed to update HUD:', error);
        }
    }

    /**
     * Update method - called every frame
     */
    update() {
        try {
            // Update HUD periodically
            if (this.worldManager) {
                const assetCountInfo = this.worldManager.getAssetCountInfo();
                if (this.assetCount !== assetCountInfo.current) {
                    this.assetCount = assetCountInfo.current;
                    this.uiManager.updateAssetCountDisplay(this.assetCount);
                }
            }
        } catch (error) {
            // Silently log errors in update loop to avoid spam
            if (!this.updateErrorLogged) {
                console.error('Error in UIScene update:', error);
                this.updateErrorLogged = true;
            }
        }
    }

    /**
     * Shutdown - cleanup when scene stops
     */
    shutdown() {
        // Clean up UI Manager
        if (this.uiManager) {
            this.uiManager.destroy();
        }
        
        // Remove event listeners
        this.events.off('generate-asset');
        this.events.off('place-asset');
        this.events.off('asset-selected');
        this.events.off('asset-deleted');
        this.events.off('world-saved');
        this.events.off('export-world');
        this.events.off('import-world');
    }
}
