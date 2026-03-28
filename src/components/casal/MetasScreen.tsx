import React, { useState } from 'react';

export const MetasScreen = ({ 
  setActiveView, metas, setMetas, formatMoney, icons, totalCofre 
}: any) => {
  const [metaSelecionada, setMetaSelecionada] = useState<any | null>(null);
  const [criandoMeta, setCriandoMeta] = useState(false);

  // Form de Novo Sonho
  const [novaMetaTitulo, setNovaMetaTitulo] = useState('');
  const [novaMetaAlvo, setNovaMetaAlvo] = useState('');

  const handleSalvarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const nova = {
      id: Date.now(),
      titulo: novaMetaTitulo,
      alvo: Number(novaMetaAlvo),
      atual: 0,
      historico: []
    };
    setMetas([...metas, nova]);
    setCriandoMeta(false);
    setNovaMetaTitulo(''); setNovaMetaAlvo('');
  };

  // --- VISÃO 1: DETALHES DO SONHO (HISTÓRICO INDIVIDUAL) ---
  if (metaSelecionada) {
    return (
      <div className="hub-fintech-container animate-fade-in">
        <button className="btn-voltar" onClick={() => setMetaSelecionada(null)}>
          {icons.voltar} Voltar para o Mapa
        </button>

        <div className="hub-balance-card" style={{ textAlign: 'left', alignItems: 'flex-start', borderStyle: 'solid' }}>
          <span className="hub-balance-label">Nosso Sonho</span>
          <h2 style={{ color: 'var(--text-h)', margin: '0 0 16px 0' }}>{metaSelecionada.titulo}</h2>
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{formatMoney(metaSelecionada.atual)} guardados</span>
            <span style={{ color: 'var(--text)' }}>Faltam: {formatMoney(metaSelecionada.alvo - metaSelecionada.atual)}</span>
          </div>
          
          <div style={{ width: '100%', height: '12px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${Math.min((metaSelecionada.atual / metaSelecionada.alvo) * 100, 100)}%`, 
              height: '100%', 
              background: 'var(--accent)',
              transition: 'width 1s ease'
            }}></div>
          </div>
        </div>

        <h3 style={{ color: 'var(--text-h)', marginBottom: '16px' }}>Passos que já demos</h3>
        <div className="extrato-container">
          {metaSelecionada.historico && metaSelecionada.historico.length > 0 ? (
            metaSelecionada.historico.map((h: any) => (
              <div key={h.id} className="extrato-item entrada">
                <div className="extrato-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)' }}>
                  {icons.checkBold}
                </div>
                <div className="extrato-info">
                  <span className="extrato-titulo">{h.descricao}</span>
                  <span className="extrato-data">{h.data}</span>
                </div>
                <div className="extrato-valor" style={{ color: '#10b981' }}>
                  +{formatMoney(h.valor)}
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text)', padding: '20px' }}>Ainda não registramos nenhum valor para este sonho.</p>
          )}
        </div>
      </div>
    );
  }

  // --- VISÃO 2: O MAPA DOS SONHOS (GRADE PRINCIPAL) ---
  return (
    <div className="hub-fintech-container animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ margin: 0 }}>
          {icons.voltar} Voltar
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Mapa dos Sonhos</h2>
          <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Tudo o que estamos construindo juntos</span>
        </div>
      </div>

      {/* Resumo do que temos guardado no total */}
      <div className="hub-balance-card" style={{ padding: '24px', background: 'var(--bg)', marginBottom: '32px', border: '1px dashed var(--border)' }}>
        <span className="hub-balance-label">Total Guardado em Nossos Sonhos</span>
        <h2 style={{ color: 'var(--text-h)', margin: 0 }}>{formatMoney(totalCofre)}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {metas.map((meta: any) => {
          const perc = Math.min((meta.atual / meta.alvo) * 100, 100);
          return (
            <div 
              key={meta.id} 
              className="card" 
              onClick={() => setMetaSelecionada(meta)}
              style={{ 
                padding: '24px', 
                border: '1px solid var(--border)', 
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)' }}>{meta.titulo}</h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Já temos para ele</span>
                <h2 style={{ margin: '4px 0', color: 'var(--accent)' }}>{formatMoney(meta.atual)}</h2>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--code-bg)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${perc}%`, height: '100%', background: 'var(--accent)' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)' }}>
                <span>{perc.toFixed(0)}% da conquista</span>
                <span>Onde queremos chegar: {formatMoney(meta.alvo)}</span>
              </div>
            </div>
          );
        })}

        {/* Botão de Adicionar como um Card pontilhado */}
        <div 
          className="card" 
          onClick={() => setCriandoMeta(true)}
          style={{ 
            padding: '24px', 
            border: '2px dashed var(--border)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'transparent',
            minHeight: '180px'
          }}
        >
          <div style={{ color: 'var(--accent)', marginBottom: '12px' }}>{icons.metas}</div>
          <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>Traçar Novo Sonho</span>
        </div>
      </div>

      {/* Modal de Criação (Fundo desfocado) */}
      {criandoMeta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <h3 style={{ color: 'var(--text-h)', marginBottom: '20px' }}>Qual o próximo marco?</h3>
            <form onSubmit={handleSalvarMeta}>
              <div className="form-group">
                <label>Título do Sonho (Ex: Nossa Casa)</label>
                <input type="text" value={novaMetaTitulo} onChange={e => setNovaMetaTitulo(e.target.value)} required placeholder="Qual o objetivo?" />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Quanto precisamos juntar?</label>
                <input type="number" value={novaMetaAlvo} onChange={e => setNovaMetaAlvo(e.target.value)} required placeholder="Ex: 5000" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setCriandoMeta(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px' }}>Pensar melhor</button>
                <button type="submit" className="primary" style={{ flex: 1 }}>Traçar Sonho</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};