import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { enviarMensagemParaGemini } from '../../services/gemini';

// ✨ O SEGREDO INFALÍVEL: Ícones convertidos em Imagens puras (Imunes a bloqueios de CSS)
const ICON_BOT = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='10' rx='2'/%3E%3Ccircle cx='12' cy='5' r='2'/%3E%3Cpath d='M12 7v4'/%3E%3Cline x1='8' y1='16' x2='8' y2='16'/%3E%3Cline x1='16' y1='16' x2='16' y2='16'/%3E%3C/svg%3E";
const ICON_SEND = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='22' y1='2' x2='11' y2='13'/%3E%3Cpolygon points='22 2 15 22 11 13 2 9 22 2'/%3E%3C/svg%3E";

export const OrcamentoModalAssistente = ({
  assistenteAberto, setAssistenteAberto, casalId, 
  parceiro1, parceiro2, limiteMensalLazer, gastoEPlanejado, 
  caixinhasValidas, gastosPorCaixinha, saidasMesAtual, formatMoney
}: any) => {

  const [inputTexto, setInputTexto] = useState('');
  const [perguntaFeita, setPerguntaFeita] = useState('');
  const [respostaIA, setRespostaIA] = useState('');
  const [isPensando, setIsPensando] = useState(false);
  
  // Estado para a animação de texto (agora super limpo)
  const [etapaIA, setEtapaIA] = useState('');
  
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [perguntaFeita, respostaIA, isPensando, etapaIA]);

  // Limpa o chat ao fechar
  useEffect(() => {
    if (!assistenteAberto) {
      setInputTexto('');
      setPerguntaFeita('');
      setRespostaIA('');
      setIsPensando(false);
    }
  }, [assistenteAberto]);

  // Lógica da animação Limpa (Pensando -> Analisando -> Digitando)
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    if (isPensando) {
      setEtapaIA('Pensando...');
      timer1 = setTimeout(() => setEtapaIA('Analisando as categorias...'), 1500);
      timer2 = setTimeout(() => setEtapaIA('Digitando...'), 3500);
    } else {
      setEtapaIA('');
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isPensando]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputTexto(e.target.value);
    e.target.style.height = 'auto'; 
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; 
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      fazerPergunta(inputTexto);
    }
  };

  if (!assistenteAberto) return null;

  const restante = limiteMensalLazer - gastoEPlanejado;

  const fazerPergunta = async (textoPergunta: string) => {
    if (!textoPergunta.trim() || isPensando) return;
    
    setInputTexto('');
    setPerguntaFeita(textoPergunta);
    setIsPensando(true);
    setRespostaIA('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const contexto = `
      Você é um Assistente Financeiro e de Lazer super inteligente para um casal brasileiro (${parceiro1} e ${parceiro2}).
      Realidade atual deste mês:
      - Teto de Lazer do Casal: ${formatMoney(limiteMensalLazer)}
      - Já gastaram/planejaram: ${formatMoney(gastoEPlanejado)}
      - Sobra atual: ${formatMoney(restante)}
      
      Categorias de Lazer deles:
      ${caixinhasValidas.map((c:any) => `- ${c.nome}: Teto de ${formatMoney(c.valor)}, já usaram ${formatMoney(gastosPorCaixinha[c.id] || 0)}. Sobra: ${formatMoney(c.valor - (gastosPorCaixinha[c.id] || 0))}`).join('\n')}
      
      Passeios recentes/planejados: ${saidasMesAtual.map((s:any) => s.titulo).join(', ') || 'Nenhum rolê ainda'}.

      Regras: 
      1. Use português do Brasil de forma amigável, natural, informal e animada (como um amigo no WhatsApp).
      2. Use os dados reais acima para dar dicas concretas e calcular as coisas se eles pedirem.
      3. Se a grana tiver curta, sugira rolês mais em conta ou em casa.
      4. Sem usar emojis excessivos, foque no conteúdo.
      5. Use quebras de linha limpas e negritos para facilitar a leitura.
    `;

    try {
      const resposta = await enviarMensagemParaGemini(textoPergunta, contexto);
      setRespostaIA(resposta.replace(/^"|"$/g, ''));
    } catch (error) {
      setRespostaIA("Putz, deu um probleminha na conexão aqui. Consegue tentar mandar de novo?");
    } finally {
      setIsPensando(false);
    }
  };

  const sugestoesRapidas = [
    "Dá uma ideia de date legal pro fim de semana!",
    "Como estão nossos gastos? Dá uma analisada.",
    "Sugere uns rolês baratos pra gente fazer juntos.",
  ];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px 24px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {/* TOPO: TÍTULO E BOTÃO DE FECHAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0, paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* O Ícone do Robozinho blindado contra CSS */}
              <img src={ICON_BOT} alt="Bot" style={{ width: '18px', height: '18px' }} />
            </div>
            Assistente
          </h3>
          
          <button 
            onClick={() => setAssistenteAberto(false)} 
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'sans-serif', padding: 0 }}
          >
            {/* O "X" puro, sem SVGs */}
            X
          </button>
        </div>

        {/* ÁREA DE CHAT SCROLLÁVEL */}
        <div ref={chatRef} style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* BOAS-VINDAS */}
          <div style={{ alignSelf: 'flex-start', background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: '0 20px 20px 20px', maxWidth: '90%' }}>
            <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Oi! Eu sei bem como estão as categorias de vocês e os rolês que planejaram pra esse mês. Pode me perguntar qualquer coisa, pedir dicas ou pedir pra eu analisar a sobra do caixa. O que vamos fazer hoje?
            </p>
          </div>

          {/* CHIPS DE SUGESTÃO RÁPIDA */}
          {!perguntaFeita && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase', paddingLeft: '8px' }}>Perguntas rápidas</span>
              {sugestoesRapidas.map((sug, i) => (
                <button key={i} onClick={() => fazerPergunta(sug)} style={{ background: 'transparent', border: '1px solid var(--accent)', padding: '14px 16px', borderRadius: '16px', color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {sug} 
                  {/* Setinha usando caractere universal de texto */}
                  <span style={{ fontSize: '1.3rem', paddingBottom: '2px', lineHeight: 0 }}>›</span>
                </button>
              ))}
            </div>
          )}

          {/* MENSAGEM DO USUÁRIO */}
          {perguntaFeita && (
            <div className="animate-slide-up" style={{ alignSelf: 'flex-end', background: 'var(--accent)', color: '#fff', padding: '14px 20px', borderRadius: '20px 20px 0 20px', maxWidth: '85%' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>{perguntaFeita}</p>
            </div>
          )}

          {/* TEXTO DE LOADING LIMPO OU RESPOSTA DA IA */}
          {(isPensando || respostaIA) && (
            <div className="animate-fade-in" style={{ alignSelf: 'flex-start', background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: '0 20px 20px 20px', maxWidth: '90%', marginTop: '4px' }}>
              {isPensando ? (
                <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  {etapaIA}
                </div>
              ) : (
                <div style={{ color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {respostaIA.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* INPUT DE CONVERSA */}
        <div style={{ display: 'flex', gap: '12px', background: 'var(--code-bg)', padding: '8px 12px', borderRadius: '24px', border: '1px solid var(--border)', flexShrink: 0, alignItems: 'flex-end' }}>
          <textarea 
            ref={textareaRef}
            rows={1}
            value={inputTexto} 
            onChange={handleInput} 
            onKeyDown={handleKeyDown}
            placeholder="Mensagem..." 
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-h)', padding: '8px 4px', outline: 'none', fontSize: '1rem', resize: 'none', minHeight: '40px', maxHeight: '120px', fontFamily: 'inherit' }}
          />
          <button 
            onClick={() => fazerPergunta(inputTexto)}
            disabled={!inputTexto.trim() || isPensando}
            style={{ background: 'var(--accent)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (!inputTexto.trim() || isPensando) ? 0.5 : 1, transition: '0.2s', marginBottom: '2px', flexShrink: 0 }}
          >
            {/* O Avião Mágico: Imune a resets de CSS */}
            <img src={ICON_SEND} alt="Enviar" style={{ width: '18px', height: '18px', transform: 'translateX(-1px)' }} />
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};