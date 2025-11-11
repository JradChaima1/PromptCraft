/**
 * Task 8.1 Verification Script
 * 
 * This script verifies that the PollinationsAPIService meets all requirements
 * for Task 8.1: Basic Generation Functionality
 */

import PollinationsAPIService from './src/services/PollinationsAPIService.js';

console.log('='.repeat(60));
console.log('Task 8.1: Basic Generation Functionality Verification');
console.log('='.repeat(60));
console.log('');

// Initialize service
const service = new PollinationsAPIService();
let testsPassed = 0;
let testsFailed = 0;

// Helper function to log test results
function logTest(testName, passed, message = '') {
  if (passed) {
    console.log(`✅ ${testName}`);
    if (message) console.log(`   ${message}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}`);
    if (message) console.log(`   ${message}`);
    testsFailed++;
  }
}

// Test 1: Service instantiation
console.log('Test 1: Service Instantiation');
console.log('-'.repeat(60));
try {
  logTest('Service instantiates correctly', service !== null);
  logTest('Service has baseURL', service.baseURL === 'https://image.pollinations.ai/prompt/');
  logTest('Service has defaultModel', service.defaultModel === 'turbo');
  logTest('Service has availableModels', Array.isArray(service.availableModels));
} catch (error) {
  logTest('Service instantiation', false, error.message);
}
console.log('');

// Test 2: Required methods exist
console.log('Test 2: Required Methods');
console.log('-'.repeat(60));
const requiredMethods = [
  'generateImage',
  'buildPollinationsURL',
  'fetchImageFromURL',
  'getAvailableModels',
  'getDefaultModel',
  'handleAPIError'
];

requiredMethods.forEach(method => {
  logTest(`Method "${method}" exists`, typeof service[method] === 'function');
});
console.log('');

// Test 3: Model configuration
console.log('Test 3: Model Configuration');
console.log('-'.repeat(60));
const models = service.getAvailableModels();
const expectedModels = ['turbo', 'flux', 'flux-realism', 'flux-anime', 'flux-3d'];

logTest('getAvailableModels returns array', Array.isArray(models));
logTest('Has correct number of models', models.length === 5);

expectedModels.forEach(modelName => {
  const found = models.find(m => m.name === modelName);
  logTest(`Model "${modelName}" is available`, !!found);
  if (found) {
    logTest(`  Model "${modelName}" has description`, !!found.description);
  }
});

const defaultModel = service.getDefaultModel();
logTest('getDefaultModel returns "turbo"', defaultModel === 'turbo');
console.log('');

// Test 4: URL construction
console.log('Test 4: URL Construction');
console.log('-'.repeat(60));
try {
  const url = service.buildPollinationsURL({
    description: 'a pixel art tree',
    width: 64,
    height: 64,
    model: 'turbo',
    seed: 12345,
    nologo: true
  });
  
  logTest('buildPollinationsURL returns string', typeof url === 'string');
  logTest('URL starts with base URL', url.startsWith('https://image.pollinations.ai/prompt/'));
  logTest('URL contains encoded description', url.includes('pixel%20art%20tree'));
  logTest('URL contains width parameter', url.includes('width=64'));
  logTest('URL contains height parameter', url.includes('height=64'));
  logTest('URL contains model parameter', url.includes('model=turbo'));
  logTest('URL contains seed parameter', url.includes('seed=12345'));
  logTest('URL contains nologo parameter', url.includes('nologo=true'));
  
  console.log(`   Generated URL: ${url}`);
} catch (error) {
  logTest('URL construction', false, error.message);
}
console.log('');

// Test 5: URL construction with special characters
console.log('Test 5: URL Encoding');
console.log('-'.repeat(60));
try {
  const url = service.buildPollinationsURL({
    description: 'a tree & house (pixel art)',
    width: 64,
    height: 64
  });
  
  const hasEncodedAmpersand = url.includes('%26');
  logTest('Ampersand (&) is encoded', hasEncodedAmpersand);
  logTest('Spaces are encoded', url.includes('%20'));
  logTest('URL is valid', url.startsWith('https://'));
  console.log(`   Encoded URL: ${url}`);
} catch (error) {
  logTest('URL encoding', false, error.message);
}
console.log('');

// Test 6: Parameter validation
console.log('Test 6: Parameter Validation');
console.log('-'.repeat(60));

// Test empty description
try {
  await service.generateImage({
    description: '',
    imageSize: { width: 64, height: 64 }
  });
  logTest('Empty description throws error', false);
} catch (error) {
  logTest('Empty description throws error', error.message.includes('Description is required'));
}

// Test invalid size (too small)
try {
  await service.generateImage({
    description: 'test',
    imageSize: { width: 8, height: 8 }
  });
  logTest('Invalid size (too small) throws error', false);
} catch (error) {
  logTest('Invalid size (too small) throws error', error.message.includes('between 16 and 1024'));
}

// Test invalid size (too large)
try {
  await service.generateImage({
    description: 'test',
    imageSize: { width: 2000, height: 2000 }
  });
  logTest('Invalid size (too large) throws error', false);
} catch (error) {
  logTest('Invalid size (too large) throws error', error.message.includes('between 16 and 1024'));
}

console.log('');

// Test 7: Error handling
console.log('Test 7: Error Handling');
console.log('-'.repeat(60));

const errorTests = [
  { error: new Error('RATE_LIMITED'), expected: 'Too many requests' },
  { error: new Error('TIMEOUT'), expected: 'timed out' },
  { error: new Error('NETWORK_ERROR'), expected: 'Network error' },
  { error: new Error('INVALID_PARAMS: Test'), expected: 'Test' },
  { error: new Error('503'), expected: 'temporarily unavailable' }
];

errorTests.forEach(({ error, expected }) => {
  const message = service.handleAPIError(error);
  logTest(`Error "${error.message}" handled correctly`, message.includes(expected));
  console.log(`   Message: ${message}`);
});

console.log('');

// Summary
console.log('='.repeat(60));
console.log('Test Summary');
console.log('='.repeat(60));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Pass Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('');

if (testsFailed === 0) {
  console.log('🎉 ALL TESTS PASSED! Task 8.1 requirements are met.');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Run the browser test: http://localhost:3000/test-task-8.1-basic-generation.html');
  console.log('2. Verify actual image generation works');
  console.log('3. Test all 5 models');
  console.log('4. Mark task 8.1 as complete');
} else {
  console.log('⚠️ SOME TESTS FAILED. Please review and fix issues.');
}

console.log('='.repeat(60));
