import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CATEGORIAS = [
  { id: 'pacote', nome: 'Pacote Completo', cor: '#f43f5e', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> },
  { id: 'espaco', nome: 'Apenas Espaço', cor: '#8b5cf6', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> },
  { id: 'buffet', nome: 'Alimentação', cor: '#f59e0b', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg> },
  { id: 'assessoria', nome: 'Assessoria', cor: '#14b8a6', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
  { id: 'foto', nome: 'Foto e Vídeo', cor: '#0ea5e9', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg> },
  { id: 'musica', nome: 'Música / DJ', cor: '#ec4899', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg> },
  { id: 'decoracao', nome: 'Decoração', cor: '#10b981', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> },
  { id: 'vestuario', nome: 'Vestuário / Beleza', cor: '#d946ef', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg> },
  { id: 'outros', nome: 'Outros', cor: '#64748b', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> }
];

// OPÇÕES DE AVALIAÇÃO VISUAL POR CORES
const AVALIACOES_CONFIG: Record<string, { label: string, cor: string, bg: string, border: string, icon: string }> = {
  verde: { label: 'Aprovado / Favorito', cor: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', icon: '🟢' },
  amarelo: { label: 'Em Análise / Dúvida', cor: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', icon: '🟡' },
  vermelho: { label: 'Descartado / Recusado', cor: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '🔴' }
};

const STATUS_CONFIG: Record<string, { label: string, cor: string }> = {
  pesquisando: { label: 'Em Pesquisa', cor: '#8b5cf6' },
  negociando: { label: 'Negociando', cor: '#f59e0b' },
  fechado: { label: 'Contrato Fechado', cor: '#10b981' }
};

// RESPOSTAS RÁPIDAS (MOTIVOS DE DESCARTE)
const MOTIVOS_RAPIDOS = [
  '💸 Preço muito alto',
  '📅 Sem data disponível',
  '📍 Localização / Acesso ruim',
  '⚠️ Pouca confiança / Avaliações ruins',
  '💳 Condições de pagamento inflexíveis',
  '🍽️ Serviço / Menu não agradou',
  '🤝 Preferimos outra opção'
];

export const CasamentoModalPlanner = ({
  plannerAberto, setPlannerAberto, casalId, fornecedores, formatMoney, tetoCasamento, valorComprometido
}: any) => {

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('espaco');
  const [itensInclusos, setItensInclusos] = useState('');
  const [status, setStatus] = useState('pesquisando');
  const [avaliacao, setAvaliacao] = useState('amarelo'); // verde | amarelo | vermelho
  const [valorInicial, setValorInicial] = useState(''); 
  const [valor, setValor] = useState(''); 
  const [contato, setContato] = useState('');
  const [temContratoAnexado, setTemContratoAnexado] = useState(false); 
  const [motivoDescarte, setMotivoDescarte] = useState('');

  const [isProcessando, setIsProcessando] = useState(false);
  const [filtroAvaliacao, setFiltroAvaliacao] = useState('todos');

  if (!plannerAberto) return null;

  const handleMask = (e: any, setter: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setter(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const abrirFormNovo = () => {
    setIdEdicao(null); setNome(''); setCategoria('espaco'); setItensInclusos(''); setStatus('pesquisando'); 
    setAvaliacao('amarelo'); setValorInicial(''); setValor(''); setContato(''); setTemContratoAnexado(false);
    setMotivoDescarte('');
    setFormAberto(true);
  };

  const abrirFormEdicao = (f: any) => {
    setIdEdicao(f.id); setNome(f.nome); setCategoria(f.categoria); setItensInclusos(f.itensInclusos || ''); setStatus(f.status || 'pesquisando'); 
    setAvaliacao(f.avaliacao || (f.status === 'fechado' ? 'verde' : 'amarelo'));
    setValorInicial(f.valorInicial ? f.valorInicial.toString() : '');
    setValor(f.valor ? f.valor.toString() : ''); 
    setContato(f.contato || '');
    setTemContratoAnexado(f.temContratoAnexado || false);
    setMotivoDescarte(f.motivoDescarte || '');
    setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !nome) return;
    setIsProcessando(true);
    try {
      const payload = { 
        nome, categoria, itensInclusos, status, 
        avaliacao,
        valorInicial: Number(valorInicial || 0), 
        valor: Number(valor || 0), 
        contato, 
        temContratoAnexado,
        motivoDescarte,
        updatedAt: serverTimestamp() 
      };
      if (idEdicao) await updateDoc(doc(db, 'casais', casalId, 'fornecedores', idEdicao), payload);
      else await addDoc(collection(db, 'casais', casalId, 'fornecedores'), { ...payload, createdAt: serverTimestamp() });
      setFormAberto(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Apagar orçamento/fornecedor?")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'fornecedores', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const adicionarMotivoRapido = (motivo: string) => {
    if (!motivoDescarte) {
      setMotivoDescarte(motivo);
    } else if (!motivoDescarte.includes(motivo)) {
      setMotivoDescarte(prev => `${prev} • ${motivo}`);
    }
  };

  const fornecedoresFiltrados = fornecedores.filter((f: any) => {
    if (filtroAvaliacao === 'todos') return true;
    if (filtroAvaliacao === 'fechado') return f.status === 'fechado';
    return (f.avaliacao || (f.status === 'fechado' ? 'verde' : 'amarelo')) === filtroAvaliacao;
  });

  const percentualTeto = tetoCasamento > 0 ? (valorComprometido / tetoCasamento) * 100 : 0;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '650px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Fornecedores & Propostas</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Compare opções e registre o motivo de escolhas.</span>
              </div>
              <button onClick={() => setPlannerAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Contratos Fechados</span>
                  <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.6rem' }}>{formatMoney(valorComprometido)}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Teto Máximo</span>
                  <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem' }}>{formatMoney(tetoCasamento)}</h4>
                </div>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${percentualTeto}%`, height: '100%', background: percentualTeto > 90 ? '#ef4444' : '#10b981', transition: 'width 1s ease' }}></div>
              </div>
            </div>

            {/* FILTROS POR CORES DE AVALIAÇÃO */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', flexShrink: 0 }}>
              <button onClick={() => setFiltroAvaliacao('todos')} style={{ padding: '8px 14px', borderRadius: '12px', whiteSpace: 'nowrap', border: filtroAvaliacao === 'todos' ? 'none' : '1px solid var(--border)', background: filtroAvaliacao === 'todos' ? 'var(--text-h)' : 'transparent', color: filtroAvaliacao === 'todos' ? 'var(--bg)' : 'var(--text)', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                Todos
              </button>
              <button onClick={() => setFiltroAvaliacao('fechado')} style={{ padding: '8px 14px', borderRadius: '12px', whiteSpace: 'nowrap', border: filtroAvaliacao === 'fechado' ? 'none' : '1px solid var(--border)', background: filtroAvaliacao === 'fechado' ? '#10b981' : 'transparent', color: filtroAvaliacao === 'fechado' ? '#fff' : 'var(--text)', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                ✔️ Fechados
              </button>
              <button onClick={() => setFiltroAvaliacao('verde')} style={{ padding: '8px 14px', borderRadius: '12px', whiteSpace: 'nowrap', border: filtroAvaliacao === 'verde' ? 'none' : '1px solid var(--border)', background: filtroAvaliacao === 'verde' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: filtroAvaliacao === 'verde' ? '#10b981' : 'var(--text)', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                🟢 Favoritos
              </button>
              <button onClick={() => setFiltroAvaliacao('amarelo')} style={{ padding: '8px 14px', borderRadius: '12px', whiteSpace: 'nowrap', border: filtroAvaliacao === 'amarelo' ? 'none' : '1px solid var(--border)', background: filtroAvaliacao === 'amarelo' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: filtroAvaliacao === 'amarelo' ? '#f59e0b' : 'var(--text)', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                🟡 Em Análise
              </button>
              <button onClick={() => setFiltroAvaliacao('vermelho')} style={{ padding: '8px 14px', borderRadius: '12px', whiteSpace: 'nowrap', border: filtroAvaliacao === 'vermelho' ? 'none' : '1px solid var(--border)', background: filtroAvaliacao === 'vermelho' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: filtroAvaliacao === 'vermelho' ? '#ef4444' : 'var(--text)', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                🔴 Descartados
              </button>
            </div>

            {/* LISTAGEM DE FORNECEDORES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              {fornecedoresFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: 'var(--code-bg)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
                  <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
                    Nenhum fornecedor nesta categoria. Cadastre propostas para poder compará-las!
                  </p>
                </div>
              ) : (
                fornecedoresFiltrados.map((f: any) => {
                  const cat = CATEGORIAS.find(c => c.id === f.categoria) || CATEGORIAS[CATEGORIAS.length - 1];
                  const avalKey = f.avaliacao || (f.status === 'fechado' ? 'verde' : 'amarelo');
                  const avalConf = AVALIACOES_CONFIG[avalKey] || AVALIACOES_CONFIG.amarelo;
                  const stat = STATUS_CONFIG[f.status || 'pesquisando'];
                  const economia = (f.valorInicial || 0) - (f.valor || 0);

                  return (
                    <div key={f.id} onClick={() => abrirFormEdicao(f)} style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: `1px solid ${avalConf.border}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `${cat.cor}15`, color: cat.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {cat.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem' }}>{f.nome}</h4>
                            <span style={{ fontSize: '0.8rem' }}>{avalConf.icon}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold' }}>{cat.nome}</span>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }}></span>
                            <span style={{ fontSize: '0.75rem', color: stat?.cor || 'var(--text)', fontWeight: 'bold' }}>{stat?.label || f.status}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1.05rem' }}>
                            {f.valor ? formatMoney(f.valor) : (f.valorInicial ? formatMoney(f.valorInicial) : '--')}
                          </span>
                        </div>
                      </div>

                      {/* DETALHES DE PROPOSTA E MOTIVO DE DESCARTE */}
                      {f.itensInclusos && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text)', background: 'var(--code-bg)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                          <strong>Proposta:</strong> {f.itensInclusos}
                        </div>
                      )}

                      {f.motivoDescarte && (
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: '500' }}>
                          <strong>Motivo do Não Fechamento:</strong> {f.motivoDescarte}
                        </div>
                      )}

                      {economia > 0 && f.status === 'fechado' && (
                        <span style={{ alignSelf: 'flex-start', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                          🎉 Economia Negociada: {formatMoney(economia)}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)' }}>
              + Cadastrar Proposta / Fornecedor
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Fornecedor & Proposta' : 'Nova Proposta de Fornecedor'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
              
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Nome da Empresa / Profissional</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Buffet Flor de Lótus..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>

              {/* SELEÇÃO DE AVALIAÇÃO COM CORES (VERDE, AMARELO, VERMELHO) */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Sinalizador de Opção (Avaliação)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {Object.entries(AVALIACOES_CONFIG).map(([key, conf]) => {
                    const isSelected = avaliacao === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setAvaliacao(key);
                          if (key === 'verde' && status === 'pesquisando') setStatus('negociando');
                        }}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '14px',
                          border: isSelected ? `2px solid ${conf.cor}` : '1px solid var(--border)',
                          background: isSelected ? conf.bg : 'var(--code-bg)',
                          color: isSelected ? conf.cor : 'var(--text)',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: '0.2s'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{conf.icon}</span>
                        <span>{key === 'verde' ? 'Favorito' : key === 'amarelo' ? 'Em Análise' : 'Descartado'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Status de Negociação</label>
                  <select value={status} onChange={e => {
                    const ns = e.target.value;
                    setStatus(ns);
                    if (ns === 'fechado') setAvaliacao('verde');
                  }} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    {Object.entries(STATUS_CONFIG).map(([key, conf]) => <option key={key} value={key}>{conf.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Detalhes da Proposta / Itens Inclusos</label>
                <textarea rows={2} value={itensInclusos} onChange={e => setItensInclusos(e.target.value)} placeholder="Ex: Inclui DJ, iluminação cênica, gerador de energia e 6h de festa..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.95rem', outline: 'none', resize: 'none' }} />
              </div>

              {/* CARD DE VALORES E VALOR FINAL */}
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#f59e0b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  Proposta de Valor e Negociação
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>1ª Proposta (R$)</label>
                    <input type="text" inputMode="numeric" value={formatMask(valorInicial)} onChange={(e) => handleMask(e, setValorInicial)} placeholder="0,00" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '4px', fontSize: '0.95rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Valor Final Fechado (R$)</label>
                    <input type="text" inputMode="numeric" value={formatMask(valor)} onChange={(e) => handleMask(e, setValor)} placeholder="0,00" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--accent)', marginTop: '4px', fontSize: '0.95rem', fontWeight: 'bold', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* SEÇÃO DO MOTIVO DE NÃO TER SIDO ESCOLHIDO (RESPOSTAS RÁPIDAS + MANUAL) */}
              <div style={{ background: avaliacao === 'vermelho' ? 'rgba(239, 68, 68, 0.05)' : 'var(--code-bg)', border: `1px solid ${avaliacao === 'vermelho' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`, padding: '16px', borderRadius: '20px', transition: '0.2s' }}>
                <label style={{ fontSize: '0.75rem', color: avaliacao === 'vermelho' ? '#ef4444' : 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🚫 Motivo de Não Ter Sido Escolhido / Descarte
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text)', display: 'block', marginTop: '4px', marginBottom: '10px' }}>
                  Selecione uma resposta rápida abaixo ou digite o motivo manualmente:
                </span>

                {/* RESPOSTAS RÁPIDAS (CHIPS) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {MOTIVOS_RAPIDOS.map((motivo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => adicionarMotivoRapido(motivo)}
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-h)',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: '0.15s'
                      }}
                    >
                      + {motivo}
                    </button>
                  ))}
                </div>

                {/* CAMPO MANUAL */}
                <input
                  type="text"
                  value={motivoDescarte}
                  onChange={e => setMotivoDescarte(e.target.value)}
                  placeholder="Digite aqui o motivo ou clique nos botões acima..."
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Link / Instagram / Contato</label>
                <input type="text" value={contato} onChange={e => setContato(e.target.value)} placeholder="Instagram, WhatsApp, Site do fornecedor..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.95rem', outline: 'none' }} />
              </div>

              {status === 'fechado' && (
                <div onClick={() => setTemContratoAnexado(!temContratoAnexado)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: temContratoAnexado ? 'rgba(16, 185, 129, 0.1)' : 'var(--code-bg)', border: `1px solid ${temContratoAnexado ? '#10b981' : 'var(--border)'}`, padding: '16px', borderRadius: '16px', cursor: 'pointer', transition: '0.2s' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: `2px solid ${temContratoAnexado ? '#10b981' : 'var(--text)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: temContratoAnexado ? '#10b981' : 'transparent' }}>
                    {temContratoAnexado && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <span style={{ fontWeight: 'bold', color: temContratoAnexado ? '#10b981' : 'var(--text)', fontSize: '0.9rem' }}>Contrato já assinado e anexo guardado</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0, marginTop: '12px' }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={isProcessando || !nome} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!nome || isProcessando) ? 0.5 : 1 }}>
                {isProcessando ? 'Salvando...' : 'Salvar Proposta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};