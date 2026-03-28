import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const Desafio200Screen = ({ 
  setActiveView, casalId, desafioP1, desafioP2, // Importante: recebendo o casalId
  parceiro1, parceiro2, formatMoney, icons, metas 
}: any) => {
  const [perfilAtivo, setPerfilAtivo] = useState<'p1' | 'p2'>('p1');
  const [valorSelecionado, setValorSelecionado] = useState<number | null>(null);
  const [isProcessando, setIsProcessando] = useState(false); // Trava o botão enquanto salva

  const isP1 = perfilAtivo === 'p1';
  const nomeAba = isP1 ? parceiro1 : parceiro2;
  const listaChecks = isP1 ? desafioP1 : desafioP2;
  const campoBanco = isP1 ? 'p1' : 'p2'; // Qual campo atualizar no Firestore

  const totalAcumulado = listaChecks.reduce((a: number, b: number) => a + b, 0);
  const progresso = ((listaChecks.length / 200) * 100).toFixed(1);

  // Criar os 200 números
  const numeros = Array.from({ length: 200 }, (_, i) => i + 1);

  // Função Assíncrona para marcar/desmarcar
  const handleCliqueQuadrado = async (num: number) => {
    if (!casalId || isProcessando) return;

    if (listaChecks.includes(num)) {
      // Se já marcou, desmarca e salva direto no Firebase
      try {
        setIsProcessando(true);
        const novaLista = listaChecks.filter((n: number) => n !== num);
        
        // setDoc com merge: true cria o documento se não existir e atualiza só o campo necessário
        const docRef = doc(db, 'casais', casalId, 'desafio200', 'progresso');
        await setDoc(docRef, {
          [campoBanco]: novaLista
        }, { merge: true });
        
      } catch (error) {
        console.error("Erro ao desmarcar:", error);
        alert("Erro ao remover o valor. Tente novamente.");
      } finally {
        setIsProcessando(false);
      }
    } else {
      // Se for marcar novo, abre o seletor de destino
      setValorSelecionado(num);
    }
  };

  // Confirma o depósito e distribui os dados no banco
  const confirmarDeposito = async (metaId: string) => {
    if (!valorSelecionado || !casalId || isProcessando) return;

    try {
      setIsProcessando(true);

      // 1. Marca o número no grid do parceiro no Firebase
      const novaLista = [...listaChecks, valorSelecionado];
      const docRefDesafio = doc(db, 'casais', casalId, 'desafio200', 'progresso');
      await setDoc(docRefDesafio, {
        [campoBanco]: novaLista
      }, { merge: true });

      // 2. Soma o valor na meta escolhida no Mapa dos Sonhos
      const metaEscolhida = metas.find((m: any) => m.id === metaId);
      
      if (metaEscolhida) {
        const metaRef = doc(db, 'casais', casalId, 'metas', metaId);
        
        const novoAporte = {
          id: Date.now().toString(),
          data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          valor: valorSelecionado,
          descricao: `Acelerador (${nomeAba})`
        };

        await updateDoc(metaRef, {
          atual: metaEscolhida.atual + valorSelecionado,
          // Junta o aporte novo com o histórico antigo
          historico: [novoAporte, ...(metaEscolhida.historico || [])]
        });
      }

      // Fecha o modal após salvar com sucesso
      setValorSelecionado(null);
      
    } catch (error) {
      console.error("Erro ao salvar o progresso:", error);
      alert("Erro ao guardar o dinheiro. Verifique sua conexão.");
    } finally {
      setIsProcessando(false);
    }
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
        paddingRight: '8px',
        opacity: isProcessando ? 0.5 : 1, // Feedback visual de carregamento
        pointerEvents: isProcessando ? 'none' : 'auto'
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
          <div className="onboarding-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '32px' }}>
            
            <div style={{ width: 64, height: 64, background: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {icons.trophy}
            </div>
            
            <h2 style={{ color: 'var(--text-h)', margin: '0 0 8px 0' }}>Guardar {formatMoney(valorSelecionado)}</h2>
            <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.9rem' }}>Para qual sonho do seu Mapa vai esse valor?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {metas.map((m: any) => (
                <button 
                  key={m.id}
                  onClick={() => confirmarDeposito(m.id)}
                  disabled={isProcessando}
                  style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-h)', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isProcessando ? 0.7 : 1 }}
                >
                  {m.titulo} 
                  <span style={{ color: 'var(--accent)' }}>Adicionar</span>
                </button>
              ))}
              
              {metas.length === 0 && (
                <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Você precisa cadastrar uma meta primeiro.</p>
              )}

              <button 
                onClick={() => setValorSelecionado(null)}
                disabled={isProcessando}
                style={{ marginTop: '12px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontWeight: 'bold' }}
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