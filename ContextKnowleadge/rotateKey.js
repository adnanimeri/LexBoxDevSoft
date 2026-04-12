// ===================================================================
// KEY ROTATION SCRIPT
// Re-encrypts all .enc files from OLD_MASTER_KEY to NEW_MASTER_KEY
//
// Usage:
//   OLD_MASTER_KEY=<old> NEW_MASTER_KEY=<new> node scripts/rotateKey.js
// ===================================================================

require('dotenv').config();
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const ALGORITHM         = 'aes-256-gcm';
const IV_LENGTH         = 16;
const TAG_LENGTH        = 16;
const KEY_LENGTH        = 32;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST     = 'sha512';

const OLD_KEY = process.env.OLD_MASTER_KEY;
const NEW_KEY = process.env.NEW_MASTER_KEY;

if (!OLD_KEY || !NEW_KEY) {
  console.error('ERROR: Both OLD_MASTER_KEY and NEW_MASTER_KEY must be set as environment variables.');
  process.exit(1);
}
if (OLD_KEY === NEW_KEY) {
  console.error('ERROR: Keys are identical — nothing to rotate.');
  process.exit(1);
}

function deriveKey(masterKey, encryptionSalt) {
  return crypto.pbkdf2Sync(
    masterKey,
    Buffer.from(encryptionSalt, 'hex'),
    PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST
  );
}

function decryptBuffer(buf, key) {
  const iv  = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const enc = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

function encryptBuffer(buf, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

function findEncFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findEncFiles(full));
    else if (entry.name.endsWith('.enc')) results.push(full);
  }
  return results;
}

async function main() {
  const sequelize        = require('../src/config/database');
  const { Organization } = require('../src/models');

  await sequelize.authenticate();
  const orgs = await Organization.findAll({ attributes: ['id', 'encryption_salt'] });

  const keyMap = {};
  for (const org of orgs) {
    keyMap[org.id] = {
      old: deriveKey(OLD_KEY, org.encryption_salt),
      new: deriveKey(NEW_KEY, org.encryption_salt),
    };
  }

  const uploadsDir = path.join(__dirname, '..', 'uploads', 'organizations');
  const encFiles   = findEncFiles(uploadsDir);

  console.log(`\nFound ${encFiles.length} encrypted file(s) across ${orgs.length} organization(s).\n`);

  let success = 0;
  let failed  = 0;

  for (const filePath of encFiles) {
    const orgId = Object.keys(keyMap).find(id => filePath.includes(id));

    if (!orgId) {
      console.warn(`  SKIP  ${filePath} — no matching org UUID in path`);
      continue;
    }

    try {
      const encBuf    = fs.readFileSync(filePath);
      const plaintext = decryptBuffer(encBuf, keyMap[orgId].old);
      const reEnc     = encryptBuffer(plaintext, keyMap[orgId].new);
      fs.writeFileSync(filePath, reEnc);
      console.log(`  OK    ${path.relative(process.cwd(), filePath)}`);
      success++;
    } catch (err) {
      console.error(`  FAIL  ${path.relative(process.cwd(), filePath)} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n────────────────────────────────────`);
  console.log(`  Rotated : ${success} file(s)`);
  console.log(`  Failed  : ${failed} file(s)`);
  console.log(`────────────────────────────────────`);

  if (failed > 0) {
    console.error('\nSome files failed. Do NOT update .env yet. Fix errors and re-run.');
    process.exit(1);
  }

  console.log('\nAll files rotated successfully.');
  console.log('Now update MASTER_ENCRYPTION_KEY in .env and restart the server.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
