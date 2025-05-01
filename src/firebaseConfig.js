import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase configuration object.
 * Reads sensitive keys and identifiers from environment variables
 * (`import.meta.env.VITE_*`). These variables must be correctly set up
 * in the project's environment (e.g., via .env files) for the application
 * to connect to the correct Firebase project.
 *
 * {object} firebaseConfig
 * @property {string} apiKey - Firebase project API key.
 * @property {string} authDomain - Firebase project authentication domain.
 * @property {string} projectId - Firebase project ID.
 * @property {string} storageBucket - Firebase project storage bucket.
 * @property {string} messagingSenderId - Firebase project messaging sender ID.
 * @property {string} appId - Firebase project application ID.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * The initialized Firebase application instance.
 * This is the core object representing the connection to your Firebase project.
 * All other Firebase services are accessed through this instance.
 *
 * {import("firebase/app").FirebaseApp} app
 */
const app = initializeApp(firebaseConfig);

/**
 * The Firebase Authentication service instance.
 * This object provides methods for managing user authentication,
 * such as signing up, logging in, logging out, and observing auth state changes.
 *
 * {import("firebase/auth").Auth} auth
 */
const auth = getAuth(app);

/**
 * The Cloud Firestore database service instance.
 * This object provides methods for interacting with the NoSQL Firestore database,
 * enabling data reading, writing, updating, and deleting operations.
 *
 * {import("firebase/firestore").Firestore} firestore
 */
const firestore = getFirestore(app);

// Export the initialized services for use in other parts of the application.
export { auth, firestore, app };
