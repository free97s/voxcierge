/**
 * Server-side encryption utilities.
 * Uses Node.js built-in `crypto` module with AES-256-GCM.
 *
 * Required environment variables:
 *   ENCRYPTION_MASTER_KEY  — 64 hex characters (256-bit key)
 *   ENCRYPTION_KEY_SALT    — 64 hex characters (256-bit salt)
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12        // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16  // 128-bit authentication tag
const KEY_LENGTH = 32       // 256-bit key

/**
 * Lazily derive the encryption key from env vars.
 * Uses scrypt to stretch the master key with the salt.
 */
function getKey(): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY
  const salt = process.env.ENCRYPTION_KEY_SALT

  if (!masterKey || !salt) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY and ENCRYPTION_KEY_SALT environment variables must be set',
    )
  }

  // scrypt: N=2^14, r=8, p=1 — fast enough for server use, strong enough for at-rest encryption
  return crypto.scryptSync(masterKey, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 })
}

/**
 * Encrypt a plaintext string.
 * Returns a Buffer with the layout: [IV (12 bytes) | authTag (16 bytes) | ciphertext]
 */
export function encryptText(text: string): Buffer {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted])
}

/**
 * Decrypt a Buffer that was produced by encryptText.
 * Expected layout: [IV (12 bytes) | authTag (16 bytes) | ciphertext]
 */
export function decryptText(encrypted: Buffer): string {
  if (encrypted.byteLength <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Encrypted buffer is too short')
  }

  const key = getKey()
  const iv = encrypted.subarray(0, IV_LENGTH)
  const authTag = encrypted.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = encrypted.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/**
 * Generate a new random 256-bit encryption key as a hex string.
 * Run once during initial setup and store the output as ENCRYPTION_MASTER_KEY.
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * Convenience helpers for encrypting/decrypting to/from base64 strings.
 * Useful for storing encrypted values in text columns.
 */
export function encryptTextToBase64(text: string): string {
  return encryptText(text).toString('base64')
}

export function decryptTextFromBase64(b64: string): string {
  return decryptText(Buffer.from(b64, 'base64'))
}
