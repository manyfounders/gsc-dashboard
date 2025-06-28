import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCnlPLZvdW9v_lwOmP6XnmJlzCHzMB5UwM",
  authDomain: "gcs-dashboard-0.firebaseapp.com",
  projectId: "gcs-dashboard-0",
  storageBucket: "gcs-dashboard-0.firebasestorage.app",
  messagingSenderId: "838905173751",
  appId: "1:838905173751:web:768cd4e14db8e9f54be5f2",
  measurementId: "G-CM25C78QXV"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber }; 