# LexBox Encryption — How It Works

## Overview

LexBox uses **AES-256-GCM** encryption with per-organization keys. No key is ever stored anywhere — every key is derived on the fly at runtime and exists only in RAM for the duration of a single request.

---

## 1 — When an Org is Created

The `Organization` model generates a random 64-character hex `encryption_salt` and saves it to the DB:

```
org.encryption_salt = "a3f7c1b2d4e6..." (32 random bytes → 64 hex chars)
```

This salt is **unique per org** and **never changes**. It is not a key — it is random input to the key derivation function.

---

## 2 — Key Derivation (on every upload/download)

No key is ever stored. Every time a file is encrypted or decrypted, the key is derived on the fly:

```
PBKDF2(
  password   = MASTER_ENCRYPTION_KEY   ← from .env only, never in DB
  salt       = org.encryption_salt     ← from DB, unique per org
  iterations = 100,000
  length     = 32 bytes
  digest     = SHA-512
)
→ 32-byte AES key  (exists only in RAM, for that request only)
```

**PBKDF2** (Password-Based Key Derivation Function 2) is deliberately slow — 100,000 iterations makes brute-forcing computationally infeasible.

Because the salt is unique per org, **every organization has a completely different AES key**, even though they share the same master key.

---

## 3 — Encrypting a File (upload)

```
Original file: contract.pdf  (plaintext)

Step 1: Generate a random IV (16 bytes) — different every time, even for the same file
Step 2: AES-256-GCM encrypt the file using the derived key + IV
Step 3: GCM produces an Auth Tag (16 bytes) — proves the file was not tampered with
Step 4: Write to disk as:

┌─────────────┬──────────────┬──────────────────────────┐
│  IV         │  Auth Tag    │  Ciphertext              │
│  16 bytes   │  16 bytes    │  (same size as original) │
└─────────────┴──────────────┴──────────────────────────┘

→ saved as: contract.pdf.enc
```

The original plaintext file is deleted from disk after encryption. Only the `.enc` file remains.

---

## 4 — Decrypting a File (download)

```
Step 1: Read the .enc file from disk
Step 2: Split — bytes 0–15 = IV, bytes 16–31 = Auth Tag, rest = Ciphertext
Step 3: Derive the same AES key (same MASTER_KEY + same org salt = same key)
Step 4: AES-256-GCM decrypt
Step 5: GCM verifies the Auth Tag — if the file was modified even 1 bit, decryption fails
Step 6: Stream the plaintext back to the browser — never written to disk
```

---

## 5 — What AES-256-GCM Provides

| Property | Meaning |
|---|---|
| **AES-256** | 256-bit key — quantum-resistant for the foreseeable future |
| **GCM mode** | Authenticated encryption — detects any tampering or corruption |
| **Random IV** | Same file uploaded twice produces completely different ciphertext |
| **Auth Tag** | If anyone modifies the `.enc` file on disk, decryption throws an error |

---

## 6 — File Storage Structure

Each organization's encrypted files are isolated in their own folder, named by the org's UUID:

```
uploads/
└── organizations/
    ├── 0c67ed5d-81ac-4d6d-9991-be4956c970c3/   ← GPartner and LawFirm
    │   └── dossiers/
    │       └── {dossierId}/
    │           └── contract.pdf.enc
    ├── 3ecd7091-da9b-458d-9d87-864b5cabf179/   ← RInori
    │   └── dossiers/...
    └── 80933f7e-8822-49a2-a30f-5e6f7c350286/   ← AdiFirmLaw
        └── dossiers/...
```

Even if someone gained access to the filesystem, every file is unreadable without the `MASTER_ENCRYPTION_KEY`.

---

## 7 — Where Data Lives

| Data | Location | Who can access it |
|---|---|---|
| `MASTER_ENCRYPTION_KEY` | `.env` on the server | Server admin only |
| `encryption_salt` | DB `organizations` table | Anyone with DB access — but useless without the master key |
| AES key | Nowhere — derived in RAM | Nobody — gone after each request |
| `.enc` files | `uploads/organizations/{uuid}/` | Unreadable without the derived key |

---

## 8 — Multi-Tenant Isolation

```
Org A: PBKDF2(MASTER_KEY, saltA) → Key A
Org B: PBKDF2(MASTER_KEY, saltB) → Key B
```

Org A's key can never decrypt Org B's files. A lawyer from one firm cannot access documents from another firm — not through the API (scoped by `organization_id`) and not through the filesystem (different AES keys).

---

## 9 — Critical Warning — Master Key

```
MASTER_ENCRYPTION_KEY (lost) → ALL documents of ALL orgs permanently unreadable
```

- This key **must be backed up** in a secure location (password manager, encrypted vault)
- If the server is rebuilt but the `.env` is lost, every encrypted document across every org is **gone forever** — there is no recovery
- Never commit `.env` to version control
- In production, store this key in a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)




##  MASTER_ENCRYPTION_KEY safe at any cost/situation, and also keep safe backup
Exactly. Here's the practical approach for your situation:

Right now (development)

Your key is in .env — fine for dev, but make sure .env is in .gitignore (never pushed to GitHub)
Make a copy of the key somewhere safe today — even a password manager entry is better than nothing
Before going to production — 3 copies, 3 places

- Password manager (Bitwarden, 1Password, etc.) — your primary reference
- Encrypted file on external drive — physical offline backup
- Secrets manager on your hosting provider — e.g. AWS Secrets Manager, Railway secrets, Render environment variables — this replaces the .env in production
- The rule to live by:  
If your server burns down tonight and you rebuild everything from the DB backup tomorrow — you can restore all client data only if you still have the MASTER_ENCRYPTION_KEY. Without it, the DB is intact but every .enc file across every law firm is permanently locked.

What changes in production

Instead of .env:


# Never put secrets in .env in production
# Store MASTER_ENCRYPTION_KEY in your hosting platform's secret vault
# and inject it as an environment variable at runtime
The code doesn't change — process.env.MASTER_ENCRYPTION_KEY works the same whether it comes from .env or a secrets vault.