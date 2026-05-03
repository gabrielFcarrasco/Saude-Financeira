import { useState, useRef, useEffect } from 'react';
import { enviarMensagemParaGemini } from '../../services/gemini';
import { auth, db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './GeminiWidget.css';

export const GeminiWidget = ({ isCasal = false, idCasal = '' }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState<string>(''); 
  
  // Iniciamos como 'pessoal' por padrão para não quebrar quem é solteiro
  const [modoConsulta, setModoConsulta] = useState<'pendente' | 'pessoal' | 'conjunto'>('pessoal');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const user = auth.currentUser;
  const primeiroNome = user?.displayName ? user.displayName.split(' ')[0] : 'Investidor';

  const [messages, setMessages] = useState<any[]>([
    { 
      role: 'bot', 
      text: `Olá, ${primeiroNome}! Sou seu Co-piloto GC. Estou aqui para analisar seus padrões e ajudar com seu dinheiro.` 
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  // CORREÇÃO 1: Assim que o app descobrir que é casal, forçamos o modo para 'pendente'
  useEffect(() => {
    if (isCasal && messages.length === 1) {
      setModoConsulta('pendente');
    }
  }, [isCasal]);

  // CORREÇÃO 2: Dispara a pergunta inicial de forma segura
  useEffect(() => {
    if (isOpen && isCasal && modoConsulta === 'pendente') {
      // Verifica se já não fizemos a pergunta para não duplicar os botões
      const jaPerguntou = messages.some(m => m.opcoes);
      if (!jaPerguntou) {
        setMessages(prev => [
          ...prev, 
          { 
            role: 'bot', 
            text: 'Como você tem uma conta conjunta vinculada, sobre qual planejamento vamos falar hoje?',
            opcoes: ['Meu Pessoal', 'Nosso Conjunto'] 
          }
        ]);
      }
    }
  }, [isOpen, isCasal, modoConsulta, messages]);

  // CORREÇÃO 3: Rotas do banco de dados ajustadas para o padrão do CasalTab
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !isOpen || modoConsulta === 'pendente') return;

      try {
        let totalReceitas = 0;
        let totalDespesas = 0;
        let metasDesc = "";

        // DADOS PESSOAIS INDIVIDUAIS
        if (modoConsulta === 'pessoal') {
          const qTransacoes = query(collection(db, 'transacoes'), where('userId', '==', user.uid));
          const qMetas = query(collection(db, 'metas'), where('userId', '==', user.uid));

          const transacoesSnapshot = await getDocs(qTransacoes);
          transacoesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.tipo === 'receita') totalReceitas += Number(data.valor || 0);
            if (data.tipo === 'despesa') totalDespesas += Number(data.valor || 0);
          });

          const metasSnapshot = await getDocs(qMetas);
          metasDesc = metasSnapshot.empty ? "Nenhuma meta cadastrada." : "";
          metasSnapshot.forEach(doc => {
            const data = doc.data();
            metasDesc += `Meta: ${data.titulo} (Progresso: R$${data.atual} de R$${data.alvo}). `;
          });
        } 
        // DADOS CONJUNTOS DO CASAL
        else if (modoConsulta === 'conjunto' && idCasal) {
          const contribuicoesSnap = await getDocs(collection(db, 'casais', idCasal, 'contribuicoes'));
          const despesasSnap = await getDocs(collection(db, 'casais', idCasal, 'despesas_rapidas'));
          const metasSnap = await getDocs(collection(db, 'casais', idCasal, 'metas'));

          contribuicoesSnap.forEach(doc => {
            const data = doc.data();
            totalReceitas += (Number(data.p1Contr || 0) + Number(data.p2Contr || 0));
          });

          despesasSnap.forEach(doc => {
            totalDespesas += Number(doc.data().valor || 0);
          });

          metasDesc = metasSnap.empty ? "Nenhuma meta de casal cadastrada." : "";
          metasSnap.forEach(doc => {
            const data = doc.data();
            metasDesc += `Meta: ${data.titulo || data.nome} (Progresso: R$${data.atual} de R$${data.alvo}). `;
          });
        }

        const saldo = totalReceitas - totalDespesas;
        
        // Monta o resumo e EXPLICITA para a IA qual o modo atual
        const contextoTipo = modoConsulta === 'pessoal' ? 'FINANÇAS PESSOAIS INDIVIDUAIS' : 'FINANÇAS CONJUNTAS DO CASAL';
        const resumoContexto = `CONTEXTO ATUAL: ${contextoTipo}. Renda/Entradas Totais: R$${totalReceitas}. Despesas Totais: R$${totalDespesas}. Saldo Atual no Cofre: R$${saldo}. ${metasDesc}`;
        
        setContextData(resumoContexto);

      } catch (error) {
        console.error("Erro ao buscar contexto financeiro:", error);
      }
    };

    fetchUserData();
  }, [user, isOpen, modoConsulta, idCasal]);

  const handleEscolherModo = (escolha: string) => {
    const modo = escolha === 'Meu Pessoal' ? 'pessoal' : 'conjunto';
    
    setMessages(prev => {
      const msgsSemBotoes = prev.map(m => ({ ...m, opcoes: undefined }));
      return [...msgsSemBotoes, { role: 'user', text: escolha }];
    });
    
    setModoConsulta(modo); 
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: `Perfeito! Já conectei os dados da sua aba ${modo}. No que posso te ajudar com esses números?` }]);
    }, 600);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || modoConsulta === 'pendente') return;

    const textoUsuario = input.trim();
    setInput(''); 

    const novasMensagens = [...messages, { role: 'user', text: textoUsuario }];
    setMessages(novasMensagens);
    setIsLoading(true);

    try {
      const contextoCompleto = contextData || "Dados financeiros indisponíveis no momento.";
      const respostaIA = await enviarMensagemParaGemini(textoUsuario, contextoCompleto);
      
      setMessages([...novasMensagens, { role: 'bot', text: respostaIA || "Não consegui formular uma resposta clara agora." }]);
    } catch (error) {
      console.error("Erro interno:", error);
      setMessages([...novasMensagens, { role: 'bot', text: "Tive uma instabilidade na conexão. Podemos tentar novamente?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="ai-floating-btn" onClick={() => setIsOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="ai-widget">
      <div className="ai-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
          </svg>
          <span style={{ fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-h)' }}>
            Co-piloto GC {modoConsulta !== 'pendente' && <span style={{fontSize: '0.7rem', opacity: 0.7}}>({modoConsulta})</span>}
          </span>
        </div>
        <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="ai-body">
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className={`ai-message ${msg.role}`}>
              {msg.text}
            </div>
            
            {/* Renderiza os botões de escolha, se existirem nesta mensagem */}
            {msg.opcoes && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginLeft: '12px' }}>
                {msg.opcoes.map((opcao: string) => (
                  <button 
                    key={opcao} 
                    onClick={() => handleEscolherModo(opcao)}
                    style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ai-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder={modoConsulta === 'pendente' ? "Escolha uma opção acima..." : "Como posso te ajudar hoje?"}
          disabled={isLoading || modoConsulta === 'pendente'}
          className="ai-input"
        />
        <button type="submit" className="ai-send-btn" disabled={isLoading || !input.trim() || modoConsulta === 'pendente'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" style={{ display: 'block', flexShrink: 0, transform: 'translateX(2px)' }}>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
};