import { useState, useRef, useEffect } from 'react';
import { enviarMensagemParaGemini } from '../services/gemini';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './GeminiWidget.css';

export const GeminiWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState<string>(''); // Guarda o resumo financeiro real
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const user = auth.currentUser;
  const primeiroNome = user?.displayName ? user.displayName.split(' ')[0] : 'Investidor';

  const [messages, setMessages] = useState([
    { role: 'bot', text: `Olá, ${primeiroNome}! Sou seu Co-piloto GC. Estou aqui para analisar seus padrões e te ajudar a tomar as melhores decisões com o seu dinheiro. Qual é o plano para hoje?` }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  // Busca os dados do usuário no Firestore quando o widget for aberto
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !isOpen) return;

      try {
        // 1. Busca Transações (Despesas e Rendas)
        const qTransacoes = query(collection(db, 'transacoes'), where('userId', '==', user.uid));
        const transacoesSnapshot = await getDocs(qTransacoes);
        
        let totalReceitas = 0;
        let totalDespesas = 0;
        
        transacoesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.tipo === 'receita') totalReceitas += data.valor;
          if (data.tipo === 'despesa') totalDespesas += data.valor;
        });

        // 2. Busca Metas
        const qMetas = query(collection(db, 'metas'), where('userId', '==', user.uid));
        const metasSnapshot = await getDocs(qMetas);
        
        let metasDesc = metasSnapshot.empty ? "Nenhuma meta cadastrada." : "";
        metasSnapshot.forEach(doc => {
          const data = doc.data();
          metasDesc += `Meta: ${data.titulo} (Progresso: R$${data.atual} de R$${data.alvo}). `;
        });

        const saldo = totalReceitas - totalDespesas;
        
        // Monta o resumo final que será enviado ocultamente para o Gemini
        const resumoContexto = `DADOS REAIS DO USUÁRIO: Renda Total Declarada: R$${totalReceitas}. Despesas Totais: R$${totalDespesas}. Saldo Atual: R$${saldo}. ${metasDesc}`;
        
        setContextData(resumoContexto);

      } catch (error) {
        console.error("Erro ao buscar contexto financeiro:", error);
      }
    };

    fetchUserData();
  }, [user, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const textoUsuario = input.trim();
    setInput(''); 

    const novasMensagens = [...messages, { role: 'user', text: textoUsuario }];
    setMessages(novasMensagens);
    setIsLoading(true);

    try {
      // Envia a pergunta do usuário junto com os dados reais do banco
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
          <span style={{ fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-h)' }}>Co-piloto GC</span>
        </div>
        <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="ai-body">
        {messages.map((msg, idx) => (
          <div key={idx} className={`ai-message ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        
        {/* Nova Animação de Digitando */}
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
          placeholder="Como posso te ajudar hoje?"
          disabled={isLoading}
          className="ai-input"
        />
        <button type="submit" className="ai-send-btn" disabled={isLoading}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="#ffffff" 
            style={{ display: 'block', flexShrink: 0, transform: 'translateX(2px)' }}
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
};
