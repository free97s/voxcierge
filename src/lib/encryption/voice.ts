/**
 * Voice-specific encryption utilities.
 * Wraps the generic client-side AES-GCM primitives for audio Blob objects.
 */

import { encryptData, decryptData } from './client'

const ENCRYPTED_MIME = 'application/octet-stream'

/**
 * Encrypt an audio Blob using the provided CryptoKey.
 * Returns a new Blob containing: [IV (12 bytes) | ciphertext]
 * The original MIME type is discarded; the caller should persist it separately.
 */
export async function encryptAudioBlob(blob: Blob, key: CryptoKey): Promise<Blob> {
  const buffer = await blob.arrayBuffer()
  const encrypted = await encryptData(buffer, key)
  return new Blob([encrypted], { type: ENCRYPTED_MIME })
}

/**
 * Decrypt a Blob that was encrypted by encryptAudioBlob.
 * @param encryptedBlob  The encrypted Blob (application/octet-stream)
 * @param key            The CryptoKey used during encryption
 * @param mimeType       The original audio MIME type (e.g. 'audio/webm')
 */
export async function decryptAudioBlob(
  encryptedBlob: Blob,
  key: CryptoKey,
  mimeType = 'audio/webm',
): Promise<Blob> {
  const buffer = await encryptedBlob.arrayBuffer()
  const decrypted = await decryptData(buffer, key)
  return new Blob([decrypted], { type: mimeType })
}
