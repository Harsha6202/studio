
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

// Enhanced logging for debugging Vercel deployment
console.log(
  "[Firebase Client] Attempting to initialize. Raw values from process.env:"
);
console.log(
  "[Firebase Client]   NEXT_PUBLIC_FIREBASE_API_KEY (length):",
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.length : 'MISSING/EMPTY'
);
console.log(
  "[Firebase Client]   NEXT_PUBLIC_FIREBASE_PROJECT_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING/EMPTY'
);
console.log(
  "[Firebase Client]   NEXT_PUBLIC_FIREBASE_APP_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'MISSING/EMPTY'
);


// Check if essential config values are present and not empty strings
const essentialConfigMissing =
  !firebaseConfigValues.apiKey || firebaseConfigValues.apiKey.trim() === "" ||
  !firebaseConfigValues.projectId || firebaseConfigValues.projectId.trim() === "" ||
  !firebaseConfigValues.appId || firebaseConfigValues.appId.trim() === "";

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;

if (essentialConfigMissing) {
  const errorMessage = 
    'CRITICAL Firebase Error: API Key, Project ID, or App ID is missing or empty. ' +
    'Firebase will not be initialized. \n' +
    '1. For local development, ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set correctly in your .env.local file. \n' +
    '2. For Vercel deployment, ensure these variables are set in your Vercel Project Settings > Environment Variables. \n' +
    'Current values seen by the app:\n' +
    `  NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'Not Provided'}\n` +
    `  NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not Provided'}\n` +
    `  NEXT_PUBLIC_FIREBASE_APP_ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'Not Provided'}\n` +
    'After setting/correcting these, restart your Next.js development server or redeploy to Vercel.';
  
  console.error(errorMessage);

  if (typeof window !== 'undefined') {
    // Attempt to display a prominent error on the page for client-side issues
    const errorBanner = document.createElement('div');
    errorBanner.id = 'firebase-config-error-banner';
    errorBanner.style.position = 'fixed';
    errorBanner.style.top = '0';
    errorBanner.style.left = '0';
    errorBanner.style.width = '100%';
    errorBanner.style.backgroundColor = 'red';
    errorBanner.style.color = 'white';
    errorBanner.style.padding = '20px';
    errorBanner.style.zIndex = '99999';
    errorBanner.style.fontFamily = 'monospace';
    errorBanner.style.fontSize = '14px';
    errorBanner.style.lineHeight = '1.5';
    errorBanner.style.textAlign = 'left';
    errorBanner.innerHTML = `
      <strong>CRITICAL Firebase Configuration Error:</strong><br/>
      API Key, Project ID, or App ID is missing, empty, or invalid.<br/>
      - Check your Vercel Environment Variables (for NEXT_PUBLIC_FIREBASE_...).<br/>
      - Review the browser console for detailed logs from "[Firebase Client]".<br/>
      Firebase will not function correctly. This app is unusable until this is fixed.
    `;
    // Prevent multiple banners
    if (!document.getElementById('firebase-config-error-banner')) {
        document.body.prepend(errorBanner);
    }
  }
} else {
  try {
    if (!getApps().length) {
      console.log("[Firebase Client] Initializing Firebase app with provided config...");
      app = initializeApp(firebaseConfigValues);
    } else {
      console.log("[Firebase Client] Getting existing Firebase app...");
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("[Firebase Client] Firebase initialized successfully.");
  } catch (error: any) {
    console.error("[Firebase Client] Error during Firebase initialization:", error);
    let specificMessage = `Firebase Initialization Error: ${error.message || 'An unknown error occurred.'}`;
    if (error.code === 'auth/invalid-api-key') {
      specificMessage = 
        "Firebase Initialization Error: Invalid API Key (auth/invalid-api-key). \n" +
        "This means the API Key value used ('" + (firebaseConfigValues.apiKey ? firebaseConfigValues.apiKey.substring(0,5) + '...' : 'EMPTY') + 
        "') is incorrect or not authorized for this project. \n" +
        "1. Double-check NEXT_PUBLIC_FIREBASE_API_KEY in your Vercel Environment Variables. \n" +
        "2. Ensure the key is correctly copied from your Firebase project settings. \n" +
        "3. Check for any API key restrictions in the Google Cloud Console for your project.";
      console.error(specificMessage);
    }

    if (typeof window !== 'undefined') {
      const errorBanner = document.createElement('div');
      errorBanner.id = 'firebase-init-error-banner';
      errorBanner.style.position = 'fixed';
      errorBanner.style.top = '0';
      errorBanner.style.left = '0';
      errorBanner.style.width = '100%';
      errorBanner.style.backgroundColor = 'red';
      errorBanner.style.color = 'white';
      errorBanner.style.padding = '20px';
      errorBanner.style.zIndex = '99999';
      errorBanner.style.fontFamily = 'monospace';
      errorBanner.style.fontSize = '14px';
      errorBanner.style.lineHeight = '1.5';
      errorBanner.style.textAlign = 'left';
      errorBanner.innerHTML = `
        <strong>Firebase Initialization Error:</strong><br/>
        ${error.message.replace(/\n/g, '<br/>') || 'An unknown error occurred during Firebase setup.'}<br/>
        ${error.code === 'auth/invalid-api-key' ? 'Ensure NEXT_PUBLIC_FIREBASE_API_KEY is correct in Vercel.' : ''}<br/>
        Check browser console for detailed logs from "[Firebase Client]". Firebase will not function correctly.
      `;
      if (!document.getElementById('firebase-init-error-banner')) {
        document.body.prepend(errorBanner);
      }
    }
  }
}

export { app, auth, db, storage };
