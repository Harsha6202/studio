
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This log will appear in both server console (during SSR/build) and browser console
console.log(
  "[Firebase Client] Attempting to initialize with API Key (length):",
  firebaseConfigValues.apiKey ? firebaseConfigValues.apiKey.length : 'MISSING/EMPTY'
);
console.log(
  "[Firebase Client] Project ID:",
  firebaseConfigValues.projectId || 'MISSING/EMPTY'
);
console.log(
  "[Firebase Client] App ID:",
  firebaseConfigValues.appId || 'MISSING/EMPTY'
);


// Initialize Firebase
let app: FirebaseApp | undefined = undefined; // Allow app to be undefined if init fails
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;

if (!firebaseConfigValues.apiKey || !firebaseConfigValues.projectId || !firebaseConfigValues.appId) {
  console.error(
    'CRITICAL Firebase Error: API Key, Project ID, or App ID is missing. ' +
    'Firebase will not be initialized. Check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set correctly. ' +
    'Then, restart your Next.js development server.'
  );
} else {
  try {
    if (!getApps().length) {
      console.log("[Firebase Client] Initializing Firebase app...");
      app = initializeApp(firebaseConfigValues);
    } else {
      console.log("[Firebase Client] Getting existing Firebase app...");
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("[Firebase Client] Firebase initialized successfully.");
  } catch (error) {
    console.error("[Firebase Client] Error during Firebase initialization:", error);
    // This catch block will show the "auth/invalid-api-key" if it's thrown by initializeApp
    // or other errors if, for example, projectId is malformed for Firestore/Storage.
  }
}

// Export possibly undefined services if config was bad or init failed
export { app, auth, db, storage };
