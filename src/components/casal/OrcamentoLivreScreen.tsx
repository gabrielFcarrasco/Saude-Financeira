import React from 'react';

export const OrcamentoLivreScreen = ({ 
  setActiveView, saidas, setSaidas, limiteMensalLazer, setLimiteMensalLazer, 
  editandoLimite, setEditandoLimite, novoLimiteInput, setNovoLimiteInput, 
  simuladorAberto, setSimuladorAberto, simTitulo, setSimTitulo, simData, 
  setSimData, simItems, setSimItems, initialSimItems, modalConcluir, 
  setModalConcluir, valorReal, setValorReal, quemPagou, setQuemPagou, 
  sobraDetectada, setSobraDetectada, despesasRapidas, setDespesasRapidas, 
  metas, setMetas, parceiro1, parceiro2, formatMoney, icons 
}: any) => {
  
  const gastoEPlanejado = saidas.reduce((acc: number, curr: any) => acc + curr.estimado, 0);
  const restanteLazer = limiteMensalLazer - gastoEPlanejado;
  const porcentagemUso = Math.min((gastoEPlanejado / limiteMensalLazer) * 100, 100);
  const totalSimulacao = simItems.reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0);

  // Processa o fechamento de um evento e gera a "mágica da sobra"
  const processarConclusao = () => {
    if (!modalConcluir) return;
    const gastoReal = Number(valorReal);
    const diferenca = modalConcluir.estimado - gastoReal;

    setSaidas(saidas.map((s: any) => 
      s.id === modalConcluir.id ? { ...s, status: 'concluido', estimado: gastoReal } : s
    ));

    setDespesasRapidas([{ 
      id: Date.now(), 
      desc: modalConcluir.titulo, 
      pagoPor: quemPagou, 
      valor: gastoReal, 
      data: 'Hoje' 
    }, ...despesasRapidas]);

    if (diferenca > 0) setSobraDetectada(diferenca);
    else setModalConcluir(null);
  };

  const investirSobra = () => {
    // Investe na primeira meta (geralmente Fundo do Noivado)
    setMetas(metas.map((m: any, index: number) => 
      index === 0 ? { ...m, atual: m.atual + sobraDetectada } : m
    ));
    setModalConcluir(null); 
    setSobraDetectada(0);
  };

  return (
    <div className="hub-fintech-container animate-fade-in">
      {/* HEADER DA TELA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ margin: 0 }}>
          {icons.voltar} Voltar
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Orçamento Livre</h2>
          <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Dinheiro para aproveitar o hoje</span>
        </div>
      </div>

      {/* CARD DE STATUS DO LIMITE */}
      <div className="hub-balance-card" style={{ padding: '32px' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
          <div style={{ textAlign: 'left' }}>
            <span className="hub-balance-label" style={{ fontSize: '0.8rem' }}>Teto Mensal</span>
            {editandoLimite ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="number" 
                  value={novoLimiteInput} 
                  onChange={e => setNovoLimiteInput(e.target.value)} 
                  style={{ width: '120px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '8px', borderRadius: '8px' }} 
                />
                <button className="primary" onClick={() => { setLimiteMensalLazer(Number(novoLimiteInput)); setEditandoLimite(false); }} style={{ padding: '8px 16px' }}>Salvar</button>
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
        <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ width: `${porcentagemUso}%`, height: '100%', background: porcentagemUso > 90 ? '#ef4444' : 'var(--accent)', transition: 'width 0.5s ease' }}></div>
        </div>
        <div style={{ width: '100%', textAlign: 'left' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{porcentagemUso.toFixed(0)}% do limite utilizado este mês</span>
        </div>
      </div>

      {/* SEÇÃO EXPLICATIVA (HELP) */}
      <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px dashed var(--accent)', padding: '16px', borderRadius: '16px', fontSize: '0.9rem', color: 'var(--text)', lineHeight: '1.5' }}>
        💡 <strong>Como funciona?</strong> Planeje suas saídas aqui. Se você gastar menos que o planejado, a "inteligência" do app sugere enviar a sobra direto para o <strong>Acelerador de Metas</strong>.
      </div>

      {/* MODAL DE CONCLUSÃO / SOBRA */}
      {modalConcluir && (
        <div className="simulator-box animate-fade-in" style={{ borderColor: '#10b981', borderStyle: 'solid', background: 'rgba(16, 185, 129, 0.02)' }}>
          {sobraDetectada === 0 ? (
            <>
              <h4 style={{ color: '#10b981', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icons.check} Concluir Evento: {modalConcluir.titulo}
              </h4>
              <div className="simulator-row">
                <span>Valor gasto real:</span>
                <input type="number" value={valorReal} onChange={e => setValorReal(e.target.value)} style={{ width: '120px', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }} />
              </div>
              <div className="simulator-row">
                <span>Quem pagou?</span>
                <select value={quemPagou} onChange={e => setQuemPagou(e.target.value)} style={{ width: '120px', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-h)' }}>
                  <option value={parceiro1}>{parceiro1}</option>
                  <option value={parceiro2}>{parceiro2}</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => setModalConcluir(null)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '12px' }}>Cancelar</button>
                <button onClick={processarConclusao} style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Finalizar Gasto</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>💰</div>
              <h3 style={{ color: 'var(--text-h)', margin: '0 0 8px 0' }}>Sobra detectada: {formatMoney(sobraDetectada)}</h3>
              <p style={{ color: 'var(--text)', marginBottom: '24px' }}>Parabéns! Vocês economizaram nesse rolê. Querem enviar essa sobra para acelerar o <strong>Fundo do Noivado</strong>?</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setModalConcluir(null); setSobraDetectada(0); }} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '12px' }}>Manter no Caixa</button>
                <button onClick={investirSobra} style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Sim, Acelerar Meta!</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LISTA DE SAÍDAS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <h3 style={{ color: 'var(--text-h)', margin: 0 }}>Planejamento de Saídas</h3>
        <button className="primary" onClick={() => setSimuladorAberto(!simuladorAberto)} style={{ padding: '10px 20px' }}>
          {simuladorAberto ? 'Fechar' : '+ Novo Plano'}
        </button>
      </div>

      <div className="extrato-lista">
        {saidas.map((saida: any) => (
          <div key={saida.id} className={`extrato-item ${saida.status === 'concluido' ? 'entrada' : ''}`} style={{ background: 'var(--code-bg)', padding: '20px', marginBottom: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="extrato-info">
              <span className="extrato-titulo" style={{ fontSize: '1.1rem' }}>{saida.titulo}</span>
              <span className="extrato-data">{icons.calendario} {saida.data} • {saida.status === 'concluido' ? 'Concluído' : 'Aguardando'}</span>
              
              {saida.status === 'planejado' && (
                <button 
                  onClick={() => { setModalConcluir(saida); setValorReal(saida.estimado.toString()); setSobraDetectada(0); }} 
                  style={{ alignSelf: 'flex-start', marginTop: '12px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {icons.check} Concluir e checar sobra
                </button>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="extrato-valor" style={{ color: 'var(--text-h)', fontSize: '1.2rem' }}>{formatMoney(saida.estimado)}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>estimado</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};