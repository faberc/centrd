import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper to check if a configuration contains the necessary Firebase fields
export function isValidConfig(config) {
  return !!(
    config &&
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.storageBucket &&
    config.messagingSenderId &&
    config.appId
  );
}

// Retrieve the Firebase configuration
export function getStoredConfig() {
  // Check localStorage first
  try {
    const local = localStorage.getItem("throwing_log_firebase_config");
    if (local) {
      const parsed = JSON.parse(local);
      if (isValidConfig(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to parse stored firebase config", e);
  }

  // Fallback to standard environment variables if defined
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  if (isValidConfig(envConfig)) {
    return envConfig;
  }

  return null;
}

let app = null;
let auth = null;
let db = null;
let storage = null;

const currentConfig = getStoredConfig();

if (currentConfig) {
  try {
    app = initializeApp(currentConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.error("Firebase initialization failed with configuration", err, currentConfig);
  }
}

export function isFirebaseConfigured() {
  return app !== null;
}

export function getFirebase() {
  return { app, auth, db, storage };
}

export function saveFirebaseConfig(newConfig) {
  if (!isValidConfig(newConfig)) {
    throw new Error("Invalid Firebase configuration object");
  }
  localStorage.setItem("throwing_log_firebase_config", JSON.stringify(newConfig));
}

export function clearFirebaseConfig() {
  localStorage.removeItem("throwing_log_firebase_config");
}
