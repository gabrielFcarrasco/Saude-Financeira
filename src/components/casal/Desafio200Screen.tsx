import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const Desafio200Screen = ({ 
  setActiveView, casalId, desafioP1, desafioP2,
  parceiro1, parceiro2, corP1, corP2, currentUserRole, meuNome, formatMoney, icons, metas 
}: any) => {
  const [valorSelecionado, setValorSelecionado] = useState<number | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

  // Lógica focada no usuário atual
  const isP1 = currentUserRole === 'p1';
  const listaChecks = isP1 ? desafioP1 : desafioP2;
  const minhaCor = isP1 ? corP1 : corP2;
  
  // Resumo do parceiro para gamificação
  const listaParceiro = isP1 ? desafioP2 : desafioP1;
  const nomeParceiro = isP1 ? parceiro2 : parceiro1;
  const corParceiro = isP1 ? corP2 : corP1;

  const totalAcumulado = listaChecks.reduce((a: number, b: number) => a + b, 0);
  const progresso = ((listaChecks.length / 200) * 100).toFixed(1);
  const numeros = Array.from({ length: 200 }, (_, i) => i + 1);

  const handleCliqueQuadrado = async (num: number) => {
    if (!casalId || isProcessando) return;

    if (listaChecks.includes(num)) {
      try {
        setIsProcessando(true);
        const novaLista = listaChecks.filter((n: number) => n !== num);
        const docRef = doc(db, 'casais', casalId, 'desafio200', 'progresso');
        await setDoc(docRef, { [currentUserRole]: novaLista }, { merge: true });
      } catch (error) {
        console.error("Erro ao desmarcar:", error);
      } finally {
        setIsProcessando(false);
      }
    } else {
      setValorSelecionado(num);
    }
  };

  const confirmarDeposito = async (metaId: string) => {
    if (!valorSelecionado || !casalId || isProcessando) return;

    try {
      setIsProcessando(true);
      const novaLista = [...listaChecks, valorSelecionado];
      const docRefDesafio = doc(db, 'casais', casalId, 'desafio200', 'progresso');
      await setDoc(docRefDesafio, { [currentUserRole]: novaLista }, { merge: true });

      const metaEscolhida = metas.find((m: any) => m.id === metaId);
      if (metaEscolhida) {
        const metaRef = doc(db, 'casais', casalId, 'metas', metaId);
        const novoAporte = {
          id: Date.now().toString(),
          data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          valor: valorSelecionado,
          descricao: `Acelerador (${meuNome})` 
        };

        await updateDoc(metaRef, {
          atual: metaEscolhida.atual + valorSelecionado,
          historico: [novoAporte, ...(metaEscolhida.historico || [])]
        });
      }

      setValorSelecionado(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setIsProcessando(false);
    }
  };

  return (
    <>
      {/* ✨ MODAL DE DESTINO DO DINHEIRO (Solto no topo do DOM) */}
      {valorSelecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }}>
          <div className="animate-slide-up" style={{ background: 'var(--bg)', width: '100%', maxWidth: '500px', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px 60px', textAlign: 'center', maxHeight: '85vh', overflowY: 'auto' }}>
            
            <div style={{ width: 64, height: 64, background: 'var(--code-bg)', color: minhaCor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: `2px solid ${minhaCor}`, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              {icons.trophy || '🏆'}
            </div>
            
            <h2 style={{ color: 'var(--text-h)', margin: '0 0 8px 0' }}>Guardar {formatMoney(valorSelecionado)}</h2>
            <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.9rem' }}>Para qual sonho do Mapa vai esse valor?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {metas.map((m: any) => (
                <button 
                  key={m.id}
                  onClick={() => confirmarDeposito(m.id)}
                  disabled={isProcessando}
                  style={{ padding: '20px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', color: 'var(--text-h)', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                >
                  {m.titulo} 
                  <span style={{ color: minhaCor, fontSize: '0.9rem' }}>Confirmar</span>
                </button>
              ))}
              
              {metas.length === 0 && (
                <p style={{ color: 'var(--text)', fontSize: '0.85rem', padding: '20px', border: '1px dashed var(--border)', borderRadius: '12px' }}>Vocês precisam cadastrar uma meta primeiro.</p>
              )}

              <button 
                onClick={() => setValorSelecionado(null)}
                disabled={isProcessando}
                style={{ marginTop: '12px', padding: '16px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hub-fintech-container animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.4rem' }}>Acelerador</h2>
        </div>

        {/* PAINEL DO PARCEIRO (COMPETIÇÃO) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--code-bg)', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border)', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Progresso de {nomeParceiro}</span>
          <span style={{ color: corParceiro, fontWeight: 'bold', fontSize: '1.1rem' }}>{formatMoney(listaParceiro.reduce((a:number,b:number)=>a+b,0))}</span>
        </div>

        {/* SEU PAINEL PRINCIPAL */}
        <div className="hub-balance-card" style={{ padding: '32px 24px', background: 'var(--code-bg)', marginBottom: '32px', borderRadius: '28px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ color: 'var(--text)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Seu Guardado ({meuNome})</span>
              <h2 style={{ color: minhaCor, margin: '4px 0 0 0', fontSize: '2.2rem', letterSpacing: '-1px' }}>{formatMoney(totalAcumulado)}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--text)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Progresso</span>
              <h3 style={{ color: 'var(--text-h)', margin: '4px 0 0 0', fontSize: '1.8rem' }}>{progresso}%</h3>
            </div>
          </div>
        </div>

        {/* ✨ A GRADE: CSS de maxHeight e overflowY foram removidos para rolar a tela toda */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: '10px', opacity: isProcessando ? 0.5 : 1, pointerEvents: isProcessando ? 'none' : 'auto' }}>
          {numeros.map(n => {
            const marcado = listaChecks.includes(n);
            return (
              <div 
                key={n}
                onClick={() => handleCliqueQuadrado(n)}
                style={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', border: '1px solid var(--border)',
                  background: marcado ? minhaCor : 'var(--code-bg)',
                  color: marcado ? '#fff' : 'var(--text)',
                  boxShadow: marcado ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                {marcado ? (icons.checkBold || '✓') : n}
              </div>
            );
          })}
        </div>

        {/* ✨ ESPAÇADOR FÍSICO (Para o menu inferior não engolir os números 194-200) */}
        <div className="scroll-spacer"></div>
      </div>
    </>
  );
};