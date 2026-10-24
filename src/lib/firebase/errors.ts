/**
 * Translates Firebase Authentication and Firestore errors into
 * user-friendly, professional, and actionable error messages.
 */
export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const rawMessage = error instanceof Error ? error.message : String(error);

  // Common Firebase Auth error codes
  if (rawMessage.includes('auth/invalid-credential') || rawMessage.includes('invalid-credential')) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }
  if (rawMessage.includes('auth/user-not-found') || rawMessage.includes('user-not-found')) {
    return 'No account was found with this email. Please check your spelling or sign up.';
  }
  if (rawMessage.includes('auth/wrong-password') || rawMessage.includes('wrong-password')) {
    return 'Incorrect password. Please verify your password or use the "Forgot password" link.';
  }
  if (rawMessage.includes('auth/email-already-in-use') || rawMessage.includes('email-already-in-use')) {
    return 'An account already exists with this email address. Please sign in instead.';
  }
  if (rawMessage.includes('auth/network-request-failed') || rawMessage.includes('network-request-failed')) {
    return 'Network connection issue or blocked authentication request. Please verify your internet connection and ensure popup blockers or ad-blockers are not interfering.';
  }
  if (rawMessage.includes('auth/popup-closed-by-user') || rawMessage.includes('popup-closed-by-user')) {
    return 'The Google sign-in window was closed before completing authentication. Please try again.';
  }
  if (rawMessage.includes('auth/popup-blocked') || rawMessage.includes('popup-blocked')) {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this domain to sign in with Google.';
  }
  if (rawMessage.includes('auth/unauthorized-domain') || rawMessage.includes('unauthorized-domain') || rawMessage.includes('The requested action is invalid')) {
    return 'This domain is not yet authorized in Firebase Console. Authorized domains have been updated — please refresh and try again.';
  }
  if (rawMessage.includes('auth/too-many-requests') || rawMessage.includes('too-many-requests')) {
    return 'Access to this account has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.';
  }
  if (rawMessage.includes('auth/user-disabled') || rawMessage.includes('user-disabled')) {
    return 'This user account has been disabled. Please contact your workspace administrator.';
  }
  if (rawMessage.includes('auth/weak-password') || rawMessage.includes('weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (rawMessage.includes('auth/invalid-email') || rawMessage.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (rawMessage.includes('auth/cancelled-popup-request') || rawMessage.includes('cancelled-popup-request')) {
    return 'Authentication request cancelled. Please try again.';
  }
  if (rawMessage.includes('auth/operation-not-allowed') || rawMessage.includes('operation-not-allowed')) {
    return 'This sign-in method is currently disabled in your Firebase console.';
  }

  // Strip generic "Firebase: Error (auth/xxx)." prefixes if any other code slips through
  const cleaned = rawMessage
    .replace(/^Firebase:\s*(Error\s*)?(\([a-z0-9/-]+\)\.?\s*)?/i, '')
    .trim();

  return cleaned || 'Authentication failed. Please verify your connection and credentials.';
}
