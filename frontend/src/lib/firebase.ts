import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFbZshAE9uiA9SuLYN3oVVVw_d2uUX6cM",
  authDomain: "aixpravo.firebaseapp.com",
  projectId: "aixpravo",
  storageBucket: "aixpravo.firebasestorage.app",
  messagingSenderId: "760378151542",
  appId: "1:760378151542:web:804038b6951be7a9378557",
  measurementId: "G-S73352N3CV",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
