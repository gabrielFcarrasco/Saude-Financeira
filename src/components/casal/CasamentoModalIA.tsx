import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { enviarMensagemParaGemini } from '../../services/gemini';

export const CasamentoModalIA = ({
  iaAberto, setIaAberto, 
  fornecedores, tetoCasamento, valorComprometido, diasRestantes, formatMoney,
  tarefas = [], convidados = [], valorPoupado = 0, parcelasProximas = [], parcelasAtrasadas = 0
}: any) => {

  const [inputTexto, setInputTexto] = useState('');
  const [respostaIA, setRespostaIA] = useState('');
  const [isPensando, setIsPensando] = useState(false);
  
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [respostaIA, isPensando]);

  if (!iaAberto) return null;

  // --- PREPARAÇÃO DO CONTEXTO PARA A IA ---
  const valorDisponivel = tetoCasamento - valorComprometido;
  const faltaPoupar = Math.max(0, tetoCasamento - valorPoupado);
  
  const fornecedoresFechados = fornecedores.filter((f: any) => f.status === 'fechado');
  const fornecedoresListados = fornecedores.map((f:any) => `- ${f.nome} (${f.categoria}): ${formatMoney(f.valor)} [Status: ${f.status}]`).join('\n');
  
  const convidadosPendentes = convidados.filter((c: any) => c.status === 'pendente').length;
  const convidadosConfirmados = convidados.filter((c: any) => c.status === 'confirmado').length;
  const totalConvidados = convidados.length;

  const tarefasPendentes = tarefas.filter((t: any) => t.status !== 'concluida');
  const tarefasUrgentes = tarefasPendentes.filter((t: any) => t.prioridade === 'Urgente');

  const fazerPergunta = async (pergunta: string) => {
    if (!pergunta.trim() || isPensando) return;
    
    setInputTexto(''); setIsPensando(true); setRespostaIA('');
    
    const contexto = `
      SISTEMA: Você é o "Assessor Financeiro e de Eventos" de um casamento de luxo. 
      CENÁRIO TEMPORAL: Faltam ${diasRestantes} dias para o casamento.
      
      DADOS FINANCEIROS ATUAIS:
      - Teto Máximo: ${formatMoney(tetoCasamento)}
      - Contratos Fechados: ${formatMoney(valorComprometido)}
      - Saldo Disponível para Gastar: ${formatMoney(valorDisponivel)}
      - Dinheiro Guardado no Cofrinho: ${formatMoney(valorPoupado)} (Falta poupar: ${formatMoney(faltaPoupar)})
      - Parcelas Atrasadas: ${parcelasAtrasadas}
      - Parcelas Próximas (7 dias): ${parcelasProximas.length}

      DADOS DE ORGANIZAÇÃO:
      - Convidados: ${totalConvidados} no total. (${convidadosConfirmados} confirmados, ${convidadosPendentes} pendentes de resposta).
      - Fornecedores Cadastrados: ${fornecedores.length} (${fornecedoresFechados.length} fechados).
      - Tarefas Pendentes: ${tarefasPendentes.length} (${tarefasUrgentes.length} marcadas como Urgente).

      LISTA DE FORNECEDORES:
      ${fornecedoresListados || 'Nenhum fornecedor cadastrado ainda.'}

      REGRAS DE CONDUTA:
      1. Seja elegante, acolhedor, prático e 100% focado no financeiro e na organização.
      2. NUNCA use NENHUM emoji em suas respostas.
      3. Seja orientado a ações: se houver pendências de convidados ou parcelas atrasadas, sugira resoluções imediatas.
      4. Formate a resposta usando negritos, quebras de linha e listas com marcadores (-) para facilitar a leitura no celular.
      5. Nunca invente preços de mercado irreais. Aja como um consultor analítico.
    `;

    try {
      const resposta = await enviarMensagemParaGemini(pergunta, contexto);
      setRespostaIA(resposta.replace(/^"|"$/g, ''));
    } catch (error) {
      setRespostaIA("Tivemos uma instabilidade na conexão. Poderia repetir a pergunta, por favor?");
    } finally {
      setIsPensando(false);
    }
  };

  const sugestoes = [
    "Analisar nossa saúde financeira agora",
    "O que precisamos resolver com urgência?",
    "Como estamos em relação à meta de economia?",
    "Resumo da lista de convidados"
  ];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 2.5 1.5 4 3 5.5s1 2.5 1 3.5h2c0-1 .5-2 1-3.5s3-3 3-5.5a5 5 0 0 0-5-5z"/></svg>
            </div>
            Assessor Onisciente
          </h3>
          <button onClick={() => setIaAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>

        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'var(--code-bg)', padding: '16px 20px', borderRadius: '0 20px 20px 20px', alignSelf: 'flex-start', border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Olá. Meu contexto foi atualizado com todas as informações do seu evento: orçamentos, metas de poupança, checklist e convidados. Como posso direcionar seu planejamento hoje?
            </p>
          </div>

          {!respostaIA && !isPensando && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {sugestoes.map((sug, i) => (
                <button key={i} onClick={() => fazerPergunta(sug)} style={{ background: 'transparent', border: '1px solid var(--accent)', padding: '12px 16px', borderRadius: '16px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', transition: '0.2s' }}>
                  {sug}
                </button>
              ))}
            </div>
          )}

          {isPensando && (
            <div style={{ color: 'var(--accent)', fontStyle: 'italic', fontSize: '0.9rem' }}>Analisando cruzamento de dados, cronogramas e finanças...</div>
          )}

          {respostaIA && (
            <div className="animate-fade-in" style={{ background: 'var(--code-bg)', padding: '16px 20px', borderRadius: '0 20px 20px 20px', alignSelf: 'flex-start', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: respostaIA.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <input 
            type="text" 
            value={inputTexto} 
            onChange={e => setInputTexto(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && fazerPergunta(inputTexto)}
            placeholder="Faça uma pergunta estratégica..." 
            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '1rem', outline: 'none' }}
          />
          <button onClick={() => fazerPergunta(inputTexto)} disabled={!inputTexto.trim() || isPensando} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '16px', cursor: 'pointer', opacity: (!inputTexto.trim() || isPensando) ? 0.5 : 1 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};