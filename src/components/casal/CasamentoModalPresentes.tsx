import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const CasamentoModalPresentes = ({
  presentesAberto, setPresentesAberto, casalId, formatMoney
}: any) => {

  const [presentes, setPresentes] = useState<any[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  const [item, setItem] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [arrecadado, setArrecadado] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (!casalId || !presentesAberto) return;
    const q = query(collection(db, 'casais', casalId, 'presentes'));
    const unsub = onSnapshot(q, (snap) => {
      setPresentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [casalId, presentesAberto]);

  if (!presentesAberto) return null;

  const handleMask = (e: any, setter: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setter(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const abrirFormNovo = () => {
    setIdEdicao(null); setItem(''); setValorTotal(''); setArrecadado(''); setFormAberto(true);
  };

  const abrirFormEdicao = (p: any) => {
    setIdEdicao(p.id); setItem(p.item); setValorTotal(p.valorTotal.toString()); setArrecadado((p.arrecadado || 0).toString()); setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !item) return;
    setIsProcessando(true);
    try {
      const payload = { item, valorTotal: Number(valorTotal || 0), arrecadado: Number(arrecadado || 0), updatedAt: serverTimestamp() };
      if (idEdicao) await updateDoc(doc(db, 'casais', casalId, 'presentes', idEdicao), payload);
      else await addDoc(collection(db, 'casais', casalId, 'presentes'), { ...payload, createdAt: serverTimestamp() });
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const totalDesejado = presentes.reduce((acc, p) => acc + Number(p.valorTotal || 0), 0);
  const totalArrecadado = presentes.reduce((acc, p) => acc + Number(p.arrecadado || 0), 0);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Lista de Presentes</h3>
              <button onClick={() => setPresentesAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Arrecadado</span>
                <h2 style={{ margin: 0, color: '#ec4899', fontSize: '1.6rem' }}>{formatMoney(totalArrecadado)}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Meta Total</span>
                <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem' }}>{formatMoney(totalDesejado)}</h4>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              {presentes.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '0.9rem' }}>Nenhuma cota ou presente registrado.</p>
              ) : (
                presentes.map((p: any) => {
                  const perc = p.valorTotal > 0 ? ((p.arrecadado || 0) / p.valorTotal) * 100 : 0;
                  return (
                    <div key={p.id} onClick={() => abrirFormEdicao(p)} style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem' }}>{p.item}</h4>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: perc >= 100 ? '#10b981' : 'var(--text)' }}>
                          {formatMoney(p.arrecadado || 0)} / {formatMoney(p.valorTotal)}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--code-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(perc, 100)}%`, height: '100%', background: perc >= 100 ? '#10b981' : '#ec4899' }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#ec4899', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0 }}>
              + Adicionar Item ou Cota
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Cota' : 'Nova Cota de Presente'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>O que é?</label>
                <input type="text" value={item} onChange={e => setItem(e.target.value)} placeholder="Ex: Cota Geladeira, Jantar Romântico..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Valor Total (R$)</label>
                  <input type="text" inputMode="numeric" value={formatMask(valorTotal)} onChange={e => handleMask(e, setValorTotal)} placeholder="0,00" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Já Arrecadado (R$)</label>
                  <input type="text" inputMode="numeric" value={formatMask(arrecadado)} onChange={e => handleMask(e, setArrecadado)} placeholder="0,00" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: '#ec4899', fontWeight: 'bold', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              {idEdicao && (
                <button onClick={async () => { await deleteDoc(doc(db, 'casais', casalId, 'presentes', idEdicao)); setFormAberto(false); }} disabled={isProcessando} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSalvar} disabled={isProcessando || !item} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: '#ec4899', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!item || isProcessando) ? 0.5 : 1 }}>Salvar</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};