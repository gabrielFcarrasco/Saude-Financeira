import { useState, useRef, useEffect } from 'react';
import { enviarMensagemParaGemini } from '../../services/gemini';
import { auth, db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './GeminiWidget.css';

// Adicionamos props para saber se o usuário está em um casal e qual o ID desse vínculo
export const GeminiWidget = ({ isCasal = false, idCasal = '' }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState<string>(''); 
  
  // Novo estado para controlar de qual carteira a IA está falando
  // Se não for casal, já vai direto pro 'pessoal'. Se for casal, fica 'pendente' até ele escolher.
  const [modoConsulta, setModoConsulta] = useState<'pendente' | 'pessoal' | 'conjunto'>(isCasal ? 'pendente' : 'pessoal');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const user = auth.currentUser;
  const primeiroNome = user?.displayName ? user.displayName.split(' ')[0] : 'Investidor';

  // Mensagem inicial adaptada (agora suporta botões de opção)
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

  // Se for casal e a pessoa acabou de abrir o chat pela primeira vez, a IA pergunta qual o escopo
  useEffect(() => {
    if (isOpen && isCasal && messages.length === 1 && modoConsulta === 'pendente') {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'bot', 
          text: 'Como você tem uma conta conjunta vinculada, sobre qual planejamento vamos falar hoje?',
          opcoes: ['Meu Pessoal', 'Nosso Conjunto'] // Adicionamos opções interativas
        }
      ]);
    }
  }, [isOpen, isCasal, messages.length, modoConsulta]);

  // Busca os dados do usuário no Firestore baseando-se na escolha dele!
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !isOpen || modoConsulta === 'pendente') return;

      try {
        let qTransacoes, qMetas;

        // Se escolheu 'pessoal', busca da coleção normal do usuário
        if (modoConsulta === 'pessoal') {
          qTransacoes = query(collection(db, 'transacoes'), where('userId', '==', user.uid));
          qMetas = query(collection(db, 'metas'), where('userId', '==', user.uid));
        } 
        // Se escolheu 'conjunto', busca da coleção do casal usando o ID do casal
        else {
          qTransacoes = query(collection(db, 'transacoes_casal'), where('casalId', '==', idCasal));
          qMetas = query(collection(db, 'metas_casal'), where('casalId', '==', idCasal));
        }

        const transacoesSnapshot = await getDocs(qTransacoes);
        
        let totalReceitas = 0;
        let totalDespesas = 0;
        
        transacoesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.tipo === 'receita') totalReceitas += data.valor;
          if (data.tipo === 'despesa') totalDespesas += data.valor;
        });

        const metasSnapshot = await getDocs(qMetas);
        let metasDesc = metasSnapshot.empty ? "Nenhuma meta cadastrada." : "";
        metasSnapshot.forEach(doc => {
          const data = doc.data();
          metasDesc += `Meta: ${data.titulo} (Progresso: R$${data.atual} de R$${data.alvo}). `;
        });

        const saldo = totalReceitas - totalDespesas;
        
        // Monta o resumo e EXPLICITA para a IA qual o modo atual
        const contextoTipo = modoConsulta === 'pessoal' ? 'FINANÇAS PESSOAIS INDIVIDUAIS' : 'FINANÇAS CONJUNTAS DO CASAL';
        const resumoContexto = `CONTEXTO ATUAL: ${contextoTipo}. Renda Total Declarada: R$${totalReceitas}. Despesas Totais: R$${totalDespesas}. Saldo Atual: R$${saldo}. ${metasDesc}`;
        
        setContextData(resumoContexto);

      } catch (error) {
        console.error("Erro ao buscar contexto financeiro:", error);
      }
    };

    fetchUserData();
  }, [user, isOpen, modoConsulta, idCasal]); // Refaz a busca se o modoConsulta mudar

  // Função para quando a pessoa clica nos botões Pessoal/Conjunto
  const handleEscolherModo = (escolha: string) => {
    const modo = escolha === 'Meu Pessoal' ? 'pessoal' : 'conjunto';
    
    // Tira os botões da tela adicionando a resposta do usuário
    setMessages(prev => {
      const msgsSemBotoes = prev.map(m => ({ ...m, opcoes: undefined }));
      return [...msgsSemBotoes, { role: 'user', text: escolha }];
    });
    
    setModoConsulta(modo); // Isso engatilha o useEffect do Firebase acima!
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: `Perfeito! Já carreguei os dados do seu plano ${modo}. Como posso ajudar com isso?` }]);
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