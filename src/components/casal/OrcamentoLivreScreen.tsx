import React, { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc, query, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { enviarMensagemParaGemini } from '../../services/gemini';

export const OrcamentoLivreScreen = ({ 
  setActiveView, casalId, saidas, limiteMensalLazer, 
  parceiro1, parceiro2, corP1, corP2, formatMoney, icons
}: any) => {
  
  const [isProcessando, setIsProcessando] = useState(false);
  const [dicaRapida, setDicaRapida] = useState('Analisando o clima financeiro...');
  
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [simTitulo, setSimTitulo] = useState('');
  const [simData, setSimData] = useState('');
  const [simItems, setSimItems] = useState([{ id: 1, nome: '', valor: '', responsavel: 'ambos' }]);

  const [saidaExpandida, setSaidaExpandida] = useState<string | null>(null);

  const [editandoLimite, setEditandoLimite] = useState(false);
  const [novoLimiteInput, setNovoLimiteInput] = useState(limiteMensalLazer.toString());

  // ✨ MODAIS DE CONFIRMAÇÃO RESTAURADOS
  const [modalConcluir, setModalConcluir] = useState<any | null>(null);
  const [passoConclusao, setPassoConclusao] = useState<'pergunta' | 'ajuste' | 'sobra'>('pergunta');
  const [valorRealFinal, setValorRealFinal] = useState('');
  const [quemPagouReal, setQuemPagouReal] = useState('ambos');
  const [valorP1Real, setValorP1Real] = useState('');
  const [valorP2Real, setValorP2Real] = useState('');
  const [sobraDetectada, setSobraDetectada] = useState(0);

  const hoje = new Date();
  const mesAtualNum = hoje.getMonth();
  const anoAtualNum = hoje.getFullYear();
  const diasParaRenovar = new Date(anoAtualNum, mesAtualNum + 1, 0).getDate() - hoje.getDate() + 1;

  // ✨ HISTÓRICO ANTIGO E MÊS ATUAL SEPARADOS NOVAMENTE
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

  let gastoP1 = 0;
  let gastoP2 = 0;

  saidasMesAtual.forEach((s: any) => {
    if (s.status === 'concluido' && s.splitReal) {
      gastoP1 += s.splitReal.p1 || 0;
      gastoP2 += s.splitReal.p2 || 0;
    } else if (s.itens && s.itens.length > 0) {
      s.itens.forEach((i: any) => {
        const val = Number(i.valor || 0);
        if (i.responsavel === 'p1') gastoP1 += val;
        else if (i.responsavel === 'p2') gastoP2 += val;
        else { gastoP1 += val / 2; gastoP2 += val / 2; }
      });
    } else {
      gastoP1 += (s.estimado || 0) / 2;
      gastoP2 += (s.estimado || 0) / 2;
    }
  });

  const gastoEPlanejado = gastoP1 + gastoP2;
  const restanteLazer = limiteMensalLazer - gastoEPlanejado;
  const porcentagemUso = Math.min((gastoEPlanejado / limiteMensalLazer) * 100, 100);
  const totalSimulacao = simItems.reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0);

  useEffect(() => {
    let isMounted = true;
    const buscarDicaRapida = async () => {
      if (!casalId) return;
      try {
        const ctx = `Limite: ${limiteMensalLazer}. Gastos: ${gastoEPlanejado}. Sobra: ${restanteLazer}. Dias: ${diasParaRenovar}.`;
        const pg = `Dê 1 dica rápida de 1 linha sobre como aproveitar esse orçamento. Sem emojis.`;
        const resposta = await enviarMensagemParaGemini(pg, ctx);
        if (isMounted && resposta) setDicaRapida(resposta.replace(/^"|"$/g, ''));
      } catch (e) { }
    };
    buscarDicaRapida();
    return () => { isMounted = false; };
  }, [casalId, limiteMensalLazer, gastoEPlanejado]); 

  const handleSalvarLimite = async () => {
    if (!casalId || !novoLimiteInput) return;
    try {
      setIsProcessando(true);
      await updateDoc(doc(db, 'casais', casalId), { limiteLazer: Number(novoLimiteInput) });
      setEditandoLimite(false);
    } catch (error) {} finally { setIsProcessando(false); }
  };

  const abrirNovoPlano = () => {
    setIdEdicao(null); setSimTitulo(''); setSimData('');
    setSimItems([{ id: Date.now(), nome: '', valor: '', responsavel: 'ambos' }]);
    setSimuladorAberto(true);
  };

  const abrirEdicao = (plano: any, e: any) => {
    e.stopPropagation();
    setIdEdicao(plano.id); setSimTitulo(plano.titulo); setSimData(plano.dataRaw || ''); 
    setSimItems(plano.itens || []); setSimuladorAberto(true);
  };

  const handleSalvarPlano = async () => {
    if (!casalId || !simTitulo || totalSimulacao <= 0) return;
    try {
      setIsProcessando(true);
      const dados = {
        titulo: simTitulo, data: simData ? new Date(simData + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'A definir',
        dataRaw: simData, estimado: totalSimulacao, status: 'planejado', itens: simItems, updatedAt: serverTimestamp()
      };
      if (idEdicao) await updateDoc(doc(db, 'casais', casalId, 'saidas', idEdicao), dados);
      else await addDoc(collection(db, 'casais', casalId, 'saidas'), { ...dados, createdAt: serverTimestamp() });
      setSimuladorAberto(false);
    } catch (error) {} finally { setIsProcessando(false); }
  };

  const handleExcluirPlano = async (id: string) => {
    if (!window.confirm("Deseja apagar este plano?")) return;
    try { 
      setIsProcessando(true); await deleteDoc(doc(db, 'casais', casalId, 'saidas', id)); setSimuladorAberto(false); 
    } catch (error) {} finally { setIsProcessando(false); }
  };

  // ✨ RESTAURADO: REABRIR PASSEIO CONCLUÍDO
  const handleReabrirPasseio = async (saida: any, e: any) => {
    e.stopPropagation();
    if (!window.confirm(`Deseja reabrir "${saida.titulo}" para correção? Isso removerá a cobrança atual.`)) return;

    try {
      setIsProcessando(true);
      const q = query(collection(db, 'casais', casalId, 'despesas_rapidas'));
      const querySnapshot = await getDocs(q);
      const deletarPromises: any[] = [];
      querySnapshot.forEach((despesaDoc) => {
        if (despesaDoc.data().desc?.includes(saida.titulo)) {
          deletarPromises.push(deleteDoc(doc(db, 'casais', casalId, 'despesas_rapidas', despesaDoc.id)));
        }
      });
      await Promise.all(deletarPromises);
      await updateDoc(doc(db, 'casais', casalId, 'saidas', saida.id), { status: 'planejado' });
      abrirEdicao(saida, e);
    } catch (error) {
      alert("Erro ao reabrir o passeio.");
    } finally {
      setIsProcessando(false);
    }
  };

  // ✨ RESTAURADO: PREPARAR CONCLUSÃO COM MODAL PASSO A PASSO
  const prepararConclusao = (saida: any, e: any) => {
    e.stopPropagation();
    setModalConcluir(saida);
    setValorRealFinal(saida.estimado.toString());

    let p1 = 0; let p2 = 0;
    if (saida.itens && saida.itens.length > 0) {
      saida.itens.forEach((item: any) => {
        const val = Number(item.valor || 0);
        if (item.responsavel === 'p1') p1 += val;
        else if (item.responsavel === 'p2') p2 += val;
        else { p1 += val/2; p2 += val/2; }
      });
    } else {
      p1 = saida.estimado / 2; p2 = saida.estimado / 2;
    }

    setValorP1Real(p1.toString());
    setValorP2Real(p2.toString());

    if (p1 > 0 && p2 === 0) setQuemPagouReal(parceiro1);
    else if (p2 > 0 && p1 === 0) setQuemPagouReal(parceiro2);
    else setQuemPagouReal('ambos');

    setPassoConclusao('pergunta');
    setSobraDetectada(0);
  };

  const processarFim = async (confirmadoIgual: boolean) => {
    if (!modalConcluir || !casalId || isProcessando) return; 
    try {
      setIsProcessando(true);
      
      let valorGastoEfetivo = 0;
      let v1 = 0; let v2 = 0;

      if (confirmadoIgual) {
        valorGastoEfetivo = modalConcluir.estimado;
        if (modalConcluir.itens && modalConcluir.itens.length > 0) {
          modalConcluir.itens.forEach((item: any) => {
            const val = Number(item.valor || 0);
            if (item.responsavel === 'p1') v1 += val;
            else if (item.responsavel === 'p2') v2 += val;
            else { v1 += val/2; v2 += val/2; }
          });
        } else {
          v1 = valorGastoEfetivo / 2; v2 = valorGastoEfetivo / 2;
        }
      } else {
        if (quemPagouReal === 'ambos') {
          v1 = Number(valorP1Real || 0); v2 = Number(valorP2Real || 0);
          valorGastoEfetivo = v1 + v2;
        } else if (quemPagouReal === parceiro1) {
          valorGastoEfetivo = Number(valorRealFinal || 0); v1 = valorGastoEfetivo;
        } else if (quemPagouReal === parceiro2) {
          valorGastoEfetivo = Number(valorRealFinal || 0); v2 = valorGastoEfetivo;
        }
      }

      await updateDoc(doc(db, 'casais', casalId, 'saidas', modalConcluir.id), { 
        status: 'concluido', estimado: valorGastoEfetivo, splitReal: { p1: v1, p2: v2 } 
      });

      if (v1 > 0) {
        await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { 
          desc: v2 > 0 ? `${modalConcluir.titulo} (${parceiro1})` : modalConcluir.titulo, pagoPor: parceiro1, valor: v1, data: 'Hoje', createdAt: serverTimestamp() 
        });
      }
      if (v2 > 0) {
        await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { 
          desc: v1 > 0 ? `${modalConcluir.titulo} (${parceiro2})` : modalConcluir.titulo, pagoPor: parceiro2, valor: v2, data: 'Hoje', createdAt: serverTimestamp() 
        });
      }

      const diferenca = modalConcluir.estimado - valorGastoEfetivo;
      if (diferenca > 0) {
        setSobraDetectada(diferenca);
        setPassoConclusao('sobra');
      } else {
        setModalConcluir(null);
      }
    } catch (e) {} finally { setIsProcessando(false); }
  };

  return (
    <div className="hub-fintech-container animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* HEADER DA TELA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.4rem' }}>Orçamento Lazer</h2>
      </div>

      {/* CARTÃO DE ORÇAMENTO */}
      <div className="hub-balance-card" style={{ padding: '24px', background: 'var(--code-bg)', borderRadius: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>O Teto do Mês</span>
            {editandoLimite ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input type="number" value={novoLimiteInput} onChange={e => setNovoLimiteInput(e.target.value)} style={{ width: '100px', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }} />
                <button onClick={handleSalvarLimite} disabled={isProcessando} style={{ padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}>✓</button>
              </div>
            ) : (
              <h2 style={{ margin: '4px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.8rem' }}>
                {formatMoney(limiteMensalLazer)}
                <button onClick={() => setEditandoLimite(true)} style={{ background: 'var(--bg)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  ✎
                </button>
              </h2>
            )}
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

      <div style={{ background: 'rgba(138, 43, 226, 0.05)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(138, 43, 226, 0.1)', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span> {dicaRapida}
        </p>
      </div>

      {!simuladorAberto && (
        <button onClick={abrirNovoPlano} style={{ width: '100%', padding: '18px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '32px', boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)' }}>
          + Planejar Novo Passeio
        </button>
      )}

      {/* SIMULADOR EM LINHA */}
      {simuladorAberto && (
        <div className="animate-fade-in" style={{ background: 'var(--code-bg)', borderRadius: '28px', padding: '24px', marginBottom: '32px', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-h)' }}>{idEdicao ? 'Ajustar Plano' : 'Novo Rolezinho'}</h4>
          <input type="text" placeholder="Nome do Passeio" value={simTitulo} onChange={e => setSimTitulo(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', marginBottom: '16px' }} />
          <input type="date" value={simData} onChange={e => setSimData(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', marginBottom: '24px' }} />

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-h)', fontWeight: 'bold' }}>ITENS DO CUSTO</span>
            {simItems.map((item: any) => (
              <div key={item.id} style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <input type="text" value={item.nome} onChange={e => setSimItems(simItems.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Combustível" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }} />
                  <input type="number" value={item.valor} onChange={e => setSimItems(simItems.map(i => i.id === item.id ? { ...i, valor: e.target.value } : i))} placeholder="R$" style={{ width: '90px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['ambos', 'p1', 'p2'].map(opt => (
                    <button key={opt} onClick={() => setSimItems(simItems.map(i => i.id === item.id ? { ...i, responsavel: opt } : i))} 
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '0.8rem', border: 'none', background: item.responsavel === opt ? 'var(--accent)' : 'var(--code-bg)', color: item.responsavel === opt ? '#fff' : 'var(--text)' }}>
                      {opt === 'ambos' ? 'Meio a meio' : opt === 'p1' ? parceiro1 : parceiro2}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setSimItems([...simItems, { id: Date.now(), nome: '', valor: '', responsavel: 'ambos' }])} style={{ width: '100%', padding: '16px', marginTop: '16px', background: 'transparent', border: '2px dashed var(--border)', color: 'var(--text)', borderRadius: '16px', fontWeight: 'bold' }}>+ Adicionar Item</button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button onClick={() => setSimuladorAberto(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--bg)', color: 'var(--text)' }}>Cancelar</button>
            <button onClick={handleSalvarPlano} disabled={isProcessando} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff' }}>Salvar</button>
          </div>
          {idEdicao && <button onClick={() => handleExcluirPlano(idEdicao)} style={{ width: '100%', marginTop: '16px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold' }}>Apagar Plano</button>}
        </div>
      )}

      {/* LISTA DE SAÍDAS DO MÊS */}
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Passeios do Mês</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {saidasMesAtual.map((saida: any) => {
          const isExpandido = saidaExpandida === saida.id;
          return (
            <div 
              key={saida.id} 
              onClick={() => setSaidaExpandida(isExpandido ? null : saida.id)}
              style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: `1px solid ${saida.status === 'concluido' ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'}`, transition: '0.3s', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {saida.status === 'concluido' ? '✅' : '⏳'} {saida.titulo}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{saida.data}</span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: saida.status === 'concluido' ? '#10b981' : 'var(--text-h)' }}>
                  {formatMoney(saida.estimado)}
                </div>
              </div>

              {/* DETALHES DA FATURA */}
              {isExpandido && (
                <div className="animate-fade-in" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>O que pagamos:</p>
                  
                  {saida.itens && saida.itens.length > 0 ? (
                    saida.itens.map((item: any, index: number) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-h)' }}>
                        <span>• {item.nome || 'Item sem nome'} <span style={{fontSize: '0.7rem', color: 'var(--text)'}}>({item.responsavel === 'ambos' ? 'Dividido' : item.responsavel === 'p1' ? parceiro1 : parceiro2})</span></span>
                        <span>{formatMoney(Number(item.valor))}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: 0 }}>Nenhum item detalhado neste plano.</p>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    {saida.status === 'planejado' ? (
                       <>
                         <button onClick={(e) => abrirEdicao(saida, e)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg)', color: 'var(--text-h)', border: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>Editar</button>
                         <button onClick={(e) => prepararConclusao(saida, e)} disabled={isProcessando} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>Concluir ✅</button>
                       </>
                    ) : (
                       <>
                         <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Passeio finalizado!</span>
                         <button onClick={(e) => handleReabrirPasseio(saida, e)} disabled={isProcessando} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 'bold', fontSize: '0.9rem' }}>Reabrir</button>
                       </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ✨ HISTÓRICO RESTAURADO */}
      {saidasHistorico.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>Histórico de Passeios</h3>
          {saidasHistorico.sort((a:any, b:any) => new Date(b.dataRaw || b.data).getTime() - new Date(a.dataRaw || a.data).getTime()).map((saida: any) => (
            <div key={saida.id} style={{ background: 'var(--bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.05rem' }}>{saida.titulo}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{saida.data} • {saida.status === 'concluido' ? 'Concluído' : 'Expirado'}</span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1.1rem' }}>
                  {formatMoney(saida.estimado)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✨ MODAL DE CONCLUSÃO DE PASSEIOS (Corrigido com z-index 99999 e overlay fixa) */}
      {modalConcluir && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="animate-slide-up" style={{ background: 'var(--bg)', width: '100%', maxWidth: '500px', borderRadius: '32px 32px 0 0', padding: '32px 24px 60px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {passoConclusao === 'pergunta' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
                <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>Como foi o passeio?</h3>
                <p style={{ color: 'var(--text)', marginBottom: '32px' }}>Gastaram os <strong>{formatMoney(modalConcluir.estimado)}</strong> que planearam?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <button onClick={() => processarFim(true)} disabled={isProcessando} style={{ padding: '20px', borderRadius: '18px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>Sim, certinho!</button>
                  <button onClick={() => setPassoConclusao('ajuste')} disabled={isProcessando} style={{ padding: '20px', borderRadius: '18px', background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '1.1rem' }}>Não, o valor mudou</button>
                  <button onClick={() => setModalConcluir(null)} disabled={isProcessando} style={{ color: 'var(--text)', background: 'none', border: 'none', marginTop: '10px', fontSize: '1rem', fontWeight: 'bold' }}>Ainda não acabou</button>
                </div>
              </div>
            )}

            {passoConclusao === 'ajuste' && (
              <div>
                <h3 style={{ marginBottom: '24px', textAlign: 'center', color: 'var(--text-h)' }}>Ajustar Valor Real</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)' }}>QUEM PAGOU?</label>
                    <select value={quemPagouReal} onChange={e => setQuemPagouReal(e.target.value)} style={{ width: '100%', padding: '16px', marginTop: '8px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', outline: 'none' }}>
                      <option value="ambos">Nós dois dividimos</option>
                      <option value={parceiro1}>{parceiro1} pagou tudo</option>
                      <option value={parceiro2}>{parceiro2} pagou tudo</option>
                    </select>
                  </div>
                  {quemPagouReal === 'ambos' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Pago por {parceiro1}</label><input type="number" value={valorP1Real} onChange={e => setValorP1Real(e.target.value)} placeholder="R$ 0,00" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '4px' }} /></div>
                      <div><label style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Pago por {parceiro2}</label><input type="number" value={valorP2Real} onChange={e => setValorP2Real(e.target.value)} placeholder="R$ 0,00" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '4px' }} /></div>
                    </div>
                  ) : (
                    <input type="number" value={valorRealFinal} onChange={e => setValorRealFinal(e.target.value)} placeholder="Valor total real" style={{ width: '100%', padding: '18px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '1.3rem', fontWeight: 'bold', textAlign: 'center' }} />
                  )}
                  <button onClick={() => processarFim(false)} disabled={isProcessando} style={{ width: '100%', padding: '20px', borderRadius: '18px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold' }}>Confirmar Valor</button>
                  <button onClick={() => setPassoConclusao('pergunta')} disabled={isProcessando} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text)', fontWeight: 'bold' }}>Voltar</button>
                </div>
              </div>
            )}

            {passoConclusao === 'sobra' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#10b981' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                </div>
                <h2 style={{ color: '#10b981', margin: '0 0 12px 0' }}>Sobrou {formatMoney(sobraDetectada)}!</h2>
                <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '32px', textAlign: 'left' }}>
                   <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--text-h)' }}>Sobra devolvida ao caixa!</p>
                </div>
                <button onClick={() => setModalConcluir(null)} disabled={isProcessando} style={{ padding: '20px', width: '100%', borderRadius: '18px', background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 'bold' }}>Concluir</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};