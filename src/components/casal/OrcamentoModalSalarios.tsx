import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const OrcamentoModalSalarios = ({
  editandoLimite, setEditandoLimite, casalId, parceiro1, parceiro2, corP1, corP2, formatMoney
}: any) => {
  const [rendaP1, setRendaP1] = useState('');
  const [rendaP2, setRendaP2] = useState('');
  const [tetoLazer, setTetoLazer] = useState(''); 
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (editandoLimite && casalId) {
      const buscarRendas = async () => {
        const docSnap = await getDoc(doc(db, 'casais', casalId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.rendaP1) setRendaP1(data.rendaP1.toString());
          if (data.rendaP2) setRendaP2(data.rendaP2.toString());
          
          if (data.limiteLazer) {
            setTetoLazer(data.limiteLazer.toString());
          } else if (data.percLazer && data.rendaP1 && data.rendaP2) {
            const total = Number(data.rendaP1) + Number(data.rendaP2);
            setTetoLazer((total * (data.percLazer / 100)).toString());
          }
        }
      };
      buscarRendas();
    }
  }, [editandoLimite, casalId]);

  if (!editandoLimite) return null;

  // ✨ MÁSCARA BANCÁRIA
  const handleMask = (e: any, setter: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setter(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ✨ A NOVA MATEMÁTICA DA PARCERIA
  const r1 = Number(rendaP1) || 0;
  const r2 = Number(rendaP2) || 0;
  const rendaTotal = r1 + r2;
  const limiteDesejado = Number(tetoLazer) || 0;
  
  // Se existir renda declarada, faz a divisão colaborativa. Se não, divide ao meio por padrão.
  const contrP1 = rendaTotal > 0 ? (r1 / rendaTotal) * limiteDesejado : limiteDesejado / 2;
  const contrP2 = rendaTotal > 0 ? (r2 / rendaTotal) * limiteDesejado : limiteDesejado / 2;
  
  // Calcula o impacto real no bolso (é matematicamente a mesma porcentagem para os dois)
  const percEfetivo = rendaTotal > 0 ? ((limiteDesejado / rendaTotal) * 100).toFixed(1) : 0;

  const handleSalvarConfig = async () => {
    if (!casalId) return;
    try {
      setIsProcessando(true);
      await updateDoc(doc(db, 'casais', casalId), {
        rendaP1: r1,
        rendaP2: r2,
        limiteLazer: limiteDesejado,
        percLazer: Number(percEfetivo) 
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
        
        {/* ✨ TÍTULO E DESCRIÇÃO MAIS AMIGÁVEIS */}
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', textAlign: 'center' }}>Nossa Parceria</h3>
        <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5' }}>
          Definam o valor total que desejam curtir neste mês. O sistema divide suavemente de acordo com a renda de cada um, para que fique leve e confortável para os dois!
        </p>

        {/* INPUTS DE SALÁRIO COM MÁSCARA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '16px', border: `1px solid ${corP1}` }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: corP1, textTransform: 'uppercase' }}>Renda {parceiro1}</label>
            <input type="text" inputMode="numeric" value={formatMask(rendaP1)} onChange={e => handleMask(e, setRendaP1)} placeholder="0,00" style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '8px', outline: 'none' }} />
          </div>
          <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '16px', border: `1px solid ${corP2}` }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: corP2, textTransform: 'uppercase' }}>Renda {parceiro2}</label>
            <input type="text" inputMode="numeric" value={formatMask(rendaP2)} onChange={e => handleMask(e, setRendaP2)} placeholder="0,00" style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '8px', outline: 'none' }} />
          </div>
        </div>

        {/* INPUT DO VALOR TOTAL DESEJADO */}
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text)' }}>TETO DE LAZER (R$):</span>
            <input 
              type="text" 
              inputMode="numeric" 
              value={formatMask(tetoLazer)} 
              onChange={e => handleMask(e, setTetoLazer)} 
              placeholder="Ex: 600,00" 
              style={{ width: '140px', border: 'none', background: 'transparent', color: 'var(--accent)', fontSize: '1.4rem', fontWeight: 'bold', textAlign: 'right', outline: 'none' }} 
            />
          </div>
        </div>

        {/* RESULTADO DA DIVISÃO COLABORATIVA */}
        {rendaTotal > 0 && limiteDesejado > 0 && (
          <div className="animate-fade-in" style={{ background: 'rgba(138, 43, 226, 0.05)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(138, 43, 226, 0.2)', marginBottom: '32px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Orçamento Conjunto</span>
              <h2 style={{ margin: '4px 0', color: 'var(--accent)', fontSize: '2.5rem' }}>{formatMoney(limiteDesejado)}</h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>{parceiro1} transfere:</span>
                <div style={{ color: corP1, fontWeight: 'bold', fontSize: '1.1rem' }}>{formatMoney(contrP1)}</div>
              </div>
              <div style={{ width: '2px', height: '30px', background: 'var(--border)' }}></div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>{parceiro2} transfere:</span>
                <div style={{ color: corP2, fontWeight: 'bold', fontSize: '1.1rem' }}>{formatMoney(contrP2)}</div>
              </div>
            </div>

            {/* ✨ AVISO DA PORCENTAGEM MAIS AMIGÁVEL */}
            <div style={{ textAlign: 'center', background: 'var(--bg)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-h)', fontWeight: '500' }}>
                 Isso representa o mesmo esforço para os dois: apenas <strong style={{ color: 'var(--accent)' }}>{percEfetivo}%</strong> da renda de cada.
               </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setEditandoLimite(false)} disabled={isProcessando} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
          
          <button onClick={handleSalvarConfig} disabled={isProcessando || rendaTotal === 0 || limiteDesejado === 0} style={{ flex: 2, padding: '18px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (rendaTotal === 0 || limiteDesejado === 0) ? 0.5 : 1 }}>
            {isProcessando ? 'Salvando...' : 'Aplicar Orçamento'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};