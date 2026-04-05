import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

interface TransacaoExtraida {
  descricao: string;
  valor: number;
  data: string;
  tipo: "receita" | "despesa";
}

export const extrairDadosExtratoComIA = functions
  .region("southamerica-east1") 
  .runWith({ 
    timeoutSeconds: 180, // Aumentamos para 2 minutos (o padrão é 60s)
    memory: "512MB"      // Damos um pouco mais de RAM para processar o texto
  })
  .https.onCall(async (data: any, context: any) => {
    
    // 1. Verificações de Segurança
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário precisa estar logado.");
    }

    const textoBruto = data.texto;
    if (!textoBruto || textoBruto.length < 50) {
      throw new functions.https.HttpsError("invalid-argument", "O texto do PDF parece inválido ou curto demais.");
    }

    try {
      // 🚀 O TRUQUE: Lazy Loading! A IA só é carregada aqui, no momento do uso.
      // Isso impede o Firebase de dar Timeout na hora do deploy!
      const genai = require("@google/genai");
      
      // 2. Inicializa o SDK com a sua chave do arquivo .env
      const ai = new genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

      const prompt = `
        Aja como um analista financeiro sênior especializado em leitura de extratos bancários brasileiros.
        Sua tarefa é ler o texto bruto e bagunçado de um PDF de extrato abaixo e extrair APENAS as transações válidas (compras, pix enviados, pix recebidos, salários, pagamentos).

        REGRAS CRÍTICAS DE EXTRAÇÃO:
        1. **Valores:** Se o valor tiver um sinal de menos (-) na frente, atrás ou a palavra "DÉBITO/DEB", classifique como "despesa". Se não tiver sinal ou tiver (+) ou "CRÉDITO/CRE", classifique como "receita". Converta o valor para número puro (ex: "R$ 1.500,00-" vira 1500.0).
        2. **Datas:** Converta datas como 12/03 ou 12/03/2026 para o padrão ISO YYYY-MM-DD. Se não tiver ano, assuma o ano atual.
        3. **Filtro de Lixo:** Ignore linhas de saldo anterior, saldo atual, totalizadores de período, rendimentos de poupança automática ou textos explicativos do banco. Pegue apenas o que mudou o saldo real.
        4. **Saída:** Me devolva estritamente um array JSON perfeito, sem textos antes ou depois, seguindo este formato de TypeScript:
        Array<TransacaoExtraida>

        TEXTO BRUTO DO PDF:
        ---
        ${textoBruto}
        ---
      `;

      // 4. Chama a IA
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // O modelo ultra-rápido que você sugeriu!
        contents: prompt
      });

      let textoJson = response.text || "";

      // Limpeza de segurança caso a IA mande blocos de código
      textoJson = textoJson.replace(/```json/g, "").replace(/```/g, "").trim();

      const transacoes: TransacaoExtraida[] = JSON.parse(textoJson);

      console.log(`IA leu com sucesso ${transacoes.length} transações.`);

      return { status: "success", data: transacoes };

    } catch (error) {
      console.error("Erro técnico na função de IA:", error);
      throw new functions.https.HttpsError("internal", "A IA falhou em analisar o documento.");
    }
  });