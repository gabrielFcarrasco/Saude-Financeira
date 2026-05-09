import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth, db } from '../../services/firebase';

export const OrcamentoLivreScreen = ({ 
  setActiveView, casalId, saidas, limiteMensalLazer, 
  parceiro1, parceiro2, formatMoney, icons, metas 
}: any) => {
  
  const [isProcessando, setIsProcessando] = useState(false);
  const [mensagemIA, setMensagemIA] = useState('');
  
  // Estados do Simulador/Editor
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [simTitulo, setSimTitulo] = useState('');
  const [simData, setSimData] = useState('');
  const [simItems, setSimItems] = useState([{ id: 1, nome: 'Ex: Restaurante', valor: '', responsavel: 'ambos' }]);

  // Estados de Conclusão
  const [modalConcluir, setModalConcluir] = useState<any | null>(null);
  const [passoConclusao, setPassoConclusao] = useState<'pergunta' | 'ajuste' | 'sobra'>('pergunta');
  const [valorRealFinal, setValorRealFinal] = useState('');
  const [quemPagouReal, setQuemPagouReal] = useState('ambos');
  const [valorP1Real, setValorP1Real] = useState('');
  const [valorP2Real, setValorP2Real] = useState('');
  const [sobraDetectada, setSobraDetectada] = useState(0);

  const gastoEPlanejado = saidas.reduce((acc: number, curr: any) => acc + Number(curr.estimado || 0), 0);
  const restanteLazer = limiteMensalLazer - gastoEPlanejado;
  const porcentagemUso = Math.min((gastoEPlanejado / limiteMensalLazer) * 100, 100);
  const totalSimulacao = simItems.reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0);

  // ==========================================
  // LÓGICA DO SIMULADOR (CRIAR E EDITAR)
  // ==========================================

  const abrirNovoPlano = () => {
    setIdEdicao(null);
    setSimTitulo('');
    setSimData('');
    setSimItems([{ id: Date.now(), nome: '', valor: '', responsavel: 'ambos' }]);
    setSimuladorAberto(true);
  };

  const abrirEdicao = (plano: any) => {
    setIdEdicao(plano.id);
    setSimTitulo(plano.titulo);
    setSimData(plano.dataRaw || ''); 
    setSimItems(plano.itens || []);
    setSimuladorAberto(true);
  };

  const handleSalvarPlano = async () => {
    if (!casalId || !simTitulo || totalSimulacao <= 0) return;
    try {
      setIsProcessando(true);
      const dadosPlano = {
        titulo: simTitulo,
        data: simData ? new Date(simData + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'A definir',
        dataRaw: simData, // Guardamos o valor puro do input date para editar depois
        estimado: totalSimulacao,
        status: 'planejado',
        itens: simItems,
        updatedAt: serverTimestamp()
      };

      if (idEdicao) {
        await updateDoc(doc(db, 'casais', casalId, 'saidas', idEdicao), dadosPlano);
      } else {
        await addDoc(collection(db, 'casais', casalId, 'saidas'), { ...dadosPlano, createdAt: serverTimestamp() });
      }
      
      setSimuladorAberto(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setIsProcessando(false);
    }
  };

  const handleExcluirPlano = async (id: string) => {
    if (!window.confirm("Deseja cancelar este planejamento?")) return;
    try {
      setIsProcessando(true);
      await deleteDoc(doc(db, 'casais', casalId, 'saidas', id));
      setSimuladorAberto(false);
    } catch (error) { console.error(error); }
    finally { setIsProcessando(false); }
  };

  // ==========================================
  // LÓGICA DE CONCLUSÃO
  // ==========================================

  const prepararConclusao = (saida: any) => {
    setModalConcluir(saida);
    setValorRealFinal(saida.estimado.toString());
    setQuemPagouReal('ambos');
    setPassoConclusao('pergunta');
    setSobraDetectada(0);
  };

  const processarFim = async (confirmadoIgual: boolean) => {
    if (!modalConcluir || !casalId) return;
    try {
      setIsProcessando(true);
      
      let valorGastoEfetivo = confirmadoIgual ? modalConcluir.estimado : Number(valorRealFinal);
      if (quemPagouReal === 'ambos' && !confirmadoIgual) {
        valorGastoEfetivo = Number(valorP1Real || 0) + Number(valorP2Real || 0);
      }

      // 1. Marcar como concluído
      await updateDoc(doc(db, 'casais', casalId, 'saidas', modalConcluir.id), { 
        status: 'concluido', 
        estimado: valorGastoEfetivo 
      });

      // 2. Lançar na balança
      if (quemPagouReal === 'ambos') {
        const v1 = confirmadoIgual ? (valorGastoEfetivo / 2) : Number(valorP1Real);
        const v2 = confirmadoIgual ? (valorGastoEfetivo / 2) : Number(valorP2Real);
        
        if (v1 > 0) await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { desc: `${modalConcluir.titulo} (${parceiro1})`, pagoPor: parceiro1, valor: v1, data: 'Hoje', createdAt: serverTimestamp() });
        if (v2 > 0) await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { desc: `${modalConcluir.titulo} (${parceiro2})`, pagoPor: parceiro2, valor: v2, data: 'Hoje', createdAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { desc: modalConcluir.titulo, pagoPor: quemPagouReal, valor: valorGastoEfetivo, data: 'Hoje', createdAt: serverTimestamp() });
      }

      // 3. Checar sobra
      const diferenca = modalConcluir.estimado - valorGastoEfetivo;
      if (diferenca > 0) {
        setSobraDetectada(diferenca);
        setPassoConclusao('sobra');
        gerarMensagemSobraComIA(diferenca, modalConcluir.titulo);
      } else {
        fecharModal();
      }
    } catch (e) { console.error(e); }
    finally { setIsProcessando(false); }
  };

  const gerarMensagemSobraComIA = async (valor: number, passeio: string) => {
    setMensagemIA("Aí sim! Sobrou dinheiro do passeio! Que tal jogar essa grana extra direto na meta de vocês? 🚀");
    try {
      const funcoesNuvem = getFunctions(auth.app, 'southamerica-east1');
      const funcIA = httpsCallable(funcoesNuvem, 'gerarInsightFinanceiro');
      const resposta = await funcIA({ prompt: `Nós economizamos R$ ${valor} no passeio "${passeio}". Escreva uma frase curta e animada incentivando a gente a investir isso.` });
      if ((resposta.data as any)?.insight) setMensagemIA((resposta.data as any).insight);
    } catch (e) {}
  };

  const investirSobra = async () => {
    if (metas.length === 0) return alert("Crie uma meta primeiro!");
    try {
      setIsProcessando(true);
      const meta = metas[0];
      await updateDoc(doc(db, 'casais', casalId, 'metas', meta.id), {
        atual: meta.atual + sobraDetectada,
        historico: [{ id: Date.now().toString(), data: 'Hoje', valor: sobraDetectada, descricao: `Sobra: ${modalConcluir?.titulo}` }, ...(meta.historico || [])]
      });
      fecharModal();
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const fecharModal = () => { setModalConcluir(null); setMensagemIA(''); };

  return (
    <div className="hub-fintech-container animate-fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* HEADER FIXO MOBILE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ margin: 0 }}>
          {icons.voltar}
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.2rem' }}>Lazer e Saídas</h2>
        </div>
      </div>

      {/* CARD DE RESUMO */}
      <div className="hub-balance-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 'bold' }}>Orçamento Mensal</span>
            <h2 style={{ margin: 0, color: 'var(--text-h)' }}>{formatMoney(limiteMensalLazer)}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 'bold' }}>Livre</span>
            <h2 style={{ margin: 0, color: restanteLazer >= 0 ? '#10b981' : '#ef4444' }}>{formatMoney(restanteLazer)}</h2>
          </div>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${porcentagemUso}%`, height: '100%', background: porcentagemUso > 90 ? '#ef4444' : 'var(--accent)', transition: 'width 0.8s ease' }}></div>
        </div>
      </div>

      {/* BOTÃO ADICIONAR RÁPIDO */}
      {!simuladorAberto && (
        <button onClick={abrirNovoPlano} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Planejar Novo Passeio
        </button>
      )}

      {/* SIMULADOR / EDITOR COLABORATIVO */}
      {simuladorAberto && (
        <div className="animate-fade-in" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: 'var(--accent)' }}>{idEdicao ? 'Editar Roteiro' : 'Novo Roteiro'}</h4>
            {idEdicao && <button onClick={() => handleExcluirPlano(idEdicao)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>Excluir</button>}
          </div>

          <input type="text" placeholder="Nome do plano (Ex: Jantar Especial)" value={simTitulo} onChange={e => setSimTitulo(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginBottom: '12px', fontSize: '1rem' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', marginLeft: '4px' }}>QUANDO SERÁ?</label>
            <input type="date" value={simData} onChange={e => setSimData(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '1rem' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Itens do Orçamento</span>
            
            {simItems.map((item: any, idx: number) => (
              <div key={item.id} style={{ background: 'var(--bg)', padding: '12px', borderRadius: '12px', marginTop: '10px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" value={item.nome} onChange={e => setSimItems(simItems.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="O que é?" style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-h)', outline: 'none', padding: '4px' }} />
                  <input type="number" value={item.valor} onChange={e => setSimItems(simItems.map(i => i.id === item.id ? { ...i, valor: e.target.value } : i))} placeholder="R$" style={{ width: '80px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-h)', outline: 'none', padding: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', gap: '4px' }}>
                      {['ambos', 'p1', 'p2'].map(opt => (
                        <button key={opt} onClick={() => setSimItems(simItems.map(i => i.id === item.id ? { ...i, responsavel: opt } : i))} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', border: '1px solid var(--border)', background: item.responsavel === opt ? 'var(--accent)' : 'transparent', color: item.responsavel === opt ? '#fff' : 'var(--text)' }}>
                          {opt === 'ambos' ? 'Nós' : opt === 'p1' ? parceiro1 : parceiro2}
                        </button>
                      ))}
                   </div>
                   <button onClick={() => setSimItems(simItems.filter(i => i.id !== item.id))} style={{ color: '#ef4444', background: 'none', border: 'none' }}>{icons.lixo || '✕'}</button>
                </div>
              </div>
            ))}
            
            <button onClick={() => setSimItems([...simItems, { id: Date.now(), nome: '', valor: '', responsavel: 'ambos' }])} style={{ width: '100%', padding: '12px', marginTop: '12px', background: 'transparent', border: '1px dashed var(--accent)', color: 'var(--accent)', borderRadius: '12px', fontWeight: 'bold' }}>+ Adicionar Item</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setSimuladorAberto(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 'bold' }}>Cancelar</button>
            <button onClick={handleSalvarPlano} disabled={isProcessando || !simTitulo} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold' }}>{idEdicao ? 'Atualizar Roteiro' : 'Salvar Roteiro'}</button>
          </div>
        </div>
      )}

      {/* LISTA DE SAÍDAS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {saidas.sort((a:any, b:any) => (a.status === 'concluido' ? 1 : -1)).map((saida: any) => (
          <div key={saida.id} style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: `1px solid ${saida.status === 'concluido' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: saida.status === 'concluido' ? 0.7 : 1 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem' }}>{saida.titulo}</h4>
                {saida.status === 'planejado' && (
                  <button onClick={() => abrirEdicao(saida)} style={{ background: 'none', border: 'none', color: 'var(--accent)', padding: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>{saida.data} • {saida.status === 'concluido' ? '✅ Concluído' : '⏳ Aguardando'}</span>
              
              {saida.status === 'planejado' && (
                <button onClick={() => prepararConclusao(saida)} style={{ marginTop: '10px', width: '100%', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>Concluir Passeio</button>
              )}
            </div>
            <div style={{ textAlign: 'right', minWidth: '90px' }}>
              <div style={{ color: 'var(--text-h)', fontWeight: 'bold' }}>{formatMoney(saida.estimado)}</div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6 }}>{saida.status === 'concluido' ? 'Real' : 'Previsto'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CONCLUSÃO MOBILE-FIRST */}
      {modalConcluir && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="animate-slide-up" style={{ background: 'var(--bg)', width: '100%', maxWidth: '500px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '30px 24px 50px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {passoConclusao === 'pergunta' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '50px', height: '5px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
                <h3 style={{ margin: '0 0 10px 0' }}>Fim do passeio! 🍕</h3>
                <p style={{ color: 'var(--text)', marginBottom: '30px' }}>O valor final foi os <strong>{formatMoney(modalConcluir.estimado)}</strong> planejados?</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={() => processarFim(true)} style={{ padding: '18px', borderRadius: '16px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem' }}>Sim, foi esse valor!</button>
                  <button onClick={() => setPassoConclusao('ajuste')} style={{ padding: '18px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '1rem' }}>Não, o valor mudou</button>
                  <button onClick={fecharModal} style={{ marginTop: '10px', color: 'var(--text)', background: 'none', border: 'none' }}>Ainda não acabou</button>
                </div>
              </div>
            )}

            {passoConclusao === 'ajuste' && (
              <div>
                <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Ajustar Gasto Real</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)' }}>QUEM PAGOU?</label>
                    <select value={quemPagouReal} onChange={e => setQuemPagouReal(e.target.value)} style={{ width: '100%', padding: '14px', marginTop: '5px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }}>
                      <option value="ambos">Dividimos a conta</option>
                      <option value={parceiro1}>{parceiro1} pagou tudo</option>
                      <option value={parceiro2}>{parceiro2} pagou tudo</option>
                    </select>
                  </div>

                  {quemPagouReal === 'ambos' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem' }}>Pago por {parceiro1}</label>
                        <input type="number" value={valorP1Real} onChange={e => setValorP1Real(e.target.value)} placeholder="R$ 0,00" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem' }}>Pago por {parceiro2}</label>
                        <input type="number" value={valorP2Real} onChange={e => setValorP2Real(e.target.value)} placeholder="R$ 0,00" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>VALOR TOTAL FINAL</label>
                      <input type="number" value={valorRealFinal} onChange={e => setValorRealFinal(e.target.value)} style={{ width: '100%', padding: '14px', marginTop: '5px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '1.2rem', fontWeight: 'bold' }} />
                    </div>
                  )}

                  <button onClick={() => processarFim(false)} disabled={isProcessando} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', marginTop: '10px' }}>Confirmar Fechamento</button>
                  <button onClick={() => setPassoConclusao('pergunta')} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text)' }}>Voltar</button>
                </div>
              </div>
            )}

            {passoConclusao === 'sobra' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '10px' }}>💰</div>
                <h2 style={{ color: '#10b981' }}>{formatMoney(sobraDetectada)} de folga!</h2>
                <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '24px', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'left' }}>
                   "{mensagemIA}"
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={investirSobra} style={{ padding: '18px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold' }}>Investir agora na Meta</button>
                  <button onClick={fecharModal} style={{ padding: '18px', borderRadius: '16px', background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>Deixar no saldo</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};