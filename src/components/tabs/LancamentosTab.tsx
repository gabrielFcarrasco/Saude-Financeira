import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase'; 

interface LancamentosTabProps {
  transacoes: any[];
}

export const LancamentosTab: React.FC<LancamentosTabProps> = ({ transacoes }) => {
  const dataAtualObj = new Date();
  const dataFormatadaHoje = dataAtualObj.toISOString().split('T')[0];

  const [categoriasDespesa, setCategoriasDespesa] = useState(['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Dívidas', 'Investimentos']);
  const [categoriasReceita, setCategoriasReceita] = useState(['Salário', 'Renda Extra', 'Rendimentos', 'Cashback']);
  const [contasUsuario, setContasUsuario] = useState(['Nubank', 'Itaú', 'Inter', 'Carteira (Físico)']);

  const [filtroMes, setFiltroMes] = useState(dataAtualObj.getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(dataAtualObj.getFullYear());
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [tipo, setTipo] = useState('despesa'); 
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(dataFormatadaHoje);
  const [categoria, setCategoria] = useState(categoriasDespesa[0]);
  const [subCategoria, setSubCategoria] = useState('');
  const [conta, setConta] = useState(contasUsuario[0]); 
  const [status, setStatus] = useState('pago');

  const [novoItemNome, setNovoItemNome] = useState('');
  const [isAdicionando, setIsAdicionando] = useState<{ ativo: boolean, campo: 'categoria' | 'conta' }>({ ativo: false, campo: 'categoria' });
  const [gerenciarModal, setGerenciarModal] = useState<{ ativo: boolean, tipoLista: 'despesa' | 'receita' | 'conta' } | null>(null);

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const transacoesFiltradas = transacoes.filter(t => {
    if (!t.data) return false;
    const [ano, mes] = t.data.split('-');
    return parseInt(mes) === filtroMes && parseInt(ano) === filtroAno && (filtroCategoria === 'Todas' || t.categoria === filtroCategoria);
  });

  const handleSalvarTransacao = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Você precisa estar logado.");

    const payload = {
      userId: user.uid,
      tipo,
      descricao,
      valor: parseFloat(valor),
      data,
      categoria,
      subCategoria: subCategoria || '',
      conta, 
      status,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'transacoes', editingId), payload);
      } else {
        await addDoc(collection(db, 'transacoes'), { ...payload, criadoEm: serverTimestamp() });
      }
      fecharE_LimparModal();
    } catch (error) {
      alert("Erro ao salvar o registro.");
    }
  };

  const handleExcluir = async (id: string) => {
    const confirmacao = window.confirm("Tem certeza que deseja excluir este registro?");
    if (confirmacao) {
      try {
        await deleteDoc(doc(db, 'transacoes', id));
      } catch (error) {
        alert("Erro ao excluir o registro.");
      }
    }
  };

  const abrirParaEditar = (t: any) => {
    setEditingId(t.id);
    setTipo(t.tipo);
    setDescricao(t.descricao);
    setValor(t.valor.toString());
    setData(t.data);
    setCategoria(t.categoria);
    setSubCategoria(t.subCategoria || '');
    setConta(t.conta);
    setStatus(t.status || 'pago');
    setIsModalOpen(true);
  };

  const fecharE_LimparModal = () => {
    setEditingId(null);
    setDescricao(''); setValor(''); setData(dataFormatadaHoje); setSubCategoria(''); setStatus('pago'); 
    setIsModalOpen(false);
  };

  const mudarTipo = (novoTipo: string) => {
    setTipo(novoTipo);
    setCategoria(novoTipo === 'receita' ? categoriasReceita[0] : categoriasDespesa[0]);
  };

  const handleSelectChange = (valorSelecionado: string, campo: 'categoria' | 'conta') => {
    if (valorSelecionado === 'ADD_NEW') setIsAdicionando({ ativo: true, campo });
    else if (valorSelecionado === 'MANAGE') setGerenciarModal({ ativo: true, tipoLista: campo === 'categoria' ? (tipo as 'despesa' | 'receita') : 'conta' });
    else campo === 'categoria' ? setCategoria(valorSelecionado) : setConta(valorSelecionado);
  };

  const salvarNovoItem = () => {
    if (!novoItemNome.trim()) return setIsAdicionando({ ativo: false, campo: 'categoria' });
    if (isAdicionando.campo === 'categoria') {
      if (tipo === 'despesa') setCategoriasDespesa([...categoriasDespesa, novoItemNome]);
      else setCategoriasReceita([...categoriasReceita, novoItemNome]);
      setCategoria(novoItemNome);
    } else {
      setContasUsuario([...contasUsuario, novoItemNome]);
      setConta(novoItemNome);
    }
    setNovoItemNome(''); setIsAdicionando({ ativo: false, campo: 'categoria' });
  };

  const removerItem = (itemParaRemover: string) => {
    if (gerenciarModal?.tipoLista === 'despesa') {
      setCategoriasDespesa(categoriasDespesa.filter(c => c !== itemParaRemover));
      if (categoria === itemParaRemover) setCategoria(categoriasDespesa[0]);
    } else if (gerenciarModal?.tipoLista === 'receita') {
      setCategoriasReceita(categoriasReceita.filter(c => c !== itemParaRemover));
      if (categoria === itemParaRemover) setCategoria(categoriasReceita[0]);
    } else if (gerenciarModal?.tipoLista === 'conta') {
      setContasUsuario(contasUsuario.filter(c => c !== itemParaRemover));
      if (conta === itemParaRemover) setConta(contasUsuario[0]);
    }
  };

  return (
    <>
      {/* 🚀 1. Garantindo que o conteiner "Pai" seja 100% flexível */}
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        
        <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0 }}>Extrato Inteligente</h1>
          <button className="primary" onClick={() => { fecharE_LimparModal(); setIsModalOpen(true); }}>+ Registro Detalhado</button>
        </div>

        {/* Filtros */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--social-bg)', width: '100%', boxSizing: 'border-box' }}>
           
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>Mês:</label>
            <select value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', cursor: 'pointer' }}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('pt-BR', {month: 'long'})}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>Ano:</label>
            <select value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', cursor: 'pointer' }}>
              {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>Categoria:</label>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', cursor: 'pointer' }}>
              <option value="Todas">Todas</option>
              {[...categoriasDespesa, ...categoriasReceita].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

        </div>

        {/* 🚀 2. Tabela Panorâmica Destravada */}
        <div className="card" style={{ overflowX: 'auto', width: '100%', maxWidth: '100%', padding: '0', borderRadius: '12px', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
          <table className="transaction-list" style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ background: 'var(--social-bg)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text)', borderBottom: '2px solid var(--border)', width: '120px', whiteSpace: 'nowrap' }}>Data</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text)', borderBottom: '2px solid var(--border)', width: 'auto' }}>Descrição</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text)', borderBottom: '2px solid var(--border)', width: '140px', whiteSpace: 'nowrap' }}>Categoria</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text)', borderBottom: '2px solid var(--border)', width: '130px', whiteSpace: 'nowrap' }}>Conta</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text)', borderBottom: '2px solid var(--border)', width: '120px', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text)', borderBottom: '2px solid var(--border)', width: '140px', whiteSpace: 'nowrap', textAlign: 'right' }}>Valor</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text)', borderBottom: '2px solid var(--border)', width: '100px', whiteSpace: 'nowrap', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text)' }}>Nenhum registro encontrado.</td></tr>
              ) : (
                transacoesFiltradas.map(t => (
                  <tr key={t.id} style={{ opacity: t.status === 'pendente' ? 0.6 : 1, transition: '0.2s' }}>
                    <td style={{ padding: '20px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </td>
                    <td style={{ padding: '20px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                      <strong style={{ display: 'block', color: 'var(--text-h)', fontSize: '1rem' }}>{t.descricao}</strong>
                      {t.subCategoria && <span style={{ fontSize: '0.8rem', color: 'var(--text)', marginTop: '4px', display: 'block' }}>{t.subCategoria}</span>}
                    </td>
                    <td style={{ padding: '20px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span className="category-badge">{t.categoria}</span>
                    </td>
                    <td style={{ padding: '20px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.85rem', padding: '6px 10px', background: 'var(--social-bg)', border: '1px solid var(--border)', borderRadius: '6px' }}>{t.conta}</span>
                    </td>
                    <td style={{ padding: '20px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '12px', background: t.status === 'pago' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: t.status === 'pago' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                        {t.status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td style={{ padding: '20px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem', color: t.tipo === 'receita' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {t.tipo === 'receita' ? '+' : '-'}{formatarMoeda(t.valor)}
                    </td>
                    
                    <td style={{ padding: '20px', borderBottom: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button onClick={() => abrirParaEditar(t)} style={{ background: 'var(--social-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-h)', display: 'flex', alignItems: 'center' }} title="Editar">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>
                        <button onClick={() => handleExcluir(t.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }} title="Excluir">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div> {/* FECHAMENTO CORRETO DO ANIMATE-FADE-IN */}

      {/* ===================================== */}
      {/* MODAIS (Ficam FORA do conteiner principal) */}
      {/* ===================================== */}

      {isModalOpen && !gerenciarModal && (
        <div className="modal-overlay" onClick={fecharE_LimparModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>{editingId ? 'Editar Registro' : 'Novo Registro'}</h2>
              <button className="close-btn" onClick={fecharE_LimparModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={handleSalvarTransacao}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', background: 'var(--code-bg)', padding: '4px', borderRadius: '12px' }}>
                <button type="button" onClick={() => mudarTipo('despesa')} style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, background: tipo === 'despesa' ? '#ef4444' : 'transparent', color: tipo === 'despesa' ? 'white' : 'var(--text)', transition: '0.2s' }}>Saída (Despesa)</button>
                <button type="button" onClick={() => mudarTipo('receita')} style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, background: tipo === 'receita' ? '#10b981' : 'transparent', color: tipo === 'receita' ? 'white' : 'var(--text)', transition: '0.2s' }}>Entrada (Receita)</button>
              </div>

              <div className="form-group"><label>Descrição</label><input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required /></div>
              
              <div className="form-grid-2">
                <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} required /></div>
                <div className="form-group"><label>Data</label><input type="date" value={data} onChange={e => setData(e.target.value)} required /></div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Categoria Principal</label>
                  {isAdicionando.ativo && isAdicionando.campo === 'categoria' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" autoFocus placeholder="Nova categoria..." value={novoItemNome} onChange={e => setNovoItemNome(e.target.value)} style={{ flex: 1 }} />
                      <button type="button" onClick={salvarNovoItem} style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '0 12px', borderRadius: '8px' }}>OK</button>
                    </div>
                  ) : (
                    <select value={categoria} onChange={e => handleSelectChange(e.target.value, 'categoria')} required style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}>
                      {(tipo === 'receita' ? categoriasReceita : categoriasDespesa).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option disabled>──────────</option>
                      <option value="ADD_NEW">+ Adicionar Nova...</option>
                      <option value="MANAGE">Gerenciar Categorias...</option>
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Conta / Banco</label>
                  {isAdicionando.ativo && isAdicionando.campo === 'conta' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" autoFocus placeholder="Nova conta..." value={novoItemNome} onChange={e => setNovoItemNome(e.target.value)} style={{ flex: 1 }} />
                      <button type="button" onClick={salvarNovoItem} style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '0 12px', borderRadius: '8px' }}>OK</button>
                    </div>
                  ) : (
                    <select value={conta} onChange={e => handleSelectChange(e.target.value, 'conta')} required style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}>
                      {contasUsuario.map(c => <option key={c} value={c}>{c}</option>)}
                      <option disabled>──────────</option>
                      <option value="ADD_NEW">+ Adicionar Novo Banco...</option>
                      <option value="MANAGE">Gerenciar Contas...</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group"><label>Subcategoria (Opcional)</label><input type="text" value={subCategoria} onChange={e => setSubCategoria(e.target.value)} /></div>
                <div className="form-group"><label>Status</label><select value={status} onChange={e => setStatus(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}><option value="pago">Pago / Realizado</option><option value="pendente">Pendente</option></select></div>
              </div>

              <button type="submit" className="primary" style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '1.05rem', fontWeight: 600, borderRadius: '8px' }}>
                {editingId ? 'Salvar Alterações' : 'Salvar Movimentação'}
              </button>
            </form>
          </div>
        </div>
      )}

      {gerenciarModal && (
        <div className="modal-overlay" onClick={() => setGerenciarModal(null)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Gerenciar {gerenciarModal.tipoLista === 'conta' ? 'Contas' : 'Categorias'}</h3>
              <button className="close-btn" onClick={() => setGerenciarModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {(gerenciarModal.tipoLista === 'conta' ? contasUsuario : gerenciarModal.tipoLista === 'despesa' ? categoriasDespesa : categoriasReceita).map(item => (
                <li key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-h)' }}>{item}</span>
                  <button onClick={() => removerItem(item)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <button className="primary" onClick={() => setGerenciarModal(null)} style={{ width: '100%', marginTop: '20px', padding: '12px', borderRadius: '8px' }}>Concluído</button>
          </div>
        </div>
      )}
    </>
  );
};