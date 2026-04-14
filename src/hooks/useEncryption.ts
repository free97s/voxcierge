'use client'

import { useState, useCallback, useRef } from 'react'
import { deriveKey, generateSalt, toBase64, fromBase64 } from '@/lib/encryption/client'

interface UseEncryptionReturn {
  encryptionKey: CryptoKey | null
  isReady: boolean
  initializeKey: (userId: string, sessionToken: string) => Promise<void>
  clearKey: () => void
}

/**
 * Derives an AES-GCM CryptoKey from the user's session credentials.
 * The key is kept in memory only — it is never persisted to storage.
 *
 * Salt derivation strategy:
 *  - We use the userId as a stable, deterministic component combined with
 *    a short session suffix so that the same user gets the same key across
 *    page reloads (within the same session token).
 *  - The salt is stored in sessionStorage for the lifetime of the tab only.
 *    Closing the tab clears it, requiring re-initialization.
 */
export function useEncryption(): UseEncryptionReturn {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null)
  const [isReady, setIsReady] = useState(false)
  // Ref prevents double-initialization in React Strict Mode
  const initializingRef = useRef(false)

  const initializeKey = useCallback(async (userId: string, sessionToken: string) => {
    if (initializingRef.current || isReady) return
    initializingRef.current = true

    try {
      const storageKey = `enc_salt_${userId}`

      // Retrieve or generate a per-user salt stored in sessionStorage
      let salt: Uint8Array
      const storedSalt = sessionStorage.getItem(storageKey)

      if (storedSalt) {
        salt = fromBase64(storedSalt)
      } else {
        salt = generateSalt(32)
        sessionStorage.setItem(storageKey, toBase64(salt))
      }

      // The password material is a deterministic combination of userId + sessionToken.
      // This means the key changes whenever the user's session token rotates (i.e., re-login).
      const password = `${userId}:${sessionToken.slice(0, 32)}`

      const key = await deriveKey(password, salt)
      setEncryptionKey(key)
      setIsReady(true)
    } catch (err) {
      console.error('[useEncryption] Key derivation failed:', err)
    } finally {
      initializingRef.current = false
    }
  }, [isReady])

  const clearKey = useCallback(() => {
    setEncryptionKey(null)
    setIsReady(false)
  }, [])

  return { encryptionKey, isReady, initializeKey, clearKey }
}
