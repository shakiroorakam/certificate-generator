// =========================================================================
// FILE: src/firebase/config.js
// This file initializes Firebase and exports the database and storage instances.
// =========================================================================
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// IMPORTANT: Replace with your actual Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyCyLJs8luOD9-IoYhS9CaeQzKN5vwMl4PY",
  authDomain: "certificate-generator-9ca1b.firebaseapp.com",
  projectId: "certificate-generator-9ca1b",
  storageBucket: "certificate-generator-9ca1b.firebasestorage.app",
  messagingSenderId: "721034901469",
  appId: "1:721034901469:web:d1fa9ee3b7a375800a2834",
  measurementId: "G-G06BELPE85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
