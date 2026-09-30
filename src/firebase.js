import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKgGwzHJTjcUV6qsrEB5EOXbGzZgrJW5g",
  authDomain: "assignment7-7baaa.firebaseapp.com",
  projectId: "assignment7-7baaa",
  storageBucket: "assignment7-7baaa.firebasestorage.app",
  messagingSenderId: "401438856123",
  appId: "1:401438856123:web:6b2fcd09f855bb0136aa9e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);