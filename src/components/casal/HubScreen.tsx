import React, { useState } from 'react';

export const HubScreen = ({ 
  setActiveView, parceiro1, parceiro2, formatMoney, icons,
  contribuicoes, setContribuicoes, despesasRapidas, 
  desafioP1, desafioP2, novoDepositoAberto, setNovoDepositoAberto,
  depMes, setDepMes, depP1, setDepP1, depP2, setDepP2
}: any) => {

  const [mostrarExtratoCompleto, setMostrarExtratoCompleto] = useState(false);

  const totalDesafioP1 = desafioP1.reduce((a: number, b: number) => a + b, 0);
  const totalDesafioP2 = desafioP2.reduce((a: number, b: number) => a + b, 0);
  const totalDepositosP1 = contribuicoes.reduce((acc: number, curr: any) => acc + curr.p1Contr, 0);
  const totalDepositosP2 = contribuicoes.reduce((acc: number, curr: any) => acc + curr.p2Contr, 0);
  
  const totalP1 = totalDepositosP1 + totalDesafioP1;
  const totalP2 = totalDepositosP2 + totalDesafioP2;
  const totalCofre = totalP1 + totalP2;

  const percP1 = totalCofre > 0 ? (totalP1 / totalCofre) * 100 : 50;
  const percP2 = totalCofre > 0 ? (totalP2 / totalCofre) * 100 : 50;

  const extratoUnificado = [
    ...contribuicoes.map((c: any) => ({
      id: c.id,
      tipo: 'entrada',
      titulo: 'Aporte Conjunto',
      data: c.mesData,
      valor: c.p1Contr + c.p2Contr,
      detalhe: `${parceiro1}: ${formatMoney(c.p1Contr)} • ${parceiro2}: ${formatMoney(c.p2Contr)}`
    })),
    ...despesasRapidas.map((d: any) => ({
      id: d.id,
      tipo: 'saida',
      titulo: d.desc,
      data: d.data,
      valor: d.valor,
      detalhe: `Pago por ${d.pagoPor}`
    }))
  ].sort((a, b) => b.id - a.id);

  const extratoExibido = mostrarExtratoCompleto ? extratoUnificado : extratoUnificado.slice(0, 3);

  const handleSalvar = () => {
    if (!depP1 && !depP2) return;
    setContribuicoes([{ id: Date.now(), mesData: depMes || 'Mês Atual', p1Contr: Number(depP1 || 0), p2Contr: Number(depP2 || 0) }, ...contribuicoes]);
    setNovoDepositoAberto(false); setDepMes(''); setDepP1(''); setDepP2('');
  };

  return (
    <div className="hub-fintech-container animate-fade-in">
      
      {/* 1. CARTÃO DE SALDO CENTRAL */}
      <div className="hub-balance-card">
        <div className="hub-balance-label">Patrimônio do Casal</div>
        <h1 className="hub-balance-value">{formatMoney(totalCofre)}</h1>
        
        <div className="split-bar-container" style={{ width: '100%', maxWidth: '350px', height: '10px', marginBottom: '16px' }}>
          <div className="split-p1" style={{ width: `${percP1}%` }}></div>
          <div className="split-p2" style={{ width: `${percP2}%` }}></div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.85rem', color: 'var(--text)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></span> {parceiro1}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span> {parceiro2}</span>
        </div>
      </div>

      {/* 2. ATALHOS RÁPIDOS */}
      <div className="hub-actions-wrapper">
        <div className="hub-actions-list">
          <div className="action-btn" onClick={() => setNovoDepositoAberto(!novoDepositoAberto)} style={{ borderColor: novoDepositoAberto ? 'var(--accent)' : 'var(--border)' }}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
            <span className="action-label">Depositar</span>
          </div>
          
          <div className="action-btn" onClick={() => setActiveView('desafio200')}>
            <div className="action-icon" style={{ color: '#f59e0b' }}>{icons.trophy}</div>
            <span className="action-label">Acelerador de Metas</span>
          </div>
          
          <div className="action-btn" onClick={() => setActiveView('lazer')}>
            <div className="action-icon" style={{ color: '#ec4899' }}>{icons.lazer}</div>
            <span className="action-label">Orçamento Livre</span>
          </div>

          <div className="action-btn" onClick={() => setActiveView('equilibrio')}>
            <div className="action-icon" style={{ color: '#3b82f6' }}>{icons.balanca}</div>
            <span className="action-label">Balança</span>
          </div>

          <div className="action-btn" onClick={() => setActiveView('metas')}>
            <div className="action-icon" style={{ color: '#8b5cf6' }}>{icons.metas}</div>
            <span className="action-label">Metas</span>
          </div>
        </div>
      </div>

      {/* MODAL DE DEPÓSITO */}
      {novoDepositoAberto && (
        <div className="simulator-box animate-fade-in" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--accent)' }}>Registrar Aporte</h4>
          <div className="simulator-row"><span>Mês/Ref.</span><input type="text" value={depMes} onChange={e => setDepMes(e.target.value)} placeholder="Ex: Março" style={{ width: '100px', background: 'var(--bg)', color: 'var(--text-h)', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div className="simulator-row"><span>Valor {parceiro1}</span><input type="number" value={depP1} onChange={e => setDepP1(e.target.value)} placeholder="0,00" style={{ width: '100px', background: 'var(--bg)', color: 'var(--text-h)', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div className="simulator-row"><span>Valor {parceiro2}</span><input type="number" value={depP2} onChange={e => setDepP2(e.target.value)} placeholder="0,00" style={{ width: '100px', background: 'var(--bg)', color: 'var(--text-h)', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <button className="primary" onClick={handleSalvar} style={{ width: '100%', marginTop: '16px', padding: '14px' }}>Salvar no Cofre</button>
        </div>
      )}

      {/* 3. EXTRATO (LISTA) */}
      <div className="extrato-container">
        <div className="extrato-header">
          <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Últimas Movimentações</h3>
          <button 
            onClick={() => setMostrarExtratoCompleto(!mostrarExtratoCompleto)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {mostrarExtratoCompleto ? 'Ocultar' : 'Ver tudo'}
          </button>
        </div>

        <div>
          {extratoExibido.map((item: any) => (
            <div key={`${item.tipo}-${item.id}`} className={`extrato-item ${item.tipo}`}>
              <div className="extrato-icon-box">
                {item.tipo === 'entrada' 
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                }
              </div>
              <div className="extrato-info">
                <span className="extrato-titulo">{item.titulo}</span>
                <span className="extrato-data">{item.data} • {item.detalhe}</span>
              </div>
              <div className="extrato-valor" style={{ color: item.tipo === 'entrada' ? '#10b981' : 'var(--text-h)' }}>
                {item.tipo === 'entrada' ? '+' : '-'}{formatMoney(item.valor)}
              </div>
            </div>
          ))}
          
          {extratoUnificado.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text)', padding: '16px 0' }}>Nenhuma movimentação registrada.</p>
          )}
        </div>
      </div>

    </div>
  );
};