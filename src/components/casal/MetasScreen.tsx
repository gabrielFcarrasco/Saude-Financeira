import React, { useState } from 'react';

export const MetasScreen = ({ 
  setActiveView, metas, setMetas, formatMoney, icons, totalCofre 
}: any) => {
  // Estados para o formulário de nova meta
  const [criandoMeta, setCriandoMeta] = useState(false);
  const [novaMetaTitulo, setNovaMetaTitulo] = useState('');
  const [novaMetaAlvo, setNovaMetaAlvo] = useState('');
  const [novaMetaAtual, setNovaMetaAtual] = useState('');

 const cofreSeguro = Number(totalCofre) || 0;

  // Calculamos o total alocado garantindo que cada meta tenha um número
  const totalAlocado = (metas || []).reduce((acc: number, m: any) => {
    return acc + (Number(m.atual) || 0);
  }, 0);

  const saldoLivreCofre = Math.max(cofreSeguro - totalAlocado, 0);
  const handleSalvarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMetaTitulo || !novaMetaAlvo) return;

    const novaMeta = {
      id: Date.now(),
      titulo: novaMetaTitulo,
      alvo: Number(novaMetaAlvo),
      atual: Number(novaMetaAtual || 0)
    };

    setMetas([...metas, novaMeta]);
    setCriandoMeta(false);
    setNovaMetaTitulo('');
    setNovaMetaAlvo('');
    setNovaMetaAtual('');
  };

  const removerMeta = (id: number) => {
    if (window.confirm("Deseja mesmo remover esse marco do seu mapa?")) {
      setMetas(metas.filter((m: any) => m.id !== id));
    }
  };

  return (
    <div className="hub-fintech-container animate-fade-in">
      
      {/* HEADER DA TELA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ margin: 0 }}>
          {icons.voltar} Voltar
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Mapa dos Sonhos</h2>
          <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Transformando planos em realidade</span>
        </div>
      </div>

      {/* PAINEL DE INTELIGÊNCIA (CONVERSA COM O COFRE) */}
      <div className="hub-balance-card" style={{ padding: '24px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Saldo no Cofre</span>
            <h3 style={{ color: 'var(--text-h)', margin: 0 }}>{formatMoney(totalCofre)}</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Ainda não alocado</span>
            <h3 style={{ color: '#10b981', margin: 0 }}>{formatMoney(saldoLivreCofre)}</h3>
          </div>
        </div>
        <p style={{ color: 'var(--text)', fontSize: '0.85rem', margin: '16px 0 0 0', textAlign: 'left', lineHeight: '1.4' }}>
          💡 <strong>Dica de Arquiteto:</strong> O "Saldo não alocado" é o valor no seu cofre que ainda não foi "carimbado" para uma meta específica. Use-o para acelerar seus sonhos!
        </p>
      </div>

      {/* BOTÃO ADICIONAR MARCO */}
      {!criandoMeta && (
        <button 
          className="primary" 
          onClick={() => setCriandoMeta(true)}
          style={{ width: '100%', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          {icons.metas} Adicionar Novo Marco ao Mapa
        </button>
      )}

      {/* FORMULÁRIO DE NOVA META */}
      {criandoMeta && (
        <div className="simulator-box animate-fade-in" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-h)' }}>Novo Objetivo</h3>
          <form onSubmit={handleSalvarMeta} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Nome do Sonho (Ex: Viagem para Gramado)</label>
              <input type="text" value={novaMetaTitulo} onChange={e => setNovaMetaTitulo(e.target.value)} required placeholder="Qual o objetivo?" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '12px', borderRadius: '8px' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Valor Alvo (Total)</label>
                <input type="number" value={novaMetaAlvo} onChange={e => setNovaMetaAlvo(e.target.value)} required placeholder="R$ 0,00" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '12px', borderRadius: '8px' }} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Já tenho guardado</label>
                <input type="number" value={novaMetaAtual} onChange={e => setNovaMetaAtual(e.target.value)} placeholder="R$ 0,00" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '12px', borderRadius: '8px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => setCriandoMeta(false)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '12px' }}>Cancelar</button>
              <button type="submit" className="primary" style={{ flex: 1, padding: '14px' }}>Salvar no Mapa</button>
            </div>
          </form>
        </div>
      )}

      {/* GRID DE METAS PERSONALIZADAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {metas.map((meta: any) => {
          const perc = Math.min((meta.atual / meta.alvo) * 100, 100);
          return (
            <div key={meta.id} className="card" style={{ padding: '24px', position: 'relative', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => removerMeta(meta.id)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
              >
                {icons.trash}
              </button>
              
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', paddingRight: '30px' }}>{meta.titulo}</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Progresso atual</span>
                <h2 style={{ margin: '4px 0', color: 'var(--accent)' }}>{formatMoney(meta.atual)}</h2>
              </div>

              {/* BARRA DE PROGRESSO CLEAN */}
              <div style={{ width: '100%', height: '8px', background: 'var(--code-bg)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ width: `${perc}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.8s ease' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-h)', fontWeight: 'bold' }}>{perc.toFixed(1)}%</span>
                <span style={{ color: 'var(--text)' }}>Meta: {formatMoney(meta.alvo)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {metas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📍</div>
          <p>O seu mapa está vazio. Que tal traçar o primeiro objetivo juntos?</p>
        </div>
      )}

    </div>
  );
};