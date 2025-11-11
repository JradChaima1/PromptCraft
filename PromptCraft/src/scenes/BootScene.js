import Phaser from 'phaser';
import StorageService from '../services/StorageService.js';
import PollinationsAPIService from '../services/PollinationsAPIService.js';
import BackgroundRemovalService from '../services/BackgroundRemovalService.js';

/**
 * BootScene - Initial loading and service initialization
 * Handles startup initialization before transitioning to main menu
 */
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
        this.storageService = null;
        this.apiService = null;
        this.bgRemovalService = null;
    }

    preload() {
        // Create loading text
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        this.loadingText = this.add.text(centerX, centerY, 'Initializing...', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    create() {
        try {
            // Initialize services
            this.storageService = new StorageService();
            
            // Initialize Pollinations API service (no authentication required)
            this.apiService = new PollinationsAPIService();
            
            // Initialize Background Removal service
            this.bgRemovalService = new BackgroundRemovalService();
            
            // Update loading text
            this.loadingText.setText('Ready!');
            
            // Store services in registry for other scenes
            this.registry.set('apiService', this.apiService);
            this.registry.set('storageService', this.storageService);
            this.registry.set('bgRemovalService', this.bgRemovalService);
            
            // Transition to main menu
            this.time.delayedCall(500, () => {
                this.scene.start('MainMenuScene');
            });
        } catch (error) {
            console.error('Critical error in BootScene initialization:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            // Show error to user
            this.showError('Failed to initialize application. Please refresh the page.');
            
            // Try to recover by initializing with minimal services
            this.time.delayedCall(3000, () => {
                try {
                    this.storageService = new StorageService();
                    this.apiService = new PollinationsAPIService();
                    this.registry.set('apiService', this.apiService);
                    this.registry.set('storageService', this.storageService);
                    this.scene.start('MainMenuScene');
                } catch (recoveryError) {
                    console.error('Recovery failed:', recoveryError);
                }
            });
        }
    }

    showError(message) {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        if (this.errorText) {
            this.errorText.destroy();
        }
        
        this.errorText = this.add.text(centerX, centerY + 180, message, {
            fontSize: '16px',
            color: '#ff6666',
            fontFamily: 'monospace',
            align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5);
    }
}
