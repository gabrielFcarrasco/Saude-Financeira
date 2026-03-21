import { GoogleGenAI } from "@google/genai";

// Inicializa o cliente com a chave do Vite
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

export const enviarMensagemParaGemini = async (mensagemUsuario: string, contextoFinanceiro?: string) => {
  try {
    // Aqui damos a "personalidade" para a IA e injetamos os dados do usuário
    const promptConfigurado = `
      Você é o GC Assistente, um consultor financeiro especialista no método 50/30/20 e em quitação de dívidas pelo método Avalanche.
      Seja direto, empático e responda em no máximo 2 parágrafos curtos.
      
      Contexto atual do usuário (se houver):
      ${contextoFinanceiro || 'Nenhum dado financeiro fornecido no momento.'}

      Pergunta do usuário:
      "${mensagemUsuario}"
    `;

    // Chamada usando o novo modelo Gemini 3 Flash
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: promptConfigurado,
    });

    return response.text;
    
  } catch (error) {
    console.error("Erro ao consultar o Gemini:", error);
    return "Desculpe, meu sistema de análise está indisponível no momento. Tente novamente em alguns segundos.";
  }
};