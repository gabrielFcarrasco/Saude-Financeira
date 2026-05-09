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
  const [simItems, setSimItems] = useState([{ id: 1, nome: '', valor: '', responsavel: 'ambos' }]);

  // Estados de Edição do Limite
  const [editandoLimite, setEditandoLimite] = useState(false);
  const [novoLimiteInput, setNovoLimiteInput] = useState(limiteMensalLazer.toString());

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

  // Lógica para saber quantos dias faltam para o próximo mês (Dia 1)
  const hoje = new Date();
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasParaRenovar = ultimoDiaMes - hoje.getDate() + 1;

  // ==========================================
  // FUNÇÕES DE AÇÃO
  // ==========================================

  const handleSalvarLimite = async () => {
    if (!casalId || !novoLimiteInput) return;
    try {
      setIsProcessando(true);
      await updateDoc(doc(db, 'casais', casalId), { limiteLazer: Number(novoLimiteInput) });
      setEditandoLimite(false);
    } catch (error) { console.error(error); }
    finally { setIsProcessando(false); }
  };

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
        dataRaw: simData,
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
    } catch (error) { console.error(error); }
    finally { setIsProcessando(false); }
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

  const processarFim = async (confirmadoIgual: boolean) => {
    if (!modalConcluir || !casalId) return;
    try {
      setIsProcessando(true);
      let valorGastoEfetivo = confirmadoIgual ? modalConcluir.estimado : Number(valorRealFinal);
      if (quemPagouReal === 'ambos' && !confirmadoIgual) {
        valorGastoEfetivo = Number(valorP1Real || 0) + Number(valorP2Real || 0);
      }

      await updateDoc(doc(db, 'casais', casalId, 'saidas', modalConcluir.id), { status: 'concluido', estimado: valorGastoEfetivo });

      if (quemPagouReal === 'ambos') {
        const v1 = confirmadoIgual ? (valorGastoEfetivo / 2) : Number(valorP1Real);
        const v2 = confirmadoIgual ? (valorGastoEfetivo / 2) : Number(valorP2Real);
        if (v1 > 0) await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { desc: `${modalConcluir.titulo} (${parceiro1})`, pagoPor: parceiro1, valor: v1, data: 'Hoje', createdAt: serverTimestamp() });
        if (v2 > 0) await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { desc: `${modalConcluir.titulo} (${parceiro2})`, pagoPor: parceiro2, valor: v2, data: 'Hoje', createdAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'casais', casalId, 'despesas_rapidas'), { desc: modalConcluir.titulo, pagoPor: quemPagouReal, valor: valorGastoEfetivo, data: 'Hoje', createdAt: serverTimestamp() });
      }

      const diferenca = modalConcluir.estimado - valorGastoEfetivo;
      if (diferenca > 0) {
        setSobraDetectada(diferenca);
        setPassoConclusao('sobra');
        setMensagemIA(`A economia de ${formatMoney(diferenca)} pode virar uma conquista maior se for para o Mapa dos Sonhos! 🚀`);
      } else {
        fecharModal();
      }
    } catch (e) { console.error(e); }
    finally { setIsProcessando(false); }
  };

  const fecharModal = () => { setModalConcluir(null); setMensagemIA(''); };

  return (
    <div className="hub-fintech-container animate-fade-in" style={{ paddingBottom: '120px' }}>
      
      {/* 1. TEXTO DIDÁTICO E CONVERSATIVO */}
      <div style={{ marginBottom: '24px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ marginBottom: '16px' }}>
          {icons.voltar} Voltar ao Hub
        </button>
        <h2 style={{ color: 'var(--text-h)', margin: '0 0 8px 0' }}>Orçamento de Lazer 🍿</h2>
        <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
          {restanteLazer > 0 
            ? `Olá! Vocês ainda têm ${formatMoney(restanteLazer)} para aproveitar o mês. Use este espaço para planejar jantares, cinema ou viagens sem comprometer o essencial.`
            : `Atenção! Vocês já comprometeram todo o orçamento de lazer deste mês. Que tal planejar algo caseiro para economizar?`}
        </p>
      </div>

      {/* 2. CARD DE LIMITE (COM EDIÇÃO E CONTAGEM REGRESSIVA) */}
      <div className="hub-balance-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.7, textTransform: 'uppercase' }}>Mesada do Casal</span>
            {editandoLimite ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input type="number" value={novoLimiteInput} onChange={e => setNovoLimiteInput(e.target.value)} style={{ width: '100px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }} />
                <button onClick={handleSalvarLimite} style={{ padding: '8px 12px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>OK</button>
              </div>
            ) : (
              <h2 style={{ margin: '4px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {formatMoney(limiteMensalLazer)}
                <button onClick={() => setEditandoLimite(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </h2>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--accent)' }}>RENOVA EM {diasParaRenovar} DIAS</span>
            <h2 style={{ margin: '4px 0', color: restanteLazer >= 0 ? '#10b981' : '#ef4444' }}>{formatMoney(restanteLazer)}</h2>
          </div>
        </div>
        <div style={{ width: '100%', height: '10px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden', marginTop: '15px' }}>
          <div style={{ width: `${porcentagemUso}%`, height: '100%', background: porcentagemUso > 90 ? '#ef4444' : 'var(--accent)', transition: 'width 1s ease' }}></div>
        </div>
      </div>

      {/* 3. DICA DO CO-PILOTO */}
      <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ fontSize: '1.5rem' }}>💡</div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.4' }}>
          <strong>Dica:</strong> Se não usarem todo o valor, tentem não "gastar por gastar". O que sobra aqui pode ser o combustível para o próximo <strong>Sonho</strong> de vocês!
        </p>
      </div>

      {/* 4. BOTÃO ADICIONAR */}
      {!simuladorAberto && (
        <button onClick={abrirNovoPlano} style={{ width: '100%', padding: '18px', borderRadius: '18px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginBottom: '32px', boxShadow: '0 6px 20px rgba(139, 92, 246, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Planejar Roteiro
        </button>
      )}

      {/* SIMULADOR / EDITOR (BOTÕES GRANDES) */}
      {simuladorAberto && (
        <div className="animate-fade-in" style={{ background: 'var(--code-bg)', border: '2px solid var(--accent)', borderRadius: '24px', padding: '24px', marginBottom: '32px' }}>
          <h4 style={{ margin: '0 0 20px 0', color: 'var(--accent)' }}>{idEdicao ? 'Ajustar Detalhes' : 'O que vamos aprontar?'}</h4>
          
          <input type="text" placeholder="Nome da Saída" value={simTitulo} onChange={e => setSimTitulo(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginBottom: '16px', fontSize: '1rem' }} />
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', marginLeft: '4px' }}>DATA PREVISTA</label>
            <input type="date" value={simData} onChange={e => setSimData(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '1rem' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-h)', fontWeight: 'bold' }}>ITENS DO CUSTO</span>
            
            {simItems.map((item: any) => (
              <div key={item.id} style={{ background: 'var(--bg)', padding: '16px', borderRadius: '16px', marginTop: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <input type="text" value={item.nome} onChange={e => setSimItems(simItems.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Combustível" style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-h)', padding: '8px' }} />
                  <input type="number" value={item.valor} onChange={e => setSimItems(simItems.map(i => i.id === item.id ? { ...i, valor: e.target.value } : i))} placeholder="R$" style={{ width: '80px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-h)', padding: '8px' }} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      {['ambos', 'p1', 'p2'].map(opt => (
                        <button key={opt} onClick={() => setSimItems(simItems.map(i => i.id === item.id ? { ...i, responsavel: opt } : i))} 
                          style={{ 
                            padding: '12px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid var(--border)',
                            background: item.responsavel === opt ? 'var(--accent)' : 'var(--code-bg)',
                            color: item.responsavel === opt ? '#fff' : 'var(--text)'
                          }}>
                          {opt === 'ambos' ? 'Nós' : opt === 'p1' ? parceiro1 : parceiro2}
                        </button>
                      ))}
                   </div>
                   <button onClick={() => setSimItems(simItems.filter(i => i.id !== item.id))} style={{ color: '#ef4444', background: 'none', border: 'none', padding: '10px' }}>✕</button>
                </div>
              </div>
            ))}
            
            <button onClick={() => setSimItems([...simItems, { id: Date.now(), nome: '', valor: '', responsavel: 'ambos' }])} style={{ width: '100%', padding: '16px', marginTop: '16px', background: 'transparent', border: '2px dashed var(--accent)', color: 'var(--accent)', borderRadius: '16px', fontWeight: 'bold' }}>+ Adicionar Gasto</button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button onClick={() => setSimuladorAberto(false)} style={{ flex: 1, padding: '18px', borderRadius: '14px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 'bold' }}>Cancelar</button>
            <button onClick={handleSalvarPlano} disabled={isProcessando} style={{ flex: 2, padding: '18px', borderRadius: '14px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold' }}>{idEdicao ? 'Salvar Alterações' : 'Confirmar Plano'}</button>
          </div>
        </div>
      )}

      {/* LISTA DE ROTEIROS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Próximos Momentos</h3>
        {saidas.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text)', padding: '40px', border: '1px dashed var(--border)', borderRadius: '20px' }}>Nenhum plano para este mês ainda. Que tal criar um jantar especial? ✨</p>}
        
        {saidas.sort((a:any, b:any) => (a.status === 'concluido' ? 1 : -1)).map((saida: any) => (
          <div key={saida.id} style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: `1px solid ${saida.status === 'concluido' ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'}`, opacity: saida.status === 'concluido' ? 0.6 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>{saida.titulo}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{saida.data} • {saida.status === 'concluido' ? '✅ Concluído' : '⏳ Planejado'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-h)', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatMoney(saida.estimado)}</div>
                {saida.status === 'planejado' && <button onClick={() => abrirEdicao(saida)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.8rem' }}>Editar</button>}
              </div>
            </div>

            {saida.status === 'planejado' && (
              <button onClick={() => { setModalConcluir(saida); setPassoConclusao('pergunta'); }} style={{ width: '100%', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '14px', fontWeight: 'bold', fontSize: '0.9rem' }}>Concluir Passeio</button>
            )}
          </div>
        ))}
      </div>

      {/* MODAL DE CONCLUSÃO (REFORMULADO) */}
      {modalConcluir && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <div className="animate-slide-up" style={{ background: 'var(--bg)', width: '100%', maxWidth: '500px', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px 60px' }}>
            
            {passoConclusao === 'pergunta' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
                <h3 style={{ margin: '0 0 12px 0' }}>Como foi o passeio? 🍕</h3>
                <p style={{ color: 'var(--text)', marginBottom: '32px' }}>Gastaram os <strong>{formatMoney(modalConcluir.estimado)}</strong> que planejaram?</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <button onClick={() => processarFim(true)} style={{ padding: '20px', borderRadius: '18px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>Sim, certinho!</button>
                  <button onClick={() => setPassoConclusao('ajuste')} style={{ padding: '20px', borderRadius: '18px', background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '1.1rem' }}>Não, o valor mudou</button>
                  <button onClick={fecharModal} style={{ color: 'var(--text)', background: 'none', border: 'none', marginTop: '10px' }}>Ainda não acabou</button>
                </div>
              </div>
            )}

            {passoConclusao === 'ajuste' && (
              <div>
                <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>Ajustar Valor Real</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)' }}>QUEM PAGOU?</label>
                    <select value={quemPagouReal} onChange={e => setQuemPagouReal(e.target.value)} style={{ width: '100%', padding: '16px', marginTop: '8px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }}>
                      <option value="ambos">Nós dois dividimos</option>
       value={parceiro1}>{parceiro1} pagou tudo</option>
                      <option value={parceiro2}>{parceiro2} pagou tudo</option>
                    </select>
                  </div>

                  {quemPagouReal === 'ambos' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={{ fontSize: '0.7rem' }}>Pago por {parceiro1}</label><input type="number" value={valorP1Real} onChange={e => setValorP1Real(e.target.value)} placeholder="R$ 0,00" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }} /></div>
                      <div><label style={{ fontSize: '0.7rem' }}>Pago por {parceiro2}</label><input type="number" value={valorP2Real} onChange={e => setValorP2Real(e.target.value)} placeholder="R$ 0,00" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }} /></div>
                    </div>
                  ) : (
                    <input type="number" value={valorRealFinal} onChange={e => setValorRealFinal(e.target.value)} placeholder="Valor total real" style={{ width: '100%', padding: '18px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '1.3rem', fontWeight: 'bold', textAlign: 'center' }} />
                  )}

                  <button onClick={() => processarFim(false)} disabled={isProcessando} style={{ width: '100%', padding: '20px', borderRadius: '18px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold' }}>Confirmar Valor</button>
                  <button onClick={() => setPassoConclusao('pergunta')} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text)' }}>Voltar</button>
                </div>
              </div>
            )}

            {passoConclusao === 'sobra' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ color: '#10b981', margin: '0 0 12px 0' }}>Sobrou {formatMoney(sobraDetectada)}!</h2>
                <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '32px', textAlign: 'left' }}>
                   <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--text-h)' }}>"{mensagemIA}"</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <button onClick={fecharModal} style={{ padding: '20px', borderRadius: '18px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold' }}>Continuar Economizando!</button>
                  <button onClick={fecharModal} style={{ padding: '20px', borderRadius: '18px', background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>Beleza, entendi</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};