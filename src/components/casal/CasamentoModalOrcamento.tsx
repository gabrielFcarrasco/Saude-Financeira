import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CATEGORIAS_PADRAO = [
  { id: 'pacote', nome: 'Pacote Completo (Espaço + Extras)', cor: '#f43f5e' },
  { id: 'espaco', nome: 'Apenas Espaço', cor: '#8b5cf6' },
  { id: 'buffet', nome: 'Alimentação', cor: '#f59e0b' },
  { id: 'assessoria', nome: 'Assessoria / Cerimonial', cor: '#14b8a6' },
  { id: 'foto', nome: 'Foto e Vídeo', cor: '#0ea5e9' },
  { id: 'musica', nome: 'Música / DJ', cor: '#ec4899' },
  { id: 'decoracao', nome: 'Decoração', cor: '#10b981' },
  { id: 'vestuario', nome: 'Vestuário / Beleza', cor: '#d946ef' },
  { id: 'outros', nome: 'Outros', cor: '#64748b' }
];

interface OrcamentoProps {
  orcamentoAberto: boolean;
  setOrcamentoAberto: (val: boolean) => void;
  casalId: string;
  tetoCasamento: number;
  categoriasPlanejado: Record<string, number>;
  formatMoney: (val: number) => string;
}

export const CasamentoModalOrcamento = ({
  orcamentoAberto, setOrcamentoAberto, casalId, tetoCasamento, categoriasPlanejado, formatMoney
}: OrcamentoProps) => {

  const [planejamento, setPlanejamento] = useState<Record<string, number>>({});
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (orcamentoAberto) {
      setPlanejamento(categoriasPlanejado || {});
    }
  }, [orcamentoAberto, categoriasPlanejado]);

  if (!orcamentoAberto) return null;

  const handleMudarValor = (catId: string, valorStr: string) => {
    const numbers = valorStr.replace(/\D/g, '');
    const valFinal = numbers ? Number((parseInt(numbers, 10) / 100).toFixed(2)) : 0;
    setPlanejamento(prev => ({ ...prev, [catId]: valFinal }));
  };

  const formatMask = (val: number) => {
    if (!val) return '';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalDistribuido = Object.values(planejamento).reduce((acc, curr) => acc + curr, 0);
  const restante = tetoCasamento - totalDistribuido;

  const handleSalvar = async () => {
    if (!casalId) return;
    setIsProcessando(true);
    try {
      await updateDoc(doc(db, 'casais', casalId), {
        casamentoCategoriasPlanejado: planejamento
      });
      setOrcamentoAberto(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Fatiar o Orçamento</h3>
          <button onClick={() => setOrcamentoAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>

        {/* MÓDULO DIDÁTICO */}
        <div style={{ background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#0ea5e9', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            Como organizar pacotes?
          </h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', lineHeight: '1.5' }}>
            Se vocês fecharam um local que já inclui comida e DJ, não tente dividir o valor exato. Coloque o valor total na categoria <strong>"Pacote Completo"</strong> e deixe as categorias de Alimentação e Música zeradas.
          </p>
        </div>

        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Ainda não distribuído</span>
              <h2 style={{ margin: 0, color: restante >= 0 ? '#10b981' : '#ef4444', fontSize: '1.6rem' }}>{formatMoney(restante)}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Teto Máximo</span>
              <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem' }}>{formatMoney(tetoCasamento)}</h4>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
          {CATEGORIAS_PADRAO.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.cor }}></div>
                <span style={{ fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.95rem' }}>{cat.nome}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--code-bg)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text)', fontSize: '0.9rem', marginRight: '4px', fontWeight: 'bold' }}>R$</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={formatMask(planejamento[cat.id] || 0)}
                  onChange={e => handleMudarValor(cat.id, e.target.value)}
                  placeholder="0,00"
                  style={{ width: '90px', background: 'transparent', border: 'none', color: 'var(--text-h)', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'right', outline: 'none' }}
                />
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSalvar} disabled={isProcessando || restante < 0} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', opacity: (restante < 0 || isProcessando) ? 0.5 : 1, flexShrink: 0 }}>
          {isProcessando ? 'Salvando...' : (restante < 0 ? 'Reajuste os valores' : 'Salvar Distribuição')}
        </button>

      </div>
    </div>,
    document.body
  );
};