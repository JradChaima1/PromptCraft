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
    this.creditsDisplay = null;
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
      { label: 'Library', title: 'Open asset library (L)', action: () => this.showLibraryModal([]) },
      { label: 'Settings', title: 'Open settings', action: () => this.showSettingsModal({}) },
      { label: 'Help', title: 'Show help', action: () => this.showHelpModal() }
    ];

    buttons.forEach(btn => {
      const button = this._createButton(btn.label, btn.title);
      button.addEventListener('click', btn.action);
      leftSection.appendChild(button);
    });

    // Right section - credits display
    const rightSection = document.createElement('div');
    rightSection.style.cssText = `
      display: flex;
      gap: 15px;
      align-items: center;
      color: #ffffff;
      font-size: 14px;
    `;

    // Credits display
    this.creditsDisplay = document.createElement('div');
    this.creditsDisplay.id = 'credits-display';
    this.creditsDisplay.style.cssText = `
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid #ffd700;
      border-radius: 4px;
    `;
    this.creditsDisplay.innerHTML = `
      <span style="color: #ffd700;">&#128176;</span>
      <span id="credits-value">0</span> credits
      <span style="margin-left: 10px; color: #87ceeb;">&#9889;</span>
      <span id="generations-value">0</span> gens
    `;

    rightSection.appendChild(this.creditsDisplay);
    toolbar.appendChild(leftSection);
    toolbar.appendChild(rightSection);
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
   * Task 3.6: Update credits display
   */
  updateCreditsDisplay(credits, generations) {
    if (this.creditsDisplay) {
      const creditsValue = this.creditsDisplay.querySelector('#credits-value');
      const generationsValue = this.creditsDisplay.querySelector('#generations-value');
      if (creditsValue) creditsValue.textContent = credits;
      if (generationsValue) generationsValue.textContent = generations;
    }
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

    // Category selection
    const categoryGroup = this._createFormGroup('Category', 'Select asset category');
    const categorySelect = document.createElement('select');
    categorySelect.id = 'category';
    categorySelect.style.cssText = this._getInputStyle();
    ['character', 'object', 'terrain', 'decoration', 'building'].forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      categorySelect.appendChild(option);
    });
    categoryGroup.appendChild(categorySelect);
    form.appendChild(categoryGroup);

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
      const params = {
        description: descInput.value,
        category: categorySelect.value
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
          cursor: pointer;
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

        card.innerHTML = `
          <div style="width: 100%; aspect-ratio: 1; background: #1a1a1a; border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="color: #fff; font-size: 12px; margin-bottom: 4px;">${asset.name || 'Asset'}</div>
          <div style="color: #87ceeb; font-size: 10px;">${asset.category || 'object'}</div>
        `;

        card.addEventListener('click', () => {
          this.scene.events.emit('place-asset', asset);
          this.hideAllModals();
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
   */
  showSettingsModal(settings) {
    const modal = this._createModal('Settings');
    
    const form = document.createElement('form');
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
      padding: 20px;
    `;

    // API Token
    const tokenGroup = this._createFormGroup('API Token', 'Your Pixellab API token');
    const tokenInput = document.createElement('input');
    tokenInput.type = 'password';
    tokenInput.id = 'api-token';
    tokenInput.value = settings.apiToken || '';
    tokenInput.placeholder = 'Enter your API token';
    tokenInput.style.cssText = this._getInputStyle();
    tokenGroup.appendChild(tokenInput);
    form.appendChild(tokenGroup);

    // Keyboard shortcuts reference
    const shortcutsSection = document.createElement('div');
    shortcutsSection.style.cssText = `
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      margin-top: 10px;
    `;
    shortcutsSection.innerHTML = `
      <h3 style="color: #87ceeb; margin: 0 0 10px 0; font-size: 14px;">Keyboard Shortcuts</h3>
      <div style="color: #ccc; font-size: 12px; line-height: 1.8;">
        <div><strong>G:</strong> Open Asset Generator</div>
        <div><strong>L:</strong> Open Asset Library</div>
        <div><strong>ESC:</strong> Close Modals / Deselect</div>
        <div><strong>Delete:</strong> Remove Selected Asset</div>
        <div><strong>Ctrl+S:</strong> Save World</div>
        <div><strong>Ctrl+E:</strong> Export World</div>
      </div>
    `;
    form.appendChild(shortcutsSection);

    // Buttons
    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 10px;
    `;

    const saveBtn = this._createButton('Save', 'Save settings');
    const cancelBtn = this._createButton('Cancel', 'Cancel');
    
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.scene.events.emit('save-settings', {
        apiToken: tokenInput.value
      });
      this.hideAllModals();
    });
    
    cancelBtn.addEventListener('click', () => this.hideAllModals());

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(saveBtn);
    form.appendChild(buttonRow);

    modal.content.appendChild(form);
    this.activeModals.push(modal.backdrop);
  }


  /**
   * Show help modal
   */
  showHelpModal() {
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
      <p>Create your own pixel art world with AI-generated assets.</p>
      
      <h4 style="color: #ffd700; margin-top: 20px;">Getting Started</h4>
      <ol style="padding-left: 20px;">
        <li>Press <strong>G</strong> to generate a new asset</li>
        <li>Describe what you want to create</li>
        <li>Click on the asset in your library to place it</li>
        <li>Move, rotate, and scale placed assets</li>
        <li>Save your world with <strong>Ctrl+S</strong></li>
      </ol>
      
      <h4 style="color: #ffd700; margin-top: 20px;">Pro Tips</h4>
      <ul style="padding-left: 20px;">
        <li>Be specific in your descriptions for better results</li>
        <li>Use the category selector to get appropriate styles</li>
        <li>Right-click or press ESC to cancel placement mode</li>
        <li>Double-click the player to center the camera</li>
      </ul>
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
  destroy() {
    this.hideAllModals();
    this.hideTooltip();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
