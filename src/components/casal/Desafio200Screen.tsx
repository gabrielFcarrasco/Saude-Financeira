import React, { useState } from 'react';

export const Desafio200Screen = ({ 
  setActiveView, parceiro1, parceiro2, formatMoney, icons,
  desafioP1, setDesafioP1, desafioP2, setDesafioP2
}: any) => {
  // Controle de quem está logado/visualizando
  const [activeProfile, setActiveProfile] = useState<'p1' | 'p2'>('p1');
  
  // Array de 1 a 200
  const arr200 = Array.from({ length: 200 }, (_, i) => i + 1);

  // Variáveis dinâmicas dependendo de qual aba está aberta
  const isP1 = activeProfile === 'p1';
  const nomeAtivo = isP1 ? parceiro1 : parceiro2;
  const arrayAtivo = isP1 ? desafioP1 : desafioP2;
  const setArrayAtivo = isP1 ? setDesafioP1 : setDesafioP2;
  const colorClass = isP1 ? 'p1' : 'p2';

  const totalGuardado = arrayAtivo.reduce((acc: number, val: number) => acc + val, 0);
  const progresso = ((arrayAtivo.length / 200) * 100).toFixed(1);

  // Função para marcar/desmarcar o quadradinho
  const toggleSquare = (valor: number) => {
    if (arrayAtivo.includes(valor)) {
      setArrayAtivo(arrayAtivo.filter((v: number) => v !== valor)); // Desmarca
    } else {
      setArrayAtivo([...arrayAtivo, valor]); // Marca
    }
  };

  return (
    <div className="animate-fade-in card">
      <button className="btn-voltar" onClick={() => setActiveView('hub')}>{icons.voltar} Voltar ao Painel</button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{ color: 'var(--accent)' }}>{icons.trophy}</div>
        <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Desafio dos 200</h2>
      </div>
      <p style={{ color: 'var(--text)', marginBottom: '24px' }}>Complete a cartela e acumule R$ 20.100,00 por pessoa.</p>

      {/* SIMULADOR DE LOGIN (ABAS) */}
      <div className="desafio-header">
        <button className={`btn-profile-toggle ${isP1 ? 'active' : ''}`} onClick={() => setActiveProfile('p1')}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)' }} />
          Painel do {parceiro1}
        </button>
        <button className={`btn-profile-toggle ${!isP1 ? 'active' : ''}`} onClick={() => setActiveProfile('p2')}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
          Painel da {parceiro2}
        </button>
      </div>

      <div className="desafio-stats" style={{ borderColor: isP1 ? 'var(--accent)' : '#10b981' }}>
        <div>
          <span style={{ display: 'block', color: 'var(--text)', fontSize: '0.9rem' }}>Progresso de {nomeAtivo}</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--text-h)' }}>{arrayAtivo.length} / 200 ({progresso}%)</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'block', color: 'var(--text)', fontSize: '0.9rem' }}>Acumulado</span>
          <strong style={{ fontSize: '1.5rem', color: isP1 ? 'var(--accent)' : '#10b981' }}>{formatMoney(totalGuardado)}</strong>
        </div>
      </div>

      <h4 style={{ color: 'var(--text-h)', marginBottom: '16px' }}>Selecione o depósito realizado:</h4>
      
      <div className="grid-200">
        {arr200.map(num => {
          const isChecked = arrayAtivo.includes(num);
          return (
            <div 
              key={num} 
              className={`box-200 ${isChecked ? `checked ${colorClass}` : ''}`}
              onClick={() => toggleSquare(num)}
            >
              {isChecked ? icons.checkBold : num}
            </div>
          );
        })}
      </div>
    </div>
  );
};