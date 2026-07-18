import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// ✨ NOVO: Importando o serviço de mensageria
import { getMessaging } from "firebase/messaging"; 

const firebaseConfig = {
  apiKey: "AIzaSyCgfKbs00pS4jHMVgkFyJ42ImIaxpi7XEw",
  authDomain: "sistema-logistica-3eadb.firebaseapp.com",
  projectId: "sistema-logistica-3eadb",
  storageBucket: "sistema-logistica-3eadb.firebasestorage.app",
  messagingSenderId: "195671195653",
  appId: "1:195671195653:web:af63aed56492c8aa131c6c",
  measurementId: "G-HBF2PH1WT3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// ✨ NOVO: Exportando para podermos gerar o Token do aparelho
export const messaging = getMessaging(app);