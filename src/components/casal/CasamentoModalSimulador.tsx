import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const CasamentoModalSimulador = ({
  simuladorAberto, setSimuladorAberto, formatMoney, tetoAtual, valorComprometidoAtual, convidadosAtuais
}: any) => {

  const [simTeto, setSimTeto] = useState('');
  const [simConvidados, setSimConvidados] = useState('');
  const [simGastosExtras, setSimGastosExtras] = useState('');
  const [simReducaoCustos, setSimReducaoCustos] = useState('');

  useEffect(() => {
    if (simuladorAberto) {
      setSimTeto(tetoAtual ? tetoAtual.toString() : '0');
      setSimConvidados(convidadosAtuais ? convidadosAtuais.toString() : '0');
      setSimGastosExtras('');
      setSimReducaoCustos('');
    }
  }, [simuladorAberto, tetoAtual, convidadosAtuais]);

  if (!simuladorAberto) return null;

  const handleMask = (e: any, setter: any) => {
    const numbers = e.target.value.replace(/\D/g, '');
    setter(numbers ? (parseInt(numbers, 10) / 100).toFixed(2) : '');
  };

  const formatMask = (val: string | number) => {
    if (!val) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- MATEMÁTICA DA SIMULAÇÃO ---
  const tetoSimulado = Number(simTeto || 0);
  const qtdConvidadosSimulada = Number(simConvidados || 0);
  const extrasSimulados = Number(simGastosExtras || 0);
  const economiaSimulada = Number(simReducaoCustos || 0);

  const novoComprometido = Math.max(0, valorComprometidoAtual + extrasSimulados - economiaSimulada);
  const disponivelSimulado = tetoSimulado - novoComprometido;

  const custoPorPessoaReal = convidadosAtuais > 0 ? valorComprometidoAtual / convidadosAtuais : 0;
  const custoPorPessoaSimulado = qtdConvidadosSimulada > 0 ? novoComprometido / qtdConvidadosSimulada : 0;

  const variacaoCustoPessoa = custoPorPessoaReal > 0 
    ? ((custoPorPessoaSimulado - custoPorPessoaReal) / custoPorPessoaReal) * 100 
    : 0;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-9 5 18 3-10 4 3h4"></path></svg>
              Simulador "E se...?"
            </h3>
          </div>
          <button onClick={() => setSimuladorAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>

        {/* MÓDULO DIDÁTICO */}
        <div style={{ background: 'rgba(138, 43, 226, 0.05)', border: '1px solid rgba(138, 43, 226, 0.2)', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Ambiente Seguro (Sandbox)
          </h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', lineHeight: '1.5' }}>
            Fiquem tranquilos, o que acontece aqui, fica aqui. Nenhum número digitado nesta tela vai alterar os orçamentos ou configurações reais do seu aplicativo. Usem este espaço para prever o impacto financeiro caso decidam convidar mais pessoas ou fechar contratos mais caros.
          </p>
        </div>

        {/* INPUTS DE SIMULAÇÃO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Simular Novo Teto</label>
              <input type="text" inputMode="numeric" value={formatMask(simTeto)} onChange={e => handleMask(e, setSimTeto)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Simular + Convidados</label>
              <input type="number" value={simConvidados} onChange={e => setSimConvidados(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Se eu gastar MAIS (R$)</label>
              <input type="text" inputMode="numeric" value={formatMask(simGastosExtras)} onChange={e => handleMask(e, setSimGastosExtras)} placeholder="Ex: Chopp Extra" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'var(--bg)', color: '#ef4444', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Se eu economizar (R$)</label>
              <input type="text" inputMode="numeric" value={formatMask(simReducaoCustos)} onChange={e => handleMask(e, setSimReducaoCustos)} placeholder="Ex: Tirar Cabine de Fotos" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'var(--bg)', color: '#10b981', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* RESULTADOS DA SIMULAÇÃO (HUD) */}
        <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-h)', fontSize: '1rem' }}>Impacto Projetado</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
             <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Novo Custo Total</span>
             <span style={{ display: 'block', fontSize: '1.2rem', color: 'var(--text-h)', fontWeight: 'bold', marginTop: '4px' }}>{formatMoney(novoComprometido)}</span>
             {novoComprometido !== valorComprometidoAtual && (
                <span style={{ fontSize: '0.75rem', color: novoComprometido > valorComprometidoAtual ? '#ef4444' : '#10b981' }}>
                  {novoComprometido > valorComprometidoAtual ? '+' : '-'}{formatMoney(Math.abs(novoComprometido - valorComprometidoAtual))} do real
                </span>
             )}
          </div>
          
          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: `1px solid ${disponivelSimulado < 0 ? '#ef4444' : 'var(--border)'}` }}>
             <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Novo Saldo Disponível</span>
             <span style={{ display: 'block', fontSize: '1.2rem', color: disponivelSimulado < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold', marginTop: '4px' }}>{formatMoney(disponivelSimulado)}</span>
             {disponivelSimulado < 0 && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Orçamento Estourado!</span>
             )}
          </div>
        </div>

        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Custo por Convidado Simulado</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.6rem', color: 'var(--accent)', fontWeight: '900' }}>{formatMoney(custoPorPessoaSimulado)}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Custo Real Atual</span>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-h)', fontWeight: 'bold' }}>{formatMoney(custoPorPessoaReal)}</span>
            {variacaoCustoPessoa !== 0 && (
              <span style={{ display: 'block', fontSize: '0.75rem', color: variacaoCustoPessoa > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                {variacaoCustoPessoa > 0 ? '▲' : '▼'} {Math.abs(variacaoCustoPessoa).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        <button onClick={() => setSimuladorAberto(false)} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', flexShrink: 0 }}>
          Fechar Simulador
        </button>

      </div>
    </div>,
    document.body
  );
};