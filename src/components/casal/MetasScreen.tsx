import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const MetasScreen = ({ 
  setActiveView, casalId, metas, formatMoney, icons, totalCofre 
}: any) => {
  const [metaSelecionada, setMetaSelecionada] = useState<any | null>(null);
  const [criandoMeta, setCriandoMeta] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [isProcessando, setIsProcessando] = useState(false);

  // ✨ NOVO: Estado para controlar o modal de exclusão
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  // Form de Novo Sonho
  const [novaMetaTitulo, setNovaMetaTitulo] = useState('');
  const [novaMetaAlvo, setNovaMetaAlvo] = useState('');

  // Form de Edição
  const [editTitulo, setEditTitulo] = useState('');
  const [editAlvo, setEditAlvo] = useState('');

  useEffect(() => {
    if (metaSelecionada) {
      const metaAtualizada = metas.find((m: any) => m.id === metaSelecionada.id);
      if (metaAtualizada) {
        setMetaSelecionada(metaAtualizada);
      } else {
        setMetaSelecionada(null);
        setEditandoMeta(false);
      }
    }
  }, [metas, metaSelecionada?.id]);

  const handleSalvarMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casalId || !novaMetaTitulo || !novaMetaAlvo) return;

    try {
      setIsProcessando(true);
      await addDoc(collection(db, 'casais', casalId, 'metas'), {
        titulo: novaMetaTitulo,
        alvo: Number(novaMetaAlvo),
        atual: 0,
        historico: [], 
        createdAt: serverTimestamp()
      });

      setCriandoMeta(false);
      setNovaMetaTitulo(''); 
      setNovaMetaAlvo('');
    } catch (error) {
      console.error("Erro ao criar o sonho:", error);
      alert("Houve um erro ao salvar seu objetivo. Tente novamente.");
    } finally {
      setIsProcessando(false);
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casalId || !metaSelecionada || !editTitulo || !editAlvo) return;

    try {
      setIsProcessando(true);
      await updateDoc(doc(db, 'casais', casalId, 'metas', metaSelecionada.id), {
        titulo: editTitulo,
        alvo: Number(editAlvo)
      });
      setEditandoMeta(false);
    } catch (error) {
      console.error("Erro ao editar o sonho:", error);
      alert("Houve um erro ao editar. Tente novamente.");
    } finally {
      setIsProcessando(false);
    }
  };

  // ✨ NOVO: Agora só abre o modal, não usa mais o window.confirm
  const abrirConfirmacaoExclusao = () => {
    setConfirmandoExclusao(true);
  };

  // ✨ NOVO: A lógica de deletar de fato foi movida para cá
  const confirmarExclusao = async () => {
    if (!casalId || !metaSelecionada) return;

    try {
      setIsProcessando(true);
      await deleteDoc(doc(db, 'casais', casalId, 'metas', metaSelecionada.id));
      setMetaSelecionada(null);
      setConfirmandoExclusao(false);
    } catch (error) {
      console.error("Erro ao excluir o sonho:", error);
    } finally {
      setIsProcessando(false);
    }
  };

  const abrirEdicao = () => {
    setEditTitulo(metaSelecionada.titulo);
    setEditAlvo(metaSelecionada.alvo.toString());
    setEditandoMeta(true);
  };

  // --- VISÃO 1: DETALHES DO SONHO ---
  if (metaSelecionada) {
    const percConcluido = Math.min((metaSelecionada.atual / metaSelecionada.alvo) * 100, 100);

    return (
      <div className="hub-fintech-container animate-fade-in">
        <button className="btn-voltar" onClick={() => { setMetaSelecionada(null); setEditandoMeta(false); }}>
          {icons.voltar} Voltar para o Mapa
        </button>

        <div className="hub-balance-card" style={{ textAlign: 'left', alignItems: 'flex-start', borderStyle: 'solid', padding: '32px' }}>
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="hub-balance-label">Nosso Sonho</span>
              <h2 style={{ color: 'var(--text-h)', margin: '0 0 24px 0', fontSize: '2rem' }}>{metaSelecionada.titulo}</h2>
            </div>
            {!editandoMeta && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={abrirEdicao} style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Editar
                </button>
              </div>
            )}
          </div>
          
          {editandoMeta ? (
            <form onSubmit={handleSalvarEdicao} style={{ width: '100%', background: 'var(--bg)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-h)', fontWeight: 'bold' }}>Título do Sonho</label>
                  <input type="text" value={editTitulo} onChange={e => setEditTitulo(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-h)', fontWeight: 'bold' }}>Valor Alvo (Onde queremos chegar)</label>
                  <input type="number" value={editAlvo} onChange={e => setEditAlvo(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setEditandoMeta(false)} disabled={isProcessando} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                  <button type="submit" disabled={isProcessando} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{isProcessando ? 'Salvando...' : 'Salvar'}</button>
                  
                  {/* ✨ NOVO: Botão dispara a abertura do modal customizado */}
                  <button type="button" onClick={abrirConfirmacaoExclusao} disabled={isProcessando} style={{ padding: '10px 16px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Excluir Sonho</button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatMoney(metaSelecionada.atual)} guardados</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>Faltam: {formatMoney(metaSelecionada.alvo - metaSelecionada.atual)}</span>
              </div>
              
              <div style={{ width: '100%', height: '12px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ width: `${percConcluido}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}></div>
              </div>
              <div style={{ width: '100%', textAlign: 'left', marginTop: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{percConcluido.toFixed(1)}% alcançado</span>
              </div>
            </>
          )}
        </div>

        <h3 style={{ color: 'var(--text-h)', marginBottom: '16px' }}>Passos que já demos</h3>
        <div className="extrato-container">
          {metaSelecionada.historico && metaSelecionada.historico.length > 0 ? (
            metaSelecionada.historico.map((h: any) => (
              <div key={h.id} className="extrato-item" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="extrato-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginLeft: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div className="extrato-info">
                  <span className="extrato-titulo">{h.descricao}</span>
                  <span className="extrato-data">{h.data}</span>
                </div>
                <div className="extrato-valor" style={{ color: '#10b981' }}>
                  +{formatMoney(h.valor)}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '12px' }}>
              <p style={{ margin: 0, color: 'var(--text)' }}>Ainda não registramos nenhum valor para este sonho.</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text)' }}>Use o Acelerador, guarde a sobra do Lazer ou faça um Depósito Direto pelo Hub para começar.</p>
            </div>
          )}

          {/* ✨ NOVO MODAL CUSTOMIZADO: Confirmação de Exclusão injetado no body */}
          {confirmandoExclusao && createPortal(
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div className="animate-fade-in" style={{ background: 'var(--code-bg)', borderRadius: '28px', padding: '32px 24px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #ef4444' }}>
                
                <div style={{ marginBottom: '16px', color: '#ef4444', display: 'flex', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </div>
                
                <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>Excluir este Sonho?</h3>
                <p style={{ color: 'var(--text)', marginBottom: '12px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Tem certeza que deseja apagar o sonho <strong>"{metaSelecionada.titulo}"</strong>?
                </p>
                <p style={{ color: 'var(--text)', marginBottom: '32px', fontSize: '0.8rem', lineHeight: '1.5', fontStyle: 'italic' }}>
                  O dinheiro já guardado <strong>continuará no Saldo Conjunto</strong>, mas o histórico dessa meta será apagado para sempre.
                </p>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setConfirmandoExclusao(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={confirmarExclusao} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>
                    {isProcessando ? 'Apagando...' : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        </div>
      </div>
    );
  }

  // --- VISÃO 2: O MAPA DOS SONHOS (MANTIDA IGUAL) ---
  return (
    <div className="hub-fintech-container animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ margin: 0 }}>
          {icons.voltar} Voltar
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Mapa dos Sonhos</h2>
          <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Tudo o que estamos construindo juntos</span>
        </div>
      </div>

      <div className="hub-balance-card" style={{ padding: '24px', background: 'var(--bg)', marginBottom: '32px', border: '1px dashed var(--border)' }}>
        <span className="hub-balance-label">Total Guardado em Nossos Sonhos</span>
        <h2 style={{ color: 'var(--text-h)', margin: 0, fontSize: '2.5rem' }}>{formatMoney(metas.reduce((a: number, b: any) => a + (b.atual || 0), 0))}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {metas.map((meta: any) => {
          const perc = Math.min((meta.atual / meta.alvo) * 100, 100);
          return (
            <div 
              key={meta.id} 
              onClick={() => setMetaSelecionada(meta)}
              style={{ padding: '24px', background: 'var(--code-bg)', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.2rem' }}>{meta.titulo}</h3>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>Já temos para ele</span>
                <h2 style={{ margin: '4px 0', color: 'var(--accent)' }}>{formatMoney(meta.atual)}</h2>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px', marginTop: 'auto' }}>
                <div style={{ width: `${perc}%`, height: '100%', background: 'var(--accent)' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)' }}>
                <span>{perc.toFixed(0)}% da conquista</span>
                <span>Onde queremos chegar: {formatMoney(meta.alvo)}</span>
              </div>
            </div>
          );
        })}

        <div 
          onClick={() => setCriandoMeta(true)}
          style={{ padding: '24px', borderRadius: '16px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', minHeight: '220px', transition: 'all 0.2s ease' }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(139, 92, 246, 0.02)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ color: 'var(--accent)', marginBottom: '16px', transform: 'scale(1.5)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <span style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '1.1rem' }}>Traçar Novo Sonho</span>
        </div>
      </div>

      {criandoMeta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-in" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%' }}>
            
            <div style={{ width: 64, height: 64, background: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>

            <h3 style={{ color: 'var(--text-h)', margin: '0 0 24px 0', textAlign: 'center' }}>Qual o próximo marco?</h3>
            
            <form onSubmit={handleSalvarMeta} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-h)' }}>Título do Sonho</label>
                <input type="text" value={novaMetaTitulo} onChange={e => setNovaMetaTitulo(e.target.value)} required placeholder="Ex: Nossa Casa, Viagem para..." style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none', fontSize: '1rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-h)' }}>Quanto precisamos juntar?</label>
                <input type="number" value={novaMetaAlvo} onChange={e => setNovaMetaAlvo(e.target.value)} required placeholder="R$ 0,00" style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none', fontSize: '1rem' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setCriandoMeta(false)} disabled={isProcessando} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isProcessando} style={{ flex: 1, padding: '14px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{isProcessando ? 'Salvando...' : 'Traçar Sonho'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="scroll-spacer"></div>
    </div>
  );
};