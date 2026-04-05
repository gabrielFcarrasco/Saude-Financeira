import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

// Esta função agora devolve APENAS o texto bruto bagunçado
export const extrairTextoBrutoDoPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = '';

    // Extrai o texto de todas as páginas, sem se preocupar com a ordem ou linhas
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const stringsDaPagina = textContent.items.map((item: any) => item.str).join(' ');
      textoCompleto += stringsDaPagina + '\n';
    }

    return textoCompleto;

  } catch (error) {
    console.error("Erro ao ler texto do PDF:", error);
    throw error;
  }
};