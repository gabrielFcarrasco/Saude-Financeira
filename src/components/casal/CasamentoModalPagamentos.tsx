import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const CasamentoModalPagamentos = ({
  pagamentosAberto, setPagamentosAberto, casalId, fornecedores, formatMoney
}: any) => {

  const [isProcessando, setIsProcessando] = useState(false);

  if (!pagamentosAberto) return null;

  const fornecedoresFechados = fornecedores.filter((f: any) => f.status === 'fechado');

  // Gerar parcelas automaticamente
  const gerarParcelas = async (fornecedor: any, numParcelas: number) => {
    if (!casalId || numParcelas <= 0) return;
    setIsProcessando(true);
    try {
      const valorParcela = fornecedor.valor / numParcelas;
      const novasParcelas = [];
      const dataAtual = new Date();

      for (let i = 0; i < numParcelas; i++) {
        const dataVencimento = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + i, dataAtual.getDate());
        novasParcelas.push({
          id: Date.now().toString() + i,
          numero: i + 1,
          valor: valorParcela,
          vencimento: dataVencimento.toISOString().split('T')[0],
          pago: false
        });
      }

      await updateDoc(doc(db, 'casais', casalId, 'fornecedores', fornecedor.id), {
        parcelas: novasParcelas
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  // Marcar como pago
  const alternarStatusPagamento = async (fornecedor: any, parcelaId: string, statusAtual: boolean) => {
    if (!casalId) return;
    setIsProcessando(true);
    try {
      const parcelasAtualizadas = fornecedor.parcelas.map((p: any) => 
        p.id === parcelaId ? { ...p, pago: !statusAtual, dataPagamento: !statusAtual ? new Date().toISOString() : null } : p
      );
      await updateDoc(doc(db, 'casais', casalId, 'fornecedores', fornecedor.id), {
        parcelas: parcelasAtualizadas
      });
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Cronograma de Pagamentos</h3>
          <button onClick={() => setPagamentosAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
          {fornecedoresFechados.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text)', marginTop: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--border)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              </div>
              <p>Nenhum contrato fechado ainda.</p>
              <span style={{ fontSize: '0.85rem' }}>Feche um fornecedor no Planner para gerenciar os pagamentos aqui.</span>
            </div>
          ) : (
            fornecedoresFechados.map((f: any) => {
              const valorRestante = f.valor - (f.parcelas?.filter((p:any) => p.pago).reduce((acc:any, p:any) => acc + p.valor, 0) || 0);
              
              return (
                <div key={f.id} style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>{f.nome}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Total: {formatMoney(f.valor)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Falta Pagar</span>
                      <div style={{ color: valorRestante === 0 ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem' }}>{formatMoney(valorRestante)}</div>
                    </div>
                  </div>

                  {!f.parcelas || f.parcelas.length === 0 ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text)', flex: 1 }}>Dividir em quantas vezes?</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 3, 5, 10].map(num => (
                          <button key={num} onClick={() => gerarParcelas(f, num)} disabled={isProcessando} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {num}x
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {f.parcelas.map((p: any) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '12px 16px', borderRadius: '16px', border: `1px solid ${p.pago ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`, opacity: p.pago ? 0.6 : 1, transition: '0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button onClick={() => alternarStatusPagamento(f, p.id, p.pago)} disabled={isProcessando} style={{ width: '28px', height: '28px', borderRadius: '8px', border: `2px solid ${p.pago ? '#10b981' : 'var(--border)'}`, background: p.pago ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
                              {p.pago && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </button>
                            <div>
                              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: p.pago ? '#10b981' : 'var(--text-h)' }}>Parcela {p.numero}</span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)' }}>Venc: {p.vencimento.split('-').reverse().join('/')}</span>
                            </div>
                          </div>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-h)', textDecoration: p.pago ? 'line-through' : 'none' }}>
                            {formatMoney(p.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};