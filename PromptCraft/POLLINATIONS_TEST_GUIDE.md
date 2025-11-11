# Pollinations Integration Test Guide

This document provides comprehensive testing instructions for validating the Pollinations integration implementation.

## Test Files

- **test-pollinations-generation.html** - Automated tests for generation, seeds, errors, and performance
- **test-pollinations-ui-validation.html** - Manual UI validation and backward compatibility checks
- **test-pollinations-ui.html** - Original UI integration test (existing)

## Quick Start

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open test files in browser:
   - http://localhost:3000/test-pollinations-generation.html
   - http://localhost:3000/test-pollinations-ui-validation.html

## Test 8.1: Basic Generation Functionality

### Automated Tests (test-pollinations-generation.html)

**Test Default Generation:**
- Click "Test Default Generation (Turbo)"
- Verify image generates successfully
- Verify generation time is reasonable (5-15 seconds typical)
- Verify metadata shows model="turbo"
- Verify image displays correctly

**Test All Models:**
- Click "Test All Models"
- Verify all 5 models generate images:
  - turbo (fast, default)
  - flux (balanced)
  - flux-realism (photorealistic)
  - flux-anime (anime style)
  - flux-3d (3D rendered)
- Verify each model completes within timeout (30s)
- Verify metadata is correct for each

**Expected Results:**
- ✅ All generations complete successfully
- ✅ Images display with correct metadata
- ✅ Generation times: 5-15 seconds typical, max 30 seconds
- ✅ No console errors

## Test 8.2: Seed Reproducibility

### Automated Tests (test-pollinations-generation.html)

**Test Seed Reproducibility:**
- Enter a seed value (e.g., 12345)
- Click "Test Seed Reproducibility"
- System generates same image twice with same seed
- Compare the two images

**Test Random Generation:**
- Click "Test Random (No Seed)"
- Verify generation works without seed
- Verify seed is null or random in metadata

**Expected Results:**
- ✅ Same seed produces identical images (or very similar)*
- ✅ Random generation works without seed
- ✅ Seed values are stored in metadata

*Note: Pollinations may not guarantee 100% reproducibility due to server-side factors. Some variation is acceptable.

## Test 8.3: Error Handling

### Automated Tests (test-pollinations-generation.html)

**Test Invalid Parameters:**
- Click "Test Invalid Parameters"
- Verifies system rejects:
  - Empty descriptions
  - Invalid sizes (< 16px or > 1024px)
  - Other malformed inputs

**Test Timeout:**
- Click "Test Timeout (30s)"
- Reads instructions for manual timeout testing
- Requires waiting 30+ seconds to verify timeout

**Test Retry Logic:**
- Click "Test Retry Logic"
- Reads instructions for manual network testing
- Requires disconnecting internet to test retries

**Manual Network Tests:**

1. **Simulate Network Failure:**
   - Disconnect internet
   - Try to generate an image
   - Verify retry logic activates (3 attempts)
   - Verify exponential backoff (1s, 2s, 4s delays)
   - Verify user-friendly error message

2. **Simulate Timeout:**
   - Use slow network or wait for overloaded service
   - Verify 30-second timeout triggers
   - Verify appropriate error message
   - Verify retry option available

**Expected Results:**
- ✅ Invalid parameters are rejected with clear messages
- ✅ Network errors trigger retry logic
- ✅ Timeouts are handled gracefully
- ✅ Error messages are user-friendly
- ✅ No crashes or unhandled exceptions

## Test 8.4: Backward Compatibility

### Manual Tests (test-pollinations-ui-validation.html)

**Prerequisites:**
- Have an existing world with Pixellab-generated assets
- Or create test data with old asset format

**Test Steps:**

1. **Load Existing World:**
   - Open game: http://localhost:3000
   - Load world with Pixellab assets
   - Check console for errors (F12)
   - Verify all assets display correctly
   - Verify asset metadata is preserved

2. **Mixed Asset Library:**
   - Generate new Pollinations assets
   - Verify old Pixellab assets still in library
   - Place both types in world
   - Verify both work correctly
   - Check metadata for both types

3. **Export/Import:**
   - Create world with mixed assets
   - Export to JSON
   - Clear localStorage
   - Import JSON file
   - Verify all assets restored

4. **Stability Check:**
   - Monitor console for errors
   - Test all game features
   - Verify no crashes
   - Verify smooth operation

**Expected Results:**
- ✅ Old Pixellab assets load and display correctly
- ✅ Mixed asset libraries work seamlessly
- ✅ Export/import preserves all data
- ✅ No errors or crashes
- ✅ Backward compatibility maintained

## Test 8.5: UI Changes Validation

### Manual Tests (test-pollinations-ui-validation.html)

**Generation Modal:**
1. Open game and click "Generate Asset"
2. Verify present:
   - Description input
   - Image size inputs (width/height)
   - Category selector
   - Model selector dropdown
   - Seed input (optional)
3. Verify absent:
   - API token status
   - Credit display
   - Pixellab parameters (outline, shading, detail, view, direction, textGuidanceScale)
   - Animation toggle
   - Animation parameters (action, nFrames)

**Model Selector:**
1. Locate model dropdown
2. Verify default is "turbo"
3. Verify all models available:
   - turbo - Fast generation (default)
   - flux - Balanced quality and speed
   - flux-realism - Photorealistic style
   - flux-anime - Anime and manga style
   - flux-3d - 3D rendered style
4. Verify tooltips/descriptions
5. Select different model and generate
6. Verify correct model used

**Seed Input:**
1. Locate seed input field
2. Verify accepts numbers
3. Verify can be left empty
4. Verify tooltip explains reproducibility
5. Generate with seed
6. Verify seed in asset metadata
7. Verify seed displays in library

**No Credit Displays:**
1. Check HUD - no credit counter
2. Check HUD - no generation counter
3. Check generation modal - no cost display
4. Check settings - no balance display
5. Generate asset - no credit deduction message

**No API Token Prompts:**
1. Clear localStorage (fresh start)
2. Open game
3. Verify no token prompt on startup
4. Open settings
5. Verify no token input field
6. Verify no token validation UI
7. Generate asset - no authentication required

**Help Documentation:**
1. Open help/documentation
2. Verify mentions "Pollinations" (not "Pixellab")
3. Verify model descriptions present
4. Verify seed usage explained
5. Verify animation note: "not currently supported"
6. Verify no references to tokens/credits

**Expected Results:**
- ✅ Generation modal simplified correctly
- ✅ Model selector works properly
- ✅ Seed input functions correctly
- ✅ All credit displays removed
- ✅ All API token UI removed
- ✅ Help documentation updated

## Test 8.6: Performance

### Automated Tests (test-pollinations-generation.html)

**Test Performance:**
1. Select image size (32, 64, 128, 256, 512)
2. Click "Test Performance"
3. Verify generation completes
4. Check generation time
5. Verify within 30-second timeout

**Test Multiple Sizes:**
1. Click "Test Multiple Sizes"
2. Tests 32x32, 64x64, 128x128, 256x256
3. Compares performance across sizes
4. Verifies all complete successfully

**Performance Expectations:**
- Small images (32-64px): 5-10 seconds
- Medium images (128-256px): 10-15 seconds
- Large images (512px): 15-30 seconds
- Maximum timeout: 30 seconds
- UI remains responsive during generation

**Expected Results:**
- ✅ All sizes generate within timeout
- ✅ Performance is acceptable
- ✅ UI stays responsive
- ✅ No memory leaks
- ✅ No performance degradation

## Automated Code Checks

### Run Code Checks (test-pollinations-ui-validation.html)

Click "Run Code Checks" to verify:
- ✅ PollinationsAPIService exists
- ✅ All required methods present
- ✅ All models defined
- ✅ Default model is "turbo"

## Test Execution Checklist

### Automated Tests
- [ ] 8.1 - Test default generation
- [ ] 8.1 - Test all models
- [ ] 8.2 - Test seed reproducibility
- [ ] 8.2 - Test random generation
- [ ] 8.3 - Test invalid parameters
- [ ] 8.6 - Test performance
- [ ] 8.6 - Test multiple sizes
- [ ] Code checks pass

### Manual Tests
- [ ] 8.3 - Test network failure (disconnect internet)
- [ ] 8.3 - Test timeout (30+ seconds)
- [ ] 8.4 - Load existing world with old assets
- [ ] 8.4 - Test mixed asset library
- [ ] 8.4 - Test export/import compatibility
- [ ] 8.4 - Verify no crashes/errors
- [ ] 8.5 - Verify generation modal parameters
- [ ] 8.5 - Verify model selector works
- [ ] 8.5 - Verify seed input works
- [ ] 8.5 - Verify no credit displays
- [ ] 8.5 - Verify no API token prompts
- [ ] 8.5 - Verify help documentation updated

## Troubleshooting

### Generation Fails
- Check internet connection
- Check browser console for errors
- Verify Pollinations service is available
- Try different model or smaller image size

### Timeout Issues
- Pollinations may be experiencing high load
- Try again in a few minutes
- Use "turbo" model for faster generation
- Reduce image size

### UI Issues
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check console for JavaScript errors
- Verify all files are up to date

### Backward Compatibility Issues
- Check asset metadata structure
- Verify StorageService handles old format
- Check console for migration errors
- Test with fresh localStorage

## Success Criteria

All tests pass when:
- ✅ All automated tests complete successfully
- ✅ All manual tests verify correctly
- ✅ No console errors during testing
- ✅ Performance meets expectations
- ✅ UI changes are correct
- ✅ Backward compatibility maintained
- ✅ Error handling works properly
- ✅ Seed reproducibility functions

## Reporting Issues

If tests fail, document:
1. Test number and name
2. Expected behavior
3. Actual behavior
4. Console errors (if any)
5. Steps to reproduce
6. Browser and version
7. Screenshots (if applicable)

## Next Steps

After all tests pass:
1. Mark task 8 as complete
2. Document any issues found
3. Create bug reports if needed
4. Proceed to production deployment
5. Monitor for issues in production
