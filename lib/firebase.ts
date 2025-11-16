// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBK7nmvzQ1Zmb2iiW2NAvJ-U8b8XloYKto",
  authDomain: "c-m-f-i-replay-f-63xui3.firebaseapp.com",
  projectId: "c-m-f-i-replay-f-63xui3",
  storageBucket: "c-m-f-i-replay-f-63xui3.appspot.com",
  messagingSenderId: "743892986646",
  appId: "1:743892986646:web:1f82cd0270676d74893e37",
  measurementId: "G-H61Z6J5T0F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;