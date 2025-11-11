/**
 * UIManager
 * Handles all user interface elements including toolbars, modals, HUD, and tooltips
 * Implements tasks 3.1-3.6 from tasks.md
 */
export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    
    // UI container
    this.container = document.createElement('div');
    this.container.id = 'game-ui';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: 'Courier New', monospace;
    `;
    document.body.appendChild(this.container);
    
    // Modal tracking
    this.activeModals = [];
    this.tooltip = null;
    
    // HUD elements
    this.assetCountDisplay = null;
    
    // Inject styles
    this._injectStyles();
    
    // Create HUD
    this.createHUD();
    
    console.log('UIManager initialized');
  }

  /**
   * Inject CSS styles for UI elements
   * @private
   */
  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #game-ui * {
        box-sizing: border-box;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Task 3.1: Create main toolbar
   */
  createMainToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'ui-toolbar';
    toolbar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 50px;
      background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
      border-bottom: 2px solid #4a4a4a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      pointer-events: auto;
      z-index: 1001;
    `;

    // Left section - action buttons
    const leftSection = document.createElement('div');
    leftSection.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    // Create buttons
    const buttons = [
      { label: 'Generate', title: 'Generate new asset (G)', action: () => this.showGenerationModal() },
      { label: 'Library', title: 'Open asset library (L)', action: () => {
        // Get assets from AssetManager if available
        const assets = this.scene.assetManager?.getAssets() || [];
        this.showLibraryModal(assets);
      }},
      { label: 'Settings', title: 'Open settings', action: () => this.showSettingsModal() },
      { label: 'Help', title: 'Show help', action: () => this.showHelpModal() }
    ];

    buttons.forEach(btn => {
      const button = this._createButton(btn.label, btn.title);
      button.addEventListener('click', btn.action);
      leftSection.appendChild(button);
    });

    toolbar.appendChild(leftSection);
    this.container.appendChild(toolbar);
    
    console.log('Main toolbar created');
  }


  /**
   * Task 3.6: Create HUD elements
   */
  createHUD() {
    // Asset count display (bottom right)
    this.assetCountDisplay = document.createElement('div');
    this.assetCountDisplay.id = 'asset-count-display';
    this.assetCountDisplay.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 15px;
      background: rgba(26, 26, 26, 0.9);
      border: 2px solid #87ceeb;
      border-radius: 8px;
      color: #87ceeb;
      font-size: 14px;
      font-weight: bold;
      pointer-events: auto;
      z-index: 1001;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    `;
    this.assetCountDisplay.innerHTML = `
      <span style="font-size: 16px;">&#128230;</span>
      Assets: <span id="asset-count-value">0</span> / 500
    `;
    this.container.appendChild(this.assetCountDisplay);
  }



  /**
   * Task 3.6: Update asset count display
   */
  updateAssetCountDisplay(count) {
    if (this.assetCountDisplay) {
      const countValue = this.assetCountDisplay.querySelector('#asset-count-value');
      if (countValue) countValue.textContent = count;
      
      // Color coding based on count
      let color = '#87ceeb'; // Blue (normal)
      let shouldPulse = false;
      
      if (count >= 500) {
        color = '#ff6b6b'; // Red (at limit)
        shouldPulse = true;
      } else if (count >= 400) {
        color = '#ffd700'; // Yellow (warning)
        shouldPulse = true;
      }
      
      this.assetCountDisplay.style.borderColor = color;
      this.assetCountDisplay.style.color = color;
      
      if (shouldPulse) {
        this.assetCountDisplay.style.animation = 'pulse 1s infinite';
      } else {
        this.assetCountDisplay.style.animation = 'none';
      }
    }
  }


  /**
   * Task 3.2: Show generation modal
   */
  showGenerationModal() {
    // Close any existing modals first
    this.hideAllModals();
    
    const modal = this._createModal('Generate Asset');
    
    const form = document.createElement('form');
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
      padding: 20px;
    `;

    // Description input
    const descGroup = this._createFormGroup('Description', 'Enter asset description');
    const descInput = document.createElement('textarea');
    descInput.id = 'asset-description';
    descInput.placeholder = 'e.g., a brave knight with a sword';
    descInput.rows = 3;
    descInput.required = true;
    descInput.style.cssText = this._getInputStyle();
    descGroup.appendChild(descInput);
    form.appendChild(descGroup);

    // Model selection
    const modelGroup = this._createFormGroup('Model', 'Select AI model for generation');
    const modelSelect = document.createElement('select');
    modelSelect.id = 'model';
    modelSelect.style.cssText = this._getInputStyle();
    
    // Get models from PollinationsAPIService if available
    const models = this.scene.assetManager?.apiService?.getAvailableModels?.() || [
      { name: 'turbo', description: 'Fast generation, good for iteration (default)' },
      { name: 'flux', description: 'Balanced quality and speed' },
      { name: 'flux-realism', description: 'Photorealistic style' },
      { name: 'flux-anime', description: 'Anime and manga style' },
      { name: 'flux-3d', description: '3D rendered style' }
    ];
    
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.name;
      option.textContent = `${model.name.charAt(0).toUpperCase() + model.name.slice(1)} - ${model.description}`;
      option.title = model.description;
      modelSelect.appendChild(option);
    });
    
    modelGroup.appendChild(modelSelect);
    form.appendChild(modelGroup);

    // Image size inputs
    const sizeGroup = this._createFormGroup('Image Size', 'Width and height in pixels (16-1024)');
    const sizeContainer = document.createElement('div');
    sizeContainer.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;
    
    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.id = 'image-width';
    widthInput.value = '64';
    widthInput.min = '16';
    widthInput.max = '1024';
    widthInput.placeholder = 'Width';
    widthInput.style.cssText = this._getInputStyle();
    widthInput.style.width = '100px';
    
    const xLabel = document.createElement('span');
    xLabel.textContent = '×';
    xLabel.style.color = '#888';
    
    const heightInput = document.createElement('input');
    heightInput.type = 'number';
    heightInput.id = 'image-height';
    heightInput.value = '64';
    heightInput.min = '16';
    heightInput.max = '1024';
    heightInput.placeholder = 'Height';
    heightInput.style.cssText = this._getInputStyle();
    heightInput.style.width = '100px';
    
    sizeContainer.appendChild(widthInput);
    sizeContainer.appendChild(xLabel);
    sizeContainer.appendChild(heightInput);
    sizeGroup.appendChild(sizeContainer);
    form.appendChild(sizeGroup);

    // Seed input (optional)
    const seedGroup = this._createFormGroup('Seed (Optional)', 'Use a seed for reproducible generations');
    const seedInput = document.createElement('input');
    seedInput.type = 'number';
    seedInput.id = 'seed';
    seedInput.placeholder = 'Leave empty for random';
    seedInput.style.cssText = this._getInputStyle();
    seedGroup.appendChild(seedInput);
    form.appendChild(seedGroup);

    // Transparent background checkbox
    const transparentGroup = this._createFormGroup('Background', 'Remove background from generated image');
    const transparentContainer = document.createElement('div');
    transparentContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    
    const transparentCheckbox = document.createElement('input');
    transparentCheckbox.type = 'checkbox';
    transparentCheckbox.id = 'transparent-bg';
    transparentCheckbox.checked = true;
    transparentCheckbox.style.cssText = `
      width: 20px;
      height: 20px;
      cursor: pointer;
    `;
    
    const transparentLabel = document.createElement('label');
    transparentLabel.htmlFor = 'transparent-bg';
    transparentLabel.textContent = 'Generate with transparent background';
    transparentLabel.style.cssText = `
      color: #ccc;
      cursor: pointer;
      font-size: 14px;
    `;
    
    transparentContainer.appendChild(transparentCheckbox);
    transparentContainer.appendChild(transparentLabel);
    transparentGroup.appendChild(transparentContainer);
    form.appendChild(transparentGroup);

    // Buttons
    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 10px;
    `;

    const generateBtn = this._createButton('Generate', 'Generate asset');
    generateBtn.type = 'submit';
    const cancelBtn = this._createButton('Cancel', 'Cancel');
    
    generateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!descInput.value.trim()) {
        this.showErrorModal('Please enter an asset description');
        return;
      }
      
      const width = parseInt(widthInput.value);
      const height = parseInt(heightInput.value);
      
      if (isNaN(width) || width < 16 || width > 1024) {
        this.showErrorModal('Width must be between 16 and 1024 pixels');
        return;
      }
      
      if (isNaN(height) || height < 16 || height > 1024) {
        this.showErrorModal('Height must be between 16 and 1024 pixels');
        return;
      }
      
      // Build description
      let description = descInput.value.trim();
      
      // Ensure all descriptions include "retro game style pixel art" for consistent style
      if (!description.toLowerCase().includes('pixel art')) {
        description = `retro game style pixel art ${description}`;
      }
      
      // Check if background removal is requested
      const transparentBg = document.getElementById('transparent-bg').checked;
      
      // Add transparent background instruction to prompt as well
      if (transparentBg && 
          !description.toLowerCase().includes('transparent') && 
          !description.toLowerCase().includes('no background')) {
        description = `${description}, transparent background, no background`;
      }
      
      const params = {
        description: description,
        category: 'object', // Default category for all assets
        model: modelSelect.value,
        imageSize: { width, height },
        seed: seedInput.value ? parseInt(seedInput.value) : null,
        removeBackground: transparentBg
      };
      
      this.scene.events.emit('generate-asset', params, (success, error) => {
        if (success) {
          this.hideAllModals();
        } else if (error) {
          this.showErrorModal(error);
        }
      });
    });
    
    cancelBtn.addEventListener('click', () => this.hideAllModals());

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(generateBtn);
    form.appendChild(buttonRow);

    modal.content.appendChild(form);
    this.activeModals.push(modal.backdrop);
  }


  /**
   * Task 3.3: Show library modal
   */
  showLibraryModal(assets) {
    // Close any existing modals first
    this.hideAllModals();
    
    const modal = this._createModal('Asset Library');
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 20px;
      max-height: 500px;
      overflow-y: auto;
    `;

    if (!assets || assets.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #888;">
          <p style="font-size: 18px; margin-bottom: 10px;">No assets yet</p>
          <p>Generate your first asset to get started!</p>
        </div>
      `;
    } else {
      const grid = document.createElement('div');
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
      `;

      assets.forEach(asset => {
        const card = document.createElement('div');
        card.style.cssText = `
          background: #2a2a2a;
          border: 2px solid #4a4a4a;
          border-radius: 8px;
          padding: 10px;
          position: relative;
          transition: all 0.2s;
        `;
        card.addEventListener('mouseenter', () => {
          card.style.borderColor = '#87ceeb';
          card.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.borderColor = '#4a4a4a';
          card.style.transform = 'translateY(0)';
        });

        // Build metadata display
        let metadataHTML = `<div style="color: #87ceeb; font-size: 10px;">${asset.category || 'object'}</div>`;
        
        // Add model info if available
        if (asset.generationParams?.model) {
          metadataHTML += `<div style="color: #888; font-size: 9px;">Model: ${asset.generationParams.model}</div>`;
        }
        
        // Add seed info if available
        if (asset.generationParams?.seed) {
          metadataHTML += `<div style="color: #888; font-size: 9px;">Seed: ${asset.generationParams.seed}</div>`;
        }

        card.innerHTML = `
          <div style="width: 100%; aspect-ratio: 1; background: #1a1a1a; border-radius: 4px; margin-bottom: 8px; cursor: pointer;"></div>
          <div style="color: #fff; font-size: 12px; margin-bottom: 4px;">${asset.name || 'Asset'}</div>
          ${metadataHTML}
          <button class="delete-asset-btn" style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
            transition: opacity 0.2s;
          " title="Delete asset">×</button>
        `;

        // Click on card to place asset
        const imageArea = card.querySelector('div');
        imageArea.addEventListener('click', () => {
          this.scene.events.emit('place-asset', asset);
          this.hideAllModals();
        });

        // Delete button
        const deleteBtn = card.querySelector('.delete-asset-btn');
        deleteBtn.addEventListener('mouseenter', () => {
          deleteBtn.style.opacity = '1';
        });
        deleteBtn.addEventListener('mouseleave', () => {
          deleteBtn.style.opacity = '0.8';
        });
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${asset.name}"?`)) {
            this.scene.events.emit('delete-asset', asset.id);
          }
        });

        grid.appendChild(card);
      });

      content.appendChild(grid);
    }

    modal.content.appendChild(content);
    this.activeModals.push(modal.backdrop);
  }


  /**
   * Task 3.4: Show settings modal
   * Updated for Pollinations integration - API token section removed
   */
  showSettingsModal() {
    // Close any existing modals first
    this.hideAllModals();
    
    const modal = this._createModal('Settings');
    
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
    `;

    // Keyboard shortcuts reference
    const shortcutsSection = document.createElement('div');
    shortcutsSection.style.cssText = `
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      border: 1px solid #4a4a4a;
    `;
    shortcutsSection.innerHTML = `
      <h3 style="color: #87ceeb; margin: 0 0 10px 0; font-size: 14px;">Keyboard Shortcuts</h3>
      <div style="color: #ccc; font-size: 12px; line-height: 1.8;">
        <div><strong>G:</strong> Open Asset Generator</div>
        <div><strong>L:</strong> Open Asset Library</div>
        <div><strong>Q / E:</strong> Rotate Selected Asset Left / Right</div>
        <div><strong>ESC:</strong> Close Modals / Deselect</div>
        <div><strong>Delete:</strong> Remove Selected Asset</div>
        <div><strong>Ctrl+S:</strong> Save World</div>
        <div><strong>Ctrl+E:</strong> Export World</div>
      </div>
    `;
    content.appendChild(shortcutsSection);

    // About section
    const aboutSection = document.createElement('div');
    aboutSection.style.cssText = `
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      border: 1px solid #4a4a4a;
    `;
    aboutSection.innerHTML = `
      <h3 style="color: #87ceeb; margin: 0 0 10px 0; font-size: 14px;">About</h3>
      <div style="color: #ccc; font-size: 12px; line-height: 1.6;">
        <p style="margin: 0 0 8px 0;">AI Sandbox Builder uses Pollinations.ai for free, open-source image generation.</p>
        <p style="margin: 0; color: #888;">No API tokens or authentication required!</p>
      </div>
    `;
    content.appendChild(aboutSection);

    // Buttons
    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 10px;
    `;

    const closeBtn = this._createButton('Close', 'Close settings');
    closeBtn.addEventListener('click', () => this.hideAllModals());

    buttonRow.appendChild(closeBtn);
    content.appendChild(buttonRow);

    modal.content.appendChild(content);
    this.activeModals.push(modal.backdrop);
  }


  /**
   * Show help modal
   */
  showHelpModal() {
    // Close any existing modals first
    this.hideAllModals();
    
    const modal = this._createModal('Help & Guide');
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 20px;
      color: #ccc;
      line-height: 1.6;
      max-height: 500px;
      overflow-y: auto;
    `;

    content.innerHTML = `
      <h3 style="color: #87ceeb; margin-top: 0;">Welcome to AI Sandbox Builder!</h3>
      <p>Create your own pixel art world with AI-generated assets powered by Pollinations.ai - completely free!</p>
      
      <h4 style="color: #ffd700; margin-top: 20px;">Getting Started</h4>
      <ol style="padding-left: 20px;">
        <li>Press <strong>G</strong> to generate a new asset</li>
        <li>Describe what you want to create</li>
        <li>Choose an AI model for different styles</li>
        <li>Click on the asset in your library to place it</li>
        <li>Move, rotate, and scale placed assets</li>
        <li>Save your world with <strong>Ctrl+S</strong></li>
      </ol>
      
      <h4 style="color: #ffd700; margin-top: 20px;">AI Models</h4>
      <ul style="padding-left: 20px;">
        <li><strong>Turbo:</strong> Fast generation, great for quick iterations (default)</li>
        <li><strong>Flux:</strong> Balanced quality and speed</li>
        <li><strong>Flux-Realism:</strong> Photorealistic style</li>
        <li><strong>Flux-Anime:</strong> Anime and manga style</li>
        <li><strong>Flux-3D:</strong> 3D rendered style</li>
      </ul>
      
      <h4 style="color: #ffd700; margin-top: 20px;">Seeds</h4>
      <p>Use a seed number to reproduce the same image. Same seed + same prompt = same result!</p>
      <p>Leave the seed field empty for random generation each time.</p>
      
      <h4 style="color: #ffd700; margin-top: 20px;">Pro Tips</h4>
      <ul style="padding-left: 20px;">
        <li>Be specific in your descriptions for better results</li>
        <li>Try different models to find the style you like</li>
        <li>Use the category selector to get appropriate styles</li>
        <li>Right-click or press ESC to cancel placement mode</li>
        <li>Double-click the player to center the camera</li>
      </ul>
      
      <h4 style="color: #ffd700; margin-top: 20px;">Note</h4>
      <p style="color: #ff9999;">Animations are not currently supported. Only static images can be generated.</p>
    `;

    modal.content.appendChild(content);
    this.activeModals.push(modal.backdrop);
  }

  /**
   * Task 3.5: Show error modal
   */
  showErrorModal(message) {
    const modal = this._createModal('Error');
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 20px;
      text-align: center;
    `;

    content.innerHTML = `
      <div style="font-size: 48px; color: #ff6b6b; animation: shake 0.5s;">&#9888;</div>
      <p style="color: #fff; margin: 20px 0; font-size: 14px;">${message}</p>
    `;

    const okBtn = this._createButton('OK', 'Close');
    okBtn.style.margin = '0 auto';
    okBtn.addEventListener('click', () => this.hideAllModals());
    content.appendChild(okBtn);

    modal.content.appendChild(content);
    this.activeModals.push(modal.backdrop);
  }

  /**
   * Task 3.5: Show loading modal
   */
  showLoadingModal(message) {
    const modal = this._createModal('Loading', false); // No close on backdrop click
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 40px;
      text-align: center;
    `;

    content.innerHTML = `
      <div style="width: 50px; height: 50px; border: 4px solid #4a4a4a; border-top-color: #87ceeb; border-radius: 50%; margin: 0 auto 20px; animation: spin 1s linear infinite;"></div>
      <p style="color: #fff; font-size: 14px;">${message || 'Loading...'}</p>
    `;

    modal.content.appendChild(content);
    modal.backdrop.setAttribute('data-loading', 'true');
    this.activeModals.push(modal.backdrop);
  }

  /**
   * Task 3.5: Hide loading modal
   */
  hideLoadingModal() {
    const loadingModal = this.activeModals.find(m => m.getAttribute('data-loading') === 'true');
    if (loadingModal && loadingModal.parentNode) {
      loadingModal.parentNode.removeChild(loadingModal);
      this.activeModals = this.activeModals.filter(m => m !== loadingModal);
    }
  }

  /**
   * Task 3.5: Hide all modals
   */
  hideAllModals() {
    this.activeModals.forEach(modal => {
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
    this.activeModals = [];
    
    // Notify that modals are closed
    if (this.scene && this.scene.events) {
      this.scene.events.emit('modals-closed');
    }
  }
  
  /**
   * Check if any modal is currently open
   */
  isModalOpen() {
    return this.activeModals.length > 0;
  }


  /**
   * Task 3.6: Show tooltip
   */
  showTooltip(text, x, y) {
    this.hideTooltip();
    
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `
      position: fixed;
      left: ${x + 10}px;
      top: ${y + 10}px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #87ceeb;
      border-radius: 4px;
      color: #fff;
      font-size: 12px;
      pointer-events: none;
      z-index: 2000;
      animation: fadeIn 0.2s;
      max-width: 200px;
    `;
    this.tooltip.textContent = text;
    
    // Adjust position if tooltip goes off screen
    document.body.appendChild(this.tooltip);
    const rect = this.tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.tooltip.style.left = `${x - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.tooltip.style.top = `${y - rect.height - 10}px`;
    }
  }

  /**
   * Task 3.6: Hide tooltip
   */
  hideTooltip() {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
      this.tooltip = null;
    }
  }

  /**
   * Helper: Create modal structure
   * @private
   */
  _createModal(title, closeOnBackdrop = true) {
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1100;
      animation: fadeIn 0.2s;
      pointer-events: auto;
    `;

    if (closeOnBackdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.hideAllModals();
        }
      });
    }
    
    // Stop keyboard events from propagating to the game
    backdrop.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });
    backdrop.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });
    backdrop.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a1a;
      border: 2px solid #4a4a4a;
      border-radius: 8px;
      min-width: 400px;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 15px 20px;
      background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
      border-bottom: 2px solid #4a4a4a;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin: 0;
      color: #ffffff;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u00D7';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    `;
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'none';
    });
    closeBtn.addEventListener('click', () => this.hideAllModals());

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const content = document.createElement('div');
    content.className = 'ui-modal-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      color: #ffffff;
    `;

    modal.appendChild(header);
    modal.appendChild(content);
    backdrop.appendChild(modal);
    this.container.appendChild(backdrop);

    return { backdrop, modal, content };
  }


  /**
   * Helper: Create form group
   * @private
   */
  _createFormGroup(label, description) {
    const group = document.createElement('div');
    group.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 5px;
    `;

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: #87ceeb;
      font-size: 14px;
      font-weight: bold;
    `;

    if (description) {
      const desc = document.createElement('div');
      desc.textContent = description;
      desc.style.cssText = `
        color: #888;
        font-size: 11px;
        margin-top: -3px;
      `;
      group.appendChild(labelEl);
      group.appendChild(desc);
    } else {
      group.appendChild(labelEl);
    }

    return group;
  }

  /**
   * Helper: Get input style
   * @private
   */
  _getInputStyle() {
    return `
      width: 100%;
      padding: 8px;
      background: #2a2a2a;
      border: 1px solid #4a4a4a;
      border-radius: 4px;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    `;
  }

  /**
   * Helper: Create button
   * @private
   */
  _createButton(label, title) {
    const button = document.createElement('button');
    button.textContent = label;
    button.title = title;
    button.style.cssText = `
      padding: 8px 16px;
      background: linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%);
      border: 2px solid #5a5a5a;
      border-radius: 4px;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'linear-gradient(180deg, #5a5a5a 0%, #4a4a4a 100%)';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
    });

    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
    });

    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
    });

    return button;
  }

  /**
   * Clean up UI elements
   */
  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#00aa00' : type === 'warning' ? '#ffd700' : type === 'error' ? '#ff6b6b' : '#87ceeb'};
      color: #fff;
      border-radius: 4px;
      font-size: 14px;
      z-index: 2000;
      animation: fadeIn 0.3s;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
      pointer-events: auto;
      max-width: 300px;
    `;
    toast.textContent = message;
    this.container.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, duration);
  }

  /**
   * Show success modal
   */
  showSuccessModal(message) {
    const modal = this._createModal('Success');
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 20px;
      text-align: center;
    `;

    content.innerHTML = `
      <div style="font-size: 48px; color: #00aa00;">&#10004;</div>
      <p style="color: #fff; margin: 20px 0; font-size: 14px;">${message}</p>
    `;

    const okBtn = this._createButton('OK', 'Close');
    okBtn.style.margin = '0 auto';
    okBtn.addEventListener('click', () => this.hideAllModals());
    content.appendChild(okBtn);

    modal.content.appendChild(content);
    this.activeModals.push(modal.backdrop);
  }

  /**
   * Clean up UI elements
   */
  destroy() {
    this.hideAllModals();
    this.hideTooltip();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
