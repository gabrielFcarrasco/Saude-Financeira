import React, { useState } from 'react';
import './CasalTab.css';

interface Saida { id: number; titulo: string; data: string; estimado: number; status: string; }
interface Meta { id: number; titulo: string; atual: number; alvo: number; }
interface Despesa { id: number; desc: string; pagoPor: string; valor: number; data: string; }
interface Contribuicao { id: number; mesData: string; p1Contr: number; p2Contr: number; }

export const CasalTab: React.FC = () => {
  const [activeView, setActiveView] = useState<'hub' | 'cofre' | 'lazer' | 'metas' | 'equilibrio'>('hub');
  
  const parceiro1 = "Gabriel";
  const parceiro2 = "Amor";

  // ==========================================
  // ESTADOS GLOBAIS (O "BANCO DE DADOS")
  // ==========================================
  const [contribuicoes, setContribuicoes] = useState<Contribuicao[]>([
    { id: 4, mesData: 'Jan/24', p1Contr: 200, p2Contr: 1500 },
    { id: 3, mesData: 'Dez/23', p1Contr: 800, p2Contr: 800 },
    { id: 2, mesData: 'Nov/23', p1Contr: 1200, p2Contr: 0 },
    { id: 1, mesData: 'Out/23', p1Contr: 500, p2Contr: 500 },
  ]);

  const [saidas, setSaidas] = useState<Saida[]>([
    { id: 1, titulo: "Jantar Aniversário", data: "12/Abr", estimado: 250, status: 'planejado' },
    { id: 2, titulo: "Cinema", data: "05/Abr", estimado: 120, status: 'concluido' }
  ]);

  const [metas, setMetas] = useState<Meta[]>([
    { id: 1, titulo: 'Fundo do Noivado', atual: 4500, alvo: 15000 },
    { id: 2, titulo: 'Viagem Fim de Ano', atual: 1200, alvo: 3500 }
  ]);

  const [despesasRapidas, setDespesasRapidas] = useState<Despesa[]>([
    { id: 1, desc: 'Jantar Outback', pagoPor: parceiro1, valor: 280, data: '22/Mar' },
    { id: 2, desc: 'Uber Cinema', pagoPor: parceiro2, valor: 45, data: '20/Mar' },
  ]);

  // ==========================================
  // CÁLCULOS DERIVADOS
  // ==========================================
  // Cofre
  const totalP1 = contribuicoes.reduce((acc, curr) => acc + curr.p1Contr, 0);
  const totalP2 = contribuicoes.reduce((acc, curr) => acc + curr.p2Contr, 0);
  const totalCofre = totalP1 + totalP2;
  const percP1 = totalCofre > 0 ? (totalP1 / totalCofre) * 100 : 50;
  const percP2 = totalCofre > 0 ? (totalP2 / totalCofre) * 100 : 50;

  // Lazer
  const [limiteMensalLazer, setLimiteMensalLazer] = useState(1000.00);
  const gastoEPlanejado = saidas.reduce((acc, curr) => acc + curr.estimado, 0);
  const restanteLazer = limiteMensalLazer - gastoEPlanejado;
  const porcentagemGastoLazer = (gastoEPlanejado / limiteMensalLazer) * 100;

  // Equilíbrio
  const gastosP1 = despesasRapidas.filter(d => d.pagoPor === parceiro1).reduce((acc, curr) => acc + curr.valor, 0);
  const gastosP2 = despesasRapidas.filter(d => d.pagoPor === parceiro2).reduce((acc, curr) => acc + curr.valor, 0);
  const totalGastosRapidos = gastosP1 + gastosP2;
  const percGastosP1 = totalGastosRapidos > 0 ? (gastosP1 / totalGastosRapidos) * 100 : 50;
  
  const diferencaEquilibrio = Math.abs(gastosP1 - gastosP2);
  const quemPagaProxima = gastosP1 > gastosP2 ? parceiro2 : parceiro1;
  const mensagemEquilibrio = diferencaEquilibrio < 50 
    ? "A balança está super equilibrada! Vocês estão dividindo muito bem." 
    : `${quemPagaProxima} poderia assumir o próximo rolê para equilibrar a balança.`;

  const formatMoney = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // ==========================================
  // ESTADOS LOCAIS E FUNÇÕES (INPUTS)
  // ==========================================
  // Cofre (Novo Depósito)
  const [novoDepositoAberto, setNovoDepositoAberto] = useState(false);
  const [depMes, setDepMes] = useState('');
  const [depP1, setDepP1] = useState('');
  const [depP2, setDepP2] = useState('');

  const handleSalvarDeposito = () => {
    if (!depP1 && !depP2) return;
    const novoDep: Contribuicao = {
      id: Date.now(),
      mesData: depMes || 'Mês Atual',
      p1Contr: Number(depP1 || 0),
      p2Contr: Number(depP2 || 0)
    };
    setContribuicoes([novoDep, ...contribuicoes]);
    setNovoDepositoAberto(false);
    setDepMes(''); setDepP1(''); setDepP2('');
  };

  // Lazer (Simulador e Edição de Limite)
  const [editandoLimite, setEditandoLimite] = useState(false);
  const [novoLimiteInput, setNovoLimiteInput] = useState('1000');
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [simTitulo, setSimTitulo] = useState('');
  const [simData, setSimData] = useState('');
  const initialSimItems = [
    { id: 1, nome: 'Transporte (Uber/Gasolina)', valor: '' },
    { id: 2, nome: 'Alimentação / Bebidas', valor: '' }
  ];
  const [simItems, setSimItems] = useState(initialSimItems);
  const totalSimulacao = simItems.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  const handleSalvarLimite = () => {
    setLimiteMensalLazer(Number(novoLimiteInput));
    setEditandoLimite(false);
  };

  const handleSalvarRole = () => {
    if (totalSimulacao <= 0) return;
    setSaidas([{ id: Date.now(), titulo: simTitulo || 'Novo Rolê', data: simData || 'A definir', estimado: totalSimulacao, status: 'planejado' }, ...saidas]);
    setSimuladorAberto(false); setSimTitulo(''); setSimData(''); setSimItems(initialSimItems); 
  };

  const handleUpdateItemSimulador = (id: number, field: 'nome' | 'valor', value: string) => {
    setSimItems(simItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Lazer -> Equilíbrio -> Metas (A Mágica da Conclusão)
  const [modalConcluir, setModalConcluir] = useState<Saida | null>(null);
  const [valorReal, setValorReal] = useState('');
  const [quemPagou, setQuemPagou] = useState(parceiro1);
  const [sobraDetectada, setSobraDetectada] = useState(0);

  const abrirModalConcluir = (saida: Saida) => {
    setModalConcluir(saida);
    setValorReal(saida.estimado.toString());
    setSobraDetectada(0);
    setQuemPagou(parceiro1);
  };

  const processarConclusao = () => {
    if (!modalConcluir) return;
    const gastoReal = Number(valorReal);
    const diferenca = modalConcluir.estimado - gastoReal;

    // 1. Atualiza status
    setSaidas(saidas.map(s => s.id === modalConcluir.id ? { ...s, status: 'concluido', estimado: gastoReal } : s));

    // 2. Injeta na Balança de Equilíbrio
    const novaDespesa: Despesa = {
      id: Date.now(),
      desc: modalConcluir.titulo,
      pagoPor: quemPagou,
      valor: gastoReal,
      data: 'Hoje'
    };
    setDespesasRapidas([novaDespesa, ...despesasRapidas]);

    // 3. Verifica sobra
    if (diferenca > 0) {
      setSobraDetectada(diferenca);
    } else {
      setModalConcluir(null);
    }
  };

  const investirSobra = () => {
    setMetas(metas.map(m => m.id === 1 ? { ...m, atual: m.atual + sobraDetectada } : m));
    setModalConcluir(null);
    setSobraDetectada(0);
  };

  // Ícones
  const icons = {
    voltar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    ia: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
    cofre: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
    lazer: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>,
    metas: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
    balanca: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"></path><rect x="3" y="15" width="6" height="6" rx="1"></rect><rect x="15" y="15" width="6" height="6" rx="1"></rect><path d="M12 7l-9 4"></path><path d="M12 7l9 4"></path></svg>,
    calendario: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
    trash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
    check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  };

  // ==========================================
  // RENDER: TELA 1 (HUB PRINCIPAL)
  // ==========================================
  if (activeView === 'hub') {
    return (
      <div className="casal-layout-container animate-fade-in">
        <div className="ia-assistant-box">
          <div className="ia-assistant-avatar">{icons.ia}</div>
          <div className="ia-assistant-content">
            <h4 className="ia-assistant-title">Sincronia do Casal</h4>
            <p className="ia-assistant-message">
              Olá, {parceiro1} & {parceiro2}! A meta do <strong>Fundo do Noivado</strong> está evoluindo. Além disso, a balança de gastos do fim de semana está bem dividida.
            </p>
          </div>
        </div>

        <div className="casal-hub-grid">
          <div className="hub-card metas" onClick={() => setActiveView('metas')}>
            <div className="hub-icon-wrapper">{icons.metas}</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>O Próximo Passo</h3>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem' }}>Acompanhe os sonhos do casal. Fundo de noivado, viagens e marcos.</p>
            </div>
          </div>

          <div className="hub-card equilibrio" onClick={() => setActiveView('equilibrio')}>
            <div className="hub-icon-wrapper">{icons.balanca}</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Quem paga a próxima?</h3>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem' }}>Uma balança para manter a justiça no fim de semana sem planilhas chatas.</p>
            </div>
          </div>

          <div className="hub-card lazer" onClick={() => setActiveView('lazer')}>
            <div className="hub-icon-wrapper">{icons.lazer}</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Planejador de Rolês</h3>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem' }}>Simulem e controlem os gastos de lazer antes de sair de casa.</p>
            </div>
          </div>

          <div className="hub-card" onClick={() => setActiveView('cofre')}>
            <div className="hub-icon-wrapper">{icons.cofre}</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Cofre Central</h3>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem' }}>O montante que vocês já construíram juntos. Acompanhe os aportes.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TELA 2 (METAS)
  // ==========================================
  if (activeView === 'metas') {
    return (
      <div className="animate-fade-in card">
        <button className="btn-voltar" onClick={() => setActiveView('hub')}>{icons.voltar} Voltar ao Painel</button>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>O Próximo Passo</h2>
        <p style={{ color: 'var(--text)', marginBottom: '32px' }}>Acompanhem os objetivos do casal e os valores guardados.</p>

        <div className="metas-grid">
          {metas.map(meta => {
            const perc = Math.min((meta.atual / meta.alvo) * 100, 100);
            return (
              <div key={meta.id} className="meta-card">
                <h3>{meta.titulo}</h3>
                <h1 style={{ color: 'var(--text-h)', margin: '8px 0' }}>{formatMoney(meta.atual)}</h1>
                <div className="meta-progress-bar">
                  <div className="meta-progress-fill" style={{ width: `${perc}%` }}></div>
                </div>
                <div className="meta-valores">
                  <span>{perc.toFixed(1)}% alcançado</span>
                  <span>Meta: {formatMoney(meta.alvo)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TELA 3 (EQUILÍBRIO)
  // ==========================================
  if (activeView === 'equilibrio') {
    return (
      <div className="animate-fade-in card">
        <button className="btn-voltar" onClick={() => setActiveView('hub')}>{icons.voltar} Voltar ao Painel</button>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Quem Paga a Próxima?</h2>
        <p style={{ color: 'var(--text)', marginBottom: '32px' }}>Para manter as coisas leves e justas, sem a burocracia de transferências.</p>

        <div className="balanca-container">
          <h1 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '2.5rem' }}>{formatMoney(diferencaEquilibrio)}</h1>
          <p style={{ color: 'var(--text)', margin: 0 }}>Diferença de gastos nos últimos rolês</p>

          <div className="balanca-barra">
            <div className="balanca-marcador-meio"></div>
            <div className="balanca-p1" style={{ width: `${percGastosP1}%` }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', fontWeight: 'bold' }}>
            <span style={{ color: 'var(--accent)' }}>{parceiro1}: {formatMoney(gastosP1)}</span>
            <span style={{ color: '#3b82f6' }}>{parceiro2}: {formatMoney(gastosP2)}</span>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', marginTop: '24px', border: '1px dashed #3b82f6' }}>
            <p style={{ margin: 0, color: '#3b82f6', fontWeight: 'bold' }}>{mensagemEquilibrio}</p>
          </div>
        </div>

        <h4 style={{ color: 'var(--text-h)', margin: '0 0 16px 0' }}>Últimos Gastos da Balança</h4>
        <div className="history-list">
          {despesasRapidas.map(gasto => (
            <div key={gasto.id} className="history-item">
              <div className="history-item-left">
                <strong style={{ color: 'var(--text-h)' }}>{gasto.desc}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{gasto.data} • Pago por {gasto.pagoPor}</span>
              </div>
              <strong style={{ color: gasto.pagoPor === parceiro1 ? 'var(--accent)' : '#3b82f6' }}>
                {formatMoney(gasto.valor)}
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TELA 4 (COFRE)
  // ==========================================
  if (activeView === 'cofre') {
    return (
      <div className="animate-fade-in card">
        <button className="btn-voltar" onClick={() => setActiveView('hub')}>{icons.voltar} Voltar ao Painel</button>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Cofre do Casal</h2>
        <p style={{ color: 'var(--text)', marginBottom: '32px' }}>Acompanhe o crescimento do patrimônio conjunto de vocês.</p>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '3rem', color: 'var(--text-h)', margin: 0 }}>{formatMoney(totalCofre)}</h1>
          <p style={{ color: 'var(--accent)', margin: 0, fontWeight: 'bold' }}>Acumulado Total</p>
        </div>

        <h4 style={{ color: 'var(--text-h)', margin: '0 0 16px 0' }}>Distribuição de Esforços</h4>
        <div className="split-bar-container">
          <div className="split-p1" style={{ width: `${percP1}%` }}>{percP1.toFixed(0)}%</div>
          <div className="split-p2" style={{ width: `${percP2}%` }}>{percP2.toFixed(0)}%</div>
        </div>

        <div className="split-legend">
          <div className="legend-item">
            <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}><span className="legend-color" style={{ background: 'var(--accent)' }}></span>{parceiro1}</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--text-h)' }}>{formatMoney(totalP1)}</strong>
          </div>
          <div className="legend-item" style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}><span className="legend-color" style={{ background: '#10b981' }}></span>{parceiro2}</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--text-h)' }}>{formatMoney(totalP2)}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ color: 'var(--text-h)', margin: 0 }}>Histórico de Depósitos</h4>
          <button className="primary" onClick={() => setNovoDepositoAberto(!novoDepositoAberto)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            {novoDepositoAberto ? 'Cancelar' : '+ Novo Depósito'}
          </button>
        </div>

        {novoDepositoAberto && (
          <div className="simulator-box animate-fade-in" style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--accent)' }}>Registrar Aporte</h4>
            <div className="simulator-row">
              <span>Mês/Referência</span>
              <input type="text" value={depMes} onChange={e => setDepMes(e.target.value)} placeholder="Ex: Fev/24" style={{ width: '100px', padding: '4px', background: 'var(--code-bg)', color: 'var(--text)' }} />
            </div>
            <div className="simulator-row">
              <span>Valor {parceiro1}</span>
              <input type="number" value={depP1} onChange={e => setDepP1(e.target.value)} placeholder="0,00" style={{ width: '100px', padding: '4px', background: 'var(--code-bg)', color: 'var(--text)' }} />
            </div>
            <div className="simulator-row">
              <span>Valor {parceiro2}</span>
              <input type="number" value={depP2} onChange={e => setDepP2(e.target.value)} placeholder="0,00" style={{ width: '100px', padding: '4px', background: 'var(--code-bg)', color: 'var(--text)' }} />
            </div>
            <button className="primary" onClick={handleSalvarDeposito} style={{ width: '100%', marginTop: '16px' }}>Salvar no Histórico</button>
          </div>
        )}

        <div className="history-list">
          {contribuicoes.map(row => (
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
  }

  // ==========================================
  // RENDER: TELA 5 (LAZER COM MÁGICA DE CONCLUSÃO)
  // ==========================================
  if (activeView === 'lazer') {
    return (
      <div className="animate-fade-in card">
        <button className="btn-voltar" onClick={() => setActiveView('hub')}>{icons.voltar} Voltar ao Painel</button>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Planejador de Rolês</h2>
        
        <div className="lazer-budget-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Teto do Mês</span>
              <button onClick={() => setEditandoLimite(!editandoLimite)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>{icons.edit}</button>
            </div>
            
            {editandoLimite ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input type="number" value={novoLimiteInput} onChange={e => setNovoLimiteInput(e.target.value)} style={{ width: '100px', padding: '4px', background: 'var(--code-bg)', color: 'var(--text-h)' }} />
                <button className="primary" onClick={handleSalvarLimite} style={{ padding: '4px 12px' }}>Salvar</button>
              </div>
            ) : (
              <h1 style={{ color: 'var(--text-h)' }}>{formatMoney(limiteMensalLazer)}</h1>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span>Disponível</span>
            <h1 style={{ color: restanteLazer > 0 ? '#10b981' : '#ef4444' }}>{formatMoney(restanteLazer)}</h1>
          </div>
        </div>

        {/* MODAL MÁGICO DE CONCLUSÃO DE ROLÊ */}
        {modalConcluir && (
          <div className="simulator-box animate-fade-in" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: '#10b981', marginBottom: '24px' }}>
            
            {sobraDetectada === 0 ? (
              // FASE 1: Confirmação de Valores
              <>
                <h4 style={{ margin: '0 0 16px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {icons.check} Concluir: {modalConcluir.titulo}
                </h4>
                <p style={{ color: 'var(--text)', fontSize: '0.9rem', marginBottom: '16px' }}>O valor estimado era de {formatMoney(modalConcluir.estimado)}. Qual foi o valor real gasto?</p>
                
                <div className="simulator-row">
                  <span>Valor Real Gasto (R$)</span>
                  <input type="number" value={valorReal} onChange={e => setValorReal(e.target.value)} style={{ width: '100px', padding: '6px', background: 'var(--code-bg)', color: 'var(--text-h)' }} />
                </div>
                <div className="simulator-row">
                  <span>Quem passou o cartão?</span>
                  <select value={quemPagou} onChange={e => setQuemPagou(e.target.value)} style={{ width: '120px', padding: '6px', background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                    <option value={parceiro1}>{parceiro1}</option>
                    <option value={parceiro2}>{parceiro2}</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button onClick={() => setModalConcluir(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={processarConclusao} style={{ flex: 1, padding: '12px', background: '#10b981', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar Gasto</button>
                </div>
              </>
            ) : (
              // FASE 2: Mágica da Sobra (Inteligência)
              <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  {icons.metas}
                </div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Sobrou Dinheiro! 🎉</h3>
                <p style={{ color: 'var(--text)', marginBottom: '24px' }}>Vocês gastaram menos do que o planejado. Sobraram <strong>{formatMoney(sobraDetectada)}</strong> no orçamento de hoje.</p>
                <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border)', marginBottom: '24px' }}>
                  <p style={{ margin: 0, color: 'var(--text-h)' }}>A inteligência sugere investir essa sobra direto na meta do <strong>Fundo do Noivado</strong>. Deseja fazer isso?</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => { setModalConcluir(null); setSobraDetectada(0); }} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer' }}>Não, deixar na conta</button>
                  <button onClick={investirSobra} style={{ flex: 1, padding: '12px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Sim, Investir Sobra</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LISTAGEM DOS CARDS DE LAZER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ color: 'var(--text-h)', margin: 0 }}>Nossos Rolês</h4>
          <button className="primary" onClick={() => setSimuladorAberto(!simuladorAberto)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            {simuladorAberto ? 'Fechar Planejador' : '+ Planejar Saída'}
          </button>
        </div>

        {simuladorAberto && (
          <div className="simulator-box animate-fade-in" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input type="text" value={simTitulo} onChange={e => setSimTitulo(e.target.value)} placeholder="Ex: Cafeteria de Especialidade" style={{ flex: 1, background: 'transparent', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-h)' }} />
              <input type="text" value={simData} onChange={e => setSimData(e.target.value)} placeholder="Data (Ex: Sábado)" style={{ width: '130px', background: 'transparent', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-h)' }} />
            </div>
            {simItems.map((item) => (
              <div key={item.id} className="simulator-row">
                <input type="text" value={item.nome} onChange={e => handleUpdateItemSimulador(item.id, 'nome', e.target.value)} placeholder="Nome do gasto" className="sim-input-name" />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="number" value={item.valor} onChange={e => handleUpdateItemSimulador(item.id, 'valor', e.target.value)} placeholder="0,00" className="sim-input-value" />
                  <button onClick={() => handleRemoveItemSimulador(item.id)} className="btn-remove-row">{icons.trash}</button>
                </div>
              </div>
            ))}
            <button onClick={() => setSimItems([...simItems, { id: Date.now(), nome: '', valor: '' }])} className="btn-add-item">+ Adicionar gasto extra</button>
            <div className="simulator-row total-row">
              <span>Custo Estimado:</span>
              <span style={{ color: '#10b981' }}>{formatMoney(totalSimulacao)}</span>
            </div>
            <button className="primary" onClick={handleSalvarRole} style={{ width: '100%', marginTop: '16px' }}>Salvar no Planejamento</button>
          </div>
        )}

        <div className="outings-grid">
          {saidas.map(saida => (
            <div key={saida.id} className={`outing-card ${saida.status}`}>
              <div className="outing-info">
                <h4>{saida.titulo}</h4>
                <p>{icons.calendario} {saida.data} • {saida.status === 'concluido' ? 'Concluído' : 'Planejado'}</p>
                {saida.status === 'planejado' && (
                  <button onClick={() => abrirModalConcluir(saida)} style={{ marginTop: '8px', padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {icons.check} Concluir Rolê
                  </button>
                )}
              </div>
              <div className="outing-cost">
                <strong>{formatMoney(saida.estimado)}</strong>
                <span>estimado</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};