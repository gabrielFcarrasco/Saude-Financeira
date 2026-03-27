import React from 'react';

export const EquilibrioScreen = ({ setActiveView, despesasRapidas, parceiro1, parceiro2, formatMoney, icons }: any) => {
  const gastosP1 = despesasRapidas.filter((d: any) => d.pagoPor === parceiro1).reduce((acc: number, curr: any) => acc + curr.valor, 0);
  const gastosP2 = despesasRapidas.filter((d: any) => d.pagoPor === parceiro2).reduce((acc: number, curr: any) => acc + curr.valor, 0);
  const total = gastosP1 + gastosP2;
  const percP1 = total > 0 ? (gastosP1 / total) * 100 : 50;
  const diferenca = Math.abs(gastosP1 - gastosP2);
  const quemPaga = gastosP1 > gastosP2 ? parceiro2 : parceiro1;
  const msg = diferenca < 50 ? "A balança está super equilibrada!" : `${quemPaga} poderia assumir o próximo rolê.`;

  return (
    <div className="animate-fade-in card">
      <button className="btn-voltar" onClick={() => setActiveView('hub')}>{icons.voltar} Voltar ao Painel</button>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Quem Paga a Próxima?</h2>
      
      <div className="balanca-container">
        <h1 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '2.5rem' }}>{formatMoney(diferenca)}</h1>
        <p style={{ color: 'var(--text)', margin: 0 }}>Diferença de gastos</p>
        <div className="balanca-barra">
          <div className="balanca-marcador-meio"></div>
          <div className="balanca-p1" style={{ width: `${percP1}%` }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span style={{ color: 'var(--accent)' }}>{parceiro1}: {formatMoney(gastosP1)}</span>
          <span style={{ color: '#3b82f6' }}>{parceiro2}: {formatMoney(gastosP2)}</span>
        </div>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', marginTop: '24px', border: '1px dashed #3b82f6' }}>
          <p style={{ margin: 0, color: '#3b82f6', fontWeight: 'bold' }}>{msg}</p>
        </div>
      </div>

      <h4 style={{ color: 'var(--text-h)', margin: '0 0 16px 0' }}>Últimos Gastos da Balança</h4>
      <div className="history-list">
        {despesasRapidas.map((gasto: any) => (
          <div key={gasto.id} className="history-item">
            <div className="history-item-left">
              <strong style={{ color: 'var(--text-h)' }}>{gasto.desc}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{gasto.data} • Pago por {gasto.pagoPor}</span>
            </div>
            <strong style={{ color: gasto.pagoPor === parceiro1 ? 'var(--accent)' : '#3b82f6' }}>{formatMoney(gasto.valor)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};