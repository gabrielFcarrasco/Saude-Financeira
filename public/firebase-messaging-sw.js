// public/firebase-messaging-sw.js

// Importando os scripts de compatibilidade do Firebase para o Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Inicializando com as suas credenciais
firebase.initializeApp({
  apiKey: "AIzaSyCgfKbs00pS4jHMVgkFyJ42ImIaxpi7XEw",
  authDomain: "sistema-logistica-3eadb.firebaseapp.com",
  projectId: "sistema-logistica-3eadb",
  storageBucket: "sistema-logistica-3eadb.firebasestorage.app",
  messagingSenderId: "195671195653",
  appId: "1:195671195653:web:af63aed56492c8aa131c6c",
  measurementId: "G-HBF2PH1WT3"
});

const messaging = firebase.messaging();

// Escutando as notificações em segundo plano (quando o app está fechado)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recebido em segundo plano: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' // Troque pelo caminho do ícone do seu app
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});