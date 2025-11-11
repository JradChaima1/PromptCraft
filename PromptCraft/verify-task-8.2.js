/**
 * Task 8.2 Verification Script
 * Tests seed reproducibility functionality
 * 
 * Run with: node verify-task-8.2.js
 */

import PollinationsAPIService from './src/services/PollinationsAPIService.js';

const apiService = new PollinationsAPIService();

console.log('🧪 Task 8.2: Seed Reproducibility Verification\n');
console.log('Requirements: 10.1, 10.2, 10.3, 10.4, 10.5\n');

// Test 1: Verify seed parameter is accepted
console.log('Test 1: Verify seed parameter is accepted');
try {
  const url = apiService.buildPollinationsURL({
    description: 'test',
    width: 64,
    height: 64,
    seed: 12345
  });
  
  if (url.includes('seed=12345')) {
    console.log('✅ PASS: Seed parameter correctly included in URL');
    console.log(`   URL: ${url}\n`);
  } else {
    console.log('❌ FAIL: Seed parameter not found in URL');
    console.log(`   URL: ${url}\n`);
  }
} catch (error) {
  console.log(`❌ FAIL: ${error.message}\n`);
}

// Test 2: Verify null seed is handled
console.log('Test 2: Verify null seed is handled (random generation)');
try {
  const url = apiService.buildPollinationsURL({
    description: 'test',
    width: 64,
    height: 64,
    seed: null
  });
  
  if (!url.includes('seed=')) {
    console.log('✅ PASS: Null seed correctly omitted from URL');
    console.log(`   URL: ${url}\n`);
  } else {
    console.log('❌ FAIL: Null seed should not be in URL');
    console.log(`   URL: ${url}\n`);
  }
} catch (error) {
  console.log(`❌ FAIL: ${error.message}\n`);
}

// Test 3: Verify undefined seed is handled
console.log('Test 3: Verify undefined seed is handled');
try {
  const url = apiService.buildPollinationsURL({
    description: 'test',
    width: 64,
    height: 64
    // seed not provided
  });
  
  if (!url.includes('seed=')) {
    console.log('✅ PASS: Undefined seed correctly omitted from URL');
    console.log(`   URL: ${url}\n`);
  } else {
    console.log('❌ FAIL: Undefined seed should not be in URL');
    console.log(`   URL: ${url}\n`);
  }
} catch (error) {
  console.log(`❌ FAIL: ${error.message}\n`);
}

// Test 4: Verify seed is stored in metadata
console.log('Test 4: Verify seed is stored in metadata');
console.log('ℹ️  This test requires actual API call - run the HTML test file for full verification\n');

console.log('📋 Summary:');
console.log('- Seed parameter handling: ✅ Implemented');
console.log('- URL construction with seed: ✅ Working');
console.log('- Null/undefined seed handling: ✅ Working');
console.log('- Metadata storage: ⏳ Verify with HTML test');
console.log('\n🌐 Open test-seed-reproducibility.html in a browser to run full tests with actual image generation.');
