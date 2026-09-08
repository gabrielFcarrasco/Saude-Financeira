import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CasamentoModalSetup } from './CasamentoModalSetup';
import { CasamentoModalPlanner } from './CasamentoModalPlanner';

export const CasamentoHubScreen = ({ casalId, formatMoney }: any) => {
  const [dataCasamento, setDataCasamento] = useState<string | null>(null);
  const [tetoCasamento, setTetoCasamento] = useState<number>(0);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  
  const [setupAberto, setSetupAberto] = useState(false);
  const [plannerAberto, setPlannerAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!casalId) return;

    // Listener 1: Configurações Iniciais (Sem forçar a abertura do Modal!)
    const unsubCasal = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDataCasamento(data.casamentoData || null);
        setTetoCasamento(data.casamentoTeto || 0);
      }
    });

    // Listener 2: Coleção de Fornecedores
    const qFornecedores = query(collection(db, 'casais', casalId, 'fornecedores'));
    const unsubFornecedores = onSnapshot(qFornecedores, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFornecedores(list);
      setCarregando(false);
    });

    return () => {
      unsubCasal();
      unsubFornecedores();
    };
  }, [casalId]);

  if (carregando) return null;

  // Matemática da Contagem Regressiva
  let diasRestantes = 0;
  let mesesRestantes = 0;
  let porcentagemTempo = 0;
  
  if (dataCasamento) {
    const hoje = new Date();
    const dataAlvo = new Date(dataCasamento + 'T12:00:00');
    const diffTime = dataAlvo.getTime() - hoje.getTime();
    diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    mesesRestantes = Math.floor(diasRestantes / 30);
    porcentagemTempo = Math.max(0, Math.min(100, 100 - (diasRestantes / 365) * 100)); // Base 1 ano
  }

  // Matemática Financeira
  const valorComprometido = fornecedores
    .filter(f => f.status === 'fechado')
    .reduce((acc, f) => acc + Number(f.valor || 0), 0);

  const valorPago = 0; // Futuro Módulo de Pagamentos
  const porcentagemFinanceira = tetoCasamento > 0 ? (valorComprometido / tetoCasamento) * 100 : 0;

  return (
    <div className="hub-fintech-container animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* HEADER FIXO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.4rem' }}>Nosso Casamento</h2>
        <button onClick={() => setSetupAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-h)', transition: '0.2s' }} title="Configurações">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>

      {/* ESTADO VAZIO (EMPTY STATE) DINÂMICO SE NÃO TIVER DATA OU TETO */}
      {(!dataCasamento || tetoCasamento === 0) && (
        <div className="animate-fade-in" style={{ background: 'linear-gradient(135deg, var(--code-bg) 0%, rgba(138, 43, 226, 0.05) 100%)', padding: '32px 24px', borderRadius: '28px', border: '1px dashed var(--accent)', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--accent)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)', fontSize: '1.3rem' }}>O grande dia vem aí!</h3>
          <p style={{ margin: '0 0 24px 0', color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Para liberar as estatísticas e o painel financeiro, precisamos de duas informações essenciais: a data prevista e o teto de gastos.
          </p>
          <button onClick={() => setSetupAberto(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '16px 24px', borderRadius: '16px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)' }}>
            Iniciar Planejamento
          </button>
        </div>
      )}

      {/* DASHBOARD COMPLETO SE OS DADOS EXISTIREM */}
      {dataCasamento && tetoCasamento > 0 && (
        <>
          {/* Card: Contagem Regressiva Premium */}
          <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '28px', marginBottom: '16px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05, color: 'var(--accent)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Faltam</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '3rem', letterSpacing: '-2px', lineHeight: '1' }}>
                    {diasRestantes > 0 ? diasRestantes : 0}
                  </h2>
                  <span style={{ color: 'var(--text-h)', fontWeight: 'bold', fontSize: '1.2rem' }}>dias</span>
                </div>
              </div>
              {mesesRestantes > 0 && (
                <div style={{ background: 'var(--bg)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-h)' }}>{mesesRestantes}</span>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Meses</span>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, marginBottom: '8px' }}>
                <span>Hoje</span>
                <span>{dataCasamento.split('-').reverse().join('/')}</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${porcentagemTempo}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent) 0%, #ec4899 100%)', borderRadius: '10px' }}></div>
              </div>
            </div>
          </div>

          {/* Card: Termômetro Financeiro Analítico */}
          <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Orçamento Teto</span>
                <h3 style={{ margin: '4px 0 0 0', color: 'var(--text-h)', fontSize: '1.5rem' }}>{formatMoney(tetoCasamento)}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Comprometido</span>
                <h3 style={{ margin: '4px 0 0 0', color: porcentagemFinanceira > 100 ? '#ef4444' : '#10b981', fontSize: '1.2rem' }}>
                  {formatMoney(valorComprometido)}
                </h3>
              </div>
            </div>

            <div style={{ width: '100%', height: '12px', background: 'var(--code-bg)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${Math.min(porcentagemFinanceira, 100)}%`, background: porcentagemFinanceira > 100 ? '#ef4444' : '#10b981', borderRadius: '10px', transition: 'width 1s ease' }}></div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                Já Pago ({formatMoney(valorPago)})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></div>
                A Pagar ({formatMoney(valorComprometido - valorPago)})
              </div>
            </div>
          </div>
        </>
      )}

      {/* GRADE DE MÓDULOS DE GESTÃO (Sempre visível, mas com visual Rico) */}
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Gestão & Contratos</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {/* Planner de Fornecedores */}
        <button onClick={() => setPlannerAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)' }}>Fornecedores</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
              {fornecedores.length > 0 ? `${fornecedores.length} na lista` : 'Adicionar orçamentos'}
            </span>
          </div>
        </button>

        {/* Futuro Módulo de Pagamentos */}
        <button style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'not-allowed', textAlign: 'left', transition: '0.2s', display: 'flex', flexDirection: 'column', gap: '12px', opacity: 0.7 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)' }}>Pagamentos</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Em breve...</span>
          </div>
        </button>
      </div>

      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Atalhos Rápidos</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
         <button style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'not-allowed', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.7 }}>
           <div style={{ color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
           </div>
           <div>
             <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '0.95rem' }}>Lista de Convidados</h4>
             <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Vincular sistema externo...</span>
           </div>
         </button>
         
         <button style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'not-allowed', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.7 }}>
           <div style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
           </div>
           <div>
             <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '0.95rem' }}>Site dos Noivos</h4>
             <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Configurar página...</span>
           </div>
         </button>
      </div>

      <CasamentoModalSetup 
        setupAberto={setupAberto} setSetupAberto={setSetupAberto} 
        casalId={casalId} dataAtual={dataCasamento} tetoAtual={tetoCasamento} 
      />

      <CasamentoModalPlanner
        plannerAberto={plannerAberto} setPlannerAberto={setPlannerAberto}
        casalId={casalId} fornecedores={fornecedores} formatMoney={formatMoney}
        tetoCasamento={tetoCasamento} valorComprometido={valorComprometido}
      />

    </div>
  );
};