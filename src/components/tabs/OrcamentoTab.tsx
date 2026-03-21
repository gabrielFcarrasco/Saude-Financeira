import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface OrcamentoTabProps {
  transacoes: any[];
}

export const OrcamentoTab: React.FC<OrcamentoTabProps> = ({ transacoes }) => {
  const [isModalOrcamentoOpen, setIsModalOrcamentoOpen] = useState(false);
  const [pctEssenciais, setPctEssenciais] = useState(50);
  const [pctLazer, setPctLazer] = useState(30);
  const [pctFuturo, setPctFuturo] = useState(20);

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((a, b) => a + b.valor, 0);
  const gastoEssenciais = transacoes.filter(t => t.categoria === 'Essenciais').reduce((a, b) => a + b.valor, 0);
  const gastoLazer = transacoes.filter(t => t.categoria === 'Lazer').reduce((a, b) => a + b.valor, 0);
  const gastoFuturo = transacoes.filter(t => t.categoria === 'Dívidas').reduce((a, b) => a + b.valor, 0);
  const totalPoupadoMetas = transacoes.filter(t => t.categoria === 'Investimentos').reduce((a, b) => a + b.valor, 0);

  // SVGs PROFISSIONAIS
  const iconHome = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  const iconCoffee = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
  const iconTarget = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;

  const envelopesDinamicos = [
    { id: 'essenciais', nome: `Custos Fixos (${pctEssenciais}%)`, limite: totalReceitas * (pctEssenciais / 100), gasto: gastoEssenciais, icone: iconHome },
    { id: 'lazer', nome: `Estilo de Vida (${pctLazer}%)`, limite: totalReceitas * (pctLazer / 100), gasto: gastoLazer, icone: iconCoffee },
    { id: 'dividas', nome: `Futuro (${pctFuturo}%)`, limite: totalReceitas * (pctFuturo / 100), gasto: (gastoFuturo + totalPoupadoMetas), icone: iconTarget },
  ];

  const despesasPizza = transacoes.filter(t => t.tipo === 'despesa').reduce((acc, curr) => { 
    acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.valor; return acc; 
  }, {} as Record<string, number>);
  
  const dadosGraficoPizza = Object.keys(despesasPizza).map(key => ({ name: key, value: despesasPizza[key] }));
  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>Estratégia de Equilíbrio</h1>
          <button className="primary" onClick={() => setIsModalOrcamentoOpen(true)}>Ajustar Regra</button>
        </div>
        <p style={{ color: 'var(--text)', marginBottom: '32px' }}>Distribuição inteligente baseada na sua renda de <strong>{formatarMoeda(totalReceitas)}</strong>.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {envelopesDinamicos.map(env => {
              const pct = env.limite > 0 ? (env.gasto / env.limite) * 100 : 0;
              const statusCor = pct > 100 ? '#ef4444' : pct >= 90 ? '#f59e0b' : 'var(--accent)';
              return (
                <div key={env.id} className="card" style={{ borderLeft: `6px solid ${statusCor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-h)' }}>{env.icone}</span>
                    <span className="category-badge" style={{ color: statusCor }}>{pct > 100 ? 'Excedido' : pct >= 90 ? 'Atenção' : 'Saudável'}</span>
                  </div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{env.nome}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                    <h2 style={{ margin: 0 }}>{formatarMoeda(env.gasto)}</h2>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Teto: {formatarMoeda(env.limite)}</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: statusCor }} /></div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '350px' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '16px' }}>Raio-X de Saídas</h4>
            {dadosGraficoPizza.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text)' }}>Nenhuma despesa para o gráfico.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={dadosGraficoPizza} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                    {dadosGraficoPizza.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatarMoeda(value)} contentStyle={{ background: 'var(--bg)', border: 'none', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {isModalOrcamentoOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOrcamentoOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Configurar Equilíbrio</h2>
              <button className="close-btn" onClick={() => setIsModalOrcamentoOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setIsModalOrcamentoOpen(false); }}>
              <div className="form-group"><label>Custos Fixos (%)</label><input type="number" value={pctEssenciais} onChange={e => setPctEssenciais(Number(e.target.value))} /></div>
              <div className="form-group"><label>Lazer (%)</label><input type="number" value={pctLazer} onChange={e => setPctLazer(Number(e.target.value))} /></div>
              <div className="form-group"><label>Futuro (%)</label><input type="number" value={pctFuturo} onChange={e => setPctFuturo(Number(e.target.value))} /></div>
              
              <div style={{ padding: '12px', textAlign: 'center', background: (pctEssenciais + pctLazer + pctFuturo) === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: (pctEssenciais + pctLazer + pctFuturo) === 100 ? '#10b981' : '#ef4444', marginBottom: '20px', borderRadius: '8px' }}>
                Total: {pctEssenciais + pctLazer + pctFuturo}% {(pctEssenciais + pctLazer + pctFuturo) !== 100 && '(Deve somar 100%)'}
              </div>
              <button type="submit" className="primary" style={{ width: '100%' }} disabled={(pctEssenciais + pctLazer + pctFuturo) !== 100}>Aplicar Regra</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};