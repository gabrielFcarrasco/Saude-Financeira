import React, { useState } from 'react';
import './CasalTab.css';

// Importando todos os componentes separados
import { HubScreen } from './HubScreen';
import { CofreScreen } from './CofreScreen';
import { OrcamentoLivreScreen } from './OrcamentoLivreScreen';
import { MetasScreen } from './MetasScreen';
import { EquilibrioScreen } from './EquilibrioScreen';
import { Desafio200Screen } from './Desafio200Screen';

export const CasalTab: React.FC = () => {
  const [activeView, setActiveView] = useState<'hub' | 'cofre' | 'lazer' | 'metas' | 'equilibrio' | 'desafio200'>('hub');
  
  const parceiro1 = "Gabriel";
  const parceiro2 = "Vitória";

  // Estados Globais
  const [contribuicoes, setContribuicoes] = useState([{ id: 1, mesData: 'Mar/24', p1Contr: 500, p2Contr: 500 }]);
  const [saidas, setSaidas] = useState([{ id: 1, titulo: "Jantar Outback", data: "12/Abr", estimado: 250, status: 'planejado' }]);
  const [metas, setMetas] = useState([{ id: 1, titulo: 'Fundo do Noivado', atual: 4500, alvo: 15000 }]);
  const [despesasRapidas, setDespesasRapidas] = useState([{ id: 1, desc: 'Ingressos', pagoPor: parceiro1, valor: 90, data: '20/Mar' }]);
  const [desafioP1, setDesafioP1] = useState<number[]>([1, 2, 5, 10]); 
  const [desafioP2, setDesafioP2] = useState<number[]>([10, 20]);      

  // Estados Form Lazer
  const [limiteMensalLazer, setLimiteMensalLazer] = useState(1000.00);
  const [editandoLimite, setEditandoLimite] = useState(false);
  const [novoLimiteInput, setNovoLimiteInput] = useState('1000');
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [simTitulo, setSimTitulo] = useState('');
  const [simData, setSimData] = useState('');
  const initialSimItems = [{ id: 1, nome: 'Transporte', valor: '' }, { id: 2, nome: 'Alimentação', valor: '' }];
  const [simItems, setSimItems] = useState(initialSimItems);
  const [modalConcluir, setModalConcluir] = useState<any | null>(null);
  const [valorReal, setValorReal] = useState('');
  const [quemPagou, setQuemPagou] = useState(parceiro1);
  const [sobraDetectada, setSobraDetectada] = useState(0);

  // Estados Form Cofre
  const [novoDepositoAberto, setNovoDepositoAberto] = useState(false);
  const [depMes, setDepMes] = useState('');
  const [depP1, setDepP1] = useState('');
  const [depP2, setDepP2] = useState('');

  const formatMoney = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // ==========================================
  // CÁLCULOS TÉCNICOS (Ficam antes do screenProps)
  // ==========================================
  const totalDesafioP1 = desafioP1.reduce((acc, val) => acc + (Number(val) || 0), 0);
  const totalDesafioP2 = desafioP2.reduce((acc, val) => acc + (Number(val) || 0), 0);
  const totalDepositosP1 = contribuicoes.reduce((acc, curr) => acc + (Number(curr.p1Contr) || 0), 0);
  const totalDepositosP2 = contribuicoes.reduce((acc, curr) => acc + (Number(curr.p2Contr) || 0), 0);

  // O Valor Real que vocês possuem hoje
  const totalCofre = totalDesafioP1 + totalDesafioP2 + totalDepositosP1 + totalDepositosP2;

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
    edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    checkBold: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    trophy: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10"></path><path d="M17 4v8a5 5 0 0 1-10 0V4"></path><path d="M4 9h3"></path><path d="M17 9h3"></path></svg>
  };

  const screenProps = {
    parceiro1, parceiro2, activeView, setActiveView, formatMoney, icons,
    contribuicoes, setContribuicoes, saidas, setSaidas, metas, setMetas, 
    despesasRapidas, setDespesasRapidas, desafioP1, setDesafioP1, desafioP2, setDesafioP2,
    totalCofre,
    limiteMensalLazer, setLimiteMensalLazer, editandoLimite, setEditandoLimite, novoLimiteInput, setNovoLimiteInput,
    simuladorAberto, setSimuladorAberto, simTitulo, setSimTitulo, simData, setSimData, simItems, setSimItems, initialSimItems,
    modalConcluir, setModalConcluir, valorReal, setValorReal, quemPagou, setQuemPagou, sobraDetectada, setSobraDetectada,
    novoDepositoAberto, setNovoDepositoAberto, depMes, setDepMes, depP1, setDepP1, depP2, setDepP2, 
  };

  switch (activeView) {
    case 'hub': return <HubScreen {...screenProps} />;
    case 'desafio200': return <Desafio200Screen {...screenProps} />;
    case 'cofre': return <CofreScreen {...screenProps} />;
    case 'metas': return <MetasScreen {...screenProps} />;
    case 'equilibrio': return <EquilibrioScreen {...screenProps} />;
    case 'lazer': return <OrcamentoLivreScreen {...screenProps} />;
    default: return <HubScreen {...screenProps} />;
  }
};