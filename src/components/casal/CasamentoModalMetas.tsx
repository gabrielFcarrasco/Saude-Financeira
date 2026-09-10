import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const CasamentoModalMetas = ({
  metasAberto, setMetasAberto, casalId, formatMoney, tetoCasamento, dataCasamento
}: any) => {

  const [contribuicoes, setContribuicoes] = useState<any[]>([]);
  const [valorPoupado, setValorPoupado] = useState(0);
  
  const [formAberto, setFormAberto] = useState(false);
  const [valorAporte, setValorAporte] = useState('');
  const [origemAporte, setOrigemAporte] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (!casalId || !metasAberto) return;

    const unsubCasal = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists()) {
        setValorPoupado(docSnap.data().casamentoValorPoupado || 0);
      }
    });

    const q = query(collection(db, 'casais', casalId, 'metaContribuicoes'), orderBy('createdAt', 'desc'));
    const unsubContribuicoes = onSnapshot(q, (snap) => {
      setContribuicoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubCasal(); unsubContribuicoes(); };
  }, [casalId, metasAberto]);

  if (!metasAberto) return null;

  const handleMask = (e: any, setter: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setter(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const abrirFormNovo = () => {
    setValorAporte(''); setOrigemAporte(''); setFormAberto(true);
  };

  const handleSalvarAporte = async () => {
    if (!casalId || !valorAporte) return;
    setIsProcessando(true);
    try {
      const valorNum = Number(valorAporte);
      await addDoc(collection(db, 'casais', casalId, 'metaContribuicoes'), {
        valor: valorNum,
        origem: origemAporte || 'Reserva',
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'casais', casalId), {
        casamentoValorPoupado: valorPoupado + valorNum
      });
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const handleExcluirAporte = async (id: string, valorAporteRemovido: number) => {
    if (!window.confirm("Remover esta contribuição? O valor será descontado do cofrinho.")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'metaContribuicoes', id));
      await updateDoc(doc(db, 'casais', casalId), {
        casamentoValorPoupado: Math.max(0, valorPoupado - valorAporteRemovido)
      });
    } catch (e) {} finally { setIsProcessando(false); }
  };

  // Matemática da Meta
  const faltaPoupar = Math.max(0, tetoCasamento - valorPoupado);
  const progresso = tetoCasamento > 0 ? (valorPoupado / tetoCasamento) * 100 : 0;

  let mesesRestantes = 1;
  if (dataCasamento) {
    const dataAlvo = new Date(dataCasamento + 'T12:00:00');
    const hoje = new Date();
    const diffTime = dataAlvo.getTime() - hoje.getTime();
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    mesesRestantes = Math.max(1, Math.floor(dias / 30));
  }

  const aporteMensalNecessario = faltaPoupar / mesesRestantes;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Cofrinho do Casamento</h3>
              <button onClick={() => setMetasAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Já Poupado</span>
                  <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.8rem' }}>{formatMoney(valorPoupado)}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Meta (Teto)</span>
                  <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>{formatMoney(tetoCasamento)}</h4>
                </div>
              </div>

              <div style={{ width: '100%', height: '10px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${Math.min(progresso, 100)}%`, height: '100%', background: '#10b981', transition: 'width 1s ease' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Faltam {mesesRestantes} meses</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}>Necessário guardar:</span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--accent)' }}>{formatMoney(aporteMensalNecessario)}<span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>/mês</span></span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              <h4 style={{ margin: '8px 0', color: 'var(--text-h)', fontSize: '1rem' }}>Histórico de Aportes</h4>
              
              {contribuicoes.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '0.9rem', padding: '20px', background: 'var(--code-bg)', borderRadius: '20px' }}>Nenhum valor guardado ainda. Que tal fazer o primeiro depósito?</p>
              ) : (
                contribuicoes.map((c: any) => (
                  <div key={c.id} style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '0.95rem' }}>{c.origem}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
                          {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: '#10b981' }}>+{formatMoney(c.valor)}</span>
                      <button onClick={() => handleExcluirAporte(c.id, c.valor)} disabled={isProcessando} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0 }}>
              + Registrar Novo Aporte
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>Novo Depósito</h3>
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Valor a guardar (R$)</label>
                <input type="text" inputMode="numeric" value={formatMask(valorAporte)} onChange={e => handleMask(e, setValorAporte)} placeholder="0,00" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: '#10b981', marginTop: '8px', fontSize: '1.3rem', fontWeight: 'bold', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Origem do Dinheiro</label>
                <input type="text" value={origemAporte} onChange={e => setOrigemAporte(e.target.value)} placeholder="Ex: Salário de Setembro, 13º..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSalvarAporte} disabled={isProcessando || !valorAporte} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!valorAporte || isProcessando) ? 0.5 : 1 }}>Adicionar ao Cofrinho</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};