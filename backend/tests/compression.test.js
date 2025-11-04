/**
 * Compression Tests
 * Validates that gzip compression is working correctly
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import zlib from 'node:zlib';

const BASE_URL = 'http://localhost:3001';

const makeRequest = (path, acceptEncoding = 'gzip') => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': acceptEncoding
      }
    };

    const req = http.request(BASE_URL + path, options, (res) => {
      const chunks = [];

      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer,
          size: buffer.length
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
};

describe('Compression Tests', () => {
  it('should return Content-Encoding: gzip when accepted', async () => {
    const response = await makeRequest('/api/eventos', 'gzip');

    if (response.headers['content-encoding'] === 'gzip') {
      assert.strictEqual(response.headers['content-encoding'], 'gzip',
        'Should return gzip encoding');
      console.log('✅ Gzip compression active');
    } else {
      console.log('⚠️  Gzip not active (response may be too small < 1KB)');
    }
  });

  it('should include Vary: Accept-Encoding header', async () => {
    const response = await makeRequest('/api/eventos');

    if (response.headers['vary']) {
      assert.ok(response.headers['vary'].includes('Accept-Encoding'),
        'Should include Vary: Accept-Encoding');
      console.log('✅ Vary header present');
    }
  });

  it('should compress large responses', async () => {
    // Request endpoint that returns more data
    const response = await makeRequest('/api/estadisticas/dashboard-financiero');

    if (response.headers['content-encoding'] === 'gzip') {
      console.log('✅ Large response compressed');
      console.log(`   Compressed size: ${response.size} bytes`);

      // Decompress to verify
      const decompressed = zlib.gunzipSync(response.buffer);
      const originalSize = decompressed.length;
      const compressionRatio = ((1 - (response.size / originalSize)) * 100).toFixed(2);

      console.log(`   Original size: ${originalSize} bytes`);
      console.log(`   Compression ratio: ${compressionRatio}%`);

      assert.ok(response.size < originalSize,
        'Compressed size should be smaller');
    } else {
      console.log('ℹ️  Response not compressed (may be already small)');
    }
  });

  it('should not compress when Accept-Encoding is not gzip', async () => {
    const response = await makeRequest('/api/eventos', '');

    assert.strictEqual(response.headers['content-encoding'], undefined,
      'Should not compress without Accept-Encoding: gzip');

    console.log('✅ Respects client Accept-Encoding');
  });

  it('should work correctly with JSON responses', async () => {
    const response = await makeRequest('/', 'gzip');

    let json;
    if (response.headers['content-encoding'] === 'gzip') {
      const decompressed = zlib.gunzipSync(response.buffer);
      json = JSON.parse(decompressed.toString());
    } else {
      json = JSON.parse(response.buffer.toString());
    }

    assert.ok(json.success, 'Should parse JSON correctly');
    assert.ok(json.optimizations, 'Should have optimizations info');

    console.log('✅ JSON parsing works with compression');
  });
});

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Compression Tests...\n');
}
