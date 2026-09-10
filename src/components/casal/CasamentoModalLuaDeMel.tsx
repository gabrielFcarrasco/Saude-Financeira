import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const CasamentoModalLuaDeMel = ({
  luaDeMelAberto, setLuaDeMelAberto, casalId, formatMoney
}: any) => {

  const [gastos, setGastos] = useState<any[]>([]);
  const [destino, setDestino] = useState('');
  const [orcamentoViagem, setOrcamentoViagem] = useState('');

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  const [item, setItem] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Passagens'); // Passagens, Hospedagem, Passeios, Alimentação
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (!casalId || !luaDeMelAberto) return;
    
    // Puxa as infos gerais (se já existirem) do doc do casal
    const unsubCasal = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.luaDeMelDestino) setDestino(data.luaDeMelDestino);
        if (data.luaDeMelOrcamento) setOrcamentoViagem(data.luaDeMelOrcamento.toString());
      }
    });

    const q = query(collection(db, 'casais', casalId, 'luaDeMelGastos'));
    const unsubGastos = onSnapshot(q, (snap) => {
      setGastos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubCasal(); unsubGastos(); };
  }, [casalId, luaDeMelAberto]);

  if (!luaDeMelAberto) return null;

  const handleMask = (e: any, setter: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setter(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSalvarConfig = async () => {
    await updateDoc(doc(db, 'casais', casalId), {
      luaDeMelDestino: destino,
      luaDeMelOrcamento: Number(orcamentoViagem || 0)
    });
  };

  const abrirFormNovo = () => {
    setIdEdicao(null); setItem(''); setValor(''); setCategoria('Passagens'); setFormAberto(true);
  };

  const handleSalvarGasto = async () => {
    if (!casalId || !item) return;
    setIsProcessando(true);
    try {
      const payload = { item, valor: Number(valor || 0), categoria, updatedAt: serverTimestamp() };
      if (idEdicao) await updateDoc(doc(db, 'casais', casalId, 'luaDeMelGastos', idEdicao), payload);
      else await addDoc(collection(db, 'casais', casalId, 'luaDeMelGastos'), { ...payload, createdAt: serverTimestamp() });
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const totalGasto = gastos.reduce((acc, g) => acc + Number(g.valor || 0), 0);
  const tetoViajemNum = Number(orcamentoViagem || 0);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Lua de Mel</h3>
              <button onClick={() => setLuaDeMelAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Destino</label>
                <input type="text" value={destino} onChange={e => setDestino(e.target.value)} onBlur={handleSalvarConfig} placeholder="Ex: Paris..." style={{ width: '100%', padding: '8px 0 0 0', border: 'none', background: 'transparent', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none' }} />
              </div>
              <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Teto Viagem (R$)</label>
                <input type="text" inputMode="numeric" value={formatMask(orcamentoViagem)} onChange={e => handleMask(e, setOrcamentoViagem)} onBlur={handleSalvarConfig} placeholder="0,00" style={{ width: '100%', padding: '8px 0 0 0', border: 'none', background: 'transparent', color: '#0ea5e9', fontSize: '1.2rem', fontWeight: '900', outline: 'none' }} />
              </div>
            </div>

            <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Já Gasto</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1.1rem' }}>{formatMoney(totalGasto)}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--code-bg)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${tetoViajemNum > 0 ? (totalGasto / tetoViajemNum) * 100 : 0}%`, height: '100%', background: '#0ea5e9' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              {gastos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '0.9rem' }}>Nenhum gasto de viagem registrado.</p>
              ) : (
                gastos.map((g: any) => (
                  <div key={g.id} onClick={() => { setIdEdicao(g.id); setItem(g.item); setValor(g.valor.toString()); setCategoria(g.categoria); setFormAberto(true); }} style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '0.95rem' }}>{g.item}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 'bold' }}>{g.categoria}</span>
                    </div>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>{formatMoney(g.valor)}</span>
                  </div>
                ))
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#0ea5e9', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0 }}>
              + Registrar Gasto
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Gasto' : 'Novo Gasto de Viagem'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>O que é?</label>
                <input type="text" value={item} onChange={e => setItem(e.target.value)} placeholder="Ex: Passagens, Hotel, Jantar..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    <option value="Passagens">Passagens</option>
                    <option value="Hospedagem">Hospedagem</option>
                    <option value="Passeios">Passeios</option>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Valor (R$)</label>
                  <input type="text" inputMode="numeric" value={formatMask(valor)} onChange={e => handleMask(e, setValor)} placeholder="0,00" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: '#0ea5e9', fontWeight: 'bold', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              {idEdicao && (
                <button onClick={async () => { await deleteDoc(doc(db, 'casais', casalId, 'luaDeMelGastos', idEdicao)); setFormAberto(false); }} disabled={isProcessando} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSalvarGasto} disabled={isProcessando || !item} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: '#0ea5e9', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!item || isProcessando) ? 0.5 : 1 }}>Salvar</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};