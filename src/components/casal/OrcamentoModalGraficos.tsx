import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export const OrcamentoModalGraficos = ({
  graficosAberto, setGraficosAberto, saidasTodas, formatMoney
}: any) => {

  const [filtroTempo, setFiltroTempo] = useState('mes_atual');
  
  const [mesPersonalizado, setMesPersonalizado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  if (!graficosAberto) return null;

  const dataHoje = new Date();
  const anoHoje = dataHoje.getFullYear();
  const mesHoje = dataHoje.getMonth();

  let customAno = anoHoje;
  let customMes = mesHoje;
  if (filtroTempo === 'personalizado' && mesPersonalizado) {
    const [a, m] = mesPersonalizado.split('-');
    customAno = Number(a);
    customMes = Number(m) - 1; 
  }

  const saidasParaGrafico = saidasTodas?.filter((s: any) => {
    if (s.status !== 'concluido') return false;

    if (filtroTempo === 'tudo') return true;

    let dataSaida = dataHoje;
    if (s.dataRaw) {
      const [anoStr, mesStr] = s.dataRaw.split('-');
      dataSaida = new Date(Number(anoStr), Number(mesStr) - 1, 1);
    }

    const diffMeses = (anoHoje - dataSaida.getFullYear()) * 12 + (mesHoje - dataSaida.getMonth());

    if (filtroTempo === 'mes_atual') return diffMeses === 0;
    if (filtroTempo === 'mes_passado') return diffMeses === 1;
    if (filtroTempo === '6_meses') return diffMeses >= 0 && diffMeses < 6;
    if (filtroTempo === '1_ano') return diffMeses >= 0 && diffMeses < 12;
    
    if (filtroTempo === 'personalizado') {
      return dataSaida.getFullYear() === customAno && dataSaida.getMonth() === customMes;
    }

    return true;
  }) || [];

  const gastosPorCategoria: Record<string, number> = {};
  let totalGasto = 0;

  saidasParaGrafico.forEach((saida: any) => {
    if (saida.itens && saida.itens.length > 0) {
      saida.itens.forEach((item: any) => {
        const cat = item.categoria ? item.categoria.trim() : 'Outros';
        const valor = Number(item.valor || 0);
        if (!gastosPorCategoria[cat]) gastosPorCategoria[cat] = 0;
        gastosPorCategoria[cat] += valor;
        totalGasto += valor;
      });
    } else {
      const cat = 'Geral';
      const valor = Number(saida.estimado || 0);
      if (!gastosPorCategoria[cat]) gastosPorCategoria[cat] = 0;
      gastosPorCategoria[cat] += valor;
      totalGasto += valor;
    }
  });

  const categoriasArray = Object.keys(gastosPorCategoria).map(nome => ({
    nome,
    valor: gastosPorCategoria[nome],
    porcentagem: totalGasto > 0 ? (gastosPorCategoria[nome] / totalGasto) * 100 : 0
  })).sort((a, b) => b.valor - a.valor);

  const cores = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

  let offsetAcumulado = 0;
  const raioCirculo = 15.9155; 
  const circunferencia = 100;

  const opcoesFiltro = [
    { id: 'mes_atual', label: 'Este Mês' },
    { id: 'mes_passado', label: 'Mês Passado' },
    { id: '6_meses', label: '6 Meses' },
    { id: '1_ano', label: '1 Ano' },
    { id: 'tudo', label: 'Histórico' },
    { id: 'personalizado', label: 'Específico' } 
  ];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', padding: '32px 24px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Análise de Gastos</h3>
          <button onClick={() => setGraficosAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>

        {/* MENU DE FILTROS DE TEMPO COM SVG NO BOTÃO ESPECÍFICO */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: filtroTempo === 'personalizado' ? '16px' : '32px' }}>
          {opcoesFiltro.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFiltroTempo(opt.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                border: filtroTempo === opt.id ? 'none' : '1px solid var(--border)',
                background: filtroTempo === opt.id ? 'var(--accent)' : 'transparent',
                color: filtroTempo === opt.id ? '#fff' : 'var(--text)',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: '0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {opt.label}
              {opt.id === 'personalizado' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              )}
            </button>
          ))}
        </div>

        {filtroTempo === 'personalizado' && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--code-bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Escolher Mês:</span>
            <input 
              type="month" 
              value={mesPersonalizado}
              onChange={(e) => setMesPersonalizado(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>
        )}

        {totalGasto === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text)' }}>
             Ainda não há gastos registrados para <strong>este período</strong>. 📉
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', position: 'relative' }}>
              <svg width="200" height="200" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <circle cx="21" cy="21" r={raioCirculo} fill="transparent" stroke="var(--code-bg)" strokeWidth="6" />
                
                {categoriasArray.map((cat, index) => {
                  const dashValue = (cat.valor / totalGasto) * circunferencia;
                  const corAtual = cores[index % cores.length];
                  
                  const strokeDasharray = `${dashValue} ${circunferencia - dashValue}`;
                  const strokeDashoffset = -offsetAcumulado;
                  offsetAcumulado += dashValue;

                  return (
                    <circle
                      key={index}
                      cx="21"
                      cy="21"
                      r={raioCirculo}
                      fill="transparent"
                      stroke={corAtual}
                      strokeWidth="6"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: 'all 1s ease-in-out' }}
                    />
                  );
                })}
              </svg>
              
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Gasto Total</span>
                <span style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-h)', fontWeight: '900' }}>{formatMoney(totalGasto)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {categoriasArray.map((cat, index) => {
                const corAtual = cores[index % cores.length];
                return (
                  <div key={index} className="animate-fade-in" style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: corAtual }}></div>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.95rem' }}>{cat.nome}</span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{formatMoney(cat.valor)}</span>
                    </div>
                    
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${cat.porcentagem}%`, height: '100%', background: corAtual, borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold' }}>
                      {cat.porcentagem.toFixed(1)}% do período
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};