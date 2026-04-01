import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../services/firebase'; 

interface LancamentosTabProps {
  transacoes: any[];
  abrirModal?: () => void;
}

// 💡 MOCK DE DADOS DINÂMICOS:
// No futuro, estas listas virão da coleção 'categorias' e 'contas' do Firebase do usuário.
// Deixando em arrays agora, o formulário já fica flexível para a migração do Notion.
const CATEGORIAS_DESPESA = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Dívidas', 'Investimentos', 'Outros'];
const CATEGORIAS_RECEITA = ['Salário', 'Renda Extra', 'Rendimentos', 'Cashback', 'Outros'];
const CONTAS_USUARIO = ['Nubank', 'Itaú', 'Inter', 'Carteira (Físico)', 'Vale Alimentação'];

export const LancamentosTab: React.FC<LancamentosTabProps> = ({ transacoes }) => {
  const dataAtualObj = new Date();
  const dataFormatadaHoje = dataAtualObj.toISOString().split('T')[0];

  // Filtros da listagem
  const [filtroMes, setFiltroMes] = useState(dataAtualObj.getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(dataAtualObj.getFullYear());
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  // Estados do Modal (Espelho do Notion)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipo, setTipo] = useState('despesa'); 
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(dataFormatadaHoje);
  const [categoria, setCategoria] = useState(CATEGORIAS_DESPESA[0]);
  const [subCategoria, setSubCategoria] = useState('');
  const [conta, setConta] = useState(CONTAS_USUARIO[0]); // Substituiu o "método"
  const [status, setStatus] = useState('pago'); // Novo campo crítico para o Notion

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
      // 💡 PAYLOAD ESPELHO: Este é o formato exato que o script de migração usará
      await addDoc(collection(db, 'transacoes'), {
        userId: user.uid,
        tipo,
        descricao,
        valor: parseFloat(valor),
        data,
        categoria,
        subCategoria: subCategoria || '',
        conta, // Mudou de métodoPagamento para conta
        status, // 'pago' ou 'pendente'
        criadoEm: serverTimestamp()
      });

      // Limpa o formulário e fecha o modal
      setDescricao(''); setValor(''); setData(dataFormatadaHoje); 
      setSubCategoria(''); setStatus('pago'); setIsModalOpen(false);
    } catch (error) {
      alert("Erro ao salvar o registro.");
      console.error(error);
    }
  };

  // Ajusta as categorias dinamicamente com base no Tipo
  const mudarTipo = (novoTipo: string) => {
    setTipo(novoTipo);
    setCategoria(novoTipo === 'receita' ? CATEGORIAS_RECEITA[0] : CATEGORIAS_DESPESA[0]);
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
              {[...CATEGORIAS_DESPESA, ...CATEGORIAS_RECEITA].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
                <th>Conta</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Nenhum registro encontrado para este filtro.</td></tr>
              ) : (
                transacoesFiltradas.map(t => (
                  <tr key={t.id} style={{ opacity: t.status === 'pendente' ? 0.6 : 1 }}>
                    <td>{new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--text-h)' }}>{t.descricao}</strong>
                      {t.subCategoria && <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{t.subCategoria}</span>}
                    </td>
                    <td><span className="category-badge">{t.categoria}</span></td>
                    <td><span style={{ fontSize: '0.85rem', padding: '4px 8px', background: 'var(--code-bg)', borderRadius: '4px' }}>{t.conta || '-'}</span></td>
                    <td>
                      <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: t.status === 'pago' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: t.status === 'pago' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                        {t.status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
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
                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required placeholder={tipo === 'despesa' ? 'Ex: Mercado, Uber, Luz...' : 'Ex: Salário, Freelance...'} />
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
                    {(tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Conta / Carteira</label>
                  <select value={conta} onChange={e => setConta(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}>
                    {CONTAS_USUARIO.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Subcategoria / Tags (Opcional)</label>
                  <input type="text" value={subCategoria} onChange={e => setSubCategoria(e.target.value)} placeholder="Ex: Ifood, Pet..." />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}>
                    <option value="pago">Realizado / Pago</option>
                    <option value="pendente">Pendente / Agendado</option>
                  </select>
                </div>
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
