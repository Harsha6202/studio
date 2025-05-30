// src/lib/firebase/client.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBTfDfEx7NjBTVLN4dh9g3utOo0A3hDO50",
  authDomain: "marwaedge-532e8.firebaseapp.com",
  projectId: "marwaedge-532e8",
  storageBucket: "marwaedge-532e8.appspot.com",
  messagingSenderId: "387538466930",
  // IMPORTANT: Replace "YOUR_WEB_APP_ID_HERE" with your actual Firebase Web App ID
  // You can find this in your Firebase project settings (Project settings > General > Your apps > Web app)
  appId: "YOUR_WEB_APP_ID_HERE", 
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
