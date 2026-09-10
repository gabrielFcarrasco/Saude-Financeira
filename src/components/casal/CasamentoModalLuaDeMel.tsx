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
  const [categoria, setCategoria] = useState('Transporte / Voos'); 
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (!casalId || !luaDeMelAberto) return;
    
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
    setIdEdicao(null); setItem(''); setValor(''); setCategoria('Transporte / Voos'); setFormAberto(true);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Gestão da Lua de Mel</h3>
              <button onClick={() => setLuaDeMelAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            {/* MÓDULO DIDÁTICO */}
            <div style={{ background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#0ea5e9', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-.5-.5-2.5 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-4 4-3-1-2 2 5 5 2-2-1-3 4-4 4 6l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>
                Por que isolar este orçamento?
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', lineHeight: '1.5' }}>
                Muitos casais gastam demais na festa e acabam precisando cancelar a viagem de núpcias. Por isso criamos este espaço separado. O Teto da Viagem que você definir aqui <strong>não vai se misturar</strong> com os custos da festa do Hub principal. Mantenha os dinheiros separados!
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Destino dos Sonhos</label>
                <input type="text" value={destino} onChange={e => setDestino(e.target.value)} onBlur={handleSalvarConfig} placeholder="Ex: Fernando de Noronha..." style={{ width: '100%', padding: '8px 0 0 0', border: 'none', background: 'transparent', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none' }} />
              </div>
              <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Teto da Viagem (R$)</label>
                <input type="text" inputMode="numeric" value={formatMask(orcamentoViagem)} onChange={e => handleMask(e, setOrcamentoViagem)} onBlur={handleSalvarConfig} placeholder="0,00" style={{ width: '100%', padding: '8px 0 0 0', border: 'none', background: 'transparent', color: '#0ea5e9', fontSize: '1.2rem', fontWeight: '900', outline: 'none' }} />
              </div>
            </div>

            <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Despesas Registradas</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1.1rem' }}>{formatMoney(totalGasto)}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--code-bg)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${tetoViajemNum > 0 ? (totalGasto / tetoViajemNum) * 100 : 0}%`, height: '100%', background: '#0ea5e9' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              {gastos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '0.9rem' }}>Nenhuma despesa lançada. Comece cadastrando os voos ou hospedagem.</p>
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
              + Inserir Despesa da Viagem
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Despesa' : 'Nova Despesa de Viagem'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>O que você pagou/vai pagar?</label>
                <input type="text" value={item} onChange={e => setItem(e.target.value)} placeholder="Ex: Passagens aéreas, Resort, Aluguel de Carro..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Tipo de Gasto</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    <option value="Transporte / Voos">Transporte / Voos</option>
                    <option value="Hospedagem / Hotel">Hospedagem / Hotel</option>
                    <option value="Passeios / Ingressos">Passeios / Ingressos</option>
                    <option value="Alimentação / Restaurantes">Alimentação / Restaurantes</option>
                    <option value="Seguro Viagem">Seguro Viagem</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Valor Total (R$)</label>
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