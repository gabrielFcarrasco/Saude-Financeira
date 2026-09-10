import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const CasamentoModalMesas = ({
  mesasAberto, setMesasAberto, casalId, convidados
}: any) => {

  const [mesas, setMesas] = useState<any[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  const [nome, setNome] = useState('');
  const [capacidade, setCapacidade] = useState(10);
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (!casalId || !mesasAberto) return;
    const q = query(collection(db, 'casais', casalId, 'mesas'));
    const unsub = onSnapshot(q, (snap) => {
      setMesas(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.nome.localeCompare(b.nome)));
    });
    return () => unsub();
  }, [casalId, mesasAberto]);

  if (!mesasAberto) return null;

  const abrirFormNovo = () => {
    setIdEdicao(null); setNome(''); setCapacidade(10); setFormAberto(true);
  };

  const abrirFormEdicao = (m: any) => {
    setIdEdicao(m.id); setNome(m.nome); setCapacidade(m.capacidade); setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !nome) return;
    setIsProcessando(true);
    try {
      const payload = { nome, capacidade: Number(capacidade), updatedAt: serverTimestamp() };
      if (idEdicao) await updateDoc(doc(db, 'casais', casalId, 'mesas', idEdicao), payload);
      else await addDoc(collection(db, 'casais', casalId, 'mesas'), { ...payload, createdAt: serverTimestamp() });
      setFormAberto(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Apagar esta mesa? Os convidados não serão apagados, apenas perderão o vínculo.")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'mesas', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Mapeamento de Mesas</h3>
              <button onClick={() => setMesasAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            {/* MÓDULO DIDÁTICO */}
            <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#8b5cf6', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                Por que organizar as mesas?
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', lineHeight: '1.5' }}>
                Além de garantir que as famílias sentem juntas, marcar as mesas ajuda a equipe do buffet. Se vocês souberem que a "Mesa 05" tem 2 convidados veganos, o garçom entrega os pratos especiais direto para eles sem precisar ficar perguntando no salão.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
              {mesas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: 'var(--code-bg)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
                  <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Nenhuma mesa criada ainda. Comece agrupando seus convidados por afinidade.</p>
                </div>
              ) : (
                mesas.map((m: any) => {
                  const convidadosNaMesa = convidados.filter((c: any) => c.mesa === m.nome);
                  const totalPessoas = convidadosNaMesa.reduce((acc: number, c: any) => acc + 1 + (c.acompanhantesPermitidos || 0), 0);
                  const isOver = totalPessoas > m.capacidade;
                  const perc = m.capacidade > 0 ? (totalPessoas / m.capacidade) * 100 : 0;

                  return (
                    <div key={m.id} onClick={() => abrirFormEdicao(m)} style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: `1px solid ${isOver ? '#ef4444' : 'var(--border)'}`, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>{m.nome}</h4>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: isOver ? '#ef4444' : 'var(--text)' }}>
                          {totalPessoas} / {m.capacidade} cadeiras
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ width: `${Math.min(perc, 100)}%`, height: '100%', background: isOver ? '#ef4444' : 'var(--accent)' }}></div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                        {convidadosNaMesa.length > 0 
                          ? convidadosNaMesa.map((c:any) => c.nome).join(', ') 
                          : 'Ninguém alocado nesta mesa ainda.'}
                      </div>
                      {isOver && (
                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>Capacidade máxima excedida! Retire alguém desta mesa.</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '12px', cursor: 'pointer', flexShrink: 0 }}>
              + Criar Nova Mesa
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Mesa' : 'Criar Mesa'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Nome ou Número da Mesa</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Mesa 01, Família da Noiva..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Capacidade (Quantidade de Cadeiras)</label>
                <input type="number" min="1" value={capacidade} onChange={e => setCapacidade(Number(e.target.value))} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text)', marginTop: '8px', background: 'var(--code-bg)', padding: '12px', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                <strong>Como colocar as pessoas aqui:</strong> Volte na sua Lista de Convidados, edite um convidado e digite exatamente o nome desta mesa (<strong>{nome || '...'}</strong>) no cadastro dele.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSalvar} disabled={isProcessando || !nome} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!nome || isProcessando) ? 0.5 : 1 }}>Salvar Mesa</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};