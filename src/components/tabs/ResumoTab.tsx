import React, { useState } from 'react';
import { auth } from '../../services/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface ResumoTabProps {
  transacoes: any[];
  dividas: any[];
  metas?: any[]; // Apenas para leitura das conquistas (não afeta o saldo)
  abrirModalLancamento: () => void;
}

export const ResumoTab: React.FC<ResumoTabProps> = ({ transacoes, dividas, metas = [], abrirModalLancamento }) => {
  const [conquistaSelecionada, setConquistaSelecionada] = useState<any | null>(null);

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const user = auth.currentUser;
  const primeiroNome = user?.displayName?.split(' ')[0] || 'Investidor';
  
  const horaAtual = new Date().getHours();
  let saudacao = 'Olá';
  if (horaAtual >= 5 && horaAtual < 12) saudacao = 'Bom dia';
  else if (horaAtual >= 12 && horaAtual < 18) saudacao = 'Boa tarde';
  else saudacao = 'Boa noite';

  // MATEMÁTICA FINANCEIRA (Blindada, lê apenas Transações)
  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((a, b) => a + b.valor, 0);
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((a, b) => a + b.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  
  const totalInvestido = transacoes.filter(t => t.categoria === 'Investimentos').reduce((a, b) => a + b.valor, 0);
  const totalPagoEmDividas = transacoes.filter(t => t.categoria === 'Dívidas').reduce((a, b) => a + b.valor, 0);

  const dadosGraficoResumo = [
    { name: 'Entradas', valor: totalReceitas, fill: '#10b981' },
    { name: 'Saídas', valor: totalDespesas, fill: '#ef4444' }
  ];

 // Lógica Auxiliar para as Conquistas de Orçamento e Quitação
  const categoriasEssenciais = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Contas', 'Essenciais'];
  const categoriasLazer = ['Lazer', 'Compras', 'Cuidados', 'Assinaturas', 'Viagem'];
  
  const temEssencial = transacoes.some(t => t.tipo === 'despesa' && categoriasEssenciais.includes(t.categoria));
  const temLazer = transacoes.some(t => t.tipo === 'despesa' && categoriasLazer.includes(t.categoria));
  const temInvestimento = transacoes.some(t => t.categoria === 'Investimentos');

  // ==========================================
  // 🏆 SISTEMA DE CONQUISTAS (10 Níveis - Totalmente Desacoplado de Metas)
  // ==========================================
  const conquistasDinamicas = [
    // --- GERAIS / TRANSAÇÕES ---
    { 
      id: "inicio", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>, 
      titulo: 'Primeiro Passo', 
      descCurta: 'Sua primeira ação.',
      comoDesbloquear: 'Registre sua primeira movimentação financeira no aplicativo.',
      mensagemParabens: 'Parabéns! O primeiro passo é sempre o mais importante. Você assumiu o controle do seu ecossistema financeiro.',
      unlocked: transacoes.length > 0,
      corFundo: 'rgba(245, 158, 11, 0.15)',
      corIcone: '#f59e0b'
    },
    { 
      id: "mestre_controle", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>, 
      titulo: 'Mestre do Controle', 
      descCurta: 'Hábito de ouro.',
      comoDesbloquear: 'Registre pelo menos 10 movimentações no seu histórico.',
      mensagemParabens: 'Você construiu o hábito! A verdadeira inteligência financeira não está em grandes tacadas, mas na constância.',
      unlocked: transacoes.length >= 10,
      corFundo: 'rgba(16, 185, 129, 0.15)',
      corIcone: '#10b981'
    },
    { 
      id: "centuriao", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>, 
      titulo: 'Centurião', 
      descCurta: '100 registros.',
      comoDesbloquear: 'Alcance a marca de 100 transações registradas no seu histórico.',
      mensagemParabens: 'Inacreditável! Chegar a 100 registros mostra um nível de disciplina incrível. Seus dados agora formam um raio-X perfeito da sua vida financeira.',
      unlocked: transacoes.length >= 100,
      corFundo: 'rgba(236, 72, 153, 0.15)',
      corIcone: '#ec4899'
    },
    
    // --- FOCADAS NA ABA: LANÇAMENTOS ---
    { 
      id: "detetive", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>, 
      titulo: 'Detetive', 
      descCurta: 'O poder dos detalhes.',
      comoDesbloquear: 'Utilize o campo de "Subcategoria" ou "Tag" ao registrar uma movimentação.',
      mensagemParabens: 'Você entende que o diabo mora nos detalhes! Usar subcategorias permite descobrir para onde os pequenos "vazamentos" do seu dinheiro estão indo.',
      unlocked: transacoes.some(t => t.subCategoria && t.subCategoria.trim() !== ''),
      corFundo: 'rgba(99, 102, 241, 0.15)',
      corIcone: '#6366f1'
    },
    { 
      id: "o_visionario", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, 
      titulo: 'O Visionário', 
      descCurta: 'Antecipando o futuro.',
      comoDesbloquear: 'Registre uma transação com o status "Pendente" para prever um gasto.',
      mensagemParabens: 'Antecipar é governar. Registrar lançamentos como "Pendentes" ajuda a moldar o seu futuro financeiro antes mesmo que o dinheiro saia da conta.',
      unlocked: transacoes.some(t => t.status === 'pendente'),
      corFundo: 'rgba(244, 63, 94, 0.15)',
      corIcone: '#f43f5e'
    },

    // --- FOCADAS NA ABA: ORÇAMENTO ---
    { 
      id: "equilibrista", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12A10 10 0 0 0 12 2v10z"></path><path d="M12 22A10 10 0 1 1 22 12h-10z"></path></svg>, 
      titulo: 'Equilibrista', 
      descCurta: 'A regra de ouro.',
      comoDesbloquear: 'Registre movimentações abrangendo as três frentes do Orçamento: Essenciais, Lazer e Investimentos/Futuro.',
      mensagemParabens: 'A verdadeira riqueza é o equilíbrio. Você não vive só para pagar boletos e nem gasta tudo hoje. Você dividiu seus recursos entre obrigações, prazeres e construção de futuro.',
      unlocked: temEssencial && temLazer && temInvestimento,
      corFundo: 'rgba(20, 184, 166, 0.15)',
      corIcone: '#14b8a6'
    },

    // --- FOCADAS NA ABA: QUITAÇÃO ---
    { 
      id: "radar_limpo", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>, 
      titulo: 'Radar Limpo', 
      descCurta: 'Mapeou os compromissos.',
      comoDesbloquear: 'Cadastre pelo menos uma dívida ou compromisso futuro na aba "Compromissos".',
      mensagemParabens: 'Você tirou os compromissos da cabeça e os colocou no sistema. Ter clareza e ver o tamanho real do "inimigo" é a única forma de recuperar a paz mental.',
      unlocked: dividas.length > 0,
      corFundo: 'rgba(59, 130, 246, 0.15)',
      corIcone: '#3b82f6'
    },
    { 
      id: "quebrador_correntes", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>, 
      titulo: 'Quebrador de Correntes', 
      descCurta: 'Liberdade alcançada.',
      comoDesbloquear: 'Quite 100% das parcelas de uma dívida na aba de "Compromissos".',
      mensagemParabens: 'Sinta essa sensação de liberdade! Você quitou um compromisso financeiro e quebrou mais uma corrente que te impedia de investir em você.',
      unlocked: dividas.some(d => parseFloat(d.parcelasPagas || 0) >= parseFloat(d.totalParcelas || 1)),
      corFundo: 'rgba(239, 68, 68, 0.15)',
      corIcone: '#ef4444'
    },

    // --- MENTAIS / PATRIMÔNIO (Transações puras) ---
    { 
      id: "multi_renda", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>, 
      titulo: 'Fontes Múltiplas', 
      descCurta: 'Diversificando a entrada.',
      comoDesbloquear: 'Registre uma Receita que não seja "Salário" ou "Renda" (Ex: Renda Extra, Rendimentos).',
      mensagemParabens: 'Excelente visão estratégica! Depender de uma única fonte de renda é um risco. Você começou a construir novos rios para alimentar o seu patrimônio.',
      unlocked: transacoes.some(t => t.tipo === 'receita' && t.categoria !== 'Salário' && t.categoria !== 'Renda'),
      corFundo: 'rgba(234, 179, 8, 0.15)',
      corIcone: '#eab308'
    },
    { 
      id: "visao_futuro", 
      icone: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, 
      titulo: 'Visão de Futuro', 
      descCurta: 'Regra dos 20%.',
      comoDesbloquear: 'Destine pelo menos 20% das suas entradas totais para Investimentos ou Pagamento de Dívidas.',
      mensagemParabens: 'Incrível! Você não está apenas pagando contas, está construindo patrimônio e liberdade. Manter 20% da sua renda voltada para o futuro é vital.',
      unlocked: totalReceitas > 0 && ((totalPagoEmDividas + totalInvestido) / totalReceitas) >= 0.2,
      corFundo: 'rgba(139, 92, 246, 0.15)',
      corIcone: '#8B5CF6'
    },
  ];

  return (
    <>
      <div className="animate-fade-in">
        <div className="page-header" style={{ marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', letterSpacing: '-1px' }}>
              {saudacao}, <span className="text-accent">{primeiroNome}</span>.
            </h1>
            <p style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem' }}>
              Aqui está o panorama atualizado do seu ecossistema financeiro.
            </p>
          </div>
          <button className="primary" onClick={abrirModalLancamento} style={{ padding: '14px 24px' }}>
            + Nova Movimentação
          </button>
        </div>
        
        {/* SESSÃO DE CONQUISTAS */}
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0 }}>Suas Conquistas</h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>
              {conquistasDinamicas.filter(c => c.unlocked).length} de {conquistasDinamicas.length} desbloqueadas
            </span>
          </div>
          
          <div className="badges-container" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
            {conquistasDinamicas.map(b => (
              <div 
                key={b.id} 
                onClick={() => setConquistaSelecionada(b)}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  padding: '16px', minWidth: '120px', borderRadius: '16px', 
                  background: 'var(--code-bg)', cursor: 'pointer',
                  border: b.unlocked ? `1px solid ${b.corIcone}50` : '1px solid var(--border)',
                  opacity: b.unlocked ? 1 : 0.6,
                  transition: 'transform 0.2s, opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: b.unlocked ? b.corFundo : 'var(--bg)',
                  color: b.unlocked ? b.corIcone : 'var(--text)'
                }}>
                  {b.icone}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: b.unlocked ? 'var(--text-h)' : 'var(--text)' }}>
                    {b.titulo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="metric-grid" style={{ marginBottom: '32px' }}>
          <div className="metric-card"><p>Entradas</p><h2 style={{ color: '#10b981' }}>{formatarMoeda(totalReceitas)}</h2></div>
          <div className="metric-card"><p>Saídas</p><h2 style={{ color: '#ef4444' }}>{formatarMoeda(totalDespesas)}</h2></div>
          <div className="metric-card"><p>Saldo Livre</p><h2>{formatarMoeda(saldo)}</h2></div>
        </div>

        <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '16px' }}>Fluxo de Caixa</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGraficoResumo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text)" />
              <YAxis stroke="var(--text)" tickFormatter={(val) => `R$ ${val}`} />
              <RechartsTooltip formatter={(value: number) => [formatarMoeda(value), 'Total']} contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ==========================================
          MODAL DE DETALHES DA CONQUISTA
      ========================================== */}
      {conquistaSelecionada && (
        <div className="modal-overlay" onClick={() => setConquistaSelecionada(null)} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: conquistaSelecionada.unlocked ? conquistaSelecionada.corFundo : 'var(--code-bg)',
              color: conquistaSelecionada.unlocked ? conquistaSelecionada.corIcone : 'var(--text)'
            }}>
              {conquistaSelecionada.icone}
            </div>

            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--text-h)' }}>
              {conquistaSelecionada.titulo}
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <span style={{ 
                padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                background: conquistaSelecionada.unlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                color: conquistaSelecionada.unlocked ? '#10b981' : 'var(--text)'
              }}>
                {conquistaSelecionada.unlocked ? '✨ Conquista Desbloqueada' : '🔒 Conquista Bloqueada'}
              </span>
            </div>

            <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {conquistaSelecionada.unlocked ? (
                <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  {conquistaSelecionada.mensagemParabens}
                </p>
              ) : (
                <div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Missão para desbloquear:</p>
                  <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {conquistaSelecionada.comoDesbloquear}
                  </p>
                </div>
              )}
            </div>

            <button className="primary" onClick={() => setConquistaSelecionada(null)} style={{ width: '100%', marginTop: '24px', padding: '12px', borderRadius: '8px' }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};