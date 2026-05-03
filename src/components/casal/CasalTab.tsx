import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import './CasalTab.css';

import { HubScreen } from './HubScreen';
import { OrcamentoLivreScreen } from './OrcamentoLivreScreen';
import { MetasScreen } from './MetasScreen';
// import { EquilibrioScreen } from './EquilibrioScreen'; // Inativado por enquanto
import { Desafio200Screen } from './Desafio200Screen';
import { OnboardingCasal } from './OnboardingCasal';

export const CasalTab: React.FC = () => {
  const user = auth.currentUser;
  
  // Estados de Vínculo e Autenticação
  const [statusVinculo, setStatusVinculo] = useState<'carregando' | 'sem_vinculo' | 'aguardando' | 'convite_recebido' | 'vinculado'>('carregando');
  const [emailConvite, setEmailConvite] = useState('');
  const [conviteId, setConviteId] = useState<string | null>(null);
  const [casalId, setCasalId] = useState<string | null>(null);
  
  // ✨ NOVO: Estado para guardar o ID real de quem enviou o convite
  const [idParceiro, setIdParceiro] = useState<string | null>(null);

  // Nomes dinâmicos vindos do banco
  const [parceiro1, setParceiro1] = useState("Parceiro 1");
  const [parceiro2, setParceiro2] = useState("Parceiro 2");

  const [activeView, setActiveView] = useState<'hub' | 'cofre' | 'lazer' | 'metas' | 'desafio200'>('hub');

  // Estados Financeiros
  const [contribuicoes, setContribuicoes] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [despesasRapidas, setDespesasRapidas] = useState<any[]>([]);
  const [desafioP1, setDesafioP1] = useState<number[]>([]); 
  const [desafioP2, setDesafioP2] = useState<number[]>([]);       
  const [limiteMensalLazer, setLimiteMensalLazer] = useState(0);

  // Estados de Interface dos Formulários
  const [editandoLimite, setEditandoLimite] = useState(false);
  const [novoLimiteInput, setNovoLimiteInput] = useState('');
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [simTitulo, setSimTitulo] = useState('');
  const [simData, setSimData] = useState('');
  const initialSimItems = [{ id: 1, nome: 'Transporte', valor: '' }, { id: 2, nome: 'Alimentação', valor: '' }];
  const [simItems, setSimItems] = useState(initialSimItems);
  const [modalConcluir, setModalConcluir] = useState<any | null>(null);
  const [valorReal, setValorReal] = useState('');
  const [quemPagou, setQuemPagou] = useState('');
  const [sobraDetectada, setSobraDetectada] = useState(0);
  const [novoDepositoAberto, setNovoDepositoAberto] = useState(false);
  const [depMes, setDepMes] = useState('');
  const [depP1, setDepP1] = useState('');
  const [depP2, setDepP2] = useState('');

  // ==========================================
  // 1. ESCUTA DE VÍNCULO (CASAL OU CONVITE)
  // ==========================================
  useEffect(() => {
    if (!user) return;

    const qCasal = query(collection(db, 'casais'), where('membros', 'array-contains', user.uid));
    const unsubCasal = onSnapshot(qCasal, (snapshot) => {
      if (!snapshot.empty) {
        const dadosCasal = snapshot.docs[0].data();
        setCasalId(snapshot.docs[0].id);
        setParceiro1(dadosCasal.nomeP1 || "Parceiro 1");
        setParceiro2(dadosCasal.nomeP2 || "Parceiro 2");
        setLimiteMensalLazer(dadosCasal.limiteLazer || 1000);
        setStatusVinculo('vinculado');
      } else {
        verificarConvites();
      }
    });

    const verificarConvites = () => {
      // Verifica se RECEBEU convite
      const qRecebidos = query(collection(db, 'convites'), where('emailPara', '==', user.email), where('status', '==', 'pendente'));
      onSnapshot(qRecebidos, (snap) => {
        if (!snap.empty) {
          const dadosConvite = snap.docs[0].data();
          setConviteId(snap.docs[0].id);
          setParceiro1(dadosConvite.deNome);
          
          // ✨ SALVA O ID DE QUEM MANDOU O CONVITE AQUI
          setIdParceiro(dadosConvite.deId); 
          
          setStatusVinculo('convite_recebido');
        } else {
          // Verifica se ENVIOU convite
          const qEnviados = query(collection(db, 'convites'), where('deId', '==', user.uid), where('status', '==', 'pendente'));
          onSnapshot(qEnviados, (snapEnv) => {
            if (!snapEnv.empty) {
              setEmailConvite(snapEnv.docs[0].data().emailPara);
              setConviteId(snapEnv.docs[0].id);
              setStatusVinculo('aguardando');
            } else {
              setStatusVinculo('sem_vinculo');
            }
          });
        }
      });
    };

    return () => unsubCasal();
  }, [user]);

  // ==========================================
  // 2. ESCUTA DOS DADOS FINANCEIROS DO CASAL (MANTIDO)
  // ==========================================
  useEffect(() => {
    if (statusVinculo !== 'vinculado' || !casalId) return;

    const unsubContr = onSnapshot(query(collection(db, 'casais', casalId, 'contribuicoes')), (snap) => {
      setContribuicoes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubDespesas = onSnapshot(query(collection(db, 'casais', casalId, 'despesas_rapidas')), (snap) => {
      setDespesasRapidas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSaidas = onSnapshot(query(collection(db, 'casais', casalId, 'saidas')), (snap) => {
      setSaidas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubMetas = onSnapshot(query(collection(db, 'casais', casalId, 'metas')), (snap) => {
      setMetas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubDesafio = onSnapshot(doc(db, 'casais', casalId, 'desafio200', 'progresso'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDesafioP1(data.p1 || []);
        setDesafioP2(data.p2 || []);
      }
    });

    return () => { unsubContr(); unsubDespesas(); unsubSaidas(); unsubMetas(); unsubDesafio(); };
  }, [statusVinculo, casalId]);

  // ==========================================
  // AÇÕES DE CONVITE (FIREBASE)
  // ==========================================
  const handleEnviarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailConvite || !user) return;
    
    try {
      await addDoc(collection(db, 'convites'), {
        deId: user.uid,
        deNome: user.displayName || "Seu Parceiro",
        emailPara: emailConvite.toLowerCase(),
        status: 'pendente',
        dataEnvio: serverTimestamp()
      });
      setStatusVinculo('aguardando');
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
    }
  };

  const handleAceitarConvite = async () => {
    // ✨ Agora verificamos se temos o idParceiro antes de avançar
    if (!user || !conviteId || !idParceiro) return; 
    
    try {
      await updateDoc(doc(db, 'convites', conviteId), { status: 'aceito' });
      
      const novoCasal = await addDoc(collection(db, 'casais'), {
        // ✨ CORREÇÃO: Passando o Array correto com os dois UIDs reais!
        membros: [user.uid, idParceiro], 
        nomeP1: parceiro1, // Quem convidou
        nomeP2: user.displayName || "Parceiro 2", // Quem aceitou
        limiteLazer: 1000,
        dataCriacao: serverTimestamp()
      });
      
      setCasalId(novoCasal.id);
      setStatusVinculo('vinculado');
    } catch (error) {
      console.error("Erro ao aceitar convite:", error);
    }
  };

  const handleRecusarConvite = async () => {
    if (!conviteId) return;
    try {
      await deleteDoc(doc(db, 'convites', conviteId));
      setStatusVinculo('sem_vinculo');
      setEmailConvite('');
    } catch (error) {
      console.error("Erro ao recusar convite:", error);
    }
  };

  const handleCancelarConviteEnviado = async () => {
    if (!conviteId) return;
    try {
      await deleteDoc(doc(db, 'convites', conviteId));
      setStatusVinculo('sem_vinculo');
      setEmailConvite('');
    } catch (error) {
      console.error("Erro ao cancelar convite:", error);
    }
  };

  const formatMoney = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalDesafioP1 = desafioP1.reduce((acc, val) => acc + (Number(val) || 0), 0);
  const totalDesafioP2 = desafioP2.reduce((acc, val) => acc + (Number(val) || 0), 0);
  const totalDepositosP1 = contribuicoes.reduce((acc, curr) => acc + (Number(curr.p1Contr) || 0), 0);
  const totalDepositosP2 = contribuicoes.reduce((acc, curr) => acc + (Number(curr.p2Contr) || 0), 0);
  const totalCofre = totalDesafioP1 + totalDesafioP2 + totalDepositosP1 + totalDepositosP2;

  const icons = {
    voltar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    ia: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
    cofre: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
    lazer: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>,
    metas: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
    balanca: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"></path><rect x="3" y="15" width="6" height="6" rx="1"></rect><rect x="15" y="15" width="6" height="6" rx="1"></rect><path d="M12 7l-9 4"></path><path d="M12 7l9 4"></path></svg>
  };

  const screenProps = {
    parceiro1, parceiro2, activeView, setActiveView, formatMoney, icons,
    contribuicoes, setContribuicoes, saidas, setSaidas, metas, setMetas, 
    despesasRapidas, setDespesasRapidas, desafioP1, setDesafioP1, desafioP2, setDesafioP2,
    totalCofre, casalId,
    limiteMensalLazer, setLimiteMensalLazer, editandoLimite, setEditandoLimite, novoLimiteInput, setNovoLimiteInput,
    simuladorAberto, setSimuladorAberto, simTitulo, setSimTitulo, simData, setSimData, simItems, setSimItems, initialSimItems,
    modalConcluir, setModalConcluir, valorReal, setValorReal, quemPagou, setQuemPagou, sobraDetectada, setSobraDetectada,
    novoDepositoAberto, setNovoDepositoAberto, depMes, setDepMes, depP1, setDepP1, depP2, setDepP2, 
  };

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  
  if (statusVinculo === 'carregando') {
    return <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text)' }}>Buscando informações do casal...</div>;
  }

  if (statusVinculo !== 'vinculado') {
    return (
      <OnboardingCasal 
        statusVinculo={statusVinculo as any} 
        emailConvite={emailConvite}
        setEmailConvite={setEmailConvite}
        parceiro1={parceiro1}
        onEnviarConvite={handleEnviarConvite}
        onAceitarConvite={handleAceitarConvite}
        onRecusarConvite={handleRecusarConvite}
        onCancelarConvite={handleCancelarConviteEnviado}
      />
    );
  }

  // Se chegou aqui, está vinculado!
  switch (activeView) {
    case 'hub': return <HubScreen {...screenProps} />;
    case 'desafio200': return <Desafio200Screen {...screenProps} />;
    case 'metas': return <MetasScreen {...screenProps} />;
    // case 'equilibrio': return <EquilibrioScreen {...screenProps} />; // Inativado por enquanto
    case 'lazer': return <OrcamentoLivreScreen {...screenProps} />;
    default: return <HubScreen {...screenProps} />;
  }
};