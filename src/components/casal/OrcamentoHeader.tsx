import React from 'react';

export const OrcamentoHeader = ({
  limiteMensalLazer, setEditandoLimite, restanteLazer, porcentagemUso,
  gastoP1, gastoP2, parceiro1, parceiro2, corP1, corP2, formatMoney, dicaRapida,
  caixinhasValidas, gastosPorCaixinha, setEditandoCaixinhas
}: any) => {
  return (
    <>
      <div className="hub-balance-card" style={{ padding: '24px', background: 'var(--code-bg)', borderRadius: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>A Mesada do Mês</span>
            <h2 style={{ margin: '4px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.8rem' }}>
              {formatMoney(limiteMensalLazer)}
              <button onClick={() => setEditandoLimite(true)} style={{ background: 'var(--bg)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                ✎
              </button>
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent)' }}>SOBRA ATUAL</span>
            <h2 style={{ margin: '4px 0', fontSize: '1.5rem', color: restanteLazer >= 0 ? '#10b981' : '#ef4444' }}>{formatMoney(restanteLazer)}</h2>
          </div>
        </div>

        <div style={{ width: '100%', height: '12px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden', margin: '20px 0 12px 0' }}>
          <div style={{ width: `${porcentagemUso}%`, height: '100%', background: porcentagemUso > 90 ? '#ef4444' : 'var(--accent)', transition: 'width 1s ease' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
          <div><span style={{ color: corP1 }}>{parceiro1}</span> usou: {formatMoney(gastoP1)}</div>
          <div><span style={{ color: corP2 }}>{parceiro2}</span> usou: {formatMoney(gastoP2)}</div>
        </div>
      </div>

      <div style={{ background: 'rgba(138, 43, 226, 0.05)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(138, 43, 226, 0.1)', marginBottom: '32px' }}>
        <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span> {dicaRapida}
        </p>
      </div>

      {/* ✨ AS BARRAS DAS CAIXINHAS INDIVIDUAIS */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>Nossas Caixinhas</h3>
          <button onClick={() => setEditandoCaixinhas(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', cursor: 'pointer' }}>Gerenciar</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {caixinhasValidas.map((c: any) => {
            const gasto = gastosPorCaixinha[c.id] || 0;
            const restante = c.valor - gasto;
            const perc = c.valor > 0 ? Math.min((gasto / c.valor) * 100, 100) : 100;
            
            return (
              <div key={c.id} style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.cor }}></span>
                    {c.nome}
                  </span>
                  <span style={{ fontWeight: 'bold', color: restante >= 0 ? '#10b981' : '#ef4444', fontSize: '1.05rem' }}>{formatMoney(restante)}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${perc}%`, height: '100%', background: c.cor, transition: 'width 1s ease' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text)', fontWeight: 600 }}>
                  <span>Usado: {formatMoney(gasto)}</span>
                  <span>Teto: {formatMoney(c.valor)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};