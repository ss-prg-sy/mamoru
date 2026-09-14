import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXX4lGVWfiLS-YLnA4-S68yocolUhqkzk",
  authDomain: "mamoru-bbe60.firebaseapp.com",
  projectId: "mamoru-bbe60",
  storageBucket: "mamoru-bbe60.firebasestorage.app",
  messagingSenderId: "1051986881035",
  appId: "1:1051986881035:web:9506f744f39de8b77c350e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);