import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CATEGORIAS = ['Cerimônia', 'Recepção', 'Vestuário', 'Beleza', 'Fornecedores', 'Convidados', 'Decoração', 'Lua de Mel', 'Financeiro', 'Documentação'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];

// Novas Fases Dinâmicas da Linha do Tempo
const FASES_TIMELINE = [
  '12 a 18 Meses Antes',
  '9 a 11 Meses Antes',
  '6 a 8 Meses Antes',
  '3 a 5 Meses Antes',
  '1 a 2 Meses Antes',
  'Mês do Casamento',
  'Pós-Casamento',
  'Sem Fase Específica'
];

export const CasamentoModalChecklist = ({
  checklistAberto, setChecklistAberto, casalId, tarefas, dataCasamento
}: any) => {

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Cerimônia');
  const [prioridade, setPrioridade] = useState('Média');
  const [fase, setFase] = useState('12 a 18 Meses Antes');
  const [prazo, setPrazo] = useState('');
  const [status, setStatus] = useState('pendente');
  const [observacao, setObservacao] = useState('');

  const [isProcessando, setIsProcessando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todas'); // todas, pendentes, concluidas

  // --- AGRUPAMENTO E PROGRESSO ---
  const tarefasFiltradas = tarefas.filter((t: any) => {
    if (filtroStatus === 'concluidas') return t.status === 'concluida';
    if (filtroStatus === 'pendentes') return t.status !== 'concluida';
    return true;
  });

  const tarefasAgrupadas = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    FASES_TIMELINE.forEach(f => grupos[f] = []);
    
    tarefasFiltradas.forEach((t: any) => {
      const faseTarefa = t.fase || 'Sem Fase Específica';
      if (grupos[faseTarefa]) grupos[faseTarefa].push(t);
      else grupos['Sem Fase Específica'].push(t);
    });
    return grupos;
  }, [tarefasFiltradas]);

  const progresso = tarefas.length > 0 
    ? Math.round((tarefas.filter((t: any) => t.status === 'concluida').length / tarefas.length) * 100) 
    : 0;

  if (!checklistAberto) return null;

  // --- CONTROLES DE FORMULÁRIO ---
  const abrirFormNovo = () => {
    setIdEdicao(null); setTitulo(''); setCategoria('Cerimônia'); setPrioridade('Média'); 
    setFase('Sem Fase Específica'); setPrazo(''); setStatus('pendente'); setObservacao('');
    setFormAberto(true);
  };

  const abrirFormEdicao = (t: any) => {
    setIdEdicao(t.id); setTitulo(t.titulo); setCategoria(t.categoria); setPrioridade(t.prioridade); 
    setFase(t.fase || 'Sem Fase Específica'); setPrazo(t.prazo || ''); setStatus(t.status); setObservacao(t.observacao || '');
    setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !titulo) return;
    setIsProcessando(true);
    try {
      const payload = { titulo, categoria, prioridade, fase, prazo, status, observacao, updatedAt: serverTimestamp() };
      if (idEdicao) await updateDoc(doc(db, 'casais', casalId, 'tarefas', idEdicao), payload);
      else await addDoc(collection(db, 'casais', casalId, 'tarefas'), { ...payload, createdAt: serverTimestamp() });
      setFormAberto(false);
    } catch (e) { console.error(e); } finally { setIsProcessando(false); }
  };

  const alternarStatusRapido = async (id: string, statusAtual: string, e: any) => {
    e.stopPropagation();
    if (!casalId) return;
    const novoStatus = statusAtual === 'concluida' ? 'pendente' : 'concluida';
    await updateDoc(doc(db, 'casais', casalId, 'tarefas', id), { status: novoStatus, updatedAt: serverTimestamp() });
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Remover esta tarefa?")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'tarefas', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  // --- MOTOR GERADOR INTELIGENTE (CALCULA DATAS BASEADAS NO CASAMENTO) ---
  const gerarChecklistAutomatico = async () => {
    if (!casalId || !window.confirm("Isso irá organizar um cronograma com as tarefas essenciais. Continuar?")) return;
    setIsProcessando(true);
    try {
      const batch = writeBatch(db);

      // Função matemática que deduz meses da data do casamento
      const calcularPrazo = (mesesAntes: number, diasAntes: number = 0) => {
        if (!dataCasamento) return '';
        const data = new Date(dataCasamento + 'T12:00:00');
        data.setMonth(data.getMonth() - mesesAntes);
        data.setDate(data.getDate() - diasAntes);
        return data.toISOString().split('T')[0];
      };

      const tarefasBase = [
        // 12 a 18 Meses
        { titulo: 'Definir o teto de gastos (Orçamento Máximo)', categoria: 'Financeiro', prioridade: 'Urgente', fase: '12 a 18 Meses Antes', prazo: calcularPrazo(13) },
        { titulo: 'Fazer a primeira lista de convidados', categoria: 'Convidados', prioridade: 'Alta', fase: '12 a 18 Meses Antes', prazo: calcularPrazo(13) },
        { titulo: 'Pesquisar e fechar o Espaço e Buffet', categoria: 'Cerimônia', prioridade: 'Urgente', fase: '12 a 18 Meses Antes', prazo: calcularPrazo(12) },
        
        // 9 a 11 Meses
        { titulo: 'Contratar Fotografia e Vídeo', categoria: 'Fornecedores', prioridade: 'Alta', fase: '9 a 11 Meses Antes', prazo: calcularPrazo(10) },
        { titulo: 'Definir o estilo da Decoração e contratar', categoria: 'Decoração', prioridade: 'Alta', fase: '9 a 11 Meses Antes', prazo: calcularPrazo(9) },
        { titulo: 'Iniciar as buscas pelo Vestido de Noiva', categoria: 'Vestuário', prioridade: 'Alta', fase: '9 a 11 Meses Antes', prazo: calcularPrazo(9) },
        
        // 6 a 8 Meses
        { titulo: 'Definir roteiro e fechar Lua de Mel', categoria: 'Lua de Mel', prioridade: 'Média', fase: '6 a 8 Meses Antes', prazo: calcularPrazo(7) },
        { titulo: 'Fazer o convite oficial aos Padrinhos', categoria: 'Convidados', prioridade: 'Alta', fase: '6 a 8 Meses Antes', prazo: calcularPrazo(6) },
        { titulo: 'Escolher o traje do Noivo', categoria: 'Vestuário', prioridade: 'Média', fase: '6 a 8 Meses Antes', prazo: calcularPrazo(6) },
        
        // 3 a 5 Meses
        { titulo: 'Comprar as Alianças', categoria: 'Cerimônia', prioridade: 'Alta', fase: '3 a 5 Meses Antes', prazo: calcularPrazo(4) },
        { titulo: 'Dar entrada na documentação do Civil', categoria: 'Documentação', prioridade: 'Urgente', fase: '3 a 5 Meses Antes', prazo: calcularPrazo(3) },
        { titulo: 'Enviar o Save the Date (Aviso Prévio)', categoria: 'Convidados', prioridade: 'Média', fase: '3 a 5 Meses Antes', prazo: calcularPrazo(4) },
        
        // 1 a 2 Meses
        { titulo: 'Entregar os Convites Oficiais', categoria: 'Convidados', prioridade: 'Urgente', fase: '1 a 2 Meses Antes', prazo: calcularPrazo(2) },
        { titulo: 'Cobrar RSVP (Confirmação de Presença)', categoria: 'Convidados', prioridade: 'Alta', fase: '1 a 2 Meses Antes', prazo: calcularPrazo(1) },
        { titulo: 'Reunião final de alinhamento com fornecedores', categoria: 'Fornecedores', prioridade: 'Alta', fase: '1 a 2 Meses Antes', prazo: calcularPrazo(1) },
        
        // Mês do Casamento
        { titulo: 'Retirar os trajes dos noivos', categoria: 'Vestuário', prioridade: 'Alta', fase: 'Mês do Casamento', prazo: calcularPrazo(0, 7) },
        { titulo: 'Fazer as malas da Lua de Mel', categoria: 'Lua de Mel', prioridade: 'Média', fase: 'Mês do Casamento', prazo: calcularPrazo(0, 3) },
        { titulo: 'Dia da Noiva / Relaxar', categoria: 'Beleza', prioridade: 'Baixa', fase: 'Mês do Casamento', prazo: calcularPrazo(0, 1) },

        // Pós-Casamento
        { titulo: 'Devolver trajes alugados', categoria: 'Vestuário', prioridade: 'Alta', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) },
        { titulo: 'Agradecer a presença dos convidados', categoria: 'Convidados', prioridade: 'Média', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) }
      ];

      tarefasBase.forEach(t => {
        const docRef = doc(collection(db, 'casais', casalId, 'tarefas'));
        batch.set(docRef, { ...t, status: 'pendente', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      await batch.commit();
    } catch (error) { console.error(error); } finally { setIsProcessando(false); }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '700px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Planner & Checklist</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Linha do tempo até o altar.</span>
              </div>
              <button onClick={() => setChecklistAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            {/* BARRA DE PROGRESSO */}
            <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', marginBottom: '24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-h)' }}>Progresso Geral</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent)' }}>{progresso}%</span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progresso}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), #10b981)', transition: 'width 0.5s ease-out' }}></div>
              </div>
            </div>

            {tarefas.length === 0 && (
              <div className="animate-fade-in" style={{ textAlign: 'center', padding: '32px 24px', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.02) 100%)', borderRadius: '24px', border: '1px solid rgba(244, 63, 94, 0.2)', marginBottom: '24px' }}>
                <h4 style={{ color: '#f43f5e', fontSize: '1.1rem', margin: '0 0 8px 0' }}>Sua jornada começa aqui</h4>
                <p style={{ color: 'var(--text)', fontSize: '0.85rem', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  Deixe nossa IA gerar as tarefas essenciais separadas por meses, <strong>já calculando as datas limites</strong> com base no dia do seu casamento.
                </p>
                <button onClick={gerarChecklistAutomatico} disabled={isProcessando} style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '16px 24px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)' }}>
                  {isProcessando ? 'A Processar Cronograma...' : 'Criar Linha do Tempo Inteligente'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button onClick={() => setFiltroStatus('todas')} style={{ padding: '8px 16px', borderRadius: '12px', background: filtroStatus === 'todas' ? 'var(--text-h)' : 'transparent', color: filtroStatus === 'todas' ? 'var(--bg)' : 'var(--text)', border: filtroStatus === 'todas' ? 'none' : '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Todas</button>
              <button onClick={() => setFiltroStatus('pendentes')} style={{ padding: '8px 16px', borderRadius: '12px', background: filtroStatus === 'pendentes' ? 'var(--accent)' : 'transparent', color: filtroStatus === 'pendentes' ? '#fff' : 'var(--text)', border: filtroStatus === 'pendentes' ? 'none' : '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Pendentes</button>
              <button onClick={() => setFiltroStatus('concluidas')} style={{ padding: '8px 16px', borderRadius: '12px', background: filtroStatus === 'concluidas' ? '#10b981' : 'transparent', color: filtroStatus === 'concluidas' ? '#fff' : 'var(--text)', border: filtroStatus === 'concluidas' ? 'none' : '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Concluídas</button>
            </div>

            {/* LISTA AGRUPADA POR FASES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {FASES_TIMELINE.map(fase => {
                const listaFase = tarefasAgrupadas[fase];
                if (!listaFase || listaFase.length === 0) return null;

                return (
                  <div key={fase} className="animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem', letterSpacing: '0.5px' }}>{fase}</h4>
                      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {listaFase.map((t: any) => {
                        const isConcluida = t.status === 'concluida';
                        const prioridadeCor = t.prioridade === 'Urgente' ? '#ef4444' : t.prioridade === 'Alta' ? '#f59e0b' : 'var(--text)';
                        
                        return (
                          <div key={t.id} onClick={() => abrirFormEdicao(t)} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', opacity: isConcluida ? 0.6 : 1, transition: '0.2s' }}>
                            
                            <button onClick={(e) => alternarStatusRapido(t.id, t.status, e)} style={{ width: '30px', height: '30px', borderRadius: '10px', border: `2px solid ${isConcluida ? '#10b981' : 'var(--border)'}`, background: isConcluida ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: '0.2s' }}>
                              {isConcluida && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </button>
                            
                            <div style={{ flex: 1 }}>
                              <h5 style={{ margin: '0 0 6px 0', color: 'var(--text-h)', fontSize: '0.95rem', textDecoration: isConcluida ? 'line-through' : 'none' }}>{t.titulo}</h5>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '6px' }}>{t.categoria}</span>
                                {!isConcluida && <span style={{ fontSize: '0.7rem', color: prioridadeCor, fontWeight: 'bold' }}>• {t.prioridade}</span>}
                                {t.prazo && !isConcluida && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold' }}>
                                    • Até {t.prazo.split('-').reverse().join('/')}
                                  </span>
                                )}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '20px', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0 }}>
              + Adicionar Tarefa
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px', paddingRight: '4px' }}>
              
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>O que precisa ser feito?</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Degustação do Buffet..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Fase / Momento</label>
                  <select value={fase} onChange={e => setFase(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    {FASES_TIMELINE.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Data Limite (Opcional)</label>
                  <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Prioridade</label>
                  <select value={prioridade} onChange={e => setPrioridade(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                  <option value="pendente">Pendente</option>
                  <option value="concluida">Concluída ✔️</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Anotações / Links Relevantes</label>
                <textarea rows={3} value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Contatos, links de orçamento, ideias..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none', resize: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0, marginTop: '8px' }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '16px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '20px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={isProcessando || !titulo} style={{ flex: 2, padding: '16px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!titulo || isProcessando) ? 0.5 : 1 }}>
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