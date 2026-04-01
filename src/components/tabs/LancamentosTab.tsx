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
  
  // 👇 2. Estado para saber se estamos EDITANDO (guarda o ID da transação) ou CRIANDO (fica nulo)
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

  // --- LÓGICA DE SALVAR (CRIAR OU ATUALIZAR) ---
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
        // Se tem ID, atualiza o documento existente
        await updateDoc(doc(db, 'transacoes', editingId), payload);
      } else {
        // Se não tem ID, cria um novo
        await addDoc(collection(db, 'transacoes'), { ...payload, criadoEm: serverTimestamp() });
      }

      fecharE_LimparModal();
    } catch (error) {
      alert("Erro ao salvar o registro.");
      console.error(error);
    }
  };

  // --- LÓGICA DE EXCLUIR ---
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

  // --- ABRIR MODAL PARA EDIÇÃO ---
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
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 style={{ margin: 0 }}>Extrato Inteligente</h1>
          <button className="primary" onClick={() => { fecharE_LimparModal(); setIsModalOpen(true); }}>+ Registro Detalhado</button>
        </div>

        <div className="card" style={{ marginBottom: '24px', padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', background: 'var(--social-bg)' }}>
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Mês:</label>
            <select value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('pt-BR', {month: 'long'})}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Ano:</label>
            <select value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }}>
              {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Categoria:</label>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }}>
              <option value="Todas">Todas</option>
              {[...categoriasDespesa, ...categoriasReceita].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
          <table className="transaction-list">
            <thead>
              <tr>
                <th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Status</th><th style={{ textAlign: 'right' }}>Valor</th>
                {/* 👇 Nova coluna de ações */}
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Nenhum registro.</td></tr>
              ) : (
                transacoesFiltradas.map(t => (
                  <tr key={t.id} style={{ opacity: t.status === 'pendente' ? 0.6 : 1 }}>
                    <td>{new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td><strong style={{ display: 'block', color: 'var(--text-h)' }}>{t.descricao}</strong></td>
                    <td><span className="category-badge">{t.categoria}</span></td>
                    <td><span style={{ fontSize: '0.85rem', padding: '4px 8px', background: 'var(--code-bg)', borderRadius: '4px' }}>{t.conta}</span></td>
                    <td><span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: t.status === 'pago' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: t.status === 'pago' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{t.status === 'pago' ? 'Pago' : 'Pendente'}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: t.tipo === 'receita' ? '#10b981' : '#ef4444' }}>{t.tipo === 'receita' ? '+' : '-'}{formatarMoeda(t.valor)}</td>
                    
                    {/* 👇 Botões de Editar e Excluir */}
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => abrirParaEditar(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px', fontSize: '1.1rem' }} title="Editar">
                        ✏️
                      </button>
                      <button onClick={() => handleExcluir(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} title="Excluir">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && !gerenciarModal && (
        <div className="modal-overlay" onClick={fecharE_LimparModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              {/* Título dinâmico */}
              <h2 style={{ margin: 0 }}>{editingId ? 'Editar Registro' : 'Novo Registro'}</h2>
              <button className="close-btn" onClick={fecharE_LimparModal}>✕</button>
            </div>

            <form onSubmit={handleSalvarTransacao}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--code-bg)', padding: '4px', borderRadius: '12px' }}>
                <button type="button" onClick={() => mudarTipo('despesa')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, background: tipo === 'despesa' ? '#ef4444' : 'transparent', color: tipo === 'despesa' ? 'white' : 'var(--text)' }}>Saída (Despesa)</button>
                <button type="button" onClick={() => mudarTipo('receita')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, background: tipo === 'receita' ? '#10b981' : 'transparent', color: tipo === 'receita' ? 'white' : 'var(--text)' }}>Entrada (Receita)</button>
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
                      <option value="MANAGE">⚙️ Gerenciar Categorias...</option>
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
                      <option value="MANAGE">⚙️ Gerenciar Contas...</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group"><label>Subcategoria (Opcional)</label><input type="text" value={subCategoria} onChange={e => setSubCategoria(e.target.value)} /></div>
                <div className="form-group"><label>Status</label><select value={status} onChange={e => setStatus(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}><option value="pago">Pago / Realizado</option><option value="pendente">Pendente</option></select></div>
              </div>

              <button type="submit" className="primary" style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' }}>
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
              <button className="close-btn" onClick={() => setGerenciarModal(null)}>✕</button>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {(gerenciarModal.tipoLista === 'conta' ? contasUsuario : gerenciarModal.tipoLista === 'despesa' ? categoriasDespesa : categoriasReceita).map(item => (
                <li key={item} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-h)' }}>{item}</span>
                  <button onClick={() => removerItem(item)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>Excluir</button>
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
