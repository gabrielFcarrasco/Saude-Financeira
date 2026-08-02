import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc, query, getDocs, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { enviarMensagemParaGemini } from '../../services/gemini';

import { OrcamentoHeader } from './OrcamentoHeader';
import { OrcamentoListas } from './OrcamentoListas';
import { OrcamentoModalPlanner } from './OrcamentoModalPlanner';
import { OrcamentoModalConclusao } from './OrcamentoModalConclusao';
import { OrcamentoModalSalarios } from './OrcamentoModalSalarios';
import { OrcamentoModalCaixinhas } from './OrcamentoModalCaixinhas';
import { OrcamentoModalAgenda } from './OrcamentoModalAgenda';
import { OrcamentoModalAssistente } from './OrcamentoModalAssistente'; 
import { OrcamentoModalGraficos } from './OrcamentoModalGraficos';
import { OrcamentoModalEdicaoCategorias } from './OrcamentoModalEdicaoCategorias'; // ✨ IMPORT NOVO

export const OrcamentoLivreScreen = ({ 
  setActiveView, casalId, saidas, limiteMensalLazer, parceiro1, parceiro2, corP1, corP2, formatMoney, icons, currentUserRole, meuNome
}: any) => {
  
  const [isProcessando, setIsProcessando] = useState(false);
  const [dicaRapida, setDicaRapida] = useState('Analisando o clima financeiro...');
  const [dicaDataFirebase, setDicaDataFirebase] = useState('');
  
  const [rendaP1, setRendaP1] = useState(0);
  const [rendaP2, setRendaP2] = useState(0);

  const [caixinhas, setCaixinhas] = useState<any[]>([]);
  const [editandoCaixinhas, setEditandoCaixinhas] = useState(false);
  const [simCaixinha, setSimCaixinha] = useState('');

  const [agendaAberto, setAgendaAberto] = useState(false);
  const [agendaP1, setAgendaP1] = useState<string[]>([]);
  const [agendaP2, setAgendaP2] = useState<string[]>([]);
  const [alfabetoConfig, setAlfabetoConfig] = useState<any>(null);

  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [simTitulo, setSimTitulo] = useState('');
  const [simData, setSimData] = useState('');
  const [simItems, setSimItems] = useState([{ id: 1, nome: '', valor: '', responsavel: 'ambos', categoria: '' }]);
  const [simEstimado, setSimEstimado] = useState(''); // ✨ NOVO: Guardar o valor caso os itens sejam apagados
  const [saidaExpandida, setSaidaExpandida] = useState<string | null>(null);
  const [editandoLimite, setEditandoLimite] = useState(false);
  
  const [modalConcluir, setModalConcluir] = useState<any | null>(null);
  const [modalCategorias, setModalCategorias] = useState<any | null>(null); // ✨ NOVO: Controlar o popup de categorias
  
  const [passoConclusao, setPassoConclusao] = useState<'pergunta' | 'ajuste' | 'sobra'>('pergunta');
  const [valorRealFinal, setValorRealFinal] = useState('');
  const [quemPagouReal, setQuemPagouReal] = useState('ambos');
  const [valorP1Real, setValorP1Real] = useState('');
  const [valorP2Real, setValorP2Real] = useState('');
  const [sobraDetectada, setSobraDetectada] = useState(0);

  const [avisoPendenciasAberto, setAvisoPendenciasAberto] = useState(false);
  const [jaAvisouPendencias, setJaAvisouPendencias] = useState(false);

  const [saidaParaReabrir, setSaidaParaReabrir] = useState<any | null>(null);
  const [graficosAberto, setGraficosAberto] = useState(false);

  useEffect(() => {
    if (!casalId) return;
    const unsub = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.caixinhas) setCaixinhas(data.caixinhas);
        if (data.agendaP1) setAgendaP1(data.agendaP1);
        if (data.agendaP2) setAgendaP2(data.agendaP2);
        if (data.dicaLazerData) setDicaDataFirebase(data.dicaLazerData);
        if (data.dicaLazerTexto) setDicaRapida(data.dicaLazerTexto);
        if (data.alfabetoConfig) setAlfabetoConfig(data.alfabetoConfig);
        if (data.rendaP1) setRendaP1(Number(data.rendaP1));
        if (data.rendaP2) setRendaP2(Number(data.rendaP2));
      }
    });
    return () => unsub();
  }, [casalId]);

  const caixinhasValidas = caixinhas.length > 0 ? caixinhas : [{ id: 'geral', nome: 'Lazer Geral', valor: limiteMensalLazer, cor: 'var(--accent)' }];

  const hoje = new Date();
  const mesAtualNum = hoje.getMonth();
  const anoAtualNum = hoje.getFullYear();
  const diasParaRenovar = new Date(anoAtualNum, mesAtualNum + 1, 0).getDate() - hoje.getDate() + 1;
  const dataHojeStr = hoje.toISOString().split('T')[0];

  const saidasMesAtualReais: any[] = [];
  const pendenciasPassadas: any[] = [];
  const saidasHistorico: any[] = [];

  saidas.forEach((saida: any) => {
    let isMesAtual = true;
    let isPassado = false;
    if (saida.dataRaw) {
      const [anoStr, mesStr] = saida.dataRaw.split('-');
      const anoS = parseInt(anoStr);
      const mesS = parseInt(mesStr) - 1;
      if (anoS < anoAtualNum || (anoS === anoAtualNum && mesS < mesAtualNum)) {
        isMesAtual = false;
        isPassado = true;
      } else if (anoS > anoAtualNum || (anoS === anoAtualNum && mesS > mesAtualNum)) {
        isMesAtual = false; 
      }
    }
    if (isMesAtual) {
      saidasMesAtualReais.push(saida);
    } else if (isPassado && saida.status === 'planejado') {
      pendenciasPassadas.push({ ...saida, isPendenciaPassada: true });
    } else if (isPassado && saida.status === 'concluido') {
      saidasHistorico.push(saida);
    }
  });

  const saidasMesAtualVisual = [...pendenciasPassadas, ...saidasMesAtualReais];

  useEffect(() => {
    if (pendenciasPassadas.length > 0 && !jaAvisouPendencias) {
      setAvisoPendenciasAberto(true);
      setJaAvisouPendencias(true);
    }
  }, [pendenciasPassadas.length, jaAvisouPendencias]);

  let gastoP1 = 0; let gastoP2 = 0;
  const gastosPorCaixinha: Record<string, number> = {};
  caixinhasValidas.forEach((c: any) => gastosPorCaixinha[c.id] = 0);

  saidasMesAtualReais.forEach((s: any) => {
    let gastoSaida = 0;
    if (s.status === 'concluido' && s.splitReal) {
      gastoP1 += s.splitReal.p1 || 0; gastoP2 += s.splitReal.p2 || 0;
      gastoSaida = (s.splitReal.p1 || 0) + (s.splitReal.p2 || 0);
    } else if (s.itens && s.itens.length > 0) {
      s.itens.forEach((i: any) => {
        const val = Number(i.valor || 0);
        if (i.responsavel === 'p1') { gastoP1 += val; gastoSaida += val; }
        else if (i.responsavel === 'p2') { gastoP2 += val; gastoSaida += val; }
        else { gastoP1 += val / 2; gastoP2 += val / 2; gastoSaida += val; }
      });
    } else {
      gastoP1 += (s.estimado || 0) / 2; gastoP2 += (s.estimado || 0) / 2;
      gastoSaida = s.estimado || 0;
    }

    const cid = s.caixinhaId || caixinhasValidas[0].id;
    if (gastosPorCaixinha[cid] === undefined) gastosPorCaixinha[cid] = 0;
    gastosPorCaixinha[cid] += gastoSaida;
  });

  const gastoEPlanejado = gastoP1 + gastoP2;
  const restanteLazer = limiteMensalLazer - gastoEPlanejado;
  const porcentagemUso = Math.min((gastoEPlanejado / limiteMensalLazer) * 100, 100);

  // ✨ AGORA A MATEMÁTICA LÊ DO CAMPO NOVO SE NÃO TIVER ITENS
  const totalSimulacao = simItems.length > 0 
    ? simItems.reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0)
    : Number(simEstimado || 0);

  useEffect(() => {
    let isMounted = true;
    const gerenciarDicaDiaria = async () => {
      if (!casalId) return;
      if (dicaDataFirebase === dataHojeStr) return;
      try {
        const ctx = `Limite mensal do casal: R$ ${limiteMensalLazer}. Já planearam/gastaram: R$ ${gastoEPlanejado}. Faltam ${diasParaRenovar} dias para virar o mês.`;
        const pg = `Dê 1 dica financeira amigável ou sugestão de lazer de 1 linha sobre como aproveitar esse orçamento de acordo com a sobra. Seja romântico e inspirador. Sem usar emojis na resposta.`;
        const resposta = await enviarMensagemParaGemini(pg, ctx);
        const textoLimpo = resposta.replace(/^"|"$/g, '');
        if (isMounted && textoLimpo) await updateDoc(doc(db, 'casais', casalId), { dicaLazerData: dataHojeStr, dicaLazerTexto: textoLimpo });
      } catch (e) { }
    };
    if (dicaDataFirebase !== '' && dicaDataFirebase !== dataHojeStr) gerenciarDicaDiaria();
    else if (dicaDataFirebase === '') gerenciarDicaDiaria();
    return () => { isMounted = false; };
  }, [casalId, limiteMensalLazer, gastoEPlanejado, diasParaRenovar, dicaDataFirebase, dataHojeStr]); 

  // ✨ INICIALIZANDO O ROLÊ COMO VAZIO
  const abrirNovoPlano = () => {
    setIdEdicao(null); setSimTitulo(''); setSimData('');
    setSimItems([]); setSimEstimado(''); 
    setSimCaixinha(caixinhasValidas[0].id);
    setSimuladorAberto(true);
  };

  const abrirNovoPlanoComData = (dataStr: string, tituloSugerido: string = '') => {
    setIdEdicao(null); setSimTitulo(tituloSugerido); setSimData(dataStr); 
    setSimItems([]); setSimEstimado('');
    setSimCaixinha(caixinhasValidas[0].id);
    setSimuladorAberto(true);
  };

  const abrirEdicao = (plano: any, e?: any) => {
    if (e) e.stopPropagation();
    setIdEdicao(plano.id); setSimTitulo(plano.titulo); setSimData(plano.dataRaw || ''); 
    setSimItems(plano.itens || []);
    setSimEstimado(plano.estimado ? plano.estimado.toString() : '');
    setSimCaixinha(plano.caixinhaId || caixinhasValidas[0].id);
    setSimuladorAberto(true);
  };

  const handleSalvarPlano = async () => {
    if (!casalId || !simTitulo) return; 
    try {
      setIsProcessando(true);
      const dataFormatada = simData ? new Date(simData + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'A definir';
      const dados = { 
        titulo: simTitulo, caixinhaId: simCaixinha, data: dataFormatada, 
        dataRaw: simData, estimado: totalSimulacao, status: 'planejado', itens: simItems, updatedAt: serverTimestamp() 
      };
      
      if (idEdicao) {
        await updateDoc(doc(db, 'casais', casalId, 'saidas', idEdicao), dados);
        await updateDoc(doc(db, 'casais', casalId), {
          notificacoes: arrayUnion({ id: Date.now().toString(), texto: `${meuNome} alterou os detalhes do rolê "${simTitulo}"!`, lida: false, createdAt: new Date().toISOString() })
        });
      } else {
        await addDoc(collection(db, 'casais', casalId, 'saidas'), { ...dados, createdAt: serverTimestamp() });
        await updateDoc(doc(db, 'casais', casalId), {
          notificacoes: arrayUnion({ id: Date.now().toString(), texto: `${meuNome} marcou um novo passeio: "${simTitulo}" para o dia ${dataFormatada}!`, lida: false, createdAt: new Date().toISOString() })
        });
      }
      setSimuladorAberto(false);
    } catch (error) {} finally { setIsProcessando(false); }
  };

  const handleExcluirPlano = async (id: string) => {
    if (!window.confirm("Deseja apagar este plano?")) return;
    try { setIsProcessando(true); await deleteDoc(doc(db, 'casais', casalId, 'saidas', id)); setSimuladorAberto(false); } 
    catch (error) {} finally { setIsProcessando(false); }
  };

  const handleReabrirPasseio = (saida: any, e: any) => {
    e.stopPropagation();
    setSaidaParaReabrir(saida);
  };

  const confirmarReabrirPasseio = async () => {
    if (!saidaParaReabrir || !casalId) return;
    try {
      setIsProcessando(true);
      const q = query(collection(db, 'casais', casalId, 'despesas_rapidas'));
      const querySnapshot = await getDocs(q);
      const deletarPromises: any[] = [];
      querySnapshot.forEach((despesaDoc) => {
        if (despesaDoc.data().desc?.includes(saidaParaReabrir.titulo)) {
            deletarPromises.push(deleteDoc(doc(db, 'casais', casalId, 'despesas_rapidas', despesaDoc.id)));
        }
      });
      await Promise.all(deletarPromises);
      await updateDoc(doc(db, 'casais', casalId, 'saidas', saidaParaReabrir.id), { status: 'planejado' });
      const saidaTemp = saidaParaReabrir;
      setSaidaParaReabrir(null); 
      abrirEdicao(saidaTemp); 
    } catch (error) { 
      alert("Erro ao reabrir o passeio."); 
    } finally { setIsProcessando(false); }
  };

  const prepararConclusao = (saida: any, e: any) => {
    e.stopPropagation();
    setModalConcluir(saida); setValorRealFinal(saida.estimado.toString());
    let p1 = 0; let p2 = 0;
    if (saida.itens && saida.itens.length > 0) {
      saida.itens.forEach((item: any) => {
        const val = Number(item.valor || 0);
        if (item.responsavel === 'p1') p1 += val; else if (item.responsavel === 'p2') p2 += val; else { p1 += val/2; p2 += val/2; }
      });
    } else { p1 = saida.estimado / 2; p2 = saida.estimado / 2; }
    setValorP1Real(p1.toString()); setValorP2Real(p2.toString());
    if (p1 > 0 && p2 === 0) setQuemPagouReal(parceiro1); else if (p2 > 0 && p1 === 0) setQuemPagouReal(parceiro2); else setQuemPagouReal('ambos');
    setPassoConclusao('pergunta'); setSobraDetectada(0);
  };

  const processarFim = async (confirmadoIgual: boolean) => {
    if (!modalConcluir || !casalId || isProcessando) return; 
    try {
      setIsProcessando(true);
      let v1 = 0; let v2 = 0; let valorGastoEfetivo = 0;

      if (confirmadoIgual) {
        valorGastoEfetivo = modalConcluir.estimado;
        if (modalConcluir.itens && modalConcluir.itens.length > 0) {
          modalConcluir.itens.forEach((i: any) => { const val = Number(i.valor || 0); if (i.responsavel === 'p1') v1 += val; else if (i.responsavel === 'p2') v2 += val; else { v1 += val/2; v2 += val/2; } });
        } else { v1 = valorGastoEfetivo / 2; v2 = valorGastoEfetivo / 2; }
      } else {
        if (quemPagouReal === 'ambos') { v1 = Number(valorP1Real || 0); v2 = Number(valorP2Real || 0); valorGastoEfetivo = v1 + v2; }
        else if (quemPagouReal === parceiro1) { valorGastoEfetivo = Number(valorRealFinal || 0); v1 = valorGastoEfetivo; }
        else { valorGastoEfetivo = Number(valorRealFinal || 0); v2 = valorGastoEfetivo; }
      }

      await updateDoc(doc(db, 'casais', casalId, 'saidas', modalConcluir.id), { status: 'concluido', estimado: valorGastoEfetivo, splitReal: { p1: v1, p2: v2 } });
      if (v1 > 0) await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { desc: v2 > 0 ? `${modalConcluir.titulo} (${parceiro1})` : modalConcluir.titulo, pagoPor: parceiro1, valor: v1, data: 'Hoje', createdAt: serverTimestamp() });
      if (v2 > 0) await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { desc: v1 > 0 ? `${modalConcluir.titulo} (${parceiro2})` : modalConcluir.titulo, pagoPor: parceiro2, valor: v2, data: 'Hoje', createdAt: serverTimestamp() });
      
      await updateDoc(doc(db, 'casais', casalId), {
        notificacoes: arrayUnion({ id: Date.now().toString(), texto: `${meuNome} marcou o rolê "${modalConcluir.titulo}" como concluído!`, lida: false, createdAt: new Date().toISOString() })
      });

      const diferenca = modalConcluir.estimado - valorGastoEfetivo;
      if (diferenca > 0) { setSobraDetectada(diferenca); setPassoConclusao('sobra'); } else { setModalConcluir(null); }
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const categoriasSet = new Set<string>();
  saidas.forEach((saida: any) => {
    if (saida.itens) {
      saida.itens.forEach((item: any) => {
        if (item.categoria && item.categoria.trim() !== '') {
          const catLimpa = item.categoria.trim();
          const catFormatada = catLimpa.charAt(0).toUpperCase() + catLimpa.slice(1);
          categoriasSet.add(catFormatada);
        }
      });
    }
  });
  const categoriasUnicas = Array.from(categoriasSet).sort();

  return (
    <div className="hub-fintech-container animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.4rem' }}>Orçamento Lazer</h2>
      </div>

      <OrcamentoHeader
        limiteMensalLazer={limiteMensalLazer} setEditandoLimite={setEditandoLimite}
        restanteLazer={restanteLazer} porcentagemUso={porcentagemUso}
        gastoP1={gastoP1} gastoP2={gastoP2} parceiro1={parceiro1} parceiro2={parceiro2} corP1={corP1} corP2={corP2} formatMoney={formatMoney} dicaRapida={dicaRapida}
        caixinhasValidas={caixinhasValidas} gastosPorCaixinha={gastosPorCaixinha} setEditandoCaixinhas={setEditandoCaixinhas}
        setAssistenteAberto={setAssistenteAberto} 
      />

      {!simuladorAberto && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <button onClick={abrirNovoPlano} style={{ width: '100%', padding: '16px 8px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Novo Passeio
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setAgendaAberto(true)} style={{ flex: 1, padding: '16px 8px', borderRadius: '20px', background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Agenda
            </button>
            <button onClick={() => setGraficosAberto(true)} style={{ flex: 1, padding: '16px 8px', borderRadius: '20px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              Gráficos
            </button>
          </div>
        </div>
      )}

      <OrcamentoListas
        saidasMesAtual={saidasMesAtualVisual} saidasHistorico={saidasHistorico} saidaExpandida={saidaExpandida} setSaidaExpandida={setSaidaExpandida}
        formatMoney={formatMoney} parceiro1={parceiro1} parceiro2={parceiro2} isProcessando={isProcessando}
        abrirEdicao={abrirEdicao} prepararConclusao={prepararConclusao} handleReabrirPasseio={handleReabrirPasseio}
        caixinhasValidas={caixinhasValidas} casalId={casalId} categoriasUnicas={categoriasUnicas} 
        setModalCategorias={setModalCategorias} // ✨ PASSANDO A FUNÇÃO DE ABRIR O NOVO MODAL
      />

      {avisoPendenciasAberto && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--code-bg)', borderRadius: '28px', padding: '32px 24px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #f59e0b' }}>
            <div style={{ marginBottom: '16px', color: '#f59e0b', display: 'flex', justifyContent: 'center' }}>
               <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>Existem Pendências!</h3>
            <p style={{ color: 'var(--text)', marginBottom: '12px', fontSize: '0.9rem', lineHeight: '1.5' }}>Vocês têm <strong>{pendenciasPassadas.length}</strong> passeio(s) de meses anteriores que ainda estão em aberto.</p>
            <p style={{ color: 'var(--text)', marginBottom: '32px', fontSize: '0.8rem', lineHeight: '1.5', fontStyle: 'italic' }}>Finalizem ou apaguem esses planos para fechar o ciclo. <strong>Fiquem tranquilos: eles não vão afetar o caixa deste mês!</strong></p>
            <button onClick={() => setAvisoPendenciasAberto(false)} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Entendido, vou organizar!</button>
          </div>
        </div>,
        document.body
      )}

      {saidaParaReabrir && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--code-bg)', borderRadius: '28px', padding: '32px 24px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #ef4444' }}>
            <div style={{ marginBottom: '16px', color: '#ef4444', display: 'flex', justifyContent: 'center' }}>
               <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            </div>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>Reabrir Passeio?</h3>
            <p style={{ color: 'var(--text)', marginBottom: '12px', fontSize: '0.9rem', lineHeight: '1.5' }}>Deseja reabrir <strong>"{saidaParaReabrir.titulo}"</strong> para ajustes?</p>
            <p style={{ color: 'var(--text)', marginBottom: '32px', fontSize: '0.8rem', lineHeight: '1.5', fontStyle: 'italic' }}>Isso vai <strong>desfazer</strong> a cobrança que foi gerada na divisão de gastos deste passeio.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setSaidaParaReabrir(null)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarReabrirPasseio} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>{isProcessando ? 'Aguarde...' : 'Reabrir'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONJUNTOS DE MODAIS */}
      <OrcamentoModalPlanner
        simuladorAberto={simuladorAberto} setSimuladorAberto={setSimuladorAberto} isProcessando={isProcessando}
        idEdicao={idEdicao} simTitulo={simTitulo} setSimTitulo={setSimTitulo} simData={simData} setSimData={setSimData}
        simItems={simItems} setSimItems={setSimItems} simEstimado={simEstimado} setSimEstimado={setSimEstimado} // ✨ Passando as novas variáveis
        parceiro1={parceiro1} parceiro2={parceiro2} corP1={corP1} corP2={corP2} 
        handleSalvarPlano={handleSalvarPlano} handleExcluirPlano={handleExcluirPlano}
        simCaixinha={simCaixinha} setSimCaixinha={setSimCaixinha} caixinhasValidas={caixinhasValidas} formatMoney={formatMoney}
        categoriasUnicas={categoriasUnicas}
      />

      {/* ✨ RENDERIZANDO O NOVO MODAL DE CATEGORIAS */}
      <OrcamentoModalEdicaoCategorias 
        modalCategorias={modalCategorias} setModalCategorias={setModalCategorias}
        categoriasUnicas={categoriasUnicas} casalId={casalId}
      />

      <OrcamentoModalConclusao modalConcluir={modalConcluir} setModalConcluir={setModalConcluir} passoConclusao={passoConclusao} setPassoConclusao={setPassoConclusao} quemPagouReal={quemPagouReal} setQuemPagouReal={setQuemPagouReal} valorP1Real={valorP1Real} setValorP1Real={setValorP1Real} valorP2Real={valorP2Real} setValorP2Real={setValorP2Real} valorRealFinal={valorRealFinal} setValorRealFinal={setValorRealFinal} sobraDetectada={sobraDetectada} isProcessando={isProcessando} parceiro1={parceiro1} parceiro2={parceiro2} formatMoney={formatMoney} processarFim={processarFim} />
      <OrcamentoModalSalarios editandoLimite={editandoLimite} setEditandoLimite={setEditandoLimite} casalId={casalId} parceiro1={parceiro1} parceiro2={parceiro2} corP1={corP1} corP2={corP2} formatMoney={formatMoney} />
      <OrcamentoModalCaixinhas editandoCaixinhas={editandoCaixinhas} setEditandoCaixinhas={setEditandoCaixinhas} casalId={casalId} caixinhasValidas={caixinhasValidas} limiteMensalLazer={limiteMensalLazer} formatMoney={formatMoney} meuNome={meuNome} />
      <OrcamentoModalAgenda agendaAberto={agendaAberto} setAgendaAberto={setAgendaAberto} casalId={casalId} agendaP1={agendaP1} agendaP2={agendaP2} currentUserRole={currentUserRole} parceiro1={parceiro1} parceiro2={parceiro2} corP1={corP1} corP2={corP2} meuNome={meuNome} abrirNovoPlanoComData={abrirNovoPlanoComData} saidasMesAtual={saidasMesAtualVisual} alfabetoConfig={alfabetoConfig} saidasTodas={saidas}/>
      <OrcamentoModalAssistente assistenteAberto={assistenteAberto} setAssistenteAberto={setAssistenteAberto} casalId={casalId} parceiro1={parceiro1} parceiro2={parceiro2} limiteMensalLazer={limiteMensalLazer} gastoEPlanejado={gastoEPlanejado} caixinhasValidas={caixinhasValidas} gastosPorCaixinha={gastosPorCaixinha} saidasMesAtual={saidasMesAtualVisual} formatMoney={formatMoney} rendaP1={rendaP1} rendaP2={rendaP2} />
      <OrcamentoModalGraficos graficosAberto={graficosAberto} setGraficosAberto={setGraficosAberto} saidasMesAtual={saidasMesAtualVisual} formatMoney={formatMoney} limiteMensalLazer={limiteMensalLazer} saidasTodas={saidas}/>

      <div className="scroll-spacer"></div>
    </div>
  );
};