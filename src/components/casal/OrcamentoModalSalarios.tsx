import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const OrcamentoModalSalarios = ({
  editandoLimite, setEditandoLimite, casalId, parceiro1, parceiro2, corP1, corP2, formatMoney
}: any) => {
  const [rendaP1, setRendaP1] = useState('');
  const [rendaP2, setRendaP2] = useState('');
  const [percLazer, setPercLazer] = useState(15); 
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (editandoLimite && casalId) {
      const buscarRendas = async () => {
        const docSnap = await getDoc(doc(db, 'casais', casalId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.rendaP1) setRendaP1(data.rendaP1.toString());
          if (data.rendaP2) setRendaP2(data.rendaP2.toString());
          if (data.percLazer) setPercLazer(data.percLazer);
        }
      };
      buscarRendas();
    }
  }, [editandoLimite, casalId]);

  if (!editandoLimite) return null;

  // ✨ MÁSCARA BANCÁRIA
  const handleRendaChange = (e: any, setter: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setter(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const r1 = Number(rendaP1) || 0;
  const r2 = Number(rendaP2) || 0;
  const rendaTotal = r1 + r2;
  const limiteSugerido = rendaTotal * (percLazer / 100);
  const contrP1 = r1 * (percLazer / 100);
  const contrP2 = r2 * (percLazer / 100);

  const handleSalvarConfig = async () => {
    if (!casalId) return;
    try {
      setIsProcessando(true);
      await updateDoc(doc(db, 'casais', casalId), {
        rendaP1: r1,
        rendaP2: r2,
        percLazer: percLazer,
        limiteLazer: limiteSugerido
      });
      setEditandoLimite(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', padding: '32px 24px 60px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
        
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', textAlign: 'center' }}>Proporção Justa ⚖️</h3>
        <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5' }}>
          Quem ganha mais, contribui com um valor maior. Mas o peso no bolso ({percLazer}%) é exatamente o mesmo para os dois!
        </p>

        {/* INPUTS DE SALÁRIO COM MÁSCARA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '16px', border: `1px solid ${corP1}` }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: corP1, textTransform: 'uppercase' }}>Renda {parceiro1}</label>
            <input type="text" inputMode="numeric" value={formatMask(rendaP1)} onChange={e => handleRendaChange(e, setRendaP1)} placeholder="0,00" style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '8px', outline: 'none' }} />
          </div>
          <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '16px', border: `1px solid ${corP2}` }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: corP2, textTransform: 'uppercase' }}>Renda {parceiro2}</label>
            <input type="text" inputMode="numeric" value={formatMask(rendaP2)} onChange={e => handleRendaChange(e, setRendaP2)} placeholder="0,00" style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '8px', outline: 'none' }} />
          </div>
        </div>

        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text)' }}>DESTINAR PARA LAZER:</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{percLazer}%</span>
          </div>
          <input 
            type="range" 
            min="5" max="50" step="1" 
            value={percLazer} 
            onChange={e => setPercLazer(Number(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--accent)' }} 
          />
        </div>

        {rendaTotal > 0 && (
          <div style={{ background: 'rgba(138, 43, 226, 0.05)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(138, 43, 226, 0.2)', marginBottom: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Nova Mesada do Casal</span>
              <h2 style={{ margin: '4px 0', color: 'var(--accent)', fontSize: '2.5rem' }}>{formatMoney(limiteSugerido)}</h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>{parceiro1} paga:</span>
                <div style={{ color: corP1, fontWeight: 'bold', fontSize: '1.1rem' }}>{formatMoney(contrP1)}</div>
              </div>
              <div style={{ width: '2px', height: '30px', background: 'var(--border)' }}></div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>{parceiro2} paga:</span>
                <div style={{ color: corP2, fontWeight: 'bold', fontSize: '1.1rem' }}>{formatMoney(contrP2)}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setEditandoLimite(false)} disabled={isProcessando} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold' }}>Cancelar</button>
          <button onClick={handleSalvarConfig} disabled={isProcessando || rendaTotal === 0} style={{ flex: 2, padding: '18px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', opacity: rendaTotal === 0 ? 0.5 : 1 }}>
            {isProcessando ? 'Salvando...' : 'Aplicar Configuração'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};