import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

export const notificarNovoMovimento = onDocumentCreated(
  "casais/{casalId}/cofre/{transacaoId}",
  async (event) => {
    const snap = event.data;
    
    if (!snap) return;

    const novaTransacao = snap.data();
    const casalId = event.params.casalId;

    const casalDoc = await admin.firestore().collection("casais").doc(casalId).get();
    
    if (!casalDoc.exists) return;

    const dadosCasal = casalDoc.data();
    const tokens = dadosCasal?.tokens; 

    if (!tokens || tokens.length === 0) return;

    const mensagem = {
      notification: {
        title: "Nova movimentação no cofre! 💰",
        body: `Um novo valor de R$ ${novaTransacao.valor} foi adicionado.`,
      },
      tokens: tokens, 
    };

    try {
      const resposta = await admin.messaging().sendEachForMulticast(mensagem);
      console.log(`${resposta.successCount} notificações enviadas com sucesso!`);
    } catch (erro) {
      console.error("Erro ao enviar a notificação:", erro);
    }
  }
);