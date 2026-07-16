import React from 'react';

export const OrcamentoHeader = ({
  limiteMensalLazer, setEditandoLimite, restanteLazer, porcentagemUso,
  gastoP1, gastoP2, parceiro1, parceiro2, corP1, corP2, formatMoney, dicaRapida,
  caixinhasValidas, gastosPorCaixinha, setEditandoCaixinhas,
  setAssistenteAberto
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
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
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

      {/* ✨ CAIXA DO ASSISTENTE (Visual mais intuitivo e didático) */}
      <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(138, 43, 226, 0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
          </div>
          <div>
             <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1.05rem' }}>Assistente Inteligente</h4>
             <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.85rem' }}>Dica de lazer de hoje:</p>
          </div>
        </div>
        
        {/* Balão apenas com texto, sem emojis */}
        <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '16px', marginBottom: '16px', border: '1px solid var(--border)' }}>
           <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.95rem', fontStyle: 'italic', lineHeight: '1.4' }}>
             "{dicaRapida}"
           </p>
        </div>

        {/* Botão claro e direto */}
        <button 
          onClick={() => setAssistenteAberto(true)}
          style={{ width: '100%', background: 'var(--accent)', color: '#fff', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          Conversar com o Assistente
        </button>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>Nossas Categorias</h3>
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