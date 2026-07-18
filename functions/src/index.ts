import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Inicializa o Admin SDK para podermos enviar o Push
admin.initializeApp();

export const notificarParceiro = onDocumentUpdated("casais/{casalId}", async (event) => {
  // Na V2, os dados vêm dentro do objeto "event.data"
  if (!event.data) {
      console.log("Nenhum dado encontrado no evento.");
      return;
  }

  const antes = event.data.before.data();
  const depois = event.data.after.data();

  const notifsAntes = antes.notificacoes || [];
  const notifsDepois = depois.notificacoes || [];

  // Se a lista de notificações não cresceu, encerra a função
  if (notifsDepois.length <= notifsAntes.length) return;

  // Pega a última notificação da array
  const novaNotificacao = notifsDepois[notifsDepois.length - 1];
  
  let tokenDestino = null;

  // Lógica para descobrir de quem é o celular que vai receber o Push
  if (novaNotificacao.texto.includes(depois.nomeP1)) {
      tokenDestino = depois[`token_${depois.nomeP2}`];
  } else if (novaNotificacao.texto.includes(depois.nomeP2)) {
      tokenDestino = depois[`token_${depois.nomeP1}`];
  }

  if (!tokenDestino) {
      console.log("Token de destino não encontrado no banco.");
      return;
  }

  // Monta a notificação visual
  const payload = {
    notification: {
      title: 'Hub do Casal 💖',
      body: novaNotificacao.texto,
    }
  };

  // Dispara a notificação via Firebase Admin
  try {
      await admin.messaging().send({
          token: tokenDestino,
          notification: payload.notification
      });
      console.log("Push Notification disparada com sucesso!");
  } catch (error) {
      console.error("Erro ao enviar push:", error);
  }
});