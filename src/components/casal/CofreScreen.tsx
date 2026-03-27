import React from 'react';

export const CofreScreen = ({ 
  setActiveView, contribuicoes, setContribuicoes, parceiro1, parceiro2, 
  formatMoney, icons, novoDepositoAberto, setNovoDepositoAberto, 
  depMes, setDepMes, depP1, setDepP1, depP2, setDepP2, desafioP1, desafioP2 
}: any) => {
  
  const totalDesafioP1 = desafioP1.reduce((a: number, b: number) => a + b, 0);
  const totalDesafioP2 = desafioP2.reduce((a: number, b: number) => a + b, 0);
  const totalDepositosP1 = contribuicoes.reduce((acc: number, curr: any) => acc + curr.p1Contr, 0);
  const totalDepositosP2 = contribuicoes.reduce((acc: number, curr: any) => acc + curr.p2Contr, 0);
  
  const totalP1 = totalDepositosP1 + totalDesafioP1;
  const totalP2 = totalDepositosP2 + totalDesafioP2;
  const totalCofre = totalP1 + totalP2;

  const percP1 = totalCofre > 0 ? (totalP1 / totalCofre) * 100 : 50;
  const percP2 = totalCofre > 0 ? (totalP2 / totalCofre) * 100 : 50;

  const handleSalvar = () => {
    if (!depP1 && !depP2) return;
    setContribuicoes([{ id: Date.now(), mesData: depMes || 'Mês Atual', p1Contr: Number(depP1 || 0), p2Contr: Number(depP2 || 0) }, ...contribuicoes]);
    setNovoDepositoAberto(false); setDepMes(''); setDepP1(''); setDepP2('');
  };

  return (
    <div className="animate-fade-in card">
      <button className="btn-voltar" onClick={() => setActiveView('hub')}>{icons.voltar} Voltar ao Painel</button>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Cofre do Casal</h2>
      
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--text-h)', margin: 0 }}>{formatMoney(totalCofre)}</h1>
        <p style={{ color: 'var(--text)', margin: '8px 0' }}>
          Inclui <strong style={{color: 'var(--accent)'}}>{formatMoney(totalDesafioP1 + totalDesafioP2)}</strong> vindos do Desafio dos 200.
        </p>
      </div>

      <div className="split-bar-container">
        <div className="split-p1" style={{ width: `${percP1}%` }}>{percP1.toFixed(0)}%</div>
        <div className="split-p2" style={{ width: `${percP2}%` }}>{percP2.toFixed(0)}%</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px 0' }}>
        <h4 style={{ color: 'var(--text-h)', margin: 0 }}>Histórico de Depósitos</h4>
        <button className="primary" onClick={() => setNovoDepositoAberto(!novoDepositoAberto)} style={{ padding: '8px 16px' }}>{novoDepositoAberto ? 'Cancelar' : '+ Novo Depósito'}</button>
      </div>

      {novoDepositoAberto && (
        <div className="simulator-box animate-fade-in" style={{ marginBottom: '24px' }}>
          <div className="simulator-row"><span>Mês/Ref.</span><input type="text" value={depMes} onChange={e => setDepMes(e.target.value)} style={{ width: '100px', background: 'var(--code-bg)', color: 'var(--text-h)', padding: '4px' }} /></div>
          <div className="simulator-row"><span>Valor {parceiro1}</span><input type="number" value={depP1} onChange={e => setDepP1(e.target.value)} style={{ width: '100px', background: 'var(--code-bg)', color: 'var(--text-h)', padding: '4px' }} /></div>
          <div className="simulator-row"><span>Valor {parceiro2}</span><input type="number" value={depP2} onChange={e => setDepP2(e.target.value)} style={{ width: '100px', background: 'var(--code-bg)', color: 'var(--text-h)', padding: '4px' }} /></div>
          <button className="primary" onClick={handleSalvar} style={{ width: '100%', marginTop: '16px' }}>Salvar</button>
        </div>
      )}

      <div className="history-list">
        {contribuicoes.map((row: any) => (
          <div key={row.id} className="history-item">
            <div className="history-item-left">
              <strong style={{ color: 'var(--text-h)' }}>{row.mesData}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{parceiro1}: {formatMoney(row.p1Contr)} • {parceiro2}: {formatMoney(row.p2Contr)}</span>
            </div>
            <strong style={{ color: 'var(--accent)' }}>+{formatMoney(row.p1Contr + row.p2Contr)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};