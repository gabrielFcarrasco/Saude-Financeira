import React from 'react';
import { createPortal } from 'react-dom';

export const OrcamentoModalPlanner = ({
  simuladorAberto, setSimuladorAberto, isProcessando, idEdicao,
  simTitulo, setSimTitulo, simData, setSimData,
  simItems, setSimItems, simEstimado, setSimEstimado,
  parceiro1, parceiro2, corP1, corP2,
  handleSalvarPlano, handleExcluirPlano,
  simCaixinha, setSimCaixinha, caixinhasValidas, formatMoney, categoriasUnicas 
}: any) => {

  if (!simuladorAberto) return null;

  const totalSimulacao = simItems.length > 0 
    ? simItems.reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0)
    : Number(simEstimado || 0);

  const adicionarItem = () => {
    setSimItems([...simItems, { id: Date.now(), nome: '', valor: '', responsavel: 'ambos', categoria: '' }]);
  };

  const atualizarItem = (id: number, campo: string, valor: string) => {
    setSimItems(simItems.map((item: any) => item.id === id ? { ...item, [campo]: valor } : item));
  };

  const removerItem = (id: number) => {
    setSimItems(simItems.filter((item: any) => item.id !== id));
  };

  const getBtnStyle = (isActive: boolean, color: string) => ({
    flex: 1, padding: '10px 4px', borderRadius: '12px',
    border: isActive ? `1px solid ${color}` : '1px solid transparent',
    fontSize: '0.8rem', fontWeight: 'bold',
    background: isActive ? `${color}20` : 'transparent',
    color: isActive ? color : 'var(--text)',
    cursor: 'pointer', transition: '0.2s'
  });

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
        <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-h)', fontSize: '1.4rem' }}>{idEdicao ? 'Editar Passeio' : 'Novo Passeio'}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold' }}>TÍTULO DO ROLÊ</label>
            <input type="text" value={simTitulo} onChange={e => setSimTitulo(e.target.value)} placeholder='Ex: Encontro "A", Boliche...' style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold' }}>DATA</label>
              <input type="date" value={simData} onChange={e => setSimData(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold' }}>CAIXINHA</label>
              <select value={simCaixinha} onChange={e => setSimCaixinha(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem' }}>
                {caixinhasValidas.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold' }}>GASTOS DO ROLÊ</label>
            <button onClick={adicionarItem} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Gasto</button>
          </div>

          <datalist id="lista-categorias">
            {categoriasUnicas?.map((cat: string, index: number) => (
              <option key={index} value={cat} />
            ))}
          </datalist>

          {simItems.length === 0 ? (
            <div className="animate-fade-in" style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold' }}>VALOR TOTAL ESTIMADO (R$)</label>
              <input 
                type="number" 
                value={simEstimado} 
                onChange={e => setSimEstimado(e.target.value)} 
                placeholder="0,00" 
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1.2rem', fontWeight: 'bold' }} 
              />
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text)' }}>
                Se preferir detalhar cada gasto (ex: Ingresso, Pipoca), clique em <strong>+ Add Gasto</strong> acima.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {simItems.map((item: any, index: number) => (
                <div key={item.id} className="animate-fade-in" style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-h)' }}>Despesa {index + 1}</span>
                    
                    {/* ✨ LIXEIRA SEM FUNDO E BEM VISÍVEL */}
                    <button onClick={() => removerItem(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }} title="Remover Despesa">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                    
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input type="text" placeholder="Nome (Ex: Ingresso)" value={item.nome} onChange={e => atualizarItem(item.id, 'nome', e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }} />
                    <input type="number" placeholder="R$ 0,00" value={item.valor} onChange={e => atualizarItem(item.id, 'valor', e.target.value)} style={{ width: '100px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      list="lista-categorias" 
                      placeholder="Categoria (Ex: Comida)" 
                      value={item.categoria || ''} 
                      onChange={e => atualizarItem(item.id, 'categoria', e.target.value)} 
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.9rem' }} 
                    />
                    
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <button onClick={() => atualizarItem(item.id, 'responsavel', 'ambos')} style={getBtnStyle(item.responsavel === 'ambos', '#8b5cf6')}>
                        Dividido
                      </button>
                      <button onClick={() => atualizarItem(item.id, 'responsavel', 'p1')} style={getBtnStyle(item.responsavel === 'p1', corP1)}>
                        {parceiro1}
                      </button>
                      <button onClick={() => atualizarItem(item.id, 'responsavel', 'p2')} style={getBtnStyle(item.responsavel === 'p2', corP2)}>
                        {parceiro2}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--code-bg)', padding: '16px 20px', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>Total Estimado:</span>
          <span style={{ color: 'var(--accent)', fontWeight: '900', fontSize: '1.2rem' }}>{formatMoney(totalSimulacao)}</span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {idEdicao && (
            <button onClick={() => handleExcluirPlano(idEdicao)} disabled={isProcessando} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              Excluir
            </button>
          )}
          <button onClick={() => setSimuladorAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSalvarPlano} disabled={isProcessando || !simTitulo} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!simTitulo || isProcessando) ? 0.5 : 1 }}>
            {isProcessando ? 'Salvando...' : 'Salvar Rolê'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};