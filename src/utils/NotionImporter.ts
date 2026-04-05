import JSZip from 'jszip';
import Papa from 'papaparse';

export const importarDoNotion = async (file: File) => {
  const zip = new JSZip();
  const resultados: any[] = [];

  try {
    // 1. Abre o arquivo ZIP
    const conteudoZip = await zip.loadAsync(file);
    
    // 2. Procura todos os arquivos .csv lá dentro
    const csvFiles = Object.keys(conteudoZip.files).filter(nome => nome.endsWith('.csv'));

    if (csvFiles.length === 0) {
      throw new Error("Nenhum arquivo CSV encontrado dentro do ZIP.");
    }

    // 3. Lê e processa cada CSV
    for (const nomeArquivo of csvFiles) {
      const csvData = await conteudoZip.files[nomeArquivo].async('string');
      
      const parseResult = Papa.parse(csvData, {
        header: true, // Usa a primeira linha como chave do objeto
        skipEmptyLines: true,
      });

      const linhas = parseResult.data as any[];

      linhas.forEach(linha => {
        // Mapeamento Inteligente: Tenta achar as colunas independente de como o usuário nomeou
        const chaves = Object.keys(linha);
        
        // Pega os valores ignorando letras maiúsculas/minúsculas
        const getValor = (termos: string[]) => {
          const chaveEncontrada = chaves.find(c => termos.some(t => c.toLowerCase().includes(t)));
          return chaveEncontrada ? linha[chaveEncontrada] : null;
        };

        const nome = getValor(['nome', 'descrição', 'titulo', 'title', 'name']) || 'Sem Nome';
        const valorRaw = getValor(['valor', 'preço', 'amount', 'price']);
        const dataRaw = getValor(['data', 'date', 'quando', 'vencimento']);
        const tipoRaw = getValor(['tipo', 'type']);
        const categoria = getValor(['categoria', 'category', 'tag']) || 'Outros';

        // Tenta limpar e converter o valor (R$ 1.500,00 -> 1500.00)
        let valor = 0;
        if (valorRaw) {
          const limpo = valorRaw.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
          valor = parseFloat(limpo);
        }

        // Tenta identificar se é Despesa ou Receita
        let tipo = 'despesa';
        if (tipoRaw && (tipoRaw.toLowerCase().includes('receita') || tipoRaw.toLowerCase().includes('entrada') || tipoRaw.toLowerCase().includes('income'))) {
          tipo = 'receita';
        } else if (valor > 0 && !tipoRaw) {
           // Se não tem coluna tipo, mas o valor é positivo, vamos chutar que é despesa (padrão)
           tipo = 'despesa';
        }

        // Tenta padronizar a data para YYYY-MM-DD
        let data = new Date().toISOString().split('T')[0];
        if (dataRaw) {
          // Lógica básica: tenta converter a string do Notion para Data
          const parsedDate = new Date(dataRaw);
          if (!isNaN(parsedDate.getTime())) {
            data = parsedDate.toISOString().split('T')[0];
          }
        }

        if (valor && !isNaN(valor)) {
          resultados.push({
            descricao: nome,
            valor: Math.abs(valor),
            data,
            categoria,
            tipo,
            conta: 'Importado Notion',
            status: 'pago'
          });
        }
      });
    }

    return resultados;

  } catch (error) {
    console.error("Erro ao ler Notion:", error);
    throw error;
  }
};