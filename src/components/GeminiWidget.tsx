import { useState, useRef, useEffect } from 'react';
import { enviarMensagemParaGemini } from '../services/gemini';
import { auth } from '../services/firebase';
import './GeminiWidget.css';

export const GeminiWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Puxa o nome do usuário para personalizar a primeira mensagem
  const user = auth.currentUser;
  const nomeCompleto = user?.displayName || 'Investidor';
  const primeiroNome = nomeCompleto.split(' ')[0];

  const [messages, setMessages] = useState([
    { role: 'bot', text: `Olá, ${primeiroNome}! Sou seu Co-piloto GC. Estou aqui para analisar seus padrões e te ajudar a tomar as melhores decisões com o seu dinheiro. Qual é o plano para hoje?` }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]); // Rola para baixo sempre que abrir também

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const textoUsuario = input.trim();
    setInput(''); 

    const novasMensagens = [...messages, { role: 'user', text: textoUsuario }];
    setMessages(novasMensagens);
    setIsLoading(true);

    try {
      const contextoAtual = "Renda: R$ 4000. Despesas: R$ 3350. Saldo: R$ 650. O usuário atingiu 87% do limite do envelope de Lazer.";
      const respostaIA = await enviarMensagemParaGemini(textoUsuario, contextoAtual);
      
      setMessages([...novasMensagens, { role: 'bot', text: respostaIA || "Não consegui formular uma resposta clara agora." }]);
    } catch (error) {
      console.error("Erro interno:", error);
      setMessages([...novasMensagens, { role: 'bot', text: "Tive uma instabilidade na conexão. Podemos tentar novamente?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Botão flutuante (Fechado)
  if (!isOpen) {
    return (
      <div 
        className="ai-floating-btn"
        onClick={() => setIsOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
        </svg>
      </div>
    );
  }

  // Widget Aberto
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
        
        {isLoading && (
          <div className="ai-message bot" style={{ opacity: 0.7, fontStyle: 'italic', background: 'transparent', border: 'none', padding: '4px 12px' }}>
            Processando estratégia...
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};