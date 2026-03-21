import React, { useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface QuitacaoTabProps {
  dividas: any[];
  transacoes: any[];
}

export const QuitacaoTab: React.FC<QuitacaoTabProps> = ({ dividas, transacoes }) => {
  const dataAtual = new Date().toISOString().split('T')[0];
  
  const [isModalDividaOpen, setIsModalDividaOpen] = useState(false);
  const [novoCredor, setNovoCredor] = useState('');
  const [novoTipo, setNovoTipo] = useState('Cartão de Crédito');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValorDivida, setNovoValorDivida] = useState('');
  
  // Datas (Início e Vencimento)
  const [novaDataInicio, setNovaDataInicio] = useState(dataAtual);
  const [novaDataVencimento, setNovaDataVencimento] = useState(dataAtual);
  
  const [novasParcelas, setNovasParcelas] = useState('1');
  const [jaIniciouPagamento, setJaIniciouPagamento] = useState(false);
  const [parcelasPagas, setParcelasPagas] = useState('0');
  
  const [mostrarJuros, setMostrarJuros] = useState(false);
  const [novoJuros, setNovoJuros] = useState('');

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const totalPagoDividas = transacoes.filter(t => t.categoria === 'Dívidas').reduce((a, b) => a + b.valor, 0);
  const totalDividasIniciais = dividas.reduce((a, b) => a + b.valorTotal, 0);
  const saldoDevedorAtual = Math.max(0, totalDividasIniciais - totalPagoDividas);
  const progressoQuitacao = totalDividasIniciais > 0 ? (totalPagoDividas / totalDividasIniciais) * 100 : 0;

  const handleSalvarDivida = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    
    const parcelasNum = parseInt(novasParcelas) || 1;
    const pagasNum = jaIniciouPagamento ? (parseInt(parcelasPagas) || 0) : 0;
    
    let statusInicial = parcelasNum > 1 ? 'Parcelado' : 'Pendente';
    if (jaIniciouPagamento && pagasNum > 0) {
      statusInicial = pagasNum >= parcelasNum ? 'Quitado' : 'Em Andamento';
    }

    try {
      await addDoc(collection(db, 'dividas'), {
        userId: user.uid,
        credor: novoCredor,
        tipo: novoTipo,
        descricao: novaDescricao,
        valorTotal: parseFloat(novoValorDivida),
        juros: mostrarJuros ? parseFloat(novoJuros) : 0, 
        status: statusInicial, 
        dataInicio: novaDataInicio, // Data que a dívida foi contraída
        dataVencimento: novaDataVencimento, // Data da parcela
        parcelas: parcelasNum,
        parcelasPagas: pagasNum,
        criadoEm: serverTimestamp()
      });
      
      setNovoCredor(''); setNovoTipo('Cartão de Crédito'); setNovaDescricao(''); 
      setNovoValorDivida(''); setNovasParcelas('1'); setParcelasPagas('0');
      setJaIniciouPagamento(false); setIsModalDividaOpen(false);
    } catch (err) { 
      alert("Erro ao registrar compromisso."); 
    }
  };

  const atualizarStatus = async (id: string, novoStatus: string) => {
    try { await updateDoc(doc(db, 'dividas', id), { status: novoStatus }); } catch (err) { alert("Erro ao atualizar o status."); }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Quitado': return '#10b981';
      case 'Em Andamento': return '#06b6d4';
      case 'Negociado': return '#f59e0b';
      case 'Parcelado': return '#3b82f6';
      default: return '#ef4444';
    }
  };

  return (
    <>
      <div className="animate-fade-in">
        {/* NOVA CLASSE PARA O HEADER */}
        <div className="page-header">
          <h1 style={{ margin: 0 }}>Central de Compromissos</h1>
          <button className="primary" onClick={() => setIsModalDividaOpen(true)}>+ Registrar Compromisso</button>
        </div>

        {dividas.length > 0 && (
          <div className="card" style={{ marginBottom: '32px', border: '1px solid #10b981' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#10b981' }}>Progresso de Quitação ({progressoQuitacao.toFixed(1)}%)</h3>
            <div className="progress-track" style={{ height: '16px', background: 'rgba(16, 185, 129, 0.1)' }}>
              <div className="progress-fill" style={{ width: `${Math.min(progressoQuitacao, 100)}%`, background: '#10b981' }} />
            </div>
            <p style={{ marginTop: '12px', color: 'var(--text)' }}>Saldo Devedor Restante: <strong style={{ color: 'var(--text-h)' }}>{formatarMoeda(saldoDevedorAtual)}</strong></p>
          </div>
        )}

        <div className="card">
          {dividas.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text)' }}>Área Limpa! Nenhum compromisso ativo no momento.</p> : (
            dividas.map(d => (
              <div key={d.id} className="debt-card" style={{ borderLeft: `6px solid ${getStatusColor(d.status)}`, padding: '20px', marginBottom: '16px', background: 'var(--social-bg)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  
                  <div>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--text-h)', display: 'block', marginBottom: '4px' }}>{d.credor}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.tipo || 'Outros'}</span>
                    
                    {d.descricao && <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--text)' }}>{d.descricao}</p>}
                    
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text)', flexWrap: 'wrap' }}>
                      <span>Início: <strong>{d.dataInicio ? new Date(d.dataInicio).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '-'}</strong></span>
                      <span>Vencimento: <strong>{d.dataVencimento ? new Date(d.dataVencimento).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '-'}</strong></span>
                      <span>Progresso: <strong>{d.parcelasPagas || 0}/{d.parcelas}</strong></span>
                      {d.juros > 0 && <span>Juros: {d.juros}%</span>}
                    </div>
                    
                    <span className="category-badge" style={{ marginTop: '12px', display: 'inline-block', color: getStatusColor(d.status) }}>
                      Status atual: {d.status}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.5rem' }}>{formatarMoeda(d.valorTotal)}</h3>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {d.status !== 'Pendente' && d.status !== 'Parcelado' && d.status !== 'Em Andamento' && (
                        <button onClick={() => atualizarStatus(d.id, d.parcelas > 1 ? 'Parcelado' : 'Pendente')} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Pendente</button>
                      )}
                      {d.status !== 'Negociado' && d.status !== 'Quitado' && (
                        <button onClick={() => atualizarStatus(d.id, 'Negociado')} style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#d97706', borderColor: '#d97706' }}>Negociar</button>
                      )}
                      {d.status !== 'Quitado' && (
                        <button onClick={() => atualizarStatus(d.id, 'Quitado')} style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#10b981', borderColor: '#10b981' }}>✓ Quitar</button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalDividaOpen && (
        <div className="modal-overlay" onClick={() => setIsModalDividaOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Registrar Compromisso</h2>
              <button className="close-btn" onClick={() => setIsModalDividaOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={handleSalvarDivida}>
              {/* CREDOR E TIPO */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Credor / Instituição</label>
                  <input type="text" value={novoCredor} onChange={e => setNovoCredor(e.target.value)} required placeholder="Ex: Nubank..." />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={novoTipo} onChange={e => setNovoTipo(e.target.value)} required style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Empréstimo">Empréstimo</option>
                    <option value="Financiamento">Financiamento</option>
                    <option value="Boleto">Boleto / Carnê</option>
                    <option value="Conta Fixa Atrasada">Conta Fixa</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descrição Opcional</label>
                <input type="text" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Ex: Compra do notebook..." />
              </div>

              {/* VALOR E PARCELAS */}
              <div className="form-grid-2">
                <div className="form-group"><label>Valor Total (R$)</label><input type="number" step="0.01" value={novoValorDivida} onChange={e => setNovoValorDivida(e.target.value)} required /></div>
                <div className="form-group"><label>Total de Parcelas</label><input type="number" min="1" value={novasParcelas} onChange={e => setNovasParcelas(e.target.value)} required /></div>
              </div>

              {/* DATAS (AGORA RESPONSIVAS) */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Data de Início</label>
                  <input type="date" value={novaDataInicio} onChange={e => setNovaDataInicio(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Próx. Vencimento</label>
                  <input type="date" value={novaDataVencimento} onChange={e => setNovaDataVencimento(e.target.value)} required />
                </div>
              </div>
              
              <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: jaIniciouPagamento ? '12px' : '0' }}>
                  <input type="checkbox" id="pagamento_iniciado" checked={jaIniciouPagamento} onChange={e => setJaIniciouPagamento(e.target.checked)} /> 
                  <label htmlFor="pagamento_iniciado" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>Já comecei a pagar</label>
                </div>
                {jaIniciouPagamento && (
                  <div className="form-group animate-fade-in" style={{ margin: 0 }}>
                    <label>Parcelas já pagas:</label>
                    <input type="number" min="0" max={novasParcelas} value={parcelasPagas} onChange={e => setParcelasPagas(e.target.value)} required />
                  </div>
                )}
              </div>

              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="checkbox" id="juros_check" checked={mostrarJuros} onChange={e => setMostrarJuros(e.target.checked)} /> 
                <label htmlFor="juros_check" style={{ margin: 0, cursor: 'pointer' }}>Existem juros aplicados?</label>
              </div>
              {mostrarJuros && <div className="form-group animate-fade-in"><label>Taxa de Juros (%)</label><input type="number" step="0.01" value={novoJuros} onChange={e => setNovoJuros(e.target.value)} /></div>}
              
              <button type="submit" className="primary" style={{ width: '100%', marginTop: '24px', padding: '12px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' }}>
                Salvar Compromisso
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};