import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../services/firebase';

export const CasamentoModalSetup = ({
  setupAberto, setSetupAberto, casalId, dataAtual, tetoAtual
}: any) => {

  const [dataCasamento, setDataCasamento] = useState('');
  const [tetoGasto, setTetoGasto] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (setupAberto) {
      setDataCasamento(dataAtual || '');
      setTetoGasto(tetoAtual ? tetoAtual.toString() : '');
    }
  }, [setupAberto, dataAtual, tetoAtual]);

  if (!setupAberto) return null;

  const handleMask = (e: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setTetoGasto(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSalvar = async () => {
    if (!casalId || !dataCasamento || !tetoGasto) return;
    setIsProcessando(true);
    try {
      await updateDoc(doc(db, 'casais', casalId), {
        casamentoData: dataCasamento,
        casamentoTeto: Number(tetoGasto)
      });
      setSetupAberto(false);
    } catch (error) {
      console.error("Erro ao salvar setup do casamento", error);
    } finally {
      setIsProcessando(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', padding: '32px 24px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--accent)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.4rem' }}>Parâmetros do Casamento</h3>
          <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Definam ou atualizem a data oficial e o teto máximo de gastos.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Quando será?</label>
            <input 
              type="date" 
              value={dataCasamento} 
              onChange={e => setDataCasamento(e.target.value)} 
              style={{ width: '100%', padding: '12px 0 0 0', border: 'none', background: 'transparent', color: 'var(--text-h)', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none' }} 
            />
          </div>

          <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Teto de Gastos (R$)</label>
            <input 
              type="text" 
              inputMode="numeric"
              value={formatMask(tetoGasto)} 
              onChange={handleMask} 
              placeholder="0,00"
              style={{ width: '100%', padding: '12px 0 0 0', border: 'none', background: 'transparent', color: 'var(--accent)', fontSize: '1.6rem', fontWeight: '900', outline: 'none' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* O BOTÃO CANCELAR AGORA FICA SEMPRE VISÍVEL! */}
          <button onClick={() => setSetupAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
            Cancelar
          </button>
          
          <button onClick={handleSalvar} disabled={isProcessando || !dataCasamento || !tetoGasto} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!dataCasamento || !tetoGasto || isProcessando) ? 0.5 : 1 }}>
            {isProcessando ? 'Salvando...' : 'Salvar Dados'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};