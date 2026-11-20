import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]

const missingKeys = requiredKeys.filter((key) => !import.meta.env[key])

if (missingKeys.length) {
  console.warn(
    `[DataPulse] Missing Firebase env vars: ${missingKeys.join(', ')}. ` +
      'Using mock/demo fallback if needed.',
  )
}

export const firebaseConfigured = missingKeys.length === 0

const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAlSq5VujlTzPv1PWqgJUNJB0n4-H_ru6M',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'datapulse-334ef.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'datapulse-334ef',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'datapulse-334ef.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '41958626059',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:41958626059:web:5f32183fb04bea12d8c80e',
})

export const auth = getAuth(firebaseApp)
export const storage = getStorage(firebaseApp)

export const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({ prompt: 'select_account' })

// Keep the session across reloads; failures here are non-fatal.
setPersistence(auth, browserLocalPersistence).catch(() => {})

/**
 * Resolves once Firebase has restored (or ruled out) a persisted session.
 *
 * Requests fired before this settles would otherwise be sent without a token
 * and rejected by the API with 401 on a hard refresh.
 */
let readyPromise
export function waitForAuthReady() {
  if (!readyPromise) {
    readyPromise = auth.authStateReady
      ? auth.authStateReady()
      : new Promise((resolve) => {
          const stop = auth.onAuthStateChanged(() => {
            stop()
            resolve()
          })
        })
  }
  return readyPromise
}
