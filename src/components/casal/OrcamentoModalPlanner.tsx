import React from 'react';
import { createPortal } from 'react-dom';

export const OrcamentoModalPlanner = ({
  simuladorAberto, setSimuladorAberto, isProcessando, idEdicao,
  simTitulo, setSimTitulo, simData, setSimData, simItems, setSimItems,
  parceiro1, parceiro2, handleSalvarPlano, handleExcluirPlano,
  simCaixinha, setSimCaixinha, caixinhasValidas, formatMoney, gastosPorCaixinha
}: any) => {
  
  if (!simuladorAberto) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', padding: '32px 24px 60px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-h)' }}>{idEdicao ? 'Ajustar Plano' : 'Novo Passeio'}</h4>
        
        <input type="text" placeholder="Nome" value={simTitulo} onChange={e => setSimTitulo(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', marginBottom: '16px', outline: 'none' }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div>
             <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold' }}>DATA</label>
             <input type="date" value={simData} onChange={e => setSimData(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', outline: 'none', marginTop: '4px' }} />
          </div>
          <div>
             <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold' }}>CAIXINHA</label>
             <select value={simCaixinha} onChange={e => setSimCaixinha(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', outline: 'none', marginTop: '4px' }}>
               {caixinhasValidas.map((c: any) => (
                 <option key={c.id} value={c.id}>{c.nome} (Sobra: {formatMoney(c.valor - (gastosPorCaixinha[c.id] || 0))})</option>
               ))}
             </select>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-h)', fontWeight: 'bold' }}>ITENS DO CUSTO</span>
          {simItems.map((item: any) => (
            <div key={item.id} style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input type="text" value={item.nome} onChange={e => setSimItems(simItems.map((i:any) => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Combustível" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', outline: 'none' }} />
                <input type="number" value={item.valor} onChange={e => setSimItems(simItems.map((i:any) => i.id === item.id ? { ...i, valor: e.target.value } : i))} placeholder="R$" style={{ width: '90px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['ambos', 'p1', 'p2'].map(opt => (
                  <button key={opt} onClick={() => setSimItems(simItems.map((i:any) => i.id === item.id ? { ...i, responsavel: opt } : i))} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '0.8rem', border: 'none', background: item.responsavel === opt ? 'var(--accent)' : 'var(--bg)', color: item.responsavel === opt ? '#fff' : 'var(--text)', fontWeight: 'bold' }}>
                    {opt === 'ambos' ? 'Dividir' : opt === 'p1' ? parceiro1 : parceiro2}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setSimItems([...simItems, { id: Date.now(), nome: '', valor: '', responsavel: 'ambos' }])} style={{ width: '100%', padding: '16px', background: 'transparent', border: '2px dashed var(--border)', color: 'var(--text)', borderRadius: '16px', fontWeight: 'bold' }}>+ Adicionar Item</button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <button onClick={() => setSimuladorAberto(false)} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold' }}>Cancelar</button>
          <button onClick={handleSalvarPlano} disabled={isProcessando} style={{ flex: 2, padding: '18px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold' }}>Salvar</button>
        </div>
        {idEdicao && <button onClick={() => handleExcluirPlano(idEdicao)} style={{ width: '100%', marginTop: '16px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold' }}>Apagar Plano</button>}
      </div>
    </div>,
    document.body
  );
};