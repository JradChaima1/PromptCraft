import Phaser from 'phaser';
import AssetManager from '../managers/AssetManager.js';
import WorldManager from '../managers/WorldManager.js';
import InputController from '../controllers/InputController.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameStarted = false;
        
        // Manager references
        this.assetManager = null;
        this.worldManager = null;
        this.inputController = null;
        this.apiService = null;
        this.storageService = null;
    }

    preload() {
        // Load the background image
        this.load.image('background', 'src/assets/background.png');
        
        // Load player sprite sheets (4 frames each for walking animation)
        this.load.spritesheet('player-right', 'src/assets/4-frame_looping_pixel_art_animation_of_a_player_wa/rotations/east.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        
        this.load.spritesheet('player-left', 'src/assets/4-frame_looping_pixel_art_animation_of_a_player_wa/rotations/west.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create() {
        // Get services from registry (set by BootScene)
        this.apiService = this.registry.get('apiService');
        this.storageService = this.registry.get('storageService');
        
        // Initialize managers
        this.assetManager = new AssetManager(this, this.apiService, this.storageService);
        this.worldManager = new WorldManager(this, this.storageService);
        this.inputController = new InputController(this);
        
        // World size - 4000 pixels wide
        const WORLD_WIDTH = 4000;
        const WORLD_HEIGHT = 600;

        // Set world bounds
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Add scrolling background
        this.background = this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'background');
        this.background.setOrigin(0, 0);
        this.background.setScrollFactor(0);

        // Create player animations
        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('player-right', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('player-left', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'idle-right',
            frames: [{ key: 'player-right', frame: 0 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'idle-left',
            frames: [{ key: 'player-left', frame: 0 }],
            frameRate: 1
        });

        // Create player with animated sprite (bigger size)
        // Ground is at Y=568 (600-32), spawn player above it
        this.player = this.physics.add.sprite(400, 300, 'player-right');
        this.player.setDisplaySize(96, 96); // Increased from 64 to 96
        
        // Set physics body size - use smaller body at the bottom (feet)
        this.player.body.setSize(50, 25); // Small collision box for feet
        this.player.body.setOffset(23, 44); // Position at the bottom of the 64x64 frame
       

        // Player physics
        this.player.setCollideWorldBounds(true)
        this.player.setBounce(0);
        this.player.setVisible(false); // Hide until game starts
        
        // Track player direction
        this.playerDirection = 'right';

        // Create ground (simple green platform)
        this.ground = this.physics.add.staticGroup();
        
        // Add ground tiles across the world
        for (let x = 0; x < WORLD_WIDTH; x += 64) {
            const groundTile = this.ground.create(x, WORLD_HEIGHT - 32, null);
            groundTile.setDisplaySize(64, 64);
            groundTile.refreshBody();
            
            // Draw ground as green square
            if (x === 0) {
                const groundGraphics = this.add.graphics();
                groundGraphics.fillStyle(0x00aa00, 1);
                groundGraphics.fillRect(0, 0, 64, 64);
                groundGraphics.generateTexture('ground', 64, 64);
                groundGraphics.destroy();
            }
            groundTile.setTexture('ground');
        }

        // Collision between player and ground
        this.physics.add.collider(this.player, this.ground);

        // Group for placed bricks
        this.bricks = this.physics.add.staticGroup();
        
        // Create brick texture (red square)
        const brickGraphics = this.add.graphics();
        brickGraphics.fillStyle(0xff0000, 1);
        brickGraphics.fillRect(0, 0, 32, 32);
        brickGraphics.generateTexture('brick', 32, 32);
        brickGraphics.destroy();

        // Camera setup (but don't follow yet)
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Create menu
        this.createMenu();
    }

    createMenu() {
        // Menu container
        this.menuContainer = this.add.container(0, 0);
        this.menuContainer.setScrollFactor(0);

        // Semi-transparent overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.menuContainer.add(overlay);

        // Title text
        const title = this.add.text(this.cameras.main.centerX, 150, 'SANDBOX GAME', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.menuContainer.add(title);

        // Play button
        const playButton = this.createPixelButton(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 60,
            'PLAY',
            () => this.startGame()
        );
        this.menuContainer.add(playButton);

        // Options button
        const optionsButton = this.createPixelButton(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 20,
            'OPTIONS',
            () => console.log('Options clicked')
        );
        this.menuContainer.add(optionsButton);

        // Credits button
        const creditsButton = this.createPixelButton(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            'CREDITS',
            () => console.log('Credits clicked')
        );
        this.menuContainer.add(creditsButton);
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
        // Hide menu
        this.menuContainer.setVisible(false);
        
        // Show player
        this.player.setVisible(true);
        
        // Start camera following - no offset, just center on player
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        
        // Set up input controller references
        this.inputController.setReferences(this.player, this.worldManager, null, this.assetManager);
        
        // Enable camera follow
        this.inputController.enableCameraFollow();
        
        // Set up player collision with placed assets
        this.worldManager.setupPlayerCollision(this.player);
        
        // Set up event listeners for WorldManager
        this.setupWorldManagerEvents();
        
        // Load saved world state
        this.loadWorldState();
        
        // Enable game
        this.gameStarted = true;
        
        // Emit event that game has started
        this.events.emit('game-started');
    }
    
    setupWorldManagerEvents() {
        // Listen for asset placement events
        this.worldManager.scene.events.on('asset-placed', (asset) => {
            console.log('Asset placed:', asset.instanceId);
            this.events.emit('asset-placed', asset);
        });
        
        // Listen for asset selection events
        this.worldManager.scene.events.on('asset-selected', (instanceId) => {
            console.log('Asset selected:', instanceId);
            this.events.emit('asset-selected', instanceId);
        });
        
        // Listen for asset deletion events
        this.worldManager.scene.events.on('asset-deleted', (instanceId) => {
            console.log('Asset deleted:', instanceId);
            this.events.emit('asset-deleted', instanceId);
        });
        
        // Listen for world save events
        this.worldManager.scene.events.on('world-saved', () => {
            console.log('World saved');
            this.events.emit('world-saved');
        });
    }
    
    async loadWorldState() {
        try {
            const loaded = await this.worldManager.loadWorld(this.assetManager);
            if (loaded) {
                console.log('World state loaded successfully');
                // Emit success event
                this.events.emit('world-loaded', { success: true });
            } else {
                console.log('No saved world state found, starting fresh');
                this.events.emit('world-loaded', { success: false, reason: 'no-saved-state' });
            }
        } catch (error) {
            console.error('Error loading world state:', error);
            // Log detailed error information
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            // Emit error event for UI to handle
            this.events.emit('world-load-error', {
                error: error.message || 'Failed to load world state',
                timestamp: new Date().toISOString()
            });
            
            // Show error to user if UIScene is available
            if (this.scene.get('UIScene')) {
                this.scene.get('UIScene').events.emit('show-error', 
                    'Failed to load saved world. Starting with empty world.'
                );
            }
        }
    }

    update() {
        // Only update game if started
        if (!this.gameStarted) return;

        // Update input controller (handles player movement)
        if (this.inputController) {
            this.inputController.update();
        }
        
        // Update world manager culling system
        if (this.worldManager) {
            this.worldManager.updateCulling();
        }

        // Update background scroll position to follow camera
        this.background.tilePositionX = this.cameras.main.scrollX;
    }

}
