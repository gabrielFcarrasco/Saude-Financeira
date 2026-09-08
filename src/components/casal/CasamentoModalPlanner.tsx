import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CATEGORIAS = [
  { id: 'espaco', nome: 'Espaço / Local', cor: '#8b5cf6', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> },
  { id: 'buffet', nome: 'Buffet / Bar', cor: '#f59e0b', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg> },
  { id: 'foto', nome: 'Foto e Vídeo', cor: '#0ea5e9', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg> },
  { id: 'musica', nome: 'Banda / DJ', cor: '#ec4899', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg> },
  { id: 'decoracao', nome: 'Decoração', cor: '#10b981', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> },
  { id: 'outros', nome: 'Outros', cor: '#64748b', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> }
];

const STATUS_CONFIG: Record<string, { label: string, cor: string }> = {
  pesquisando: { label: 'Pesquisando', cor: '#8b5cf6' },
  negociando: { label: 'Negociando', cor: '#f59e0b' },
  fechado: { label: 'Contrato Fechado', cor: '#10b981' }
};

export const CasamentoModalPlanner = ({
  plannerAberto, setPlannerAberto, casalId, fornecedores, formatMoney, tetoCasamento, valorComprometido
}: any) => {

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('espaco');
  const [status, setStatus] = useState('pesquisando');
  const [valor, setValor] = useState('');
  const [contato, setContato] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');

  if (!plannerAberto) return null;

  const handleMask = (e: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setValor(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const abrirFormNovo = () => {
    setIdEdicao(null); setNome(''); setCategoria('espaco'); setStatus('pesquisando'); setValor(''); setContato('');
    setFormAberto(true);
  };

  const abrirFormEdicao = (f: any) => {
    setIdEdicao(f.id); setNome(f.nome); setCategoria(f.categoria); setStatus(f.status); setValor(f.valor ? f.valor.toString() : ''); setContato(f.contato || '');
    setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !nome) return;
    setIsProcessando(true);
    try {
      const payload = { nome, categoria, status, valor: Number(valor || 0), contato, updatedAt: serverTimestamp() };
      if (idEdicao) {
        await updateDoc(doc(db, 'casais', casalId, 'fornecedores', idEdicao), payload);
      } else {
        await addDoc(collection(db, 'casais', casalId, 'fornecedores'), { ...payload, createdAt: serverTimestamp() });
      }
      setFormAberto(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Apagar fornecedor?")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'fornecedores', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const fornecedoresFiltrados = filtroStatus === 'todos' ? fornecedores : fornecedores.filter((f: any) => f.status === filtroStatus);
  const percentualTeto = tetoCasamento > 0 ? (valorComprometido / tetoCasamento) * 100 : 0;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Fornecedores</h3>
              <button onClick={() => setPlannerAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
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

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', flexShrink: 0 }}>
              {['todos', 'pesquisando', 'negociando', 'fechado'].map(f => (
                <button key={f} onClick={() => setFiltroStatus(f)} style={{ padding: '8px 16px', borderRadius: '12px', whiteSpace: 'nowrap', border: filtroStatus === f ? 'none' : '1px solid var(--border)', background: filtroStatus === f ? 'var(--text-h)' : 'transparent', color: filtroStatus === f ? 'var(--bg)' : 'var(--text)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                  {f === 'todos' ? 'Todos' : STATUS_CONFIG[f].label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              {fornecedoresFiltrados.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text)', marginTop: '24px', fontSize: '0.9rem' }}>Nenhum fornecedor encontrado aqui.</p>
              ) : (
                fornecedoresFiltrados.map((f: any) => {
                  const cat = CATEGORIAS.find(c => c.id === f.categoria) || CATEGORIAS[CATEGORIAS.length - 1];
                  const stat = STATUS_CONFIG[f.status];
                  return (
                    <div key={f.id} onClick={() => abrirFormEdicao(f)} style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${cat.cor}15`, color: cat.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {cat.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1rem' }}>{f.nome}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {cat.nome}
                          </span>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }}></span>
                          <span style={{ fontSize: '0.75rem', color: stat.cor, fontWeight: 'bold' }}>{stat.label}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-h)' }}>
                        {f.valor ? formatMoney(f.valor) : '--'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '24px', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)' }}>
              + Adicionar Fornecedor
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Nome da Empresa / Profissional</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Chácara Recanto, DJ Silva..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    {Object.entries(STATUS_CONFIG).map(([key, conf]) => <option key={key} value={key}>{conf.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Valor Total do Serviço (R$)</label>
                <input type="text" inputMode="numeric" value={formatMask(valor)} onChange={handleMask} placeholder="0,00" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--accent)', marginTop: '8px', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Link ou Contato (Opcional)</label>
                <input type="text" value={contato} onChange={e => setContato(e.target.value)} placeholder="Instagram, Site, WhatsApp..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={isProcessando || !nome} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!nome || isProcessando) ? 0.5 : 1 }}>
                {isProcessando ? 'Salvando...' : 'Salvar Dados'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};