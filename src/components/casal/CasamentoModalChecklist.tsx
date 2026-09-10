import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CATEGORIAS = ['Cerimônia', 'Recepção', 'Vestuário', 'Beleza', 'Fornecedores', 'Convidados', 'Decoração', 'Lua de Mel', 'Financeiro', 'Documentação'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];

export const CasamentoModalChecklist = ({
  checklistAberto, setChecklistAberto, casalId, tarefas, dataCasamento
}: any) => {

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Cerimônia');
  const [prioridade, setPrioridade] = useState('Média');
  const [prazo, setPrazo] = useState('');
  const [status, setStatus] = useState('pendente');
  const [observacao, setObservacao] = useState('');

  const [isProcessando, setIsProcessando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todas');

  if (!checklistAberto) return null;

  const tarefasFiltradas = tarefas.filter((t: any) => {
    if (filtroStatus === 'todas') return true;
    if (filtroStatus === 'concluidas') return t.status === 'concluida';
    if (filtroStatus === 'pendentes') return t.status !== 'concluida';
    return true;
  });

  const abrirFormNovo = () => {
    setIdEdicao(null); setTitulo(''); setCategoria('Cerimônia'); setPrioridade('Média'); setPrazo(''); setStatus('pendente'); setObservacao('');
    setFormAberto(true);
  };

  const abrirFormEdicao = (t: any) => {
    setIdEdicao(t.id); setTitulo(t.titulo); setCategoria(t.categoria); setPrioridade(t.prioridade); setPrazo(t.prazo || ''); setStatus(t.status); setObservacao(t.observacao || '');
    setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !titulo) return;
    setIsProcessando(true);
    try {
      const payload = { titulo, categoria, prioridade, prazo, status, observacao, updatedAt: serverTimestamp() };
      if (idEdicao) {
        await updateDoc(doc(db, 'casais', casalId, 'tarefas', idEdicao), payload);
      } else {
        await addDoc(collection(db, 'casais', casalId, 'tarefas'), { ...payload, createdAt: serverTimestamp() });
      }
      setFormAberto(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  const alternarStatusRapido = async (id: string, statusAtual: string, e: any) => {
    e.stopPropagation();
    if (!casalId) return;
    const novoStatus = statusAtual === 'concluida' ? 'pendente' : 'concluida';
    await updateDoc(doc(db, 'casais', casalId, 'tarefas', id), { status: novoStatus });
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Remover esta tarefa?")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'tarefas', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  // Gerador Automático de Tarefas Base (Substitui a IA momentaneamente para dados determinísticos)
  const gerarChecklistAutomatico = async () => {
    if (!casalId || !window.confirm("Isso irá gerar as tarefas básicas. Deseja continuar?")) return;
    setIsProcessando(true);
    try {
      const batch = writeBatch(db);
      const tarefasBase = [
        { titulo: 'Definir teto de gastos', categoria: 'Financeiro', prioridade: 'Alta', prazo: '' },
        { titulo: 'Montar primeira lista de convidados', categoria: 'Convidados', prioridade: 'Alta', prazo: '' },
        { titulo: 'Pesquisar e visitar espaços', categoria: 'Cerimônia', prioridade: 'Urgente', prazo: '' },
        { titulo: 'Contratar Fotografia e Vídeo', categoria: 'Fornecedores', prioridade: 'Alta', prazo: '' },
        { titulo: 'Definir paleta de cores e decoração', categoria: 'Decoração', prioridade: 'Média', prazo: '' },
        { titulo: 'Degustação e contratação de Buffet', categoria: 'Fornecedores', prioridade: 'Alta', prazo: '' },
        { titulo: 'Pesquisar roteiros de Lua de Mel', categoria: 'Lua de Mel', prioridade: 'Média', prazo: '' },
        { titulo: 'Enviar Save the Date', categoria: 'Convidados', prioridade: 'Alta', prazo: '' },
        { titulo: 'Dar entrada na documentação civil', categoria: 'Documentação', prioridade: 'Urgente', prazo: '' }
      ];

      tarefasBase.forEach(t => {
        const docRef = doc(collection(db, 'casais', casalId, 'tarefas'));
        batch.set(docRef, { ...t, status: 'pendente', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      await batch.commit();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessando(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Checklist</h3>
              <button onClick={() => setChecklistAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button onClick={() => setFiltroStatus('todas')} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: filtroStatus === 'todas' ? 'var(--text-h)' : 'transparent', color: filtroStatus === 'todas' ? 'var(--bg)' : 'var(--text)', border: filtroStatus === 'todas' ? 'none' : '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>Todas</button>
              <button onClick={() => setFiltroStatus('pendentes')} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: filtroStatus === 'pendentes' ? 'var(--text-h)' : 'transparent', color: filtroStatus === 'pendentes' ? 'var(--bg)' : 'var(--text)', border: filtroStatus === 'pendentes' ? 'none' : '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>Pendentes</button>
              <button onClick={() => setFiltroStatus('concluidas')} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: filtroStatus === 'concluidas' ? 'var(--text-h)' : 'transparent', color: filtroStatus === 'concluidas' ? 'var(--bg)' : 'var(--text)', border: filtroStatus === 'concluidas' ? 'none' : '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>Concluídas</button>
            </div>

            {tarefas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--code-bg)', borderRadius: '24px', border: '1px dashed var(--accent)', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text)', fontSize: '0.9rem', marginBottom: '16px' }}>Nenhuma tarefa cadastrada. Quer gerar as tarefas essenciais automaticamente?</p>
                <button onClick={gerarChecklistAutomatico} disabled={isProcessando} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Gerar Checklist Básico
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
              {tarefasFiltradas.map((t: any) => {
                const isConcluida = t.status === 'concluida';
                const prioridadeCor = t.prioridade === 'Urgente' ? '#ef4444' : t.prioridade === 'Alta' ? '#f59e0b' : 'var(--text)';
                
                return (
                  <div key={t.id} onClick={() => abrirFormEdicao(t)} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', opacity: isConcluida ? 0.6 : 1 }}>
                    <button onClick={(e) => alternarStatusRapido(t.id, t.status, e)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: `2px solid ${isConcluida ? '#10b981' : 'var(--border)'}`, background: isConcluida ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      {isConcluida && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </button>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '0.95rem', textDecoration: isConcluida ? 'line-through' : 'none' }}>{t.titulo}</h4>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>{t.categoria}</span>
                        {!isConcluida && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: prioridadeCor }}></span>}
                        {!isConcluida && <span style={{ fontSize: '0.75rem', color: prioridadeCor, fontWeight: 'bold' }}>{t.prioridade}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)' }}>
              + Adicionar Tarefa
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>O que precisa ser feito?</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Prioridade</label>
                  <select value={prioridade} onChange={e => setPrioridade(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Prazo (Opcional)</label>
                  <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Observações</label>
                <input type="text" value={observacao} onChange={e => setObservacao(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={isProcessando || !titulo} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!titulo || isProcessando) ? 0.5 : 1 }}>
                {isProcessando ? 'Salvando...' : 'Salvar Tarefa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};