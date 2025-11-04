/**
 * Test Runner
 * Runs all test suites and generates a report
 */

import { run } from 'node:test';
import { spec as SpecReporter } from 'node:test/reporters';
import process from 'node:process';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 IntraMedia System - Test Suite');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Test Categories:');
console.log('   1. Cache System Validation');
console.log('   2. Rate Limiting Enforcement');
console.log('   3. Gzip Compression');
console.log('   4. Security Headers');
console.log('   5. Performance Monitoring\n');

console.log('⏳ Running tests...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Get all test files
const testFiles = (await readdir(__dirname))
  .filter(file => file.endsWith('.test.js'))
  .map(file => join(__dirname, file));

if (testFiles.length === 0) {
  console.error('❌ No test files found');
  process.exit(1);
}

console.log(`Found ${testFiles.length} test suites:\n`);
testFiles.forEach((file, i) => {
  const name = file.split('/').pop();
  console.log(`   ${i + 1}. ${name}`);
});
console.log('');

// Run tests
const stream = run({
  files: testFiles,
  concurrency: true,
  timeout: 10000
});

stream.compose(new SpecReporter()).pipe(process.stdout);

// Track results
let passed = 0;
let failed = 0;
let skipped = 0;

stream.on('test:pass', () => passed++);
stream.on('test:fail', () => failed++);
stream.on('test:skip', () => skipped++);

stream.on('end', () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Results Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ Passed:  ${passed}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📝 Total:   ${passed + failed + skipped}\n`);

  const successRate = ((passed / (passed + failed)) * 100).toFixed(2);
  console.log(`Success Rate: ${successRate}%\n`);

  if (failed === 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ System optimizations validated successfully!\n');
    process.exit(0);
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  SOME TESTS FAILED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nℹ️  Check the output above for details\n');
    process.exit(1);
  }
});
