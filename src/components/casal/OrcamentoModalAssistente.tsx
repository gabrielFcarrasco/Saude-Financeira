import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { enviarMensagemParaGemini } from '../../services/gemini';

const ICON_BOT = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='10' rx='2'/%3E%3Ccircle cx='12' cy='5' r='2'/%3E%3Cpath d='M12 7v4'/%3E%3Cline x1='8' y1='16' x2='8' y2='16'/%3E%3Cline x1='16' y1='16' x2='16' y2='16'/%3E%3C/svg%3E";
const ICON_SEND = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='22' y1='2' x2='11' y2='13'/%3E%3Cpolygon points='22 2 15 22 11 13 2 9 22 2'/%3E%3C/svg%3E";

export const OrcamentoModalAssistente = ({
  assistenteAberto, setAssistenteAberto, casalId, 
  parceiro1, parceiro2, limiteMensalLazer, gastoEPlanejado, 
  caixinhasValidas, gastosPorCaixinha, saidasMesAtual, formatMoney,
  rendaP1, rendaP2 // ✨ As rendas chegaram aqui
}: any) => {

  const [inputTexto, setInputTexto] = useState('');
  const [perguntaFeita, setPerguntaFeita] = useState('');
  const [respostaIA, setRespostaIA] = useState('');
  const [isPensando, setIsPensando] = useState(false);
  const [etapaIA, setEtapaIA] = useState('');
  
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [perguntaFeita, respostaIA, isPensando, etapaIA]);

  useEffect(() => {
    if (!assistenteAberto) {
      setInputTexto(''); setPerguntaFeita(''); setRespostaIA(''); setIsPensando(false);
    }
  }, [assistenteAberto]);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    if (isPensando) {
      setEtapaIA('Lendo extratos detalhados...');
      timer1 = setTimeout(() => setEtapaIA('Cruzando dados com a renda...'), 1500);
      timer2 = setTimeout(() => setEtapaIA('Analisando locais e digitando...'), 3500);
    } else {
      setEtapaIA('');
    }
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
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

  // ✨ A MÁGICA DE VERDADE: O MEGA PROMPT
  const fazerPergunta = async (textoPergunta: string) => {
    if (!textoPergunta.trim() || isPensando) return;
    
    setInputTexto('');
    setPerguntaFeita(textoPergunta);
    setIsPensando(true);
    setRespostaIA('');
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // 1. Mapeamento Profundo: A IA vai ler centavo por centavo de cada item!
    const passeiosDetalhados = saidasMesAtual.map((s: any) => {
      let detalhe = `- Rolê "${s.titulo}" (${s.status}): Total ${formatMoney(s.estimado || 0)}.`;
      if (s.itens && s.itens.length > 0) {
         const itensStr = s.itens.map((i: any) => `[Item: ${i.nome || '?'}, Valor: ${formatMoney(i.valor)}]`).join(', ');
         detalhe += ` O que compraram lá dentro: ${itensStr}.`;
      }
      return detalhe;
    }).join('\n      ');

    // 2. O Contexto Monstruoso
    const contexto = `
      SISTEMA: VOCÊ É O "CÉREBRO FINANCEIRO E GUIA LOCAL DO CASAL", um assistente ultra-avançado especializado em finanças, análise comportamental e guia de lazer no Estado de São Paulo, focando especialmente na Capital, Região Metropolitana e no ABC Paulista (Santo André, São Bernardo, São Caetano, Mauá, etc.).

      👥 PERFIL FINANCEIRO DO CASAL:
      - Renda do(a) ${parceiro1}: ${formatMoney(rendaP1)}
      - Renda do(a) ${parceiro2}: ${formatMoney(rendaP2)}
      - Teto de Lazer Conjunto: ${formatMoney(limiteMensalLazer)}
      - Já gastaram/planejaram: ${formatMoney(gastoEPlanejado)}
      - CAIXA LIVRE (Sobra real para gastar hoje): ${formatMoney(restante)}

      📊 CATEGORIAS (ORÇAMENTO VS USO):
      ${caixinhasValidas.map((c:any) => `- ${c.nome}: Teto ${formatMoney(c.valor)} | Usado: ${formatMoney(gastosPorCaixinha[c.id] || 0)}`).join('\n')}
      
      🛒 EXTRATO DETALHADO E COMPORTAMENTO DE GASTOS (LEIA COM ATENÇÃO):
      ${passeiosDetalhados || 'Nenhum rolê registrado ainda.'}

      🧠 MOTOR DE INFERÊNCIA E REGRAS ABSOLUTAS:
      1. ANÁLISE SEMÂNTICA PROFUNDA: Nunca seja genérico. Leia os nomes dos itens inseridos livremente no extrato (ex: "Ifood", "McDonalds", "Dogão", "Uber", "Estacionamento", "Cerveja"). Agrupe-os logicamente na sua mente. Se perguntarem "com o que gastamos mais?", SOME os itens semelhantes invisivelmente e entregue a resposta mastigada: "Vocês torraram R$ X só com delivery e lanches (como o McDonalds e o Dogão)". Prove que você leu os itens citando os nomes deles!
      2. ANÁLISE DE RENDA E ESFORÇO: Avalie o peso dos gastos com base na renda de cada um. Se a sobra estiver apertada, avise.
      3. GUIA LOCAL ESPECIALIZADO (SP e ABC): Ao sugerir passeios, você DEVE recomendar locais REAIS e conhecidos em São Paulo e na região do ABC Paulista cruzando com o valor exato do "CAIXA LIVRE".
         - Sobra BAIXA (Menos de R$ 50): Sugira rolês quase gratuitos como o Parque Celso Daniel (Santo André), Parque da Juventude (SBC), Parque Guapituba (Mauá), Av. Paulista de domingo, SESCs do ABC ou de SP, ou noites criativas em casa.
         - Sobra MÉDIA (R$ 50 a R$ 150): Sugira boliche no ABC, Rota dos Restaurantes no Demarchi (SBC), comer um lanche artesanal, ir ao cinema VIP do Grand Plaza ou passeios culturais no Centro de SP.
         - Sobra ALTA (Acima de R$ 150): Dê opções premium de restaurantes, teatro, ou viagens curtas de bate-volta (Paranapiacaba, Litoral sul).
      4. CÁLCULO MATEMÁTICO FORÇADO: Se eles perguntarem "Dá pra ir no cinema hoje?", faça a conta cruzando o preço médio de cinema com o "Caixa Livre" e dê a resposta exata.
      5. TOM DE VOZ: Seja extremamente analítico, sagaz, mas muito amigável e descolado (estilo paulista, informal). Seja o melhor amigo do casal. VOCÊ DEVE iniciar a conversa chamando-os pelos nomes (${parceiro1} e ${parceiro2}) para ficar bem pessoal e carinhoso!
      6. FORMATO: Sem limites de criatividade. Use respostas estruturadas com bullet points e NEGRITOS nos valores, nomes de locais e nomes dos itens gastos.
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
    "No que a gente gastou mais dinheiro nesse mês?",
    "A gente tá gastando muito com comida?",
    "Sugere um rolê maneiro aqui perto pro fim de semana!",
  ];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px 24px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0, paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={ICON_BOT} alt="Bot" style={{ width: '18px', height: '18px' }} />
            </div>
            Assistente
          </h3>
          
          <button 
            onClick={() => setAssistenteAberto(false)} 
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'sans-serif', padding: 0 }}
          >
            X
          </button>
        </div>

        <div ref={chatRef} style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ alignSelf: 'flex-start', background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: '0 20px 20px 20px', maxWidth: '90%' }}>
            <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              E aí! Eu já li cada centavo do extrato de vocês e cruzei com as rendas e o teto do mês. Quer que eu faça a conta de algum rolê ou que eu entregue onde o dinheiro tá sumindo? Pode mandar!
            </p>
          </div>

          {!perguntaFeita && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase', paddingLeft: '8px' }}>Perguntas rápidas</span>
              {sugestoesRapidas.map((sug, i) => (
                <button key={i} onClick={() => fazerPergunta(sug)} style={{ background: 'transparent', border: '1px solid var(--accent)', padding: '14px 16px', borderRadius: '16px', color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {sug} 
                  <span style={{ fontSize: '1.3rem', paddingBottom: '2px', lineHeight: 0 }}>›</span>
                </button>
              ))}
            </div>
          )}

          {perguntaFeita && (
            <div className="animate-slide-up" style={{ alignSelf: 'flex-end', background: 'var(--accent)', color: '#fff', padding: '14px 20px', borderRadius: '20px 20px 0 20px', maxWidth: '85%' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>{perguntaFeita}</p>
            </div>
          )}

          {(isPensando || respostaIA) && (
            <div className="animate-fade-in" style={{ alignSelf: 'flex-start', background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: '0 20px 20px 20px', maxWidth: '90%', marginTop: '4px' }}>
              {isPensando ? (
                <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  {etapaIA}
                </div>
              ) : (
                <div 
                  style={{ color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: respostaIA.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} 
                />
              )}
            </div>
          )}
        </div>

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
            <img src={ICON_SEND} alt="Enviar" style={{ width: '18px', height: '18px', transform: 'translateX(-1px)' }} />
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};