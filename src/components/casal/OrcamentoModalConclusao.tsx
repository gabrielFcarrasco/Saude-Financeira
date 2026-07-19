import React from 'react';
import { createPortal } from 'react-dom';

export const OrcamentoModalConclusao = ({
  modalConcluir, setModalConcluir, passoConclusao, setPassoConclusao,
  quemPagouReal, setQuemPagouReal, valorP1Real, setValorP1Real, valorP2Real, setValorP2Real,
  valorRealFinal, setValorRealFinal, sobraDetectada, isProcessando,
  parceiro1, parceiro2, formatMoney, processarFim
}: any) => {

  if (!modalConcluir) return null;

  // ✨ MÁSCARA BANCÁRIA
  const handleMask = (e: any, setter: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setter(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', width: '100%', maxWidth: '500px', borderRadius: '32px 32px 0 0', padding: '32px 24px 60px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {passoConclusao === 'pergunta' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>Como foi o passeio?</h3>
            <p style={{ color: 'var(--text)', marginBottom: '32px' }}>Gastaram os <strong>{formatMoney(modalConcluir.estimado)}</strong> que planearam?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button onClick={() => processarFim(true)} disabled={isProcessando} style={{ padding: '20px', borderRadius: '18px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>Sim, certinho!</button>
              <button onClick={() => setPassoConclusao('ajuste')} disabled={isProcessando} style={{ padding: '20px', borderRadius: '18px', background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '1.1rem' }}>Não, o valor mudou</button>
              <button onClick={() => setModalConcluir(null)} disabled={isProcessando} style={{ color: 'var(--text)', background: 'none', border: 'none', marginTop: '10px', fontSize: '1rem', fontWeight: 'bold' }}>Cancelar</button>
            </div>
          </div>
        )}

        {passoConclusao === 'ajuste' && (
          <div>
            <h3 style={{ marginBottom: '24px', textAlign: 'center', color: 'var(--text-h)' }}>Ajustar Valor</h3>
            <select value={quemPagouReal} onChange={e => setQuemPagouReal(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginBottom: '16px' }}>
              <option value="ambos">Nós dois dividimos</option>
              <option value={parceiro1}>{parceiro1} pagou tudo</option>
              <option value={parceiro2}>{parceiro2} pagou tudo</option>
            </select>
            
            {quemPagouReal === 'ambos' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <input type="text" inputMode="numeric" value={formatMask(valorP1Real)} onChange={e => handleMask(e, setValorP1Real)} placeholder={`R$ ${parceiro1}`} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', textAlign: 'right', fontWeight: 'bold' }} />
                <input type="text" inputMode="numeric" value={formatMask(valorP2Real)} onChange={e => handleMask(e, setValorP2Real)} placeholder={`R$ ${parceiro2}`} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', textAlign: 'right', fontWeight: 'bold' }} />
              </div>
            ) : (
              <input type="text" inputMode="numeric" value={formatMask(valorRealFinal)} onChange={e => handleMask(e, setValorRealFinal)} placeholder="Valor total real (0,00)" style={{ width: '100%', padding: '18px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '1.3rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px' }} />
            )}
            
            <button onClick={() => processarFim(false)} disabled={isProcessando} style={{ width: '100%', padding: '20px', borderRadius: '18px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold' }}>Confirmar Valor</button>
          </div>
        )}

        {passoConclusao === 'sobra' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#10b981', margin: '0 0 12px 0' }}>Feito com sucesso!</h2>
            <button onClick={() => setModalConcluir(null)} disabled={isProcessando} style={{ padding: '20px', width: '100%', borderRadius: '18px', background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 'bold' }}>Continuar</button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};