import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initFirebaseClient(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  let app: FirebaseApp;

  if (getApps().length > 0) {
    app = getApp();
  } else {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn(
        '[Firebase Client] Warning: Firebase client configuration keys are missing. ' +
        'Please check that NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set in your .env.local file.'
      );
    }
    app = initializeApp(firebaseConfig);
  }

  const auth = getAuth(app);
  const db = getFirestore(app);

  return { app, auth, db };
}

const { app, auth, db } = initFirebaseClient();

export { app, auth, db, initFirebaseClient };
