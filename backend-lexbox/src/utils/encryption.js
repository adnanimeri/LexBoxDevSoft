// ===================================================================
// ENCRYPTION UTILITY — Multi-Tenant (Option B)
// ===================================================================
// Keys are NEVER stored and NEVER visible to org admins.
// Each org gets a unique AES-256 key derived on-the-fly from:
//   PBKDF2(MASTER_ENCRYPTION_KEY, org.encryption_salt, 100000 iterations)
// The MASTER_ENCRYPTION_KEY lives only in the server environment.
// ===================================================================

const crypto = require('crypto');
const fs = require('fs').promises;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha512';

// ===================================================================
// KEY DERIVATION
// ===================================================================

/**
 * Derive a deterministic per-org AES-256 key.
 * Uses PBKDF2(MASTER_ENCRYPTION_KEY, org.encryption_salt).
 * The org admin never sees this key — it is derived on the fly at runtime.
 *
 * @param {string} encryptionSalt - org.encryption_salt (64-char hex string)
 * @returns {Buffer} 32-byte AES key
 */
const deriveOrgKey = (encryptionSalt) => {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('MASTER_ENCRYPTION_KEY environment variable is not set');
  }
  return crypto.pbkdf2Sync(
    masterKey,
    Buffer.from(encryptionSalt, 'hex'),
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  );
};

/**
 * Fallback global key for legacy / non-org documents.
 */
const getGlobalKey = () => {
  const secret = process.env.ENCRYPTION_SECRET || process.env.MASTER_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET or MASTER_ENCRYPTION_KEY environment variable is not set');
  }
  return crypto.scryptSync(secret, 'lexbox-global-salt', KEY_LENGTH);
};

// ===================================================================
// BUFFER ENCRYPTION / DECRYPTION
// ===================================================================

/**
 * Encrypt a buffer.
 * Output format: IV (16 bytes) | Auth Tag (16 bytes) | Ciphertext
 *
 * @param {Buffer} buffer
 * @param {Buffer|null} key - 32-byte AES key. Defaults to global key.
 * @returns {Buffer}
 */
const encryptBuffer = (buffer, key = null) => {
  const aesKey = key || getGlobalKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
};

/**
 * Decrypt a buffer.
 *
 * @param {Buffer} encryptedBuffer
 * @param {Buffer|null} key - 32-byte AES key. Defaults to global key.
 * @returns {Buffer}
 */
const decryptBuffer = (encryptedBuffer, key = null) => {
  const aesKey = key || getGlobalKey();
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const tag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, aesKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

// ===================================================================
// FILE ENCRYPTION / DECRYPTION
// ===================================================================

/**
 * Encrypt a file and write ciphertext to outputPath.
 *
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {Buffer|null} key - Per-org key from deriveOrgKey(). Falls back to global.
 * @returns {number} encrypted file size in bytes
 */
const encryptFile = async (inputPath, outputPath, key = null) => {
  const buffer = await fs.readFile(inputPath);
  const encrypted = encryptBuffer(buffer, key);
  await fs.writeFile(outputPath, encrypted);
  return encrypted.length;
};

/**
 * Decrypt a file and return its plaintext as a Buffer.
 *
 * @param {string} filePath
 * @param {Buffer|null} key - Per-org key from deriveOrgKey(). Falls back to global.
 * @returns {Buffer}
 */
const decryptFile = async (filePath, key = null) => {
  const encryptedBuffer = await fs.readFile(filePath);
  return decryptBuffer(encryptedBuffer, key);
};

module.exports = {
  deriveOrgKey,
  encryptBuffer,
  decryptBuffer,
  encryptFile,
  decryptFile
};
