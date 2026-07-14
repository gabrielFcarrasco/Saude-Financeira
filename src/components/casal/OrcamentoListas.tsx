import React from 'react';

export const OrcamentoListas = ({
  saidasMesAtual, saidasHistorico, saidaExpandida, setSaidaExpandida,
  formatMoney, parceiro1, parceiro2, isProcessando,
  abrirEdicao, prepararConclusao, handleReabrirPasseio, caixinhasValidas
}: any) => {

  const renderBadge = (caixinhaId: string) => {
    const cx = caixinhasValidas.find((c: any) => c.id === caixinhaId) || caixinhasValidas[0];
    return <span style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '8px', background: `${cx.cor}20`, color: cx.cor, fontWeight: 'bold', letterSpacing: '0.5px' }}>{cx.nome.toUpperCase()}</span>;
  };

  return (
    <>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Passeios do Mês</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {saidasMesAtual.map((saida: any) => {
          const isExpandido = saidaExpandida === saida.id;
          return (
            <div key={saida.id} onClick={() => setSaidaExpandida(isExpandido ? null : saida.id)} style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: `1px solid ${saida.status === 'concluido' ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'}`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {saida.status === 'concluido' ? '✅' : '⏳'} {saida.titulo}
                  </h4>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: saida.status === 'concluido' ? '#10b981' : 'var(--text-h)' }}>
                  {formatMoney(saida.estimado)}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renderBadge(saida.caixinhaId)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{saida.data}</span>
              </div>

              {isExpandido && (
                <div className="animate-fade-in" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>O que pagamos:</p>
                  {saida.itens && saida.itens.length > 0 ? (
                    saida.itens.map((item: any, index: number) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-h)' }}>
                        <span>• {item.nome || 'Item'} <span style={{fontSize: '0.7rem', color: 'var(--text)'}}>({item.responsavel === 'ambos' ? 'Dividido' : item.responsavel === 'p1' ? parceiro1 : parceiro2})</span></span>
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

      {saidasHistorico.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>Histórico Antigo</h3>
          {saidasHistorico.map((saida: any) => (
            <div key={saida.id} style={{ background: 'var(--bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.05rem' }}>{saida.titulo}</h4>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1.1rem' }}>
                  {formatMoney(saida.estimado)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renderBadge(saida.caixinhaId)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{saida.data}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};