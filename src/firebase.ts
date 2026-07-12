import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBAturoFsiGwTjNFOsRSEMgiLOjxyfE_rM",
  authDomain: "msoccer-djuma-13d00.firebaseapp.com",
  projectId: "msoccer-djuma-13d00",
  storageBucket: "msoccer-djuma-13d00.firebasestorage.app",
  messagingSenderId: "941532999611",
  appId: "1:941532999611:web:e02bda8b29ad2618351e9e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust multi-tab offline cache and forced long-polling
// Fall back to standard getFirestore if sandboxed iframe restricts IndexedDB/localStorage
export let db: any;
const dbId = "(default)";

try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, dbId);
} catch (e) {
  console.warn("Firestore offline cache initialization failed. Falling back to default memory-based Firestore.", e);
  db = getFirestore(app, dbId);
}

export const auth = getAuth(app);
export default app;
