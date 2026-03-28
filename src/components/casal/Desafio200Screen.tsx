import React, { useState } from 'react';

export const Desafio200Screen = ({ 
  setActiveView, desafioP1, setDesafioP1, desafioP2, setDesafioP2, 
  parceiro1, parceiro2, formatMoney, icons, metas, setMetas 
}: any) => {
  const [perfilAtivo, setPerfilAtivo] = useState<'p1' | 'p2'>('p1');
  const [valorSelecionado, setValorSelecionado] = useState<number | null>(null);

  const isP1 = perfilAtivo === 'p1';
  const nomeAba = isP1 ? parceiro1 : parceiro2;
  const listaChecks = isP1 ? desafioP1 : desafioP2;
  const setLista = isP1 ? setDesafioP1 : setDesafioP2;

  const totalAcumulado = listaChecks.reduce((a: number, b: number) => a + b, 0);
  const progresso = ((listaChecks.length / 200) * 100).toFixed(1);

  // Criar os 200 números
  const numeros = Array.from({ length: 200 }, (_, i) => i + 1);

  const handleCliqueQuadrado = (num: number) => {
    if (listaChecks.includes(num)) {
      // Se já marcou, apenas desmarca (limpa o erro)
      setLista(listaChecks.filter((n: number) => n !== num));
    } else {
      // Se for marcar novo, abre o seletor de destino
      setValorSelecionado(num);
    }
  };

  const confirmarDeposito = (metaId: number) => {
    if (!valorSelecionado) return;

    // 1. Marca no grid do parceiro
    setLista([...listaChecks, valorSelecionado]);

    // 2. Soma o valor na meta escolhida no Mapa dos Sonhos
    setMetas(metas.map((m: any) => {
      if (m.id === metaId) {
        const novoAporte = {
          id: Date.now(),
          data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          valor: valorSelecionado,
          descricao: `Acelerador (${nomeAba})`
        };
        return {
          ...m,
          atual: m.atual + valorSelecionado,
          historico: [novoAporte, ...(m.historico || [])]
        };
      }
      return m;
    }));

    setValorSelecionado(null);
  };

  return (
    <div className="hub-fintech-container animate-fade-in">
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ margin: 0 }}>
          {icons.voltar} Voltar
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Acelerador de Metas</h2>
          <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Pequenos passos, grandes saltos</span>
        </div>
      </div>

      {/* SELETOR DE PERFIL (GABRIEL / VITÓRIA) */}
      <div style={{ display: 'flex', background: 'var(--code-bg)', padding: '4px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border)' }}>
        <button 
          onClick={() => setPerfilAtivo('p1')}
          style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: isP1 ? 'var(--bg)' : 'transparent', color: isP1 ? 'var(--accent)' : 'var(--text)', fontWeight: 'bold', transition: '0.3s' }}
        >
          {parceiro1}
        </button>
        <button 
          onClick={() => setPerfilAtivo('p2')}
          style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: !isP1 ? 'var(--bg)' : 'transparent', color: !isP1 ? '#10b981' : 'var(--text)', fontWeight: 'bold', transition: '0.3s' }}
        >
          {parceiro2}
        </button>
      </div>

      {/* PAINEL DE STATUS */}
      <div className="hub-balance-card" style={{ padding: '24px', background: 'var(--bg)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Guardado por {nomeAba}</span>
            <h2 style={{ color: isP1 ? 'var(--accent)' : '#10b981', margin: 0 }}>{formatMoney(totalAcumulado)}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Progresso</span>
            <h3 style={{ color: 'var(--text-h)', margin: 0 }}>{progresso}%</h3>
          </div>
        </div>
      </div>

      {/* GRID DOS QUADRADINHOS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', 
        gap: '8px',
        maxHeight: '400px',
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
        {numeros.map(n => {
          const marcado = listaChecks.includes(n);
          return (
            <div 
              key={n}
              onClick={() => handleCliqueQuadrado(n)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: '0.2s',
                border: '1px solid var(--border)',
                background: marcado ? (isP1 ? 'var(--accent)' : '#10b981') : 'var(--code-bg)',
                color: marcado ? '#fff' : 'var(--text)',
                boxShadow: marcado ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {marcado ? icons.checkBold : n}
            </div>
          );
        })}
      </div>

      {/* MODAL: DESTINO DO DINHEIRO */}
      {valorSelecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💰</div>
            <h2 style={{ color: 'var(--text-h)', margin: '0 0 8px 0' }}>Guardar {formatMoney(valorSelecionado)}</h2>
            <p style={{ color: 'var(--text)', marginBottom: '24px' }}>Para qual sonho do seu Mapa vai esse valor?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {metas.map((m: any) => (
                <button 
                  key={m.id}
                  onClick={() => confirmarDeposito(m.id)}
                  style={{ padding: '16px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-h)', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                >
                  {m.titulo} <span>{icons.voltar}</span>
                </button>
              ))}
              <button 
                onClick={() => setValorSelecionado(null)}
                style={{ marginTop: '12px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};