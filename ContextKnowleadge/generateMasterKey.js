// ===================================================================
// MASTER ENCRYPTION KEY GENERATOR
// Run this once before production deployment to generate a secure key.
//
// Usage:
//   node ContextKnowleadge/generateMasterKey.js
// ===================================================================

const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');
const date = new Date().toISOString();

console.log('\n══════════════════════════════════════════════════════════');
console.log('  LexBox — Master Encryption Key Generator');
console.log('══════════════════════════════════════════════════════════');
console.log(`\n  Generated at : ${date}`);
console.log(`\n  MASTER_ENCRYPTION_KEY=${key}`);
console.log('\n══════════════════════════════════════════════════════════');
console.log('\n  NEXT STEPS:');
console.log('\n  1. Copy the key above into your production .env:');
console.log(`       MASTER_ENCRYPTION_KEY=${key}`);
console.log('\n  2. Save the key in your password manager NOW.');
console.log('     Label it: "LexBox MASTER_ENCRYPTION_KEY — production"');
console.log('\n  3. Store a second backup in an encrypted offline location.');
console.log('\n  ⚠️  WARNING:');
console.log('     - Never commit this key to git');
console.log('     - Never share it over email or chat');
console.log('     - Losing this key = all encrypted documents permanently unreadable');
console.log('\n══════════════════════════════════════════════════════════\n');
