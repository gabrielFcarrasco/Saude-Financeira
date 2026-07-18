import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ICON_EDIT = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'/%3E%3C/svg%3E";
const ICON_CHECK_LIST = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E";

export const ConexaoAlinhamento = ({ casalId, meuNome }: any) => {
  const [pautas, setPautas] = useState<any[]>([]);
  const [novaPauta, setNovaPauta] = useState('');
  const [pautaEditandoId, setPautaEditandoId] = useState<string | null>(null);
  const [textoPautaEditado, setTextoPautaEditado] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (!casalId) return;
    const unsub = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().pautasAlinhamento) {
        setPautas(docSnap.data().pautasAlinhamento);
      }
    });
    return () => unsub();
  }, [casalId]);

  const adicionarPauta = async () => {
    if (!novaPauta.trim() || !casalId) return;
    setIsProcessando(true);
    try {
      const novaPautaObj = { id: Date.now().toString(), texto: novaPauta.trim(), criadoPor: meuNome, concluido: false };
      await updateDoc(doc(db, 'casais', casalId), { pautasAlinhamento: arrayUnion(novaPautaObj) });
      setNovaPauta('');
    } catch (error) {} finally { setIsProcessando(false); }
  };

  const togglePauta = async (pauta: any) => {
    if (!casalId) return;
    const pautasAtualizadas = pautas.map(p => p.id === pauta.id ? { ...p, concluido: !p.concluido } : p);
    await updateDoc(doc(db, 'casais', casalId), { pautasAlinhamento: pautasAtualizadas });
  };

  const apagarPauta = async (pauta: any) => {
    if (!casalId) return;
    const pautasAtualizadas = pautas.filter(p => p.id !== pauta.id);
    await updateDoc(doc(db, 'casais', casalId), { pautasAlinhamento: pautasAtualizadas });
  };

  const iniciarEdicaoPauta = (pauta: any) => { setPautaEditandoId(pauta.id); setTextoPautaEditado(pauta.texto); };
  
  const salvarPautaEditada = async (id: string) => {
    if (!casalId || !textoPautaEditado.trim()) return;
    const pautasAtualizadas = pautas.map(p => p.id === id ? { ...p, texto: textoPautaEditado.trim() } : p);
    await updateDoc(doc(db, 'casais', casalId), { pautasAlinhamento: pautasAtualizadas });
    setPautaEditandoId(null);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Pautas do Mês</h3>
        <p style={{ color: 'var(--text)', margin: '0 0 20px 0', fontSize: '0.9rem', lineHeight: '1.4' }}>Anote aqui assuntos importantes ou planos que precisam conversar na próxima reunião.</p>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={novaPauta} 
            onChange={e => setNovaPauta(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && adicionarPauta()}
            placeholder="Ex: Discutir teto do lazer" 
            style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }}
          />
          <button 
            onClick={adicionarPauta}
            disabled={!novaPauta.trim() || isProcessando}
            style={{ padding: '0 20px', borderRadius: '16px', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Adicionar
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pautas.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text)', marginTop: '20px' }}>Nenhuma pauta anotada. Tudo alinhado!</p>
        ) : (
          pautas.map((pauta) => (
            <div key={pauta.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--code-bg)', padding: '16px 20px', borderRadius: '20px', border: `1px solid ${pauta.concluido ? 'var(--border)' : 'var(--accent)'}`, opacity: pauta.concluido ? 0.6 : 1, transition: '0.2s' }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                <div onClick={() => togglePauta(pauta)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: `2px solid ${pauta.concluido ? 'var(--text)' : 'var(--accent)'}`, background: pauta.concluido ? 'var(--text)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  {pauta.concluido && <img src={ICON_CHECK_LIST} style={{ width: 14, height: 14 }} alt="Check" />}
                </div>
                
                <div style={{ flex: 1 }}>
                  {pautaEditandoId === pauta.id ? (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                      <input 
                        autoFocus
                        type="text" 
                        value={textoPautaEditado} 
                        onChange={(e) => setTextoPautaEditado(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && salvarPautaEditada(pauta.id)}
                        style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--accent)', color: 'var(--text-h)', padding: '4px 8px', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} 
                      />
                      <button onClick={() => salvarPautaEditada(pauta.id)} style={{ background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '0 8px', cursor: 'pointer' }}>
                         <img src={ICON_CHECK_LIST} style={{ width: 16, height: 16, stroke: '#fff' }} alt="Salvar" />
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1rem', fontWeight: pauta.concluido ? 'normal' : 'bold', textDecoration: pauta.concluido ? 'line-through' : 'none', wordBreak: 'break-word' }}>
                      {pauta.texto}
                    </p>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Por {pauta.criadoPor}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {!pauta.concluido && pautaEditandoId !== pauta.id && (
                  <button onClick={() => iniciarEdicaoPauta(pauta)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px' }}>
                    <img src={ICON_EDIT} style={{ width: 18, height: 18, opacity: 0.6 }} alt="Editar" />
                  </button>
                )}
                <button onClick={() => apagarPauta(pauta)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', padding: '4px' }}>
                  ✕
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};