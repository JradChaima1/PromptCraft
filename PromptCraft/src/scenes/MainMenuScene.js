import Phaser from 'phaser';

/**
 * MainMenuScene - Main menu with play, options, and about
 * Transitions to GameScene when play is clicked
 */
export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Semi-transparent overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // Title text
        const title = this.add.text(centerX, 150, 'AI SANDBOX BUILDER', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(centerX, 210, 'Build worlds with AI-generated assets', {
            fontSize: '18px',
            color: '#cccccc',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Play button
        const playButton = this.createPixelButton(
            centerX,
            centerY - 60,
            'PLAY',
            () => this.startGame()
        );

        // Options button
        const optionsButton = this.createPixelButton(
            centerX,
            centerY + 20,
            'OPTIONS',
            () => this.showOptions()
        );

        // About button
        const aboutButton = this.createPixelButton(
            centerX,
            centerY + 100,
            'ABOUT',
            () => this.showAbout()
        );

        // Handle window resize
        this.scale.on('resize', this.resize, this);
    }

    createPixelButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        // Button background (pixel style)
        const bg = this.add.graphics();
        bg.fillStyle(0x444444, 1);
        bg.fillRect(-100, -25, 200, 50);
        bg.lineStyle(4, 0xffffff, 1);
        bg.strokeRect(-100, -25, 200, 50);

        // Button text
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '24px',
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

    startGame() {
        // Start GameScene and UIScene in parallel
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
    }

    showOptions() {
        console.log('Options - will be implemented in UIScene');
        // For now, just start the game
        this.startGame();
    }

    showAbout() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Clear existing content
        this.children.removeAll();

        // Background
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // About text
        const aboutText = this.add.text(centerX, centerY - 100, 'ABOUT', {
            fontSize: '36px',
            color: '#ffffff',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const info = this.add.text(centerX, centerY, 
            'AI Sandbox Builder\n\n' +
            'Built with Phaser 3\n' +
            'Powered by Pollinations.ai\n\n' +
            'Generate pixel art assets with AI\n' +
            'Build and share your worlds',
            {
                fontSize: '18px',
                color: '#cccccc',
                fontFamily: 'monospace',
                align: 'center',
                lineSpacing: 10
            }
        ).setOrigin(0.5);

        // Back button
        const backButton = this.createPixelButton(
            centerX,
            centerY + 180,
            'BACK',
            () => this.scene.restart()
        );
    }

    resize(gameSize) {
        // Handle resize if needed
        const width = gameSize.width;
        const height = gameSize.height;
        this.cameras.resize(width, height);
    }
}
