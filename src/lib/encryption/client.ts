/**
 * Client-side encryption utilities using the Web Crypto API (SubtleCrypto).
 * Algorithm: AES-GCM 256-bit with PBKDF2 key derivation.
 * All operations are performed entirely in the browser — no plaintext leaves the device.
 */

const PBKDF2_ITERATIONS = 310_000 // OWASP 2023 recommendation
const KEY_LENGTH_BITS = 256
const IV_LENGTH_BYTES = 12 // 96-bit IV for AES-GCM

/**
 * Derive a CryptoKey from a password and salt using PBKDF2 → AES-GCM.
 * The derived key can be used directly with encryptData / decryptData.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()

  // Import the raw password as a PBKDF2 key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  // Ensure salt is a plain ArrayBuffer to satisfy SubtleCrypto's BufferSource requirement
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer

  // Derive the final AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false, // Not extractable — keeps the key in secure memory
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypt an ArrayBuffer with the given AES-GCM key.
 * Returns an ArrayBuffer with a 12-byte IV prepended: [IV (12 bytes) | ciphertext]
 */
export async function encryptData(data: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  )

  // Concatenate IV + ciphertext into a single buffer
  const result = new Uint8Array(IV_LENGTH_BYTES + ciphertext.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(ciphertext), IV_LENGTH_BYTES)

  return result.buffer
}

/**
 * Decrypt an ArrayBuffer that was encrypted by encryptData.
 * Expects the format: [IV (12 bytes) | ciphertext]
 */
export async function decryptData(encryptedData: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
  const data = new Uint8Array(encryptedData)

  if (data.byteLength <= IV_LENGTH_BYTES) {
    throw new Error('Encrypted data is too short to contain an IV')
  }

  const iv = data.slice(0, IV_LENGTH_BYTES)
  const ciphertext = data.slice(IV_LENGTH_BYTES)

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )
}

/**
 * Generate a cryptographically random salt suitable for PBKDF2.
 * Store this alongside encrypted data; it does not need to be secret.
 */
export function generateSalt(byteLength = 32): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(byteLength))
}

/**
 * Convert a Uint8Array to a base64 string for storage.
 */
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

/**
 * Convert a base64 string back to a Uint8Array.
 */
export function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}
