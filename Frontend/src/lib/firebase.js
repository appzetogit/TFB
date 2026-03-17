import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration - primary source is backend env API; falls back to VITE_ only if needed.
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
  vapidKey: "",
  databaseURL: "", // Realtime DB for live tracking
};

// Fetch config from backend and inject DB env values
const fetchFirebaseConfig = async () => {
  try {
    const { adminAPI } = await import("./api/index.js");
    const response = await adminAPI.getPublicEnvVariables();

    if (response.data.success && response.data.data) {
      const config = response.data.data;
      // Backend/DB is the source of truth
      if (config.FIREBASE_API_KEY) firebaseConfig.apiKey = config.FIREBASE_API_KEY;
      if (config.FIREBASE_AUTH_DOMAIN) firebaseConfig.authDomain = config.FIREBASE_AUTH_DOMAIN;
      if (config.FIREBASE_PROJECT_ID) firebaseConfig.projectId = config.FIREBASE_PROJECT_ID;
      if (config.FIREBASE_STORAGE_BUCKET) firebaseConfig.storageBucket = config.FIREBASE_STORAGE_BUCKET;
      if (config.FIREBASE_MESSAGING_SENDER_ID) firebaseConfig.messagingSenderId = config.FIREBASE_MESSAGING_SENDER_ID;
      if (config.FIREBASE_APP_ID) firebaseConfig.appId = config.FIREBASE_APP_ID;
      if (config.FIREBASE_VAPID_KEY) firebaseConfig.vapidKey = config.FIREBASE_VAPID_KEY;
      if (config.MEASUREMENT_ID) firebaseConfig.measurementId = config.MEASUREMENT_ID;
      if (config.FIREBASE_DATABASE_URL) firebaseConfig.databaseURL = config.FIREBASE_DATABASE_URL;

      console.log("✅ Firebase config loaded from backend env");
      return true;
    }
    return false;
  } catch (e) {
    console.warn(
      "⚠️ Failed to fetch firebase config from backend, using defaults/env",
      e,
    );
    return false;
  }
};

// Initialize Firebase app only once
let app;
let firebaseAuth;
let googleProvider;

// Function to ensure Firebase is initialized
async function ensureFirebaseInitialized() {
  const loadedFromBackend = await fetchFirebaseConfig(); // Try to load from backend/DB first

  // If backend didn't provide full config, fall back to VITE_ env for missing fields only
  if (!loadedFromBackend) {
    firebaseConfig.apiKey =
      firebaseConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || "";
    firebaseConfig.authDomain =
      firebaseConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "";
    firebaseConfig.projectId =
      firebaseConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || "";
    firebaseConfig.storageBucket =
      firebaseConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "";
    firebaseConfig.messagingSenderId =
      firebaseConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "";
    firebaseConfig.appId =
      firebaseConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || "";
    firebaseConfig.measurementId =
      firebaseConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "";
    firebaseConfig.vapidKey =
      firebaseConfig.vapidKey ||
      import.meta.env.VITE_FIREBASE_VAPID_KEY ||
      import.meta.env.VITE_FCM_VAPID_KEY ||
      "";
    firebaseConfig.databaseURL =
      firebaseConfig.databaseURL || import.meta.env.VITE_FIREBASE_DATABASE_URL || "";
  }

  // Validate Firebase configuration
  const requiredFields = [
    "apiKey",
    "authDomain",
    "projectId",
    "appId",
    "messagingSenderId",
  ];
  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field] || firebaseConfig[field] === "undefined",
  );

  if (missingFields.length > 0) {
    console.warn(
      "⚠️ Firebase configuration is missing required fields:",
      missingFields,
    );
    console.warn(
      "💡 Authentication features may not work until configured in Admin Panel.",
    );
    return;
  }

  try {
    const existingApps = getApps();
    if (existingApps.length === 0) {
      app = initializeApp(firebaseConfig);
      console.log(
        "🚀 Firebase initialized successfully with config from database",
      );
    } else {
      app = existingApps[0];
    }

    // Initialize Auth
    if (!firebaseAuth) {
      firebaseAuth = getAuth(app);
    }

    // Initialize Google Provider
    if (!googleProvider) {
      googleProvider = new GoogleAuthProvider();
      googleProvider.addScope("email");
      googleProvider.addScope("profile");
    }
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
  }

  return app;
}

export function getFirebaseVapidKey() {
  return firebaseConfig.vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY || import.meta.env.VITE_FCM_VAPID_KEY || "";
}

/** Realtime Database URL for live tracking (must match backend). Use with getDatabase(app, url). */
export function getFirebaseDatabaseURL() {
  return firebaseConfig.databaseURL || import.meta.env.VITE_FIREBASE_DATABASE_URL || "";
}

export { firebaseAuth, googleProvider, ensureFirebaseInitialized };
