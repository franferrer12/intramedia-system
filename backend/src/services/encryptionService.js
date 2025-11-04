import crypto from 'crypto';

// Algorithm for encryption
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Get encryption key from environment variable
 * Must be 32 bytes (64 hex characters) for AES-256
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Convert hex string to buffer (should be 64 hex chars = 32 bytes)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt text using AES-256-CBC
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text with IV prepended (hex format)
 */
export function encrypt(text) {
  if (!text) return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (both in hex)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text using AES-256-CBC
 * @param {string} encryptedText - Encrypted text with IV prepended
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    const key = getEncryptionKey();

    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random encryption key (for initial setup)
 * Use this once to generate your ENCRYPTION_KEY
 * @returns {string} - Random 32-byte key in hex format
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Test encryption/decryption
 */
export function testEncryption() {
  try {
    const testText = 'This is a test message';
    const encrypted = encrypt(testText);
    const decrypted = decrypt(encrypted);

    console.log('Encryption test:');
    console.log('  Original:', testText);
    console.log('  Encrypted:', encrypted);
    console.log('  Decrypted:', decrypted);
    console.log('  Match:', testText === decrypted ? '✓' : '✗');

    return testText === decrypted;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
}
