import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const OrcamentoLivreScreen = ({ 
  setActiveView, casalId, saidas, limiteMensalLazer, 
  editandoLimite, setEditandoLimite, novoLimiteInput, setNovoLimiteInput, 
  simuladorAberto, setSimuladorAberto, simTitulo, setSimTitulo, simData, 
  setSimData, simItems, setSimItems, initialSimItems, modalConcluir, 
  setModalConcluir, valorReal, setValorReal, quemPagou, setQuemPagou, 
  sobraDetectada, setSobraDetectada, metas, parceiro1, parceiro2, formatMoney, icons 
}: any) => {
  
  const [isProcessando, setIsProcessando] = useState(false);
  
  // Novos estados para divisão de contas
  const [valorP1, setValorP1] = useState('');
  const [valorP2, setValorP2] = useState('');

  // Cálculos baseados no banco de dados
  const gastoEPlanejado = saidas.reduce((acc: number, curr: any) => acc + Number(curr.estimado || 0), 0);
  const restanteLazer = limiteMensalLazer - gastoEPlanejado;
  const porcentagemUso = Math.min((gastoEPlanejado / limiteMensalLazer) * 100, 100);
  const totalSimulacao = simItems.reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0);

  // ==========================================
  // FUNÇÕES DO FIREBASE
  // ==========================================

  const handleSalvarLimite = async () => {
    if (!casalId || !novoLimiteInput) return;
    try {
      setIsProcessando(true);
      await updateDoc(doc(db, 'casais', casalId), {
        limiteLazer: Number(novoLimiteInput)
      });
      setEditandoLimite(false);
    } catch (error) {
      console.error("Erro ao atualizar limite:", error);
    } finally {
      setIsProcessando(false);
    }
  };

  const handleSalvarNovoPlano = async () => {
    if (!casalId || !simTitulo || totalSimulacao <= 0) return;
    try {
      setIsProcessando(true);
      await addDoc(collection(db, 'casais', casalId, 'saidas'), {
        titulo: simTitulo,
        data: simData || 'A definir',
        estimado: totalSimulacao,
        status: 'planejado',
        itens: simItems,
        createdAt: serverTimestamp()
      });
      
      // Limpa os campos
      setSimuladorAberto(false);
      setSimTitulo('');
      setSimData('');
      setSimItems(initialSimItems);
    } catch (error) {
      console.error("Erro ao criar planejamento:", error);
    } finally {
      setIsProcessando(false);
    }
  };

  const processarConclusao = async () => {
    if (!modalConcluir || !casalId) return;
    try {
      setIsProcessando(true);
      
      // Calcula o gasto total dependendo de quem pagou
      let gastoRealTotal = 0;
      if (quemPagou === 'ambos') {
        gastoRealTotal = Number(valorP1 || 0) + Number(valorP2 || 0);
      } else {
        gastoRealTotal = Number(valorReal || 0);
      }
      
      const diferenca = modalConcluir.estimado - gastoRealTotal;

      // 1. Atualiza o status do plano para concluído
      await updateDoc(doc(db, 'casais', casalId, 'saidas', modalConcluir.id), { 
        status: 'concluido', 
        estimado: gastoRealTotal // Atualiza para o valor que realmente custou
      });

      // 2. Registra na "Balança" (Despesas Rápidas)
      if (quemPagou === 'ambos') {
        // Se ambos pagaram, cria um registro para cada um que gastou algo
        if (Number(valorP1) > 0) {
          await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), {
            desc: `${modalConcluir.titulo} (Parte ${parceiro1})`,
            pagoPor: parceiro1,
            valor: Number(valorP1),
            data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            createdAt: serverTimestamp()
          });
        }
        if (Number(valorP2) > 0) {
          await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), {
            desc: `${modalConcluir.titulo} (Parte ${parceiro2})`,
            pagoPor: parceiro2,
            valor: Number(valorP2),
            data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            createdAt: serverTimestamp()
          });
        }
      } else {
        // Se apenas um pagou tudo
        await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), {
          desc: modalConcluir.titulo,
          pagoPor: quemPagou,
          valor: gastoRealTotal,
          data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          createdAt: serverTimestamp()
        });
      }

      // 3. Lida com a "Sobra"
      if (diferenca > 0) {
        setSobraDetectada(diferenca);
      } else {
        fecharModal();
      }

    } catch (error) {
      console.error("Erro ao concluir gasto:", error);
    } finally {
      setIsProcessando(false);
    }
  };

  const investirSobra = async () => {
    if (!casalId || metas.length === 0) {
      alert("Vocês precisam ter pelo menos uma meta criada para investir a sobra.");
      fecharModal();
      return;
    }
    
    try {
      setIsProcessando(true);
      // Investe na primeira meta da lista
      const metaPrinc = metas[0];
      
      const novoAporte = {
        id: Date.now().toString(),
        data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        valor: sobraDetectada,
        descricao: `Sobra do Lazer (${modalConcluir?.titulo})`
      };

      await updateDoc(doc(db, 'casais', casalId, 'metas', metaPrinc.id), {
        atual: metaPrinc.atual + sobraDetectada,
        historico: [novoAporte, ...(metaPrinc.historico || [])]
      });

      fecharModal();
    } catch (error) {
      console.error("Erro ao investir sobra:", error);
    } finally {
      setIsProcessando(false);
    }
  };

  const fecharModal = () => {
    setModalConcluir(null);
    setSobraDetectada(0);
    setValorReal('');
    setValorP1('');
    setValorP2('');
    setQuemPagou(parceiro1);
  };

  return (
    <div className="hub-fintech-container animate-fade-in">
      {/* HEADER DA TELA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ margin: 0 }} disabled={isProcessando}>
          {icons.voltar} Voltar
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Lazer e Saídas</h2>
          <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Planejamento de momentos juntos</span>
        </div>
      </div>

      {/* CARD DE STATUS DO LIMITE */}
      <div className="hub-balance-card" style={{ padding: '32px' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
          <div style={{ textAlign: 'left' }}>
            <span className="hub-balance-label" style={{ fontSize: '0.8rem' }}>Limite Mensal</span>
            {editandoLimite ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="number" 
                  value={novoLimiteInput} 
                  onChange={e => setNovoLimiteInput(e.target.value)} 
                  style={{ width: '120px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '8px', borderRadius: '8px', outline: 'none' }} 
                />
                <button onClick={handleSalvarLimite} disabled={isProcessando} style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar</button>
              </div>
            ) : (
              <h2 style={{ color: 'var(--text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {formatMoney(limiteMensalLazer)}
                <button onClick={() => setEditandoLimite(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>{icons.edit}</button>
              </h2>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="hub-balance-label" style={{ fontSize: '0.8rem' }}>Disponível</span>
            <h2 style={{ color: restanteLazer >= 0 ? '#10b981' : '#ef4444', margin: 0 }}>{formatMoney(restanteLazer)}</h2>
          </div>
        </div>

        {/* BARRA DE PROGRESSO DO ORÇAMENTO */}
        <div style={{ width: '100%', height: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ width: `${porcentagemUso}%`, height: '100%', background: porcentagemUso > 90 ? '#ef4444' : 'var(--accent)', transition: 'width 0.5s ease' }}></div>
        </div>
        <div style={{ width: '100%', textAlign: 'left' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{porcentagemUso.toFixed(0)}% do limite planejado/utilizado</span>
        </div>
      </div>

      {/* SEÇÃO EXPLICATIVA (HELP) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ color: 'var(--accent)', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4 12H2"></path><path d="M22 12h-2"></path><path d="M19.07 4.93l-1.41 1.41"></path><path d="M6.34 17.66l-1.41 1.41"></path><path d="M19.07 19.07l-1.41-1.41"></path><path d="M6.34 6.34l-1.41 1.41"></path></svg>
        </div>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Planejem suas saídas com antecedência. Se vocês gastarem menos do que previram, a ferramenta sugerirá enviar o dinheiro que sobrou direto para as suas metas!
        </p>
      </div>

      {/* LISTA DE SAÍDAS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-h)', margin: 0 }}>Roteiro Mensal</h3>
        <button onClick={() => setSimuladorAberto(!simuladorAberto)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          {simuladorAberto ? 'Cancelar' : '+ Novo Planejamento'}
        </button>
      </div>

      {/* ÁREA DE CRIAR NOVO PLANEJAMENTO (ESTAVA FALTANDO) */}
      {simuladorAberto && (
        <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h4 style={{ color: 'var(--text-h)', marginTop: 0, marginBottom: '16px' }}>Novo Planejamento de Lazer</h4>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input type="text" placeholder="Qual é o plano? (Ex: Cinema + Jantar)" value={simTitulo} onChange={e => setSimTitulo(e.target.value)} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }} />
            <input type="text" placeholder="Data/Dia" value={simData} onChange={e => setSimData(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Estimativa de Custos</span>
            
            {simItems.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                <input type="text" value={item.nome} onChange={e => setSimItems(simItems.map((i:any) => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Item (Ex: Ingressos)" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }} />
                <input type="number" value={item.valor} onChange={e => setSimItems(simItems.map((i:any) => i.id === item.id ? { ...i, valor: e.target.value } : i))} placeholder="R$ 0,00" style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }} />
                <button onClick={() => setSimItems(simItems.filter((i:any) => i.id !== item.id))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>{icons.trash}</button>
              </div>
            ))}
            
            <button onClick={() => setSimItems([...simItems, { id: Date.now(), nome: '', valor: '' }])} style={{ width: '100%', padding: '12px', marginTop: '12px', background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer' }}>
              + Adicionar Custo
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div>
              <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Total Estimado:</span>
              <h3 style={{ color: 'var(--text-h)', margin: 0 }}>{formatMoney(totalSimulacao)}</h3>
            </div>
            <button onClick={handleSalvarNovoPlano} disabled={isProcessando || totalSimulacao <= 0} style={{ padding: '12px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Salvar Plano
            </button>
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO DA LISTA DE SAÍDAS (DO BANCO DE DADOS) */}
      <div>
        {saidas.map((saida: any) => (
          <div key={saida.id} style={{ background: 'var(--code-bg)', padding: '20px', marginBottom: '12px', borderRadius: '16px', border: `1px solid ${saida.status === 'concluido' ? '#10b981' : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: saida.status === 'concluido' ? 0.8 : 1 }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>{saida.titulo}</h4>
              <span style={{ color: 'var(--text)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {icons.calendario} {saida.data} • {saida.status === 'concluido' ? 'Concluído' : 'Aguardando'}
              </span>
              
              {saida.status === 'planejado' && (
                <button 
                  onClick={() => { setModalConcluir(saida); setValorReal(saida.estimado.toString()); setSobraDetectada(0); setQuemPagou(parceiro1); }} 
                  style={{ marginTop: '12px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
                >
                  {icons.check} Registrar Gasto e Checar Sobra
                </button>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-h)', fontSize: '1.2rem', fontWeight: 'bold' }}>{formatMoney(saida.estimado)}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
                {saida.status === 'concluido' ? 'gasto final' : 'estimado'}
              </span>
            </div>
          </div>
        ))}
        {saidas.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text)', padding: '24px', border: '1px dashed var(--border)', borderRadius: '12px' }}>Nenhum plano para este mês. Que tal criar um?</p>
        )}
      </div>

      {/* MODAL DE CONCLUSÃO / SOBRA E DIVISÃO DE QUEM PAGOU */}
      {modalConcluir && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            
            {sobraDetectada === 0 ? (
              <>
                <h3 style={{ color: 'var(--text-h)', margin: '0 0 20px 0' }}>Concluir: {modalConcluir.titulo}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-h)', fontWeight: 'bold' }}>Quem pagou os gastos desse dia?</label>
                    <select value={quemPagou} onChange={e => setQuemPagou(e.target.value)} style={{ padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)', outline: 'none' }}>
                      <option value={parceiro1}>{parceiro1} pagou tudo</option>
                      <option value={parceiro2}>{parceiro2} pagou tudo</option>
                      <option value="ambos">Nós dois (Dividimos a conta)</option>
                    </select>
                  </div>

                  {quemPagou === 'ambos' ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Gastos de {parceiro1}</label>
                        <input type="number" placeholder="R$ 0,00" value={valorP1} onChange={e => setValorP1(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)', outline: 'none' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Gastos de {parceiro2}</label>
                        <input type="number" placeholder="R$ 0,00" value={valorP2} onChange={e => setValorP2(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)', outline: 'none' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-h)', fontWeight: 'bold' }}>Qual foi o valor real gasto?</label>
                      <input type="number" value={valorReal} onChange={e => setValorReal(e.target.value)} style={{ padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)', outline: 'none' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Você havia planejado {formatMoney(modalConcluir.estimado)}.</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button onClick={fecharModal} disabled={isProcessando} style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={processarConclusao} disabled={isProcessando} style={{ flex: 1, padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Finalizar Gasto</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, background: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  {icons.trophy}
                </div>
                <h3 style={{ color: 'var(--text-h)', margin: '0 0 12px 0' }}>Sobra de {formatMoney(sobraDetectada)}</h3>
                <p style={{ color: 'var(--text)', marginBottom: '24px', lineHeight: '1.5' }}>Vocês economizaram em relação ao plano! Querem enviar essa sobra para acelerar as metas de vocês?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={investirSobra} disabled={isProcessando} style={{ padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Sim, Acelerar Metas!</button>
                  <button onClick={fecharModal} disabled={isProcessando} style={{ padding: '14px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Não, manter como folga</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};