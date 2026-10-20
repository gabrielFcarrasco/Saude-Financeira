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

// Regra de Isenção do Buffet: Crianças até 7 anos e bebês NÃO PAGAM
export const ehPaganteBuffet = (tipo: string, idade?: number | string) => {
  if (tipo === 'bebe' || tipo === 'staff') return false;
  if (tipo === 'crianca') {
    if (idade !== undefined && idade !== null && String(idade).trim() !== '') {
      return Number(idade) > 7;
    }
    return false; // Por padrão, se não definiu idade, assume até 7 anos (isento)
  }
  return true; // Adultos pagam
};

export const CasamentoModalConvidados = ({
  convidadosAberto, setConvidadosAberto, casalId, convidados
}: any) => {

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

  // --- ESTADOS DO FORMULÁRIO ---
  const [nomeConvite, setNomeConvite] = useState('');
  const [categoria, setCategoria] = useState('Família Noiva');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [mesa, setMesa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  const [membros, setMembros] = useState<any[]>([]);

  // --- FILTROS ---
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [busca, setBusca] = useState('');

  // 1. NORMALIZAÇÃO DE DADOS
  const listaNormalizada = useMemo(() => {
    return convidados.map((c: any) => {
      if (c.membros) return c;
      
      const membrosConvertidos = [
        { id: 'titular', nome: c.nome, tipo: c.tipo || 'adulto', idade: c.idade || '', status: c.status || 'pendente', restricao: c.restricaoAlimentar || '' }
      ];
      for (let i = 0; i < (c.acompanhantesPermitidos || 0); i++) {
        membrosConvertidos.push({ id: `extra_${i}`, nome: `Acompanhante ${i+1}`, tipo: 'adulto', idade: '', status: c.status || 'pendente', restricao: '' });
      }

      return {
        ...c,
        nomeConvite: c.nomeConvite || `${c.nome} ${c.sobrenome || ''}`.trim(),
        categoria: c.grupo || 'Outros',
        membros: membrosConvertidos
      };
    });
  }, [convidados]);

  // 2. MÉTRICAS RESUMIDAS E LIMPbullet
  const metricas = useMemo(() => {
    let totalPessoas = 0;
    let totalPagantes = 0;
    let totalIsentos = 0;
    let totalCriancas = 0;
    let confirmados = 0;

    listaNormalizada.forEach((convite: any) => {
      convite.membros.forEach((m: any) => {
        totalPessoas++;

        const pagante = ehPaganteBuffet(m.tipo, m.idade);
        if (pagante) totalPagantes++;
        else totalIsentos++;

        if (m.tipo === 'crianca' || m.tipo === 'bebe') totalCriancas++;
        if (m.status === 'confirmado') confirmados++;
      });
    });

    return { totalPessoas, totalPagantes, totalIsentos, totalCriancas, confirmados };
  }, [listaNormalizada]);

  // 3. FILTRAGEM INTELIGENTE POR CATEGORIA (INCLUINDO "CRIANÇAS")
  const convitesFiltrados = useMemo(() => {
    const buscaClean = busca.toLowerCase().trim();

    return listaNormalizada.filter((c: any) => {
      // Pesquisa textual por nome do convite ou integrante
      const atendeBusca = !buscaClean || 
        c.nomeConvite?.toLowerCase().includes(buscaClean) ||
        c.membros.some((m: any) => m.nome?.toLowerCase().includes(buscaClean));

      if (!atendeBusca) return false;

      // Filtro de Categoria:
      // Se for "Todas", exibe tudo.
      // Se for "Crianças", puxa automaticamente qualquer convite/família que tenha criança ou bebê.
      // Caso contrário, filtra pela categoria salva na família.
      if (filtroCategoria === 'Todas') return true;
      if (filtroCategoria === 'Crianças') {
        return c.membros.some((m: any) => m.tipo === 'crianca' || m.tipo === 'bebe');
      }
      return c.categoria === filtroCategoria;
    });
  }, [listaNormalizada, filtroCategoria, busca]);

  if (!convidadosAberto) return null;

  // --- CONTROLES DO FORMULÁRIO ---
  const abrirFormNovo = () => {
    setIdEdicao(null); 
    setNomeConvite(''); setCategoria('Família Noiva'); setTelefone(''); setEmail(''); setMesa(''); setObservacoes('');
    setMembros([{ id: Date.now().toString(), nome: '', tipo: 'adulto', idade: '', status: 'pendente', restricao: '' }]);
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
    setMembros([...membros, { id: Date.now().toString(), nome: '', tipo: 'adulto', idade: '', status: 'pendente', restricao: '' }]);
  };

  const atualizarMembro = (id: string, campo: string, valor: any) => {
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
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '750px', padding: '24px 20px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        
        {/* BARRA DE ARRASTE */}
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 16px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            {/* CABEÇALHO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.3rem' }}>Lista de Convidados</h3>
                <p style={{ margin: '2px 0 0 0', color: 'var(--text)', fontSize: '0.8rem' }}>Gestão de famílias e cálculo do buffet.</p>
              </div>
              <button onClick={() => setConvidadosAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            {/* PAINEL DE MÉTRICAS COMPACTO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
              <div style={{ background: 'var(--code-bg)', padding: '12px 6px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-h)' }}>{metricas.totalPessoas}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Total</span>
              </div>
              <div style={{ background: 'rgba(138, 43, 226, 0.1)', padding: '12px 6px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(138, 43, 226, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '900', color: 'var(--accent)' }}>{metricas.totalPagantes}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase' }}>Pagantes</span>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px 6px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '900', color: '#10b981' }}>{metricas.totalIsentos}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase' }}>Isentos ≤7a</span>
              </div>
              <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '12px 6px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '900', color: '#0ea5e9' }}>{metricas.totalCriancas}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#0ea5e9', textTransform: 'uppercase' }}>Crianças</span>
              </div>
            </div>

            {/* BARRA DE PESQUISA E CATEGORIAS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--code-bg)', borderRadius: '14px', padding: '0 14px', border: '1px solid var(--border)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" placeholder="Buscar por nome da família ou convidado..." value={busca} onChange={(e) => setBusca(e.target.value)}
                  style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-h)', outline: 'none', fontSize: '0.85rem' }}
                />
              </div>

              {/* BARRA ÚNICA DE CATEGORIAS */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['Todas', ...CATEGORIAS_CONVITE].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setFiltroCategoria(cat)} 
                    style={{ 
                      padding: '6px 12px', 
                      borderRadius: '10px', 
                      whiteSpace: 'nowrap', 
                      border: filtroCategoria === cat ? 'none' : '1px solid var(--border)', 
                      background: filtroCategoria === cat ? 'var(--accent)' : 'var(--code-bg)', 
                      color: filtroCategoria === cat ? '#fff' : 'var(--text)', 
                      fontWeight: 'bold', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer' 
                    }}
                  >
                    {cat} {cat === 'Crianças' ? `(${metricas.totalCriancas})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* LISTAGEM FLUIDA DE CONVITES (ÁREA ROLÁVEL) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
              {convitesFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text)' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Nenhum convidado encontrado para este filtro.</p>
                </div>
              ) : (
                convitesFiltrados.map((convite: any) => {
                  const totalMembros = convite.membros.length;
                  const totalIsentosConvite = convite.membros.filter((m: any) => !ehPaganteBuffet(m.tipo, m.idade)).length;

                  return (
                    <div key={convite.id} onClick={() => abrirFormEdicao(convite)} className="animate-fade-in" style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      
                      {/* Topo do Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px' }}>{convite.categoria}</span>
                          <h4 style={{ margin: '2px 0 0 0', color: 'var(--text-h)', fontSize: '1.05rem' }}>{convite.nomeConvite}</h4>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ background: 'var(--bg)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-h)', border: '1px solid var(--border)' }}>
                            {totalMembros} {totalMembros === 1 ? 'Pessoa' : 'Pessoas'}
                          </span>
                          {totalIsentosConvite > 0 && (
                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                              {totalIsentosConvite} Isento(s)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Membros integrantes */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {convite.membros.map((m: any) => {
                          const cor = getStatusCor(m.status);
                          const ePag = ehPaganteBuffet(m.tipo, m.idade);

                          return (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg)', padding: '5px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cor.text }}></div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: '600' }}>
                                {m.nome || 'Sem nome'}
                              </span>
                              
                              {m.tipo === 'crianca' && (
                                <span style={{ fontSize: '0.65rem', background: ePag ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: ePag ? '#f59e0b' : '#10b981', padding: '1px 5px', borderRadius: '5px', fontWeight: 'bold' }}>
                                  {m.idade ? `${m.idade} anos` : 'Criança'} • {ePag ? 'Paga' : 'Isento'}
                                </span>
                              )}

                              {m.tipo === 'bebe' && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', padding: '1px 5px', borderRadius: '5px', fontWeight: 'bold' }}>
                                  Bebê (Isento)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {convite.mesa && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>📍 Mesa: <strong>{convite.mesa}</strong></span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* BOTÃO FIXO DE CRIAÇÃO */}
            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '14px', borderRadius: '18px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '14px', cursor: 'pointer', flexShrink: 0 }}>
              + Criar Novo Convite / Família
            </button>
          </>
        ) : (
          /* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO DE FAMÍLIA */
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Convite' : 'Novo Convite'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
              
              {/* DADOS GERAIS */}
              <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '18px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Nome do Convite (Ex: Família Souza)</label>
                <input type="text" value={nomeConvite} onChange={e => setNomeConvite(e.target.value)} placeholder="Ex: Família Souza, João e Maria..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '6px', fontSize: '0.9rem', outline: 'none' }} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                    <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '4px', fontSize: '0.85rem', outline: 'none' }}>
                      {CATEGORIAS_CONVITE.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Telefone</label>
                    <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 9..." style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '4px', fontSize: '0.85rem', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* INTEGRANTES */}
              <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '18px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.9rem' }}>Pessoas no Convite ({membros.length})</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {membros.map((membro, index) => {
                    const ePagante = ehPaganteBuffet(membro.tipo, membro.idade);

                    return (
                      <div key={membro.id} style={{ background: 'var(--bg)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border)', position: 'relative' }}>
                        
                        {membros.length > 1 && (
                          <button onClick={() => removerMembro(membro.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ✕
                          </button>
                        )}

                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Integrante #{index + 1}</span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input type="text" value={membro.nome} onChange={e => atualizarMembro(membro.id, 'nome', e.target.value)} placeholder="Nome completo" style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '0.85rem', outline: 'none' }} />

                          <div style={{ display: 'grid', gridTemplateColumns: membro.tipo === 'crianca' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '6px' }}>
                            <div>
                              <select value={membro.tipo} onChange={e => atualizarMembro(membro.id, 'tipo', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '0.8rem', outline: 'none' }}>
                                <option value="adulto">Adulto (+12)</option>
                                <option value="crianca">Criança</option>
                                <option value="bebe">Bebê (Colo)</option>
                                <option value="staff">Staff/Profissional</option>
                              </select>
                            </div>

                            {membro.tipo === 'crianca' && (
                              <div>
                                <input type="number" min="0" max="17" value={membro.idade ?? ''} onChange={e => atualizarMembro(membro.id, 'idade', e.target.value)} placeholder="Idade (anos)" style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '0.8rem', outline: 'none' }} />
                              </div>
                            )}

                            <div>
                              <select value={membro.status} onChange={e => atualizarMembro(membro.id, 'status', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: getStatusCor(membro.status).bg, color: getStatusCor(membro.status).text, fontWeight: 'bold', fontSize: '0.8rem', outline: 'none' }}>
                                <option value="pendente">Pendente</option>
                                <option value="confirmado">Confirmado ✔️</option>
                                <option value="recusado">Não Irá ❌</option>
                              </select>
                            </div>
                          </div>

                          {(membro.tipo === 'crianca' || membro.tipo === 'bebe') && (
                            <div style={{ padding: '4px 8px', borderRadius: '6px', background: ePagante ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: ePagante ? '#f59e0b' : '#10b981', fontSize: '0.7rem', fontWeight: 'bold' }}>
                              {ePagante ? '🟡 Paga Buffet (idade > 7 anos)' : '🟢 Isento do Buffet (≤ 7 anos)'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={adicionarMembro} style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--accent)', border: '1px dashed rgba(138, 43, 226, 0.4)', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '10px', cursor: 'pointer' }}>
                  + Adicionar Outra Pessoa
                </button>
              </div>

              {/* DETALHES DE ORGANIZAÇÃO */}
              <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '18px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Mesa</label>
                <input type="text" value={mesa} onChange={e => setMesa(e.target.value)} placeholder="Ex: Mesa 04" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '4px', fontSize: '0.85rem', outline: 'none' }} />
              </div>

            </div>

            {/* BOTÕES DE AÇÃO */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginTop: '12px' }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '12px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Excluir
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={isProcessando || !nomeConvite || membros.length === 0} style={{ flex: 2, padding: '12px', borderRadius: '14px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!nomeConvite || isProcessando) ? 0.5 : 1 }}>
                {isProcessando ? 'Salvando...' : 'Salvar Convite'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};