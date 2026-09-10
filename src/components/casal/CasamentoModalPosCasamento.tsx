import React from 'react';
import { createPortal } from 'react-dom';

export const CasamentoModalPosCasamento = ({
  posCasamentoAberto, setPosCasamentoAberto, formatMoney,
  tetoCasamento, valorComprometido, valorPago,
  fornecedores, convidados, tarefas, dataCasamento
}: any) => {

  if (!posCasamentoAberto) return null;

  // --- CÁLCULOS DO RELATÓRIO FINAL ---
  const fornecedoresFechados = fornecedores.filter((f: any) => f.status === 'fechado');
  
  const economiaTotal = fornecedoresFechados.reduce((acc: number, f: any) => {
    const eco = (Number(f.valorInicial) || 0) - (Number(f.valor) || 0);
    return acc + (eco > 0 ? eco : 0);
  }, 0);

  const saldoPendente = valorComprometido - valorPago;
  const economiaGeralNoTeto = tetoCasamento - valorComprometido;

  const convidadosConfirmados = convidados.filter((c: any) => c.status === 'confirmado').length;
  const custoFinalPorPessoa = convidadosConfirmados > 0 ? (valorComprometido / convidadosConfirmados) : 0;

  const tarefasConcluidas = tarefas.filter((t: any) => t.status === 'concluida').length;
  const porcentagemTarefas = tarefas.length > 0 ? (tarefasConcluidas / tarefas.length) * 100 : 0;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '700px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Balanço do Casamento</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
              Data do Evento: {dataCasamento ? dataCasamento.split('-').reverse().join('/') : 'Não definida'}
            </span>
          </div>
          <button onClick={() => setPosCasamentoAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>

        {/* MÓDULO DIDÁTICO */}
        <div style={{ background: 'rgba(138, 43, 226, 0.05)', border: '1px solid rgba(138, 43, 226, 0.2)', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            O Raio-X Final
          </h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', lineHeight: '1.5' }}>
            A festa acabou, mas o planejamento financeiro precisa de um fechamento. Este relatório consolida todo o seu suor ao longo dos meses. Salve este documento em PDF para garantir que todos os fornecedores foram quitados e para visualizar o custo real do evento.
          </p>
        </div>

        <div id="relatorio-print" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* RESUMO FINANCEIRO */}
          <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Auditoria Financeira</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Teto Planejado Inicial</span>
                <span style={{ display: 'block', fontSize: '1.2rem', color: 'var(--text-h)', fontWeight: 'bold' }}>{formatMoney(tetoCasamento)}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Custo Real do Evento</span>
                <span style={{ display: 'block', fontSize: '1.2rem', color: '#10b981', fontWeight: 'bold' }}>{formatMoney(valorComprometido)}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Já Pago</span>
                <span style={{ display: 'block', fontSize: '1.2rem', color: 'var(--text-h)', fontWeight: 'bold' }}>{formatMoney(valorPago)}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Saldo Pendente a Pagar</span>
                <span style={{ display: 'block', fontSize: '1.2rem', color: saldoPendente > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{formatMoney(saldoPendente)}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', background: 'var(--bg)', padding: '16px', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 'bold' }}>Economia em Negociações Diretas:</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>{formatMoney(economiaTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 'bold' }}>Saldo do Teto Não Utilizado:</span>
                <span style={{ color: economiaGeralNoTeto >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{formatMoney(economiaGeralNoTeto)}</span>
              </div>
            </div>
          </div>

          {/* DADOS DO EVENTO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1rem' }}>Impacto por Pessoa</h4>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Presente (Confirmados)</span>
              <span style={{ display: 'block', fontSize: '1.5rem', color: 'var(--accent)', fontWeight: '900', marginBottom: '12px' }}>{convidadosConfirmados}</span>
              
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Custo Real por Pessoa</span>
              <span style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-h)', fontWeight: 'bold' }}>{formatMoney(custoFinalPorPessoa)}</span>
            </div>

            <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1rem' }}>Métricas de Esforço</h4>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Fornecedores Envolvidos</span>
              <span style={{ display: 'block', fontSize: '1.5rem', color: 'var(--text-h)', fontWeight: '900', marginBottom: '12px' }}>{fornecedoresFechados.length}</span>
              
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 'bold' }}>Tarefas Concluídas</span>
              <span style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-h)', fontWeight: 'bold' }}>{tarefasConcluidas} de {tarefas.length} ({porcentagemTarefas.toFixed(0)}%)</span>
            </div>
          </div>

          {saldoPendente > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '1rem' }}>Atenção Pós-Festa</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-h)', lineHeight: '1.5' }}>
                Atenção: o sistema identificou que vocês ainda possuem <strong>{formatMoney(saldoPendente)}</strong> em contratos pendentes. Verifiquem o módulo de "Pagamentos" para quitar as últimas parcelas e fechar todas as obrigações com seus fornecedores.
              </p>
            </div>
          )}
        </div>

        <button onClick={() => window.print()} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '24px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Exportar PDF / Imprimir Relatório
        </button>

      </div>
    </div>,
    document.body
  );
};