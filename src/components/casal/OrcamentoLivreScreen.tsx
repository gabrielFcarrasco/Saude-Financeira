import React, { useState, useEffect } from 'react';
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

export const OrcamentoLivreScreen = ({ 
  setActiveView, casalId, saidas, limiteMensalLazer, parceiro1, parceiro2, corP1, corP2, formatMoney, icons, currentUserRole, meuNome
}: any) => {
  
  const [isProcessando, setIsProcessando] = useState(false);
  const [dicaRapida, setDicaRapida] = useState('Analisando o clima financeiro...');
  const [dicaDataFirebase, setDicaDataFirebase] = useState('');
  
  const [caixinhas, setCaixinhas] = useState<any[]>([]);
  const [editandoCaixinhas, setEditandoCaixinhas] = useState(false);
  const [simCaixinha, setSimCaixinha] = useState('');

  const [agendaAberto, setAgendaAberto] = useState(false);
  const [agendaP1, setAgendaP1] = useState<string[]>([]);
  const [agendaP2, setAgendaP2] = useState<string[]>([]);

  const [assistenteAberto, setAssistenteAberto] = useState(false);

  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [simTitulo, setSimTitulo] = useState('');
  const [simData, setSimData] = useState('');
  const [simItems, setSimItems] = useState([{ id: 1, nome: '', valor: '', responsavel: 'ambos' }]);
  const [saidaExpandida, setSaidaExpandida] = useState<string | null>(null);
  const [editandoLimite, setEditandoLimite] = useState(false);
  
  const [modalConcluir, setModalConcluir] = useState<any | null>(null);
  const [passoConclusao, setPassoConclusao] = useState<'pergunta' | 'ajuste' | 'sobra'>('pergunta');
  const [valorRealFinal, setValorRealFinal] = useState('');
  const [quemPagouReal, setQuemPagouReal] = useState('ambos');
  const [valorP1Real, setValorP1Real] = useState('');
  const [valorP2Real, setValorP2Real] = useState('');
  const [sobraDetectada, setSobraDetectada] = useState(0);

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

  const saidasMesAtual: any[] = [];
  const saidasHistorico: any[] = [];

  saidas.forEach((saida: any) => {
    let isMesAtual = true;
    if (saida.dataRaw) {
      const [anoStr, mesStr] = saida.dataRaw.split('-');
      if (parseInt(anoStr) !== anoAtualNum || parseInt(mesStr) - 1 !== mesAtualNum) isMesAtual = false;
    }
    if (isMesAtual) saidasMesAtual.push(saida);
    else saidasHistorico.push(saida);
  });

  let gastoP1 = 0; let gastoP2 = 0;
  const gastosPorCaixinha: Record<string, number> = {};
  caixinhasValidas.forEach((c: any) => gastosPorCaixinha[c.id] = 0);

  saidasMesAtual.forEach((s: any) => {
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
  const totalSimulacao = simItems.reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0);

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
        
        if (isMounted && textoLimpo) {
          await updateDoc(doc(db, 'casais', casalId), {
            dicaLazerData: dataHojeStr,
            dicaLazerTexto: textoLimpo
          });
        }
      } catch (e) { }
    };
    
    if (dicaDataFirebase !== '' && dicaDataFirebase !== dataHojeStr) {
      gerenciarDicaDiaria();
    } else if (dicaDataFirebase === '') {
      gerenciarDicaDiaria();
    }

    return () => { isMounted = false; };
  }, [casalId, limiteMensalLazer, gastoEPlanejado, diasParaRenovar, dicaDataFirebase, dataHojeStr]); 

  const abrirNovoPlano = () => {
    setIdEdicao(null); setSimTitulo(''); setSimData('');
    setSimItems([{ id: Date.now(), nome: '', valor: '', responsavel: 'ambos' }]);
    setSimCaixinha(caixinhasValidas[0].id);
    setSimuladorAberto(true);
  };

  const abrirNovoPlanoComData = (dataStr: string) => {
    setIdEdicao(null); setSimTitulo(''); 
    setSimData(dataStr); 
    setSimItems([{ id: Date.now(), nome: '', valor: '', responsavel: 'ambos' }]);
    setSimCaixinha(caixinhasValidas[0].id);
    setSimuladorAberto(true);
  };

  const abrirEdicao = (plano: any, e: any) => {
    e.stopPropagation();
    setIdEdicao(plano.id); setSimTitulo(plano.titulo); setSimData(plano.dataRaw || ''); 
    setSimItems(plano.itens || []);
    setSimCaixinha(plano.caixinhaId || caixinhasValidas[0].id);
    setSimuladorAberto(true);
  };

  const handleSalvarPlano = async () => {
    if (!casalId || !simTitulo || totalSimulacao <= 0) return;
    try {
      setIsProcessando(true);
      const dataFormatada = simData ? new Date(simData + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'A definir';
      const dados = { 
        titulo: simTitulo, caixinhaId: simCaixinha, data: dataFormatada, 
        dataRaw: simData, estimado: totalSimulacao, status: 'planejado', itens: simItems, updatedAt: serverTimestamp() 
      };
      
      if (idEdicao) {
        await updateDoc(doc(db, 'casais', casalId, 'saidas', idEdicao), dados);
        // ✨ Notificação ao editar um plano
        await updateDoc(doc(db, 'casais', casalId), {
          notificacoes: arrayUnion({
            id: Date.now().toString(),
            texto: `${meuNome} alterou os detalhes do rolê "${simTitulo}"!`,
            lida: false,
            createdAt: new Date().toISOString()
          })
        });
      } else {
        await addDoc(collection(db, 'casais', casalId, 'saidas'), { ...dados, createdAt: serverTimestamp() });
        await updateDoc(doc(db, 'casais', casalId), {
          notificacoes: arrayUnion({
            id: Date.now().toString(),
            texto: `${meuNome} marcou um novo passeio: "${simTitulo}" para o dia ${dataFormatada}!`,
            lida: false,
            createdAt: new Date().toISOString()
          })
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

  const handleReabrirPasseio = async (saida: any, e: any) => {
    e.stopPropagation();
    if (!window.confirm(`Deseja reabrir "${saida.titulo}" para correção? Isso removerá a cobrança atual.`)) return;
    try {
      setIsProcessando(true);
      const q = query(collection(db, 'casais', casalId, 'despesas_rapidas'));
      const querySnapshot = await getDocs(q);
      const deletarPromises: any[] = [];
      querySnapshot.forEach((despesaDoc) => {
        if (despesaDoc.data().desc?.includes(saida.titulo)) deletarPromises.push(deleteDoc(doc(db, 'casais', casalId, 'despesas_rapidas', despesaDoc.id)));
      });
      await Promise.all(deletarPromises);
      await updateDoc(doc(db, 'casais', casalId, 'saidas', saida.id), { status: 'planejado' });
      abrirEdicao(saida, e);
    } catch (error) { alert("Erro ao reabrir o passeio."); } finally { setIsProcessando(false); }
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
      
      // ✨ Disparando a Notificação de Conclusão de Rolê!
      await updateDoc(doc(db, 'casais', casalId), {
        notificacoes: arrayUnion({
          id: Date.now().toString(),
          texto: `${meuNome} marcou o rolê "${modalConcluir.titulo}" como concluído!`,
          lida: false,
          createdAt: new Date().toISOString()
        })
      });

      const diferenca = modalConcluir.estimado - valorGastoEfetivo;
      if (diferenca > 0) { setSobraDetectada(diferenca); setPassoConclusao('sobra'); } else { setModalConcluir(null); }
    } catch (e) {} finally { setIsProcessando(false); }
  };

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <button onClick={abrirNovoPlano} style={{ width: '100%', padding: '16px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)' }}>
            + Novo Passeio
          </button>
          <button onClick={() => setAgendaAberto(true)} style={{ width: '100%', padding: '16px', borderRadius: '20px', background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }}>
            📅 Ver Agendas
          </button>
        </div>
      )}

      <OrcamentoListas
        saidasMesAtual={saidasMesAtual} saidasHistorico={saidasHistorico} saidaExpandida={saidaExpandida} setSaidaExpandida={setSaidaExpandida}
        formatMoney={formatMoney} parceiro1={parceiro1} parceiro2={parceiro2} isProcessando={isProcessando}
        abrirEdicao={abrirEdicao} prepararConclusao={prepararConclusao} handleReabrirPasseio={handleReabrirPasseio}
        caixinhasValidas={caixinhasValidas}
      />

      <OrcamentoModalPlanner
        simuladorAberto={simuladorAberto} setSimuladorAberto={setSimuladorAberto} isProcessando={isProcessando}
        idEdicao={idEdicao} simTitulo={simTitulo} setSimTitulo={setSimTitulo} simData={simData} setSimData={setSimData}
        simItems={simItems} setSimItems={setSimItems} parceiro1={parceiro1} parceiro2={parceiro2}
        handleSalvarPlano={handleSalvarPlano} handleExcluirPlano={handleExcluirPlano}
        simCaixinha={simCaixinha} setSimCaixinha={setSimCaixinha} caixinhasValidas={caixinhasValidas} formatMoney={formatMoney} gastosPorCaixinha={gastosPorCaixinha}
      />

      <OrcamentoModalConclusao
        modalConcluir={modalConcluir} setModalConcluir={setModalConcluir} passoConclusao={passoConclusao} setPassoConclusao={setPassoConclusao}
        quemPagouReal={quemPagouReal} setQuemPagouReal={setQuemPagouReal} valorP1Real={valorP1Real} setValorP1Real={setValorP1Real}
        valorP2Real={valorP2Real} setValorP2Real={setValorP2Real} valorRealFinal={valorRealFinal} setValorRealFinal={setValorRealFinal}
        sobraDetectada={sobraDetectada} isProcessando={isProcessando} parceiro1={parceiro1} parceiro2={parceiro2}
        formatMoney={formatMoney} processarFim={processarFim}
      />

      <OrcamentoModalSalarios
        editandoLimite={editandoLimite} setEditandoLimite={setEditandoLimite} casalId={casalId} 
        parceiro1={parceiro1} parceiro2={parceiro2} corP1={corP1} corP2={corP2} formatMoney={formatMoney}
      />

      {/* ✨ REPASSANDO O SEU NOME PARA AS CAIXINHAS */}
      <OrcamentoModalCaixinhas
        editandoCaixinhas={editandoCaixinhas} setEditandoCaixinhas={setEditandoCaixinhas} casalId={casalId}
        caixinhasValidas={caixinhasValidas} limiteMensalLazer={limiteMensalLazer} formatMoney={formatMoney}
        meuNome={meuNome} 
      />

      <OrcamentoModalAgenda
        agendaAberto={agendaAberto} setAgendaAberto={setAgendaAberto} casalId={casalId}
        agendaP1={agendaP1} agendaP2={agendaP2} currentUserRole={currentUserRole}
        parceiro1={parceiro1} parceiro2={parceiro2} corP1={corP1} corP2={corP2} meuNome={meuNome}
        abrirNovoPlanoComData={abrirNovoPlanoComData}
      />

      <OrcamentoModalAssistente
        assistenteAberto={assistenteAberto} setAssistenteAberto={setAssistenteAberto}
        casalId={casalId} parceiro1={parceiro1} parceiro2={parceiro2}
        limiteMensalLazer={limiteMensalLazer} gastoEPlanejado={gastoEPlanejado}
        caixinhasValidas={caixinhasValidas} gastosPorCaixinha={gastosPorCaixinha}
        saidasMesAtual={saidasMesAtual} formatMoney={formatMoney}
      />

      <div className="scroll-spacer"></div>
    </div>
  );
};