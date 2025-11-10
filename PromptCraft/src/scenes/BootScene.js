import Phaser from 'phaser';
import StorageService from '../services/StorageService.js';
import PixellabAPIService from '../services/PixellabAPIService.js';

/**
 * BootScene - Initial loading and API token validation
 * Handles startup initialization before transitioning to main menu
 */
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
        this.storageService = null;
        this.apiService = null;
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
            
            // Load saved settings
            const settings = this.storageService.loadSettings();
            
            // Get API token from storage
            const apiToken = this.storageService.getAPIToken();
            
            if (apiToken) {
                // Initialize API service with stored token
                this.apiService = new PixellabAPIService(apiToken);
                
                // Update loading text
                this.loadingText.setText('Validating API token...');
                
                // Validate token
                this.validateTokenAndProceed(apiToken);
            } else {
                // No token found, prompt user
                this.promptForToken();
            }
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
                    this.apiService = new PixellabAPIService('');
                    this.registry.set('apiService', this.apiService);
                    this.registry.set('storageService', this.storageService);
                    this.scene.start('MainMenuScene');
                } catch (recoveryError) {
                    console.error('Recovery failed:', recoveryError);
                }
            });
        }
    }

    async validateTokenAndProceed(token) {
        try {
            const isValid = await this.apiService.validateToken();
            
            if (isValid) {
                // Token is valid, proceed to main menu
                this.loadingText.setText('Token validated!');
                
                // Store API service in registry for other scenes
                this.registry.set('apiService', this.apiService);
                this.registry.set('storageService', this.storageService);
                
                // Wait a moment then transition
                this.time.delayedCall(500, () => {
                    this.scene.start('MainMenuScene');
                });
            } else {
                // Token is invalid
                console.warn('API token validation failed');
                this.showError('Invalid API token. Please enter a valid token.');
                this.promptForToken();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                token: token ? '***' + token.slice(-4) : 'none'
            });
            
            // On error, still allow proceeding but show warning
            this.showError('Could not validate token. Proceeding anyway...');
            
            // Store services in registry
            this.registry.set('apiService', this.apiService);
            this.registry.set('storageService', this.storageService);
            
            // Proceed to main menu after delay
            this.time.delayedCall(2000, () => {
                this.scene.start('MainMenuScene');
            });
        }
    }

    promptForToken() {
        // Clear loading text
        this.loadingText.destroy();
        
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // Create token input UI
        const title = this.add.text(centerX, centerY - 100, 'API Token Required', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        const instructions = this.add.text(centerX, centerY - 40, 'Enter your Pixellab API token:', {
            fontSize: '18px',
            color: '#cccccc',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        // Create HTML input element for token
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = 'Enter API token...';
        inputElement.style.position = 'absolute';
        inputElement.style.left = '50%';
        inputElement.style.top = '50%';
        inputElement.style.transform = 'translate(-50%, -50%)';
        inputElement.style.width = '400px';
        inputElement.style.padding = '10px';
        inputElement.style.fontSize = '16px';
        inputElement.style.fontFamily = 'monospace';
        inputElement.style.border = '2px solid #ffffff';
        inputElement.style.backgroundColor = '#333333';
        inputElement.style.color = '#ffffff';
        inputElement.style.outline = 'none';
        document.body.appendChild(inputElement);
        inputElement.focus();
        
        // Create submit button
        const submitButton = this.createButton(centerX, centerY + 60, 'Submit', () => {
            const token = inputElement.value.trim();
            if (token) {
                // Remove input element
                document.body.removeChild(inputElement);
                
                // Save token
                this.storageService.saveAPIToken(token);
                
                // Initialize API service
                this.apiService = new PixellabAPIService(token);
                
                // Clear UI
                title.destroy();
                instructions.destroy();
                submitButton.destroy();
                if (this.errorText) this.errorText.destroy();
                
                // Create loading text
                this.loadingText = this.add.text(centerX, centerY, 'Validating token...', {
                    fontSize: '24px',
                    color: '#ffffff',
                    fontFamily: 'monospace'
                }).setOrigin(0.5);
                
                // Validate and proceed
                this.validateTokenAndProceed(token);
            }
        });
        
        // Create skip button (for testing without token)
        const skipButton = this.createButton(centerX, centerY + 120, 'Skip (Testing)', () => {
            // Remove input element
            document.body.removeChild(inputElement);
            
            // Initialize with empty token (will fail API calls but allow testing)
            this.apiService = new PixellabAPIService('');
            
            // Store services in registry
            this.registry.set('apiService', this.apiService);
            this.registry.set('storageService', this.storageService);
            
            // Proceed to main menu
            this.scene.start('MainMenuScene');
        });
        
        // Handle Enter key
        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitButton.emit('pointerdown');
            }
        });
    }

    createButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        // Button background
        const bg = this.add.graphics();
        bg.fillStyle(0x444444, 1);
        bg.fillRect(-100, -25, 200, 50);
        bg.lineStyle(4, 0xffffff, 1);
        bg.strokeRect(-100, -25, 200, 50);

        // Button text
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        container.add([bg, buttonText]);
        container.setSize(200, 50);
        container.setInteractive({ useHandCursor: true });

        // Hover effect
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x666666, 1);
            bg.fillRect(-100, -25, 200, 50);
            bg.lineStyle(4, 0xffff00, 1);
            bg.strokeRect(-100, -25, 200, 50);
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x444444, 1);
            bg.fillRect(-100, -25, 200, 50);
            bg.lineStyle(4, 0xffffff, 1);
            bg.strokeRect(-100, -25, 200, 50);
        });

        // Click event
        container.on('pointerdown', callback);

        return container;
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
