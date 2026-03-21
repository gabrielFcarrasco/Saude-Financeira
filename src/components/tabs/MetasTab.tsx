import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface MetasTabProps {
  transacoes: any[];
  metas: any[];
}

export const MetasTab: React.FC<MetasTabProps> = ({ transacoes, metas }) => {
  const [isModalNovaMetaOpen, setIsModalNovaMetaOpen] = useState(false);
  const [novoNomeMeta, setNovoNomeMeta] = useState('');
  const [novoValorAlvo, setNovoValorAlvo] = useState('');
  const [novaDataAlvo, setNovaDataAlvo] = useState('');

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const totalPoupadoMetas = transacoes.filter(t => t.categoria === 'Investimentos').reduce((a, b) => a + b.valor, 0);

  const handleSalvarMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, 'metas'), {
        userId: user.uid,
        nome: novoNomeMeta,
        valorAlvo: parseFloat(novoValorAlvo), 
        dataAlvo: novaDataAlvo, 
        criadoEm: serverTimestamp()
      });
      setNovoNomeMeta(''); setNovoValorAlvo(''); setNovaDataAlvo(''); setIsModalNovaMetaOpen(false);
    } catch (err) { alert("Erro ao criar meta."); }
  };

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>Seus Objetivos</h1>
          <button className="primary" onClick={() => setIsModalNovaMetaOpen(true)}>+ Novo Objetivo</button>
        </div>

        {metas.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <h3 style={{ color: 'var(--text-h)' }}>Nenhum objetivo traçado</h3>
            <p style={{ color: 'var(--text)', marginBottom: '24px' }}>Dê o primeiro passo para o seu futuro.</p>
            <button className="primary" onClick={() => setIsModalNovaMetaOpen(true)}>Criar Meta</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {metas.map(meta => {
              const progresso = (totalPoupadoMetas / meta.valorAlvo) * 100;
              const dataFormatada = meta.dataAlvo ? new Date(meta.dataAlvo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Sem prazo';

              return (
                <div key={meta.id} className="card" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', color: 'white', border: 'none', padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: 'white' }}>{meta.nome}</h3>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                  
                  <h2 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: 'white' }}>{formatarMoeda(totalPoupadoMetas)}</h2>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                    <span>Alvo: {formatarMoeda(meta.valorAlvo)}</span>
                    <span>Previsto: {dataFormatada}</span>
                  </div>

                  <div className="progress-track" style={{ background: 'rgba(255,255,255,0.15)', height: '12px' }}>
                    <div className="progress-fill" style={{ width: `${Math.min(progresso, 100)}%`, background: 'white' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL ISOLADO */}
      {isModalNovaMetaOpen && (
        <div className="modal-overlay" onClick={() => setIsModalNovaMetaOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Novo Objetivo</h2>
              <button className="close-btn" onClick={() => setIsModalNovaMetaOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleSalvarMeta}>
              <div className="form-group"><label>O que você quer conquistar?</label><input type="text" value={novoNomeMeta} onChange={e => setNovoNomeMeta(e.target.value)} required /></div>
              <div className="form-group"><label>Valor Necessário (R$)</label><input type="number" step="0.01" value={novoValorAlvo} onChange={e => setNovoValorAlvo(e.target.value)} required /></div>
              <div className="form-group">
                <label>Data Alvo (Opcional)</label>
                <input type="date" value={novaDataAlvo} onChange={e => setNovaDataAlvo(e.target.value)} />
              </div>
              <button type="submit" className="primary" style={{ width: '100%', marginTop: '8px' }}>Salvar Sonho</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};