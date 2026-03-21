import React from 'react';
import { auth } from '../../services/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface ResumoTabProps {
  transacoes: any[];
  dividas: any[];
  abrirModalLancamento: () => void;
}

export const ResumoTab: React.FC<ResumoTabProps> = ({ transacoes, dividas, abrirModalLancamento }) => {
  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const user = auth.currentUser;
  const nomeCompleto = user?.displayName || 'Investidor';
  const primeiroNome = nomeCompleto.split(' ')[0]; // Pega só o primeiro nome
  
  const horaAtual = new Date().getHours();
  let saudacao = 'Olá';
  if (horaAtual >= 5 && horaAtual < 12) saudacao = 'Bom dia';
  else if (horaAtual >= 12 && horaAtual < 18) saudacao = 'Boa tarde';
  else saudacao = 'Boa noite';

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((a, b) => a + b.valor, 0);
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((a, b) => a + b.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  
  const gastoLazer = transacoes.filter(t => t.categoria === 'Lazer').reduce((a, b) => a + b.valor, 0);
  const totalPoupadoMetas = transacoes.filter(t => t.categoria === 'Investimentos').reduce((a, b) => a + b.valor, 0);
  const gastoFuturo = transacoes.filter(t => t.categoria === 'Dívidas').reduce((a, b) => a + b.valor, 0);

  const dadosGraficoResumo = [
    { name: 'Entradas', valor: totalReceitas, fill: '#10b981' },
    { name: 'Saídas', valor: totalDespesas, fill: '#ef4444' }
  ];

  // AGORA COM SVGs PROFISSIONAIS
  const conquistasDinamicas = [
    { id: 1, icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>, titulo: 'O Início', desc: 'Sua primeira movimentação.', unlocked: transacoes.length > 0 },
    { id: 2, icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, titulo: 'Foco Total', desc: 'Nenhum gasto com lazer ainda.', unlocked: transacoes.length > 0 && gastoLazer === 0 },
    { id: 3, icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, titulo: 'Poupador', desc: 'Destinou 20% para o futuro.', unlocked: totalReceitas > 0 && ((gastoFuturo + totalPoupadoMetas) / totalReceitas) >= 0.2 },
    { id: 4, icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, titulo: 'Radar Limpo', desc: 'Mapeou seus compromissos.', unlocked: dividas.length > 0 },
  ];

  return (
    <>
      <div className="animate-fade-in">
        {/* 3. O Cabeçalho Atualizado */}
        <div className="page-header" style={{ marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', letterSpacing: '-1px' }}>
              {saudacao}, <span className="text-accent">{primeiroNome}</span>.
            </h1>
            <p style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem' }}>
              Aqui está o panorama atualizado do seu ecossistema financeiro.
            </p>
          </div>
          <button className="primary" onClick={abrirModalLancamento} style={{ padding: '14px 24px' }}>
            + Nova Movimentação
          </button>
        </div>
        
        <div className="card" style={{ marginBottom: '32px' }}>
          <h4 style={{ marginBottom: '16px' }}>Suas Conquistas</h4>
          <div className="badges-container">
            {conquistasDinamicas.map(b => (
              <div key={b.id} className={`badge-item ${b.unlocked ? 'unlocked' : ''}`} title={b.desc}>
                <div className="badge-icon">{b.icone}</div><span className="badge-title">{b.titulo}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-grid" style={{ marginBottom: '32px' }}>
          <div className="metric-card"><p>Entradas</p><h2 style={{ color: '#10b981' }}>{formatarMoeda(totalReceitas)}</h2></div>
          <div className="metric-card"><p>Saídas</p><h2 style={{ color: '#ef4444' }}>{formatarMoeda(totalDespesas)}</h2></div>
          <div className="metric-card"><p>Saldo Livre</p><h2>{formatarMoeda(saldo)}</h2></div>
        </div>

        <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '16px' }}>Fluxo de Caixa</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGraficoResumo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text)" />
              <YAxis stroke="var(--text)" tickFormatter={(val) => `R$ ${val}`} />
              <RechartsTooltip formatter={(value: number) => [formatarMoeda(value), 'Total']} contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};