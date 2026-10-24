'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { AuthContextType, UserProfile } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Detects if the user is on a mobile device where popups are blocked.
 * On mobile we fall back to redirect-based OAuth.
 */
function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  /** Upsert Firestore user profile document */
  const syncUserProfile = async (currentUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        setProfile(data);
        if (data.defaultWorkspaceId) {
          setActiveWorkspaceId(data.defaultWorkspaceId);
        }
      } else {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || null,
          photoURL: currentUser.photoURL || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to sync user profile:', err);
      // Graceful degradation: keep app usable even if Firestore is unreachable
      setProfile({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || null,
        photoURL: currentUser.photoURL || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    // Handle the result of signInWithRedirect (fires after page reload on mobile)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // The onAuthStateChanged below will pick up the user and sync the profile.
          console.log('[AuthContext] Redirect sign-in successful:', result.user.email);
        }
      })
      .catch((err) => {
        // Common on first load when no redirect was initiated — safe to ignore.
        const code = (err as { code?: string }).code;
        if (code && code !== 'auth/no-auth-event') {
          console.error('[AuthContext] getRedirectResult error:', err);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setProfile(null);
        setActiveWorkspaceId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
      if (cred.user) {
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          console.warn('[AuthContext] Could not send verification email:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google sign-in:
   * - Desktop: popup (instant UX)
   * - Mobile: redirect (avoids popup-blocked errors on iOS/Android)
   */
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (isMobile()) {
      // Redirect flow — page will reload and getRedirectResult handles the rest
      await signInWithRedirect(auth, provider);
      // Code below this line will NOT run on mobile (page navigates away)
      return;
    }

    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendEmailVerificationLink = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        activeWorkspaceId,
        setActiveWorkspaceId,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        sendEmailVerificationLink,
        signOutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
