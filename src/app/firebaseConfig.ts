import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

// Replace with your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB919MAHPHTzJoQLZi0IcLUpRW32Se2i8g",
    authDomain: "f1analysis-d2911.firebaseapp.com",
    projectId: "f1analysis-d2911",
    storageBucket: "f1analysis-d2911.firebasestorage.app",
    messagingSenderId: "1071034360240",
    appId: "1:1071034360240:web:6f2cdfa83a19f552ec7675",
    measurementId: "G-LXR9R11CVD"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);