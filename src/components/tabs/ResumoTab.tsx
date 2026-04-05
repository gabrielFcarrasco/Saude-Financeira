import React, { useState, useMemo } from 'react';
import { auth } from '../../services/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface ResumoTabProps {
  transacoes: any[];
  dividas: any[];
  metas?: any[]; // Apenas para leitura das conquistas
  abrirModalLancamento: () => void;
}

export const ResumoTab: React.FC<ResumoTabProps> = ({ transacoes, dividas, metas = [], abrirModalLancamento }) => {
  const [conquistaSelecionada, setConquistaSelecionada] = useState<any | null>(null);
  const [verTodasConquistas, setVerTodasConquistas] = useState(false);

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const user = auth.currentUser;
  const primeiroNome = user?.displayName?.split(' ')[0] || 'Investidor';
  
  const horaAtual = new Date().getHours();
  const saudacao = horaAtual >= 5 && horaAtual < 12 ? 'Bom dia' : horaAtual >= 12 && horaAtual < 18 ? 'Boa tarde' : 'Boa noite';

  // ==========================================
  // 1. FILTRO DE MÊS ATUAL (Apenas este mês e ano)
  // ==========================================
  const transacoesMesAtual = useMemo(() => {
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    return transacoes.filter(t => {
      const dataT = new Date(t.data);
      return dataT.getMonth() === mes && dataT.getFullYear() === ano;
    });
  }, [transacoes]);

  // ==========================================
  // 2. MATEMÁTICA FINANCEIRA BLINDADA (Math.abs resolve o bug do --)
  // ==========================================
  const totalReceitas = transacoesMesAtual
    .filter(t => t.tipo === 'receita')
    .reduce((a, b) => a + Math.abs(b.valor), 0);

  const totalDespesas = transacoesMesAtual
    .filter(t => t.tipo === 'despesa')
    .reduce((a, b) => a + Math.abs(b.valor), 0);

  const saldo = totalReceitas - totalDespesas;
  
  const totalInvestido = transacoesMesAtual.filter(t => t.categoria === 'Investimentos').reduce((a, b) => a + Math.abs(b.valor), 0);
  const totalPagoEmDividas = transacoesMesAtual.filter(t => t.categoria === 'Dívidas').reduce((a, b) => a + Math.abs(b.valor), 0);

  const dadosGraficoResumo = [
    { name: 'Entradas', valor: totalReceitas, fill: '#10b981' },
    { name: 'Saídas', valor: totalDespesas, fill: '#ef4444' }
  ];

  // Lógica Auxiliar para Conquistas
  const categoriasEssenciais = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Contas', 'Essenciais'];
  const categoriasLazer = ['Lazer', 'Compras', 'Cuidados', 'Assinaturas', 'Viagem'];
  const temEssencial = transacoes.some(t => t.tipo === 'despesa' && categoriasEssenciais.includes(t.categoria));
  const temLazer = transacoes.some(t => t.tipo === 'despesa' && categoriasLazer.includes(t.categoria));
  const temInvestimento = transacoes.some(t => t.categoria === 'Investimentos');

  // ==========================================
  // 🏆 SISTEMA DE CONQUISTAS COMPLETO (Sua versão original restaurada)
  // ==========================================
  const conquistasDinamicas = [
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

  // ==========================================
  // VIEW: TELA CHEIA DE CONQUISTAS (Solicitado)
  // ==========================================
  if (verTodasConquistas) {
    return (
      <div className="animate-fade-in" style={{ padding: '20px', minHeight: '85vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
           <button 
            onClick={() => setVerTodasConquistas(false)}
            style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            ← Voltar
          </button>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Suas Conquistas</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {conquistasDinamicas.map(c => (
            <div 
              key={c.id} 
              onClick={() => setConquistaSelecionada(c)}
              className="card"
              style={{ padding: '30px', textAlign: 'center', cursor: 'pointer', opacity: c.unlocked ? 1 : 0.5, border: c.unlocked ? `1px solid ${c.corIcone}80` : '1px solid var(--border)', transition: '0.3s' }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: c.unlocked ? c.corFundo : 'var(--bg)', color: c.unlocked ? c.corIcone : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                {c.icone}
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--text-h)' }}>{c.titulo}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.4' }}>{c.descCurta}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: DASHBOARD PRINCIPAL
  // ==========================================
  return (
    <>
      <div className="animate-fade-in">
        <div className="page-header" style={{ marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', letterSpacing: '-1px' }}>
              {saudacao}, <span className="text-accent">{primeiroNome}</span>.
            </h1>
            <p style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem' }}>
              Ecossistema em <span style={{ color: 'var(--text-h)', fontWeight: 'bold' }}>{new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())}</span>.
            </p>
          </div>
          <button className="primary" onClick={abrirModalLancamento} style={{ padding: '14px 24px' }}>
            + Nova Movimentação
          </button>
        </div>
        
        {/* WIDGET DE CONQUISTAS RESUMIDO NO DASHBOARD */}
        <div className="card" style={{ marginBottom: '32px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0 }}>Progresso de Conquistas</h4>
            <button onClick={() => setVerTodasConquistas(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 'bold', cursor: 'pointer' }}>
              Ver todas →
            </button>
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
                  opacity: b.unlocked ? 1 : 0.5, transition: '0.2s'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: b.unlocked ? b.corFundo : 'var(--bg)', color: b.unlocked ? b.corIcone : 'var(--text)' }}>
                  {b.icone}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', color: 'var(--text-h)' }}>{b.titulo}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* MÉTRICAS DO MÊS ATUAL */}
        <div className="metric-grid" style={{ marginBottom: '32px' }}>
          <div className="metric-card" style={{ borderLeft: '4px solid #10b981' }}>
            <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Entradas do Mês</p>
            <h2 style={{ color: '#10b981' }}>{formatarMoeda(totalReceitas)}</h2>
          </div>
          <div className="metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Saídas do Mês</p>
            <h2 style={{ color: '#ef4444' }}>{formatarMoeda(totalDespesas)}</h2>
          </div>
          <div className="metric-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Saldo Mensal</p>
            <h2>{formatarMoeda(saldo)}</h2>
          </div>
        </div>

        {/* GRÁFICO MELHORADO VISUALMENTE */}
        <div className="card" style={{ padding: '24px', background: 'var(--social-bg)' }}>
          <h4 style={{ marginBottom: '24px' }}>Fluxo de Caixa Mensal</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGraficoResumo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text)' }} dy={10} />
                <YAxis hide />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px' }}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="valor">
                   {dadosGraficoResumo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} radius={[10, 10, 0, 0]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DA CONQUISTA (Mantido Original) */}
      {conquistaSelecionada && (
        <div className="modal-overlay" onClick={() => setConquistaSelecionada(null)} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '32px', borderRadius: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: conquistaSelecionada.unlocked ? conquistaSelecionada.corFundo : 'var(--code-bg)', color: conquistaSelecionada.unlocked ? conquistaSelecionada.corIcone : 'var(--text)' }}>
              {conquistaSelecionada.icone}
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--text-h)' }}>{conquistaSelecionada.titulo}</h2>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: conquistaSelecionada.unlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: conquistaSelecionada.unlocked ? '#10b981' : 'var(--text)' }}>
                {conquistaSelecionada.unlocked ? '✨ Desbloqueada' : '🔒 Bloqueada'}
              </span>
            </div>
            <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {conquistaSelecionada.unlocked ? conquistaSelecionada.mensagemParabens : conquistaSelecionada.comoDesbloquear}
              </p>
            </div>
            <button className="primary" onClick={() => setConquistaSelecionada(null)} style={{ width: '100%', marginTop: '24px', padding: '12px', borderRadius: '12px' }}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
};