import React, { useState } from 'react';

export const EquilibrioScreen = ({ 
  setActiveView, despesasRapidas, setDespesasRapidas, parceiro1, parceiro2, formatMoney, icons 
}: any) => {
  
  // Cálculos de Gastos
  const gastosP1 = despesasRapidas
    .filter((d: any) => d.pagoPor === parceiro1)
    .reduce((acc: number, curr: any) => acc + (Number(curr.valor) || 0), 0);
    
  const gastosP2 = despesasRapidas
    .filter((d: any) => d.pagoPor === parceiro2)
    .reduce((acc: number, curr: any) => acc + (Number(curr.valor) || 0), 0);

  const total = gastosP1 + gastosP2;
  const diferenca = Math.abs(gastosP1 - gastosP2);
  const quemEstaDevendo = gastosP1 > gastosP2 ? parceiro2 : parceiro1;
  const quemGastouMais = gastosP1 > gastosP2 ? parceiro1 : parceiro2;

  // Cálculo da posição da balança (50% é o centro perfeito)
  // Se P1 gastou tudo, vai para 100%. Se P2 gastou tudo, vai para 0%.
  const posicaoBalanca = total > 0 ? (gastosP1 / total) * 100 : 50;

  const handleZerarBalanca = () => {
    if (window.confirm(`Deseja zerar o histórico de gastos? Isso marcará o equilíbrio atual como resolvido.`)) {
      setDespesasRapidas([]);
    }
  };

  return (
    <div className="hub-fintech-container animate-fade-in">
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ margin: 0 }}>
          {icons.voltar} Voltar
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Nossa Balança</h2>
          <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Mantendo tudo justo e leve</span>
        </div>
      </div>

      {/* CARD PRINCIPAL DA BALANÇA */}
      <div className="hub-balance-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <span className="hub-balance-label">Diferença Atual</span>
        <h1 style={{ fontSize: '3.5rem', color: 'var(--text-h)', margin: '8px 0' }}>{formatMoney(diferenca)}</h1>
        <p style={{ color: 'var(--text)', marginBottom: '32px' }}>
          {diferenca === 0 
            ? "Vocês estão em perfeito equilíbrio!" 
            : `${quemGastouMais} investiu mais nos últimos rolês.`}
        </p>

        {/* VISUAL DA BALANÇA (GANGORRA) */}
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto 24px auto' }}>
          <div style={{ 
            width: '100%', 
            height: '6px', 
            background: 'var(--border)', 
            borderRadius: '10px', 
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            {/* Marcador Central */}
            <div style={{ 
              position: 'absolute', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              width: '2px', 
              height: '16px', 
              background: 'var(--text)',
              zIndex: 1
            }}></div>

            {/* O "Peso" da Balança */}
            <div style={{ 
              position: 'absolute', 
              left: `${posicaoBalanca}%`, 
              transform: 'translateX(-50%)', 
              width: '24px', 
              height: '24px', 
              background: posicaoBalanca > 50 ? 'var(--accent)' : '#10b981',
              borderRadius: '50%',
              border: '4px solid var(--bg)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: 'left 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <span style={{ color: 'var(--accent)' }}>{parceiro1}<br/>{formatMoney(gastosP1)}</span>
            <span style={{ color: '#10b981', textAlign: 'right' }}>{parceiro2}<br/>{formatMoney(gastosP2)}</span>
          </div>
        </div>

        {/* BOTÃO ZERAR */}
        {diferenca > 0 && (
          <button 
            onClick={handleZerarBalanca}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Zerar Balança
          </button>
        )}
      </div>

      {/* SUGESTÃO DE PRÓXIMO PASSO */}
      <div style={{ 
        background: 'rgba(59, 130, 246, 0.05)', 
        border: '1px solid rgba(59, 130, 246, 0.2)', 
        padding: '20px', 
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ fontSize: '1.5rem' }}>💡</div>
        <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {diferenca < 20 
            ? "Vocês estão mandando muito bem! Que tal um sorvete para comemorar esse equilíbrio?" 
            : `Para equilibrar, o próximo rolê (até ${formatMoney(diferenca * 2)}) poderia ser por conta de ${quemEstaDevendo}.`}
        </p>
      </div>

      {/* HISTÓRICO DE QUEM PAGOU O QUÊ */}
      <div className="extrato-container">
        <h3 style={{ color: 'var(--text-h)', marginBottom: '20px' }}>O que rolou nos últimos rolês</h3>
        
        {despesasRapidas.length > 0 ? (
          despesasRapidas.map((gasto: any) => (
            <div key={gasto.id} className="extrato-item" style={{ borderLeft: `4px solid ${gasto.pagoPor === parceiro1 ? 'var(--accent)' : '#10b981'}` }}>
              <div className="extrato-info" style={{ paddingLeft: '12px' }}>
                <span className="extrato-titulo">{gasto.desc}</span>
                <span className="extrato-data">{gasto.data} • Pago por <strong>{gasto.pagoPor}</strong></span>
              </div>
              <div className="extrato-valor" style={{ color: 'var(--text-h)' }}>
                {formatMoney(gasto.valor)}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text)', padding: '40px' }}>Tudo equilibrado. Nenhum gasto recente!</p>
        )}
      </div>

    </div>
  );
};