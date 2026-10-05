import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CATEGORIAS_CONVITE = [
  'Família Noiva', 'Família Noivo', 
  'Padrinhos', 'Madrinhas', 
  'Amigos Noiva', 'Amigos Noivo', 
  'Amigos do Casal', 'Trabalho', 
  'Crianças', 'Staff', 'Outros'
];

export const CasamentoModalConvidados = ({
  convidadosAberto, setConvidadosAberto, casalId, convidados
}: any) => {

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

  // --- ESTADOS DO NOVO FORMULÁRIO (Baseado em "Convites / Famílias") ---
  const [nomeConvite, setNomeConvite] = useState(''); // Ex: "Família Silva"
  const [categoria, setCategoria] = useState('Família Noiva');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [mesa, setMesa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Lista dinâmica de pessoas dentro deste convite
  const [membros, setMembros] = useState<any[]>([]);

  // --- ESTADOS DA LISTAGEM ---
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [busca, setBusca] = useState('');

  // 1. NORMALIZAÇÃO DE DADOS (Garante que convidados antigos funcionem no novo modelo)
  const listaNormalizada = useMemo(() => {
    return convidados.map((c: any) => {
      if (c.membros) return c; // Já está no formato novo
      
      // Converte o formato antigo para o formato de "Família"
      const membrosConvertidos = [
        { id: 'titular', nome: c.nome, tipo: c.tipo || 'adulto', status: c.status || 'pendente', restricao: c.restricaoAlimentar || '' }
      ];
      // Adiciona acompanhantes antigos como membros genéricos
      for (let i = 0; i < (c.acompanhantesPermitidos || 0); i++) {
        membrosConvertidos.push({ id: `extra_${i}`, nome: `Acompanhante ${i+1}`, tipo: 'adulto', status: c.status || 'pendente', restricao: '' });
      }

      return {
        ...c,
        nomeConvite: c.nomeConvite || `${c.nome} ${c.sobrenome || ''}`.trim(),
        categoria: c.grupo || 'Outros',
        membros: membrosConvertidos
      };
    });
  }, [convidados]);

  // 2. MÉTRICAS (Contando pessoas reais dentro dos convites)
  const metricas = useMemo(() => {
    let total = 0; let confirmados = 0; let pendentes = 0; let recusados = 0;
    listaNormalizada.forEach((convite: any) => {
      convite.membros.forEach((m: any) => {
        total++;
        if (m.status === 'confirmado') confirmados++;
        else if (m.status === 'recusado') recusados++;
        else pendentes++;
      });
    });
    return { total, confirmados, pendentes, recusados };
  }, [listaNormalizada]);

  const convitesFiltrados = listaNormalizada.filter((c: any) => {
    const atendeCategoria = filtroCategoria === 'Todas' || c.categoria === filtroCategoria;
    const atendeBusca = c.nomeConvite?.toLowerCase().includes(busca.toLowerCase()) ||
                        c.membros.some((m:any) => m.nome.toLowerCase().includes(busca.toLowerCase()));
    return atendeCategoria && atendeBusca;
  });

  if (!convidadosAberto) return null;

  // --- FUNÇÕES DO FORMULÁRIO ---
  const abrirFormNovo = () => {
    setIdEdicao(null); 
    setNomeConvite(''); setCategoria('Família Noiva'); setTelefone(''); setEmail(''); setMesa(''); setObservacoes('');
    // Começa com 1 membro vazio
    setMembros([{ id: Date.now().toString(), nome: '', tipo: 'adulto', status: 'pendente', restricao: '' }]);
    setFormAberto(true);
  };

  const abrirFormEdicao = (c: any) => {
    setIdEdicao(c.id); 
    setNomeConvite(c.nomeConvite || ''); setCategoria(c.categoria || 'Outros'); 
    setTelefone(c.telefone || ''); setEmail(c.email || ''); 
    setMesa(c.mesa || ''); setObservacoes(c.observacoes || '');
    setMembros(c.membros || []);
    setFormAberto(true);
  };

  const adicionarMembro = () => {
    setMembros([...membros, { id: Date.now().toString(), nome: '', tipo: 'adulto', status: 'pendente', restricao: '' }]);
  };

  const atualizarMembro = (id: string, campo: string, valor: string) => {
    setMembros(membros.map(m => m.id === id ? { ...m, [campo]: valor } : m));
  };

  const removerMembro = (id: string) => {
    setMembros(membros.filter(m => m.id !== id));
  };

  const handleSalvar = async () => {
    if (!casalId || !nomeConvite || membros.length === 0) return;
    setIsProcessando(true);
    try {
      const payload = {
        nomeConvite, categoria, telefone, email, mesa, observacoes,
        membros, updatedAt: serverTimestamp()
      };

      if (idEdicao) await updateDoc(doc(db, 'casais', casalId, 'convidados', idEdicao), payload);
      else await addDoc(collection(db, 'casais', casalId, 'convidados'), { ...payload, createdAt: serverTimestamp() });
      
      setFormAberto(false);
    } catch (e) { console.error(e); } finally { setIsProcessando(false); }
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Apagar toda esta família/convite?")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'convidados', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const getStatusCor = (stat: string) => {
    if (stat === 'confirmado') return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    if (stat === 'recusado') return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '750px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            {/* CABEÇALHO DA LISTAGEM */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Gestor de Convidados</h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text)', fontSize: '0.85rem' }}>Agrupe por famílias e controle confirmações individualmente.</p>
              </div>
              <button onClick={() => setConvidadosAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            {/* MÉTRICAS GERAIS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--code-bg)', padding: '16px 8px', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-h)' }}>{metricas.total}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Total Pessoas</span>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px 8px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: '900', color: '#10b981' }}>{metricas.confirmados}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase' }}>Confirmados</span>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px 8px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b' }}>{metricas.pendentes}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase' }}>Pendentes</span>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px 8px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: '900', color: '#ef4444' }}>{metricas.recusados}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase' }}>Faltas</span>
              </div>
            </div>

            {/* BARRA DE PESQUISA E FILTROS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--code-bg)', borderRadius: '16px', padding: '0 16px', border: '1px solid var(--border)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" placeholder="Pesquisar família ou nome do convidado..." value={busca} onChange={(e) => setBusca(e.target.value)}
                  style={{ flex: 1, padding: '16px', border: 'none', background: 'transparent', color: 'var(--text-h)', outline: 'none', fontSize: '0.95rem' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {['Todas', ...CATEGORIAS_CONVITE].map(cat => (
                  <button key={cat} onClick={() => setFiltroCategoria(cat)} style={{ padding: '8px 16px', borderRadius: '12px', whiteSpace: 'nowrap', border: filtroCategoria === cat ? 'none' : '1px solid var(--border)', background: filtroCategoria === cat ? 'var(--accent)' : 'transparent', color: filtroCategoria === cat ? '#fff' : 'var(--text)', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', transition: '0.2s' }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* LISTAGEM DE CONVITES (FAMÍLIAS) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {convitesFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px', opacity: 0.5 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  <p>Nenhum convite encontrado para esta categoria.</p>
                </div>
              ) : (
                convitesFiltrados.map((convite: any) => {
                  
                  // Resumo dos status dentro deste convite
                  const total = convite.membros.length;
                  const conf = convite.membros.filter((m:any) => m.status === 'confirmado').length;
                  const rec = convite.membros.filter((m:any) => m.status === 'recusado').length;
                  const pend = total - conf - rec;

                  return (
                    <div key={convite.id} onClick={() => abrirFormEdicao(convite)} className="animate-fade-in" style={{ background: 'var(--bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                      
                      {/* Topo do Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '1px' }}>{convite.categoria}</span>
                          <h4 style={{ margin: '4px 0 0 0', color: 'var(--text-h)', fontSize: '1.15rem' }}>{convite.nomeConvite}</h4>
                        </div>
                        <div style={{ background: 'var(--code-bg)', padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)' }}>
                          {total} {total === 1 ? 'Pessoa' : 'Pessoas'}
                        </div>
                      </div>

                      {/* Nomes das Pessoas e Status Inline */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {convite.membros.map((m: any) => {
                          const cor = getStatusCor(m.status);
                          return (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--code-bg)', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cor.text }}></div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-h)', fontWeight: '500' }}>
                                {m.nome || 'Sem nome'} {m.tipo !== 'adulto' ? `(${m.tipo})` : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Resumo visual do Convite */}
                      {(pend > 0 || rec > 0) && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                          {conf > 0 && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>{conf} Vão</span>}
                          {pend > 0 && <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>{pend} Pendentes</span>}
                          {rec > 0 && <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>{rec} Não Vão</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0, boxShadow: '0 8px 25px rgba(138, 43, 226, 0.3)' }}>
              + Criar Novo Convite
            </button>
          </>
        ) : (
          /* =========================================
             TELA 2: FORMULÁRIO DE CRIAÇÃO / EDIÇÃO
             ========================================= */
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.3rem' }}>{idEdicao ? 'Editar Convite' : 'Criar Novo Convite'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto', paddingBottom: '24px', paddingRight: '8px' }}>
              
              {/* BLOCO 1: DADOS DO CONVITE */}
              <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1rem' }}>1. Dados da Família / Grupo</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Nome do Convite (Para o Envelope)</label>
                    <input type="text" value={nomeConvite} onChange={e => setNomeConvite(e.target.value)} placeholder="Ex: Família Souza, João e Maria..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                      <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                        {CATEGORIAS_CONVITE.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Telefone (WhatsApp)</label>
                      <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 9..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCO 2: PESSOAS DO CONVITE (A Mágica acontece aqui) */}
              <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem' }}>2. Quem está neste convite?</h4>
                  <span style={{ background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{membros.length} Pessoas</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {membros.map((membro, index) => (
                    <div key={membro.id} style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', position: 'relative' }}>
                      
                      {/* Botão de Excluir Pessoa */}
                      {membros.length > 1 && (
                        <button onClick={() => removerMembro(membro.id)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                           X
                        </button>
                      )}

                      <h5 style={{ margin: '0 0 12px 0', color: 'var(--text)', fontSize: '0.85rem' }}>Membro {index + 1}</h5>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
                        <input type="text" value={membro.nome} onChange={e => atualizarMembro(membro.id, 'nome', e.target.value)} placeholder="Nome completo" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '0.95rem', outline: 'none' }} />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <select value={membro.tipo} onChange={e => atualizarMembro(membro.id, 'tipo', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none' }}>
                          <option value="adulto">Adulto (+12)</option>
                          <option value="crianca">Criança (Não paga)</option>
                          <option value="bebe">Bebê (Colo)</option>
                          <option value="staff">Staff/Profissional</option>
                        </select>
                        <select value={membro.status} onChange={e => atualizarMembro(membro.id, 'status', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: getStatusCor(membro.status).bg, color: getStatusCor(membro.status).text, fontWeight: 'bold', fontSize: '0.9rem', outline: 'none' }}>
                          <option value="pendente">Pendente RSVP</option>
                          <option value="confirmado">Confirmado ✔️</option>
                          <option value="recusado">Não Irá ❌</option>
                        </select>
                      </div>

                      <input type="text" value={membro.restricao || ''} onChange={e => atualizarMembro(membro.id, 'restricao', e.target.value)} placeholder="Restrição Alimentar? (Ex: Vegano, Alergia)" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-h)', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                  ))}
                </div>

                <button onClick={adicionarMembro} style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--accent)', border: '1px dashed rgba(138, 43, 226, 0.4)', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '16px', cursor: 'pointer', transition: '0.2s' }}>
                  + Adicionar Pessoa ao Convite
                </button>
              </div>

              {/* BLOCO 3: DETALHES EXTRAS */}
              <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1rem' }}>3. Planejamento (Opcional)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Número da Mesa</label>
                    <input type="text" value={mesa} onChange={e => setMesa(e.target.value)} placeholder="Ex: Mesa 05" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Observações / Presente</label>
                    <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Informações úteis sobre esta família..." rows={3} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none', resize: 'none' }} />
                  </div>
                </div>
              </div>

            </div>

            {/* BOTÕES DE AÇÃO */}
            <div style={{ display: 'flex', gap: '12px', flexShrink: 0, marginTop: '8px' }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '16px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   Excluir Convite
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '20px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={isProcessando || !nomeConvite || membros.length === 0} style={{ flex: 2, padding: '16px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!nomeConvite || isProcessando) ? 0.5 : 1 }}>
                {isProcessando ? 'A Processar...' : 'Salvar Convite'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};