// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5xusqH-dLaCEc6iFtNvu0TidRR3NEKJQ",
  authDomain: "control-flete.firebaseapp.com",
  projectId: "control-flete",
  storageBucket: "control-flete.firebasestorage.app",
  messagingSenderId: "202542017007",
  appId: "1:202542017007:web:87cbdab9883fa8b625ee1a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
