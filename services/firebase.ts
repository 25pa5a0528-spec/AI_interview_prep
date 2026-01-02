
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Updated configuration with user provided credentials
const firebaseConfig = {
  apiKey: "AIzaSyAS5HLk8vKrZXHiyvpiZjsX5RvN7Cv6VHw",
  authDomain: "hirepulse-1.firebaseapp.com",
  projectId: "hirepulse-1",
  storageBucket: "hirepulse-1.firebasestorage.app",
  messagingSenderId: "978979547248",
  appId: "1:978979547248:web:50287c2ce92373ec2d6cb5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
