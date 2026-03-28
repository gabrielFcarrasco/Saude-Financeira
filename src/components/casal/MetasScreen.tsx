import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const MetasScreen = ({ 
  setActiveView, casalId, metas, formatMoney, icons, totalCofre 
}: any) => {
  const [metaSelecionada, setMetaSelecionada] = useState<any | null>(null);
  const [criandoMeta, setCriandoMeta] = useState(false);
  const [isProcessando, setIsProcessando] = useState(false);

  // Form de Novo Sonho
  const [novaMetaTitulo, setNovaMetaTitulo] = useState('');
  const [novaMetaAlvo, setNovaMetaAlvo] = useState('');

  // Mantém a meta selecionada sempre atualizada com os dados do Firebase
  useEffect(() => {
    if (metaSelecionada) {
      const metaAtualizada = metas.find((m: any) => m.id === metaSelecionada.id);
      if (metaAtualizada) {
        setMetaSelecionada(metaAtualizada);
      } else {
        // Se a meta foi deletada do banco, fecha a tela de detalhes
        setMetaSelecionada(null);
      }
    }
  }, [metas, metaSelecionada?.id]);

  const handleSalvarMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casalId || !novaMetaTitulo || !novaMetaAlvo) return;

    try {
      setIsProcessando(true);
      
      // Salva direto na coleção de metas do casal no Firestore
      await addDoc(collection(db, 'casais', casalId, 'metas'), {
        titulo: novaMetaTitulo,
        alvo: Number(novaMetaAlvo),
        atual: 0,
        historico: [], // Array vazio para receber os futuros aportes
        createdAt: serverTimestamp()
      });

      setCriandoMeta(false);
      setNovaMetaTitulo(''); 
      setNovaMetaAlvo('');
    } catch (error) {
      console.error("Erro ao criar o sonho:", error);
      alert("Houve um erro ao salvar seu objetivo. Tente novamente.");
    } finally {
      setIsProcessando(false);
    }
  };

  // --- VISÃO 1: DETALHES DO SONHO (HISTÓRICO INDIVIDUAL) ---
  if (metaSelecionada) {
    const percConcluido = Math.min((metaSelecionada.atual / metaSelecionada.alvo) * 100, 100);

    return (
      <div className="hub-fintech-container animate-fade-in">
        <button className="btn-voltar" onClick={() => setMetaSelecionada(null)}>
          {icons.voltar} Voltar para o Mapa
        </button>

        <div className="hub-balance-card" style={{ textAlign: 'left', alignItems: 'flex-start', borderStyle: 'solid', padding: '32px' }}>
          <span className="hub-balance-label">Nosso Sonho</span>
          <h2 style={{ color: 'var(--text-h)', margin: '0 0 24px 0', fontSize: '2rem' }}>{metaSelecionada.titulo}</h2>
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatMoney(metaSelecionada.atual)} guardados</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>Faltam: {formatMoney(metaSelecionada.alvo - metaSelecionada.atual)}</span>
          </div>
          
          <div style={{ width: '100%', height: '12px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ 
              width: `${percConcluido}%`, 
              height: '100%', 
              background: 'var(--accent)',
              transition: 'width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}></div>
          </div>
          <div style={{ width: '100%', textAlign: 'left', marginTop: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{percConcluido.toFixed(1)}% alcançado</span>
          </div>
        </div>

        <h3 style={{ color: 'var(--text-h)', marginBottom: '16px' }}>Passos que já demos</h3>
        <div className="extrato-container">
          {metaSelecionada.historico && metaSelecionada.historico.length > 0 ? (
            metaSelecionada.historico.map((h: any) => (
              <div key={h.id} className="extrato-item" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="extrato-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginLeft: '12px' }}>
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
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '12px' }}>
              <p style={{ margin: 0, color: 'var(--text)' }}>Ainda não registramos nenhum valor para este sonho.</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text)' }}>Use o Acelerador ou guarde a sobra do Lazer para começar.</p>
            </div>
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
        <h2 style={{ color: 'var(--text-h)', margin: 0, fontSize: '2.5rem' }}>{formatMoney(totalCofre)}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {metas.map((meta: any) => {
          const perc = Math.min((meta.atual / meta.alvo) * 100, 100);
          return (
            <div 
              key={meta.id} 
              onClick={() => setMetaSelecionada(meta)}
              style={{ 
                padding: '24px', 
                background: 'var(--code-bg)',
                borderRadius: '16px',
                border: '1px solid var(--border)', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.2rem' }}>{meta.titulo}</h3>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>Já temos para ele</span>
                <h2 style={{ margin: '4px 0', color: 'var(--accent)' }}>{formatMoney(meta.atual)}</h2>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px', marginTop: 'auto' }}>
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
          onClick={() => setCriandoMeta(true)}
          style={{ 
            padding: '24px', 
            borderRadius: '16px',
            border: '2px dashed var(--border)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'transparent',
            minHeight: '220px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.02)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ color: 'var(--accent)', marginBottom: '16px', transform: 'scale(1.5)' }}>{icons.metas}</div>
          <span style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '1.1rem' }}>Traçar Novo Sonho</span>
        </div>
      </div>

      {/* Modal de Criação */}
      {criandoMeta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%' }}>
            
            <div style={{ width: 64, height: 64, background: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {icons.metas}
            </div>

            <h3 style={{ color: 'var(--text-h)', margin: '0 0 24px 0', textAlign: 'center' }}>Qual o próximo marco?</h3>
            
            <form onSubmit={handleSalvarMeta} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-h)' }}>Título do Sonho</label>
                <input 
                  type="text" 
                  value={novaMetaTitulo} 
                  onChange={e => setNovaMetaTitulo(e.target.value)} 
                  required 
                  placeholder="Ex: Nossa Casa, Viagem para..." 
                  style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none', fontSize: '1rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-h)' }}>Quanto precisamos juntar?</label>
                <input 
                  type="number" 
                  value={novaMetaAlvo} 
                  onChange={e => setNovaMetaAlvo(e.target.value)} 
                  required 
                  placeholder="R$ 0,00" 
                  style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none', fontSize: '1rem' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setCriandoMeta(false)} disabled={isProcessando} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isProcessando} style={{ flex: 1, padding: '14px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isProcessando ? 'Salvando...' : 'Traçar Sonho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};