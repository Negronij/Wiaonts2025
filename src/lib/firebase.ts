
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase para Wion
const firebaseConfig = {
  apiKey: "AIzaSyAnu_kMeNGdaqcIKJlKsWrgAtCBUDWcppc",
  authDomain: "wion-e32c0.firebaseapp.com",
  projectId: "wion-e32c0",
  storageBucket: "wion-e32c0.appspot.com",
  messagingSenderId: "893242593046",
  appId: "1:893242593046:web:288c9d45ca5a2872230a37",
  measurementId: "G-LKMND5P5XN"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
