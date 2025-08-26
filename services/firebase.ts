// FIX: Add a triple-slash directive to include Vite's client types, which defines `import.meta.env`.
/// <reference types="vite/client" />

// FIX: Switched to Firebase compat initialization to resolve import errors from 'firebase/app'.
// The FirebaseApp instance from the compat library is compatible with the modular functions (e.g., getAuth) used elsewhere in the app.
import firebase from 'firebase/compat/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration, populated by Vite from your .env files
// Using import.meta.env which is the standard way in Vite.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey) {
    console.error("Firebase config is missing. Make sure you have set up your .env file with VITE_FIREBASE_... variables.");
}

// Initialize Firebase using the compat library for the app instance.
// This supports hot-reloading in dev environments.
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };