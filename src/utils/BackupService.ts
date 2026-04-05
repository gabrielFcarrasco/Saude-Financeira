import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

// 1. GERA O ARQUIVO .JSON E FAZ O DOWNLOAD
export const gerarBackupCompleto = async (userId: string) => {
  try {
    const colecoes = ['transacoes', 'dividas', 'metas'];
    const backupData: Record<string, any[]> = {};

    for (const col of colecoes) {
      const q = query(collection(db, col), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      backupData[col] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        delete data.userId; // Removemos o ID antigo para não dar conflito na restauração
        delete data.criadoEm; // Removemos o timestamp antigo
        return data;
      });
    }

    // Cria o arquivo JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `GC_Planner_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode); // Requerido pro Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    return true;
  } catch (error) {
    console.error("Erro ao gerar backup:", error);
    throw error;
  }
};

// 2. LÊ O .JSON E REINJETA NO BANCO
export const restaurarBackupJSON = async (file: File, userId: string) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Verifica se é um arquivo válido do nosso sistema
        if (!json.transacoes && !json.dividas && !json.metas) {
          throw new Error("Arquivo de backup inválido.");
        }

        const colecoes = ['transacoes', 'dividas', 'metas'];
        
        for (const col of colecoes) {
          if (json[col] && Array.isArray(json[col])) {
            for (const item of json[col]) {
              await addDoc(collection(db, col), {
                ...item,
                userId: userId,
                criadoEm: serverTimestamp()
              });
            }
          }
        }
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};