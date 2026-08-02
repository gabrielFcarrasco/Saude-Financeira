import React from 'react';

const getIcon = (name: string, size: number = 20) => {
  const props = { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case 'food': return <svg {...props}><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>;
    case 'heart': return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
    case 'shopping': return <svg {...props}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
    case 'plane': return <svg {...props}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-.5-.5-2.5 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-4 4-3-1-2 2 5 5 2-2-1-3 4-4 4 6l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>;
    case 'users': return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
    case 'gamepad': return <svg {...props}><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="2"></rect></svg>;
    case 'music': return <svg {...props}><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
    case 'dollar': return <svg {...props}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
    case 'home': return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
    case 'star':
    default: return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
  }
};

const StatusCheck = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const StatusClock = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export const OrcamentoListas = ({
  saidasMesAtual, saidasHistorico, saidaExpandida, setSaidaExpandida,
  formatMoney, parceiro1, parceiro2, isProcessando,
  abrirEdicao, prepararConclusao, handleReabrirPasseio, caixinhasValidas,
  setModalCategorias
}: any) => {

  const renderBadge = (caixinhaId: string) => {
    const cx = caixinhasValidas.find((c: any) => c.id === caixinhaId) || caixinhasValidas[0];
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', padding: '6px 10px', borderRadius: '10px', background: `${cx.cor}15`, color: cx.cor, fontWeight: 'bold', letterSpacing: '0.5px', border: `1px solid ${cx.cor}30` }}>
        {getIcon(cx.icone, 14)}
        {cx.nome.toUpperCase()}
      </span>
    );
  };

  const sortedSaidasMes = [...saidasMesAtual].sort((a: any, b: any) => {
    if (a.status === 'planejado' && b.status !== 'planejado') return -1;
    if (a.status !== 'planejado' && b.status === 'planejado') return 1;
    const dateA = new Date(a.dataRaw || '1970-01-01').getTime();
    const dateB = new Date(b.dataRaw || '1970-01-01').getTime();
    return dateB - dateA;
  });

  const historicoAgrupado = saidasHistorico.reduce((acc: any, saida: any) => {
    if (!saida.dataRaw) return acc;
    const [ano, mes] = saida.dataRaw.split('-');
    const data = new Date(Number(ano), Number(mes) - 1, 1);
    const mesNomeRaw = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const mesNome = mesNomeRaw.charAt(0).toUpperCase() + mesNomeRaw.slice(1);
    
    if (!acc[mesNome]) acc[mesNome] = [];
    acc[mesNome].push(saida);
    return acc;
  }, {});

  const sortedMesesKeys = Object.keys(historicoAgrupado).sort((a, b) => {
    const dateA = new Date(historicoAgrupado[a][0].dataRaw).getTime();
    const dateB = new Date(historicoAgrupado[b][0].dataRaw).getTime();
    return dateB - dateA;
  });

  const renderItensDetalhes = (saida: any) => (
    <div className="animate-fade-in" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
      <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>O que pagamos:</p>
      
      {saida.itens && saida.itens.length > 0 ? (
        saida.itens.map((item: any, index: number) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg)', padding: '12px', borderRadius: '16px', marginBottom: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-h)' }}>{item.nome || 'Despesa'}</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>{item.valor === 0 || item.valor === "0.00" ? '--' : formatMoney(Number(item.valor))}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{fontSize: '0.75rem', color: 'var(--text)'}}>
                {item.responsavel === 'ambos' ? 'Dividido' : item.responsavel === 'p1' ? parceiro1 : parceiro2}
                <span style={{ margin: '0 6px', color: 'var(--border)' }}>•</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{item.categoria || 'Sem Categoria'}</span>
              </span>
            </div>
          </div>
        ))
      ) : (
        <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: 0 }}>Nenhum gasto detalhado neste plano.</p>
      )}

      {/* ✨ BOTÃO DE EDITAR CATEGORIAS ISOLADO */}
      {saida.itens && saida.itens.length > 0 && (
        <button onClick={(e) => { e.stopPropagation(); setModalCategorias(saida); }} style={{ width: '100%', marginTop: '8px', padding: '12px', background: 'var(--code-bg)', border: '1px dashed var(--accent)', borderRadius: '14px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Ajustar Categorias
        </button>
      )}

      {saida.status === 'planejado' ? (
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button onClick={(e) => abrirEdicao(saida, e)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg)', color: 'var(--text-h)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Editar Tudo
          </button>
          <button onClick={(e) => prepararConclusao(saida, e)} disabled={isProcessando} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            Concluir <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <StatusCheck color="#10b981" /> Passeio finalizado!
          </span>
          <button onClick={(e) => handleReabrirPasseio(saida, e)} disabled={isProcessando} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Reabrir
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Passeios do Mês</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sortedSaidasMes.map((saida: any) => {
          const isExpandido = saidaExpandida === saida.id;
          const isPendenteAntigo = saida.isPendenciaPassada; 
          return (
            <div key={saida.id} onClick={() => setSaidaExpandida(isExpandido ? null : saida.id)} style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: `1px solid ${saida.status === 'concluido' ? 'rgba(16, 185, 129, 0.3)' : (isPendenteAntigo ? '#f59e0b' : 'var(--border)')}`, cursor: 'pointer', transition: '0.2s', boxShadow: isExpandido ? '0 8px 24px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              {isPendenteAntigo && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', marginBottom: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  ⚠️ PENDÊNCIA (Ciclo Anterior)
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saida.status === 'concluido' ? <StatusCheck color="#10b981" /> : <StatusClock color={isPendenteAntigo ? '#f59e0b' : 'var(--text)'} />}
                  <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>{saida.titulo}</h4>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: saida.status === 'concluido' ? '#10b981' : 'var(--text-h)' }}>
                  {saida.estimado === 0 ? '--' : formatMoney(saida.estimado)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renderBadge(saida.caixinhaId)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500 }}>{saida.data}</span>
              </div>
              {isExpandido && renderItensDetalhes(saida)}
            </div>
          );
        })}
      </div>

      {sortedMesesKeys.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '40px' }}>
          <h3 style={{ margin: '0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Nosso Histórico</h3>
          {sortedMesesKeys.map(mesNome => (
            <div key={mesNome}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>{mesNome}</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {historicoAgrupado[mesNome]
                  .sort((a: any, b: any) => new Date(b.dataRaw).getTime() - new Date(a.dataRaw).getTime())
                  .map((saida: any) => {
                    const isExpandido = saidaExpandida === saida.id;
                    return (
                      <div key={saida.id} onClick={() => setSaidaExpandida(isExpandido ? null : saida.id)} style={{ background: 'var(--bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StatusCheck color="#10b981" />
                            <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.05rem' }}>{saida.titulo}</h4>
                          </div>
                          <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1.1rem' }}>
                            {formatMoney(saida.estimado)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {renderBadge(saida.caixinhaId)}
                          <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500 }}>{saida.data}</span>
                        </div>
                        {isExpandido && renderItensDetalhes(saida)}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};