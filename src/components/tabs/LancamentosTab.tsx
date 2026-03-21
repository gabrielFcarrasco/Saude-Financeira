import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../services/firebase'; // <-- Importamos o banco e a autenticação

interface LancamentosTabProps {
  transacoes: any[];
  abrirModal?: () => void; // Deixei opcional caso o parent ainda passe
}

export const LancamentosTab: React.FC<LancamentosTabProps> = ({ transacoes }) => {
  const dataAtualObj = new Date();
  const dataFormatadaHoje = dataAtualObj.toISOString().split('T')[0];

  // Filtros da listagem
  const [filtroMes, setFiltroMes] = useState(dataAtualObj.getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(dataAtualObj.getFullYear());
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipo, setTipo] = useState('despesa'); // 'despesa' ou 'receita'
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(dataFormatadaHoje);
  const [categoria, setCategoria] = useState('Essenciais');
  const [subCategoria, setSubCategoria] = useState('');
  const [metodo, setMetodo] = useState('Pix');

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  // Filtro Inteligente da Tabela
  const transacoesFiltradas = transacoes.filter(t => {
    if (!t.data) return false;
    const [ano, mes] = t.data.split('-');
    const mesBate = parseInt(mes) === filtroMes;
    const anoBate = parseInt(ano) === filtroAno;
    const categoriaBate = filtroCategoria === 'Todas' || t.categoria === filtroCategoria;
    return mesBate && anoBate && categoriaBate;
  });

  // Função para salvar no Firebase atrelado ao usuário logado
  const handleSalvarTransacao = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    
    if (!user) {
      alert("Você precisa estar logado para registrar uma transação.");
      return;
    }

    try {
      await addDoc(collection(db, 'transacoes'), {
        userId: user.uid, // CRÍTICO: Atrela a transação ao dono
        tipo,
        descricao,
        valor: parseFloat(valor),
        data,
        categoria,
        subCategoria: subCategoria || 'Geral',
        metodoPagamento: metodo,
        criadoEm: serverTimestamp()
      });

      // Limpa o formulário e fecha o modal
      setDescricao(''); setValor(''); setData(dataFormatadaHoje); 
      setSubCategoria(''); setIsModalOpen(false);
    } catch (error) {
      alert("Erro ao salvar o registro.");
      console.error(error);
    }
  };

  // Ajusta as categorias dinamicamente com base no Tipo (Receita ou Despesa)
  const mudarTipo = (novoTipo: string) => {
    setTipo(novoTipo);
    setCategoria(novoTipo === 'receita' ? 'Renda' : 'Essenciais');
  };

  return (
    <>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 style={{ margin: 0 }}>Extrato Inteligente</h1>
          <button className="primary" onClick={() => setIsModalOpen(true)}>+ Registro Detalhado</button>
        </div>

        {/* BARRA DE FILTROS */}
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
              <option value="Renda">Entradas (Renda)</option>
              <option value="Essenciais">Essenciais</option>
              <option value="Lazer">Lazer</option>
              <option value="Dívidas">Dívidas</option>
              <option value="Investimentos">Investimentos</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
          <table className="transaction-list">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição & Subcategoria</th>
                <th>Categoria</th>
                <th>Método</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Nenhum registro encontrado para este filtro.</td></tr>
              ) : (
                transacoesFiltradas.map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--text-h)' }}>{t.descricao}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{t.subCategoria || 'Geral'}</span>
                    </td>
                    <td><span className="category-badge">{t.categoria}</span></td>
                    <td><span style={{ fontSize: '0.85rem', padding: '4px 8px', background: 'var(--code-bg)', borderRadius: '4px' }}>{t.metodoPagamento || '-'}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: t.tipo === 'receita' ? '#10b981' : '#ef4444' }}>
                      {t.tipo === 'receita' ? '+' : '-'}{formatarMoeda(t.valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Novo Registro</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={handleSalvarTransacao}>
              {/* TOGGLE RECEITA / DESPESA */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--code-bg)', padding: '4px', borderRadius: '12px' }}>
                <button type="button" onClick={() => mudarTipo('despesa')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: '0.2s', background: tipo === 'despesa' ? '#ef4444' : 'transparent', color: tipo === 'despesa' ? 'white' : 'var(--text)' }}>
                  Saída (Despesa)
                </button>
                <button type="button" onClick={() => mudarTipo('receita')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: '0.2s', background: tipo === 'receita' ? '#10b981' : 'transparent', color: tipo === 'receita' ? 'white' : 'var(--text)' }}>
                  Entrada (Receita)
                </button>
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required placeholder={tipo === 'despesa' ? 'Ex: Mercado, Uber, Conta de Luz...' : 'Ex: Salário, Freelance...'} />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} required placeholder="0,00" />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input type="date" value={data} onChange={e => setData(e.target.value)} required />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Categoria Principal</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}>
                    {tipo === 'receita' ? (
                      <>
                        <option value="Renda">Renda Fixa (Salário)</option>
                        <option value="Renda Extra">Renda Extra / Freela</option>
                        <option value="Rendimentos">Rendimentos (Investimentos)</option>
                      </>
                    ) : (
                      <>
                        <option value="Essenciais">Gastos Essenciais (Moradia, Mercado...)</option>
                        <option value="Lazer">Estilo de Vida & Lazer</option>
                        <option value="Dívidas">Pagamento de Dívidas</option>
                        <option value="Investimentos">Aporte (Investimentos)</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Método</label>
                  <select value={metodo} onChange={e => setMetodo(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}>
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro Físico</option>
                    <option value="Boleto">Boleto / Transferência</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Subcategoria / Tags (Opcional)</label>
                <input type="text" value={subCategoria} onChange={e => setSubCategoria(e.target.value)} placeholder="Ex: Ifood, Netflix, Roupas..." />
              </div>

              <button type="submit" className="primary" style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' }}>
                Salvar Movimentação
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};