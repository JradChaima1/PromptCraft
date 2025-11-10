# Task 6.3: Export/Import UI - Integration Example

## Overview
This document provides an example of how to integrate the export/import UI functionality into a game scene.

## Files Modified
- `src/managers/UIManager.js` - Added `showSuccessModal()` and `_handleImportWorld()` methods

## New Methods Added

### 1. showSuccessModal(message)
Displays a success modal with:
- ✅ Green checkmark icon with pulse animation
- Green success message text
- OK button to close
- Auto-closes after 3 seconds

### 2. _handleImportWorld()
Handles import button click with:
- Confirmation dialog warning about overwriting
- Reminder to export current world first
- Only proceeds if user confirms
- Emits 'import-world' event after confirmation

## Integration Example

Here's how to wire up the export/import functionality in your game scene:

```javascript
// In GameScene.create() or similar initialization method

// Assuming you have these managers initialized:
// - this.worldManager (WorldManager instance)
// - this.assetManager (AssetManager instance)
// - this.storageService (StorageService instance)
// - this.uiManager (UIManager instance)

// Export World Event Handler
this.events.on('export-world', () => {
  try {
    console.log('Exporting world...');
    
    // Get world data from WorldManager
    const worldData = this.worldManager.exportWorld(this.assetManager);
    
    // Trigger file download
    const success = this.storageService.exportToFile(worldData);
    
    if (success) {
      // Show success message
      this.uiManager.showSuccessModal('World exported successfully!');
      console.log('World exported successfully');
    } else {
      throw new Error('Export failed');
    }
  } catch (error) {
    console.error('Export error:', error);
    this.uiManager.showErrorModal('Failed to export world: ' + error.message);
  }
});

// Import World Event Handler
this.events.on('import-world', async () => {
  try {
    console.log('Importing world...');
    
    // Show loading modal
    this.uiManager.showLoadingModal('Importing world...');
    
    // Open file picker and get world data
    const worldData = await this.storageService.importFromFile();
    
    // Import world data
    await this.worldManager.importWorld(worldData, this.assetManager);
    
    // Hide loading modal
    this.uiManager.hideLoadingModal();
    
    // Show success message
    this.uiManager.showSuccessModal('World imported successfully!');
    console.log('World imported successfully');
    
    // Optional: Update UI to reflect new world state
    this.uiManager.updateAssetCountDisplay(this.worldManager.placedAssets.length);
    
  } catch (error) {
    console.error('Import error:', error);
    this.uiManager.hideLoadingModal();
    
    // Show appropriate error message
    let errorMessage = 'Failed to import world';
    if (error.message.includes('No file selected')) {
      // User cancelled file picker, don't show error
      return;
    } else if (error.message.includes('Invalid JSON')) {
      errorMessage = 'Invalid world file format';
    } else {
      errorMessage = 'Failed to import world: ' + error.message;
    }
    
    this.uiManager.showErrorModal(errorMessage);
  }
});
```

## User Flow

### Export Flow
1. User clicks Settings button (⚙️) in toolbar
2. Settings modal opens
3. User scrolls to "World Management" section
4. User clicks "📤 Export World" button
5. Event 'export-world' is emitted
6. Scene handler:
   - Calls `worldManager.exportWorld(assetManager)`
   - Calls `storageService.exportToFile(worldData)`
   - Shows success modal
7. Browser downloads file: `world_2025-11-09_14-30-45.json`
8. Success modal auto-closes after 3 seconds

### Import Flow
1. User clicks Settings button (⚙️) in toolbar
2. Settings modal opens
3. User scrolls to "World Management" section
4. User clicks "📥 Import World" button
5. Confirmation dialog appears:
   ```
   Import World?
   
   This will replace your current world with the imported one.
   All current placed assets will be removed.
   
   ⚠️ Make sure to export your current world first if you want to keep it!
   
   Are you sure you want to continue?
   ```
6. If user clicks Cancel: Process stops
7. If user clicks OK:
   - Event 'import-world' is emitted
   - Loading modal appears
   - File picker opens (restricted to .json files)
   - User selects world file
   - Scene handler:
     - Calls `storageService.importFromFile()`
     - Calls `worldManager.importWorld(worldData, assetManager)`
     - Hides loading modal
     - Shows success modal
8. Success modal auto-closes after 3 seconds

## Error Handling

The implementation handles various error scenarios:

### Export Errors
- World serialization failure
- File download failure
- Storage quota exceeded

### Import Errors
- No file selected (user cancelled) - No error shown
- Invalid JSON file format
- Missing required fields in world data
- Invalid asset data
- Texture loading failures

## UI Components

### Success Modal
- **Icon:** ✅ (with pulse animation)
- **Title:** "Success"
- **Message:** Green text (#4ade80)
- **Button:** OK (closes modal)
- **Auto-close:** 3 seconds
- **Class:** 'success-modal'

### Confirmation Dialog
- **Type:** Native browser confirm dialog
- **Message:** Multi-line warning with emoji
- **Buttons:** OK / Cancel
- **Behavior:** Only proceeds on OK

### Error Modal (Existing)
- **Icon:** ⚠️ (with shake animation)
- **Title:** "Error"
- **Message:** Red text (#ff6b6b)
- **Button:** OK (closes modal)
- **Class:** 'error-modal'

### Loading Modal (Existing)
- **Icon:** Spinning circle
- **Title:** None
- **Message:** "Importing world..."
- **Behavior:** Blocks interaction until hidden

## Testing

To test the implementation:

1. **Test Export:**
   ```javascript
   // Manually trigger export
   scene.events.emit('export-world');
   ```

2. **Test Import:**
   ```javascript
   // Manually trigger import
   scene.events.emit('import-world');
   ```

3. **Test Success Modal:**
   ```javascript
   uiManager.showSuccessModal('Test success message!');
   ```

4. **Test Error Modal:**
   ```javascript
   uiManager.showErrorModal('Test error message!');
   ```

## Requirements Satisfied

✅ **Task 6.3 Requirements:**
- Add Export World button to settings modal
- Add Import World button to settings modal
- Implement file picker dialog for import
- Show success/error messages after export/import
- Add confirmation dialog before importing (warns about overwriting current world)

✅ **Design Document Requirements:**
- Requirement 14.3: File picker for import
- Requirement 14.4: Validate and deserialize world data
- Requirement 14.5: Handle import errors gracefully

## Next Steps

The export/import UI is now complete. To fully integrate:

1. Ensure WorldManager, AssetManager, and StorageService are initialized in your scene
2. Add the event handlers shown above to your scene's create() method
3. Test the complete flow with actual world data
4. Verify error handling with invalid files

## Notes

- The confirmation dialog uses native browser `confirm()` for simplicity and reliability
- Success modal auto-closes to reduce user clicks
- Error modal requires user acknowledgment
- File picker is restricted to .json files only
- Export filename includes timestamp to prevent overwrites
- Import validates world data structure before applying changes
