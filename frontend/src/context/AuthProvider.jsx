import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth, firebaseConfigured, googleProvider, waitForAuthReady } from '../lib/firebase'
import { UNAUTHORIZED_EVENT } from '../lib/apiClient'
import { clearWorkspaceCache } from '../api/workspaces'
import { invalidateCache } from '../hooks/useAsyncData'

const AuthContext = createContext(null)

const QUIET_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
])

function readableAuthError(code, fallback) {
  switch (code) {
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups for this site or use Email/Password sign-in below.'
    case 'auth/network-request-failed':
      return 'Network error while signing in. Check your connection or try the instant Demo Studio mode.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised in your Firebase console. Use the instant Demo Studio mode or Email sign-in.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase console.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials or create a new account.'
    case 'auth/email-already-in-use':
      return 'An account already exists with that email address. Please sign in instead.'
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.'
    default:
      return fallback || 'Sign-in failed. Please try again.'
  }
}

const DEMO_STORAGE_KEY = 'datapulse_demo_user'

function loadSavedDemoUser() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Session state with Google, Email/Password, and Instant Demo Studio access. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => auth.currentUser || loadSavedDemoUser())
  const [initialising, setInitialising] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    waitForAuthReady().finally(() => {
      if (active) setInitialising(false)
    })
    const stop = onAuthStateChanged(auth, (next) => {
      if (!active) return
      if (next) {
        localStorage.removeItem(DEMO_STORAGE_KEY)
        setUser(next)
      } else {
        const savedDemo = loadSavedDemoUser()
        if (savedDemo) {
          setUser(savedDemo)
        } else {
          setUser(null)
          clearWorkspaceCache()
          invalidateCache()
        }
      }
      setInitialising(false)
    })
    return () => {
      active = false
      stop()
    }
  }, [])

  const signOut = useCallback(async () => {
    clearWorkspaceCache()
    invalidateCache()
    localStorage.removeItem(DEMO_STORAGE_KEY)
    setUser(null)
    await firebaseSignOut(auth).catch(() => {})
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      if (user) void signOut()
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [user, signOut])

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true)
    setError(null)
    try {
      clearWorkspaceCache()
      invalidateCache()
      localStorage.removeItem(DEMO_STORAGE_KEY)
      const credential = await signInWithPopup(auth, googleProvider)
      setUser(credential.user)
      return credential.user
    } catch (caught) {
      if (!QUIET_CODES.has(caught?.code)) {
        setError(readableAuthError(caught?.code, caught?.message))
      }
      throw caught
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signInWithEmail = useCallback(async (email, password) => {
    setSigningIn(true)
    setError(null)
    try {
      clearWorkspaceCache()
      invalidateCache()
      localStorage.removeItem(DEMO_STORAGE_KEY)
      const credential = await signInWithEmailAndPassword(auth, email, password)
      setUser(credential.user)
      return credential.user
    } catch (caught) {
      setError(readableAuthError(caught?.code, caught?.message))
      throw caught
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    setSigningIn(true)
    setError(null)
    try {
      clearWorkspaceCache()
      invalidateCache()
      localStorage.removeItem(DEMO_STORAGE_KEY)
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(credential.user, { displayName }).catch(() => {})
      }
      setUser(credential.user)
      return credential.user
    } catch (caught) {
      setError(readableAuthError(caught?.code, caught?.message))
      throw caught
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signInAsDemo = useCallback(async () => {
    setSigningIn(true)
    setError(null)
    try {
      clearWorkspaceCache()
      invalidateCache()
      const demoUser = {
        uid: 'datapulse_demo_user',
        email: 'demo@datapulse.io',
        displayName: 'Demo Explorer',
        photoURL: null,
        isDemo: true,
        getIdToken: async () => 'demo-token-explorer',
      }
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser))
      setUser(demoUser)
      return demoUser
    } finally {
      setSigningIn(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      initialising,
      signingIn,
      error,
      configured: firebaseConfigured,
      isAuthenticated: Boolean(user),
      clearError: () => setError(null),
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInAsDemo,
      signOut,
    }),
    [user, initialising, signingIn, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsDemo, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
