# LexBox Master Key Rotation Guide

## When would you rotate the key?

| Situation | Action required |
|---|---|
| Key was accidentally exposed (committed to git, leaked) | **Rotate immediately** |
| Server admin leaves the company | Rotate as a precaution |
| Scheduled security policy (e.g. annually) | Rotate |

**Important:** Rotating the key does NOT change the per-org `encryption_salt` values in the DB.
It only changes the `MASTER_ENCRYPTION_KEY` in `.env`. Because the AES key is derived from
`PBKDF2(MASTER_KEY + salt)`, changing the master key means all existing files can no longer
be decrypted — so you must re-encrypt every `.enc` file before switching over.

---

## Overview of the process

```
1. Generate new MASTER_ENCRYPTION_KEY
2. Run the rotation script (re-encrypts every .enc file: old key → new key)
3. Replace MASTER_ENCRYPTION_KEY in .env
4. Restart the server
5. Verify a document opens correctly
6. Destroy the old key
```

---

## Step 1 — Generate a new key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save this output — it is your **NEW_MASTER_KEY**. Store it in your password manager immediately before continuing.

---

## Step 2 — Run the rotation script

The script is at `backend-lexbox/scripts/rotateKey.js` (see below).

```bash
cd backend-lexbox

OLD_MASTER_KEY=<your_current_key> \
NEW_MASTER_KEY=<your_new_key> \
node scripts/rotateKey.js
```

The script will:
- Load every organization and its `encryption_salt` from the DB
- Derive the old AES key per org: `PBKDF2(OLD_MASTER_KEY, salt)`
- Derive the new AES key per org: `PBKDF2(NEW_MASTER_KEY, salt)`
- Decrypt each `.enc` file with the old key, re-encrypt with the new key
- Overwrite the file in place with a fresh random IV
- Log `OK` or `FAIL` for every file

**The server can stay running during this step** — do not restart until the script completes with 0 failures.

---

## Step 3 — Update .env

Only after the script reports success:

```
MASTER_ENCRYPTION_KEY=<your_new_key>
```

---

## Step 4 — Restart the server

```bash
# nodemon will pick it up automatically if you save any file
# or manually:
pm2 restart lexbox-backend
```

---

## Step 5 — Verify

Log in as an org admin and open any encrypted document. If it renders correctly, the rotation is complete.

---

## Step 6 — Destroy the old key

- Update your password manager entry
- Remove from any notes, chat messages, or emails where it appeared
- If it was on paper, shred it

---

## What if the script fails halfway?

Files already processed are on the new key. Files not yet processed are still on the old key.
**Do not update `.env` until the script reports 0 failures.**
Fix the error and re-run — the script will re-process everything safely (decrypting and re-encrypting is idempotent as long as you pass the correct keys).

---

## The rotation script

> **Note:** `rotateKey.js` is stored in `ContextKnowleadge/` for reference. If you need to run it,
> move it back to `backend-lexbox/scripts/` first — the relative paths inside the script
> (`../src/config/database`, etc.) depend on it being in that location.

```bash
mv ContextKnowleadge/rotateKey.js backend-lexbox/scripts/rotateKey.js
```

```javascript
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

const ALGORITHM        = 'aes-256-gcm';
const IV_LENGTH        = 16;
const TAG_LENGTH       = 16;
const KEY_LENGTH       = 32;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST    = 'sha512';

const OLD_KEY = process.env.OLD_MASTER_KEY;
const NEW_KEY = process.env.NEW_MASTER_KEY;

if (!OLD_KEY || !NEW_KEY) {
  console.error('ERROR: Both OLD_MASTER_KEY and NEW_MASTER_KEY must be set.');
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
  const sequelize      = require('../src/config/database');
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
      console.warn(`  SKIP  ${filePath} — no matching org`);
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
    console.error('\nDo NOT update .env yet. Fix errors and re-run.');
    process.exit(1);
  }

  console.log('\nAll files rotated. Now update MASTER_ENCRYPTION_KEY in .env and restart.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
```

---

## Quick reference card

```bash
# 1. Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Re-encrypt all files
cd backend-lexbox
OLD_MASTER_KEY=<current> NEW_MASTER_KEY=<new> node scripts/rotateKey.js

# 3. Update .env then restart the server
```
