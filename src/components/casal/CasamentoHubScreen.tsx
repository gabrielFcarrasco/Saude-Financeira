import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../services/firebase';

// IMPORTAÇÃO DOS MODAIS (Fases 1 a 8)
import { CasamentoModalSetup } from './CasamentoModalSetup';
import { CasamentoModalOrcamento } from './CasamentoModalOrcamento';
import { CasamentoModalConvidados } from './CasamentoModalConvidados';
import { CasamentoModalChecklist } from './CasamentoModalChecklist';
import { CasamentoModalCronograma } from './CasamentoModalCronograma';
import { CasamentoModalDocumentos } from './CasamentoModalDocumentos';
import { CasamentoModalPlanner } from './CasamentoModalPlanner';
import { CasamentoModalMesas } from './CasamentoModalMesas';
import { CasamentoModalLuaDeMel } from './CasamentoModalLuaDeMel';
import { CasamentoModalPresentes } from './CasamentoModalPresentes';
import { CasamentoModalMetas } from './CasamentoModalMetas';
import { CasamentoModalSimulador } from './CasamentoModalSimulador';
import { CasamentoModalIA } from './CasamentoModalIA';
import { CasamentoModalPagamentos } from './CasamentoModalPagamentos';
import { CasamentoModalPosCasamento } from './CasamentoModalPosCasamento';
import { CasamentoModalMuralIdeias } from './CasamentoModalMuralIdeias';

const CATEGORIAS_PADRAO = [
  { id: 'espaco', nome: 'Espaço', cor: '#8b5cf6' },
  { id: 'buffet', nome: 'Buffet', cor: '#f59e0b' },
  { id: 'foto', nome: 'Foto/Vídeo', cor: '#0ea5e9' },
  { id: 'musica', nome: 'Música', cor: '#ec4899' },
  { id: 'decoracao', nome: 'Decoração', cor: '#10b981' },
  { id: 'vestuario', nome: 'Vestuário', cor: '#f43f5e' },
  { id: 'outros', nome: 'Outros', cor: '#64748b' }
];

export const CasamentoHubScreen = ({ casalId, formatMoney }: any) => {
  
  // --- ESTADOS DE DADOS (FIRESTORE) ---
  const [dataCasamento, setDataCasamento] = useState<string | null>(null);
  const [tetoCasamento, setTetoCasamento] = useState<number>(0);
  const [categoriasPlanejado, setCategoriasPlanejado] = useState<Record<string, number>>({});
  const [valorPoupado, setValorPoupado] = useState<number>(0);
  
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [convidados, setConvidados] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [eventosCronograma, setEventosCronograma] = useState<any[]>([]);
  
  // --- CONTROLES DE INTERFACE (MODAIS) ---
  const [setupAberto, setSetupAberto] = useState(false);
  const [orcamentoAberto, setOrcamentoAberto] = useState(false);
  const [convidadosAberto, setConvidadosAberto] = useState(false);
  const [checklistAberto, setChecklistAberto] = useState(false);
  const [cronogramaAberto, setCronogramaAberto] = useState(false);
  const [documentosAberto, setDocumentosAberto] = useState(false);
  const [plannerAberto, setPlannerAberto] = useState(false);
  const [mesasAberto, setMesasAberto] = useState(false);
  const [luaDeMelAberto, setLuaDeMelAberto] = useState(false);
  const [presentesAberto, setPresentesAberto] = useState(false);
  const [metasAberto, setMetasAberto] = useState(false);
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [iaAberto, setIaAberto] = useState(false);
  const [pagamentosAberto, setPagamentosAberto] = useState(false);
  const [posCasamentoAberto, setPosCasamentoAberto] = useState(false);
  
  // NOVO ESTADO: Mural Especial
  const [muralAberto, setMuralAberto] = useState(false);
  
  const [carregando, setCarregando] = useState(true);

  // --- SINCRONIZAÇÃO EM TEMPO REAL ---
  useEffect(() => {
    if (!casalId) return;

    const unsubCasal = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDataCasamento(data.casamentoData || null);
        setTetoCasamento(data.casamentoTeto || 0);
        setCategoriasPlanejado(data.casamentoCategoriasPlanejado || {});
        setValorPoupado(data.casamentoValorPoupado || 0);
      }
    });

    const qFornecedores = query(collection(db, 'casais', casalId, 'fornecedores'));
    const unsubFornecedores = onSnapshot(qFornecedores, (snap) => setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qConvidados = query(collection(db, 'casais', casalId, 'convidados'));
    const unsubConvidados = onSnapshot(qConvidados, (snap) => setConvidados(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qTarefas = query(collection(db, 'casais', casalId, 'tarefas'));
    const unsubTarefas = onSnapshot(qTarefas, (snap) => setTarefas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qCronograma = query(collection(db, 'casais', casalId, 'cronograma'));
    const unsubCronograma = onSnapshot(qCronograma, (snap) => {
      setEventosCronograma(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCarregando(false);
    });

    return () => { unsubCasal(); unsubFornecedores(); unsubConvidados(); unsubTarefas(); unsubCronograma(); };
  }, [casalId]);

  if (carregando) return null;

  // --- MATEMÁTICAS E CÁLCULOS DO HUB ---
  let diasRestantes = 0;
  if (dataCasamento) {
    const diff = new Date(dataCasamento + 'T12:00:00').getTime() - new Date().getTime();
    diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const fornecedoresFechados = fornecedores.filter(f => f.status === 'fechado');
  const valorComprometido = fornecedoresFechados.reduce((acc, f) => acc + Number(f.valor || 0), 0);
  const valorPago = fornecedoresFechados.reduce((acc, f) => acc + (f.parcelas?.filter((p:any) => p.pago).reduce((s:any, p:any) => s + p.valor, 0) || 0), 0);
  const valorDisponivel = tetoCasamento - valorComprometido;

  const economiaTotal = fornecedoresFechados.reduce((acc, f) => {
    const eco = (Number(f.valorInicial) || 0) - (Number(f.valor) || 0);
    return acc + (eco > 0 ? eco : 0);
  }, 0);

  const convidadosPendentes = convidados.filter(c => c.status === 'pendente').length;
  const totalConvidados = convidados.length;
  const convidadosConfirmados = convidados.filter(c => c.status === 'confirmado').length;
  
  const custoBaseadoReal = totalConvidados > 0 ? (valorComprometido / totalConvidados) : 0;
  
  const hojeDate = new Date();
  const proximaSemanaDate = new Date();
  proximaSemanaDate.setDate(hojeDate.getDate() + 7);

  let parcelasAtrasadas = 0;
  let parcelasProximas: any[] = [];
  let contratosPendentes = 0;
  let contratosSemAnexo = 0;
  
  fornecedoresFechados.forEach(f => {
    if (!f.parcelas || f.parcelas.length === 0) contratosPendentes++;
    if (!f.temContratoAnexado) contratosSemAnexo++;
    if (f.parcelas) {
      f.parcelas.forEach((p: any) => {
        if (!p.pago) {
          const venc = new Date(p.vencimento + 'T12:00:00');
          if (venc < hojeDate) parcelasAtrasadas++;
          else if (venc <= proximaSemanaDate) parcelasProximas.push({ ...p, fornecedor: f.nome });
        }
      });
    }
  });

  const tarefasUrgentes = tarefas.filter(t => t.status !== 'concluida' && t.prioridade === 'Urgente').length;

  let scoreSaude = 100;
  if (tetoCasamento > 0) {
    if (valorComprometido > tetoCasamento) scoreSaude -= 40;
    else if (valorComprometido > tetoCasamento * 0.9) scoreSaude -= 15;
  }
  scoreSaude -= (parcelasAtrasadas * 10) + (contratosPendentes * 5) + (tarefasUrgentes * 5);
  scoreSaude -= (convidadosPendentes > 0 && diasRestantes < 30) ? 10 : 0;
  scoreSaude = Math.max(0, scoreSaude);

  let saudeLabel = 'Excelente'; let saudeCor = '#10b981';
  if (scoreSaude < 50) { saudeLabel = 'Crítico'; saudeCor = '#ef4444'; }
  else if (scoreSaude < 80) { saudeLabel = 'Atenção'; saudeCor = '#f59e0b'; }
  else if (scoreSaude < 95) { saudeLabel = 'Saudável'; saudeCor = '#3b82f6'; }

  return (
    <div className="hub-fintech-container animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* CABEÇALHO SUPERIOR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: 'var(--text-h)', margin: '0 0 4px 0', fontSize: '1.4rem' }}>Nosso Casamento</h2>
          {dataCasamento ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold' }}>
              {dataCasamento.split('-').reverse().join('/')} • {diasRestantes < 0 ? 'Concluído' : `Faltam ${diasRestantes} dias`}
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 'bold' }}>
              Data a definir
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setIaAberto(true)} style={{ background: 'rgba(138, 43, 226, 0.1)', border: '1px solid rgba(138, 43, 226, 0.2)', padding: '10px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', transition: '0.2s', boxShadow: '0 2px 10px rgba(138,43,226,0.15)' }} title="Assessor IA">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 2.5 1.5 4 3 5.5s1 2.5 1 3.5h2c0-1 .5-2 1-3.5s3-3 3-5.5a5 5 0 0 0-5-5z"/></svg>
          </button>
          <button onClick={() => setSetupAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-h)', transition: '0.2s' }} title="Configurações Base">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
        </div>
      </div>

      {/* NOVO BLOCO: MURAL ESPECIAL EM DESTAQUE NO TOPO */}
      <button 
        onClick={() => setMuralAberto(true)} 
        className="animate-fade-in"
        style={{ 
          width: '100%', 
          background: 'linear-gradient(135deg, #ff7eb3 0%, #ff758c 100%)', 
          border: 'none', 
          padding: '24px', 
          borderRadius: '24px', 
          marginBottom: '24px', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 10px 25px rgba(255, 117, 140, 0.4)',
          transition: 'transform 0.2s',
          textAlign: 'left'
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            Mural Especial
          </h3>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', fontWeight: '500' }}>
            Momentos, inspirações e nossa jornada até o altar.
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.25)', padding: '14px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </button>

      {/* AVISO DISCRETO CASO NÃO TENHA DADOS (NÃO BLOQUEIA MAIS A TELA) */}
      {(!dataCasamento || tetoCasamento === 0) && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px', borderRadius: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#f59e0b', fontSize: '0.95rem' }}>Complete o seu perfil</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Defina a data e o teto de gastos para liberar a saúde financeira.</span>
          </div>
          <button onClick={() => setSetupAberto(true)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Configurar</button>
        </div>
      )}

      {/* PAINEL: SAÚDE FINANCEIRA GERAL */}
      <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase' }}>Índice de Saúde Financeira</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <h3 style={{ margin: 0, color: saudeCor, fontSize: '1.5rem' }}>{scoreSaude}/100</h3>
              <span style={{ background: `${saudeCor}15`, color: saudeCor, padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>{saudeLabel}</span>
            </div>
          </div>
        </div>
        
        <p style={{ margin: '0 0 20px 0', fontSize: '0.75rem', color: 'var(--text)', lineHeight: '1.4' }}>
          Este índice cruza seus prazos, pagamentos e orçamentos. Mantenha as parcelas em dia para uma nota alta.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Teto Máximo</span>
            <span style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text-h)', fontWeight: 'bold' }}>{formatMoney(tetoCasamento)}</span>
          </div>
          <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Disponível</span>
            <span style={{ display: 'block', fontSize: '1.05rem', color: valorDisponivel >= 0 ? 'var(--text-h)' : '#ef4444', fontWeight: 'bold' }}>{formatMoney(valorDisponivel)}</span>
          </div>
          <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Contratado</span>
            <span style={{ display: 'block', fontSize: '1.05rem', color: '#f59e0b', fontWeight: 'bold' }}>{formatMoney(valorComprometido)}</span>
          </div>
          <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Já Pago</span>
            <span style={{ display: 'block', fontSize: '1.05rem', color: '#10b981', fontWeight: 'bold' }}>{formatMoney(valorPago)}</span>
          </div>
        </div>
        
        {economiaTotal > 0 && (
          <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '16px', textAlign: 'center', color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
            Vocês economizaram {formatMoney(economiaTotal)} em negociações!
          </div>
        )}
      </div>

      {/* PAINEL: CONVIDADOS E CUSTO REAL */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Convidados
            </h3>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h)' }}>{totalConvidados}</span>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.7rem', color: 'var(--text)' }}>Progresso da lista de presença (RSVP).</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>{convidadosConfirmados} Confirmados</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>{convidadosPendentes} Pendentes</div>
          </div>
        </div>

        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase', marginBottom: '2px' }}>Custo / Pessoa</span>
          <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.2rem' }}>{formatMoney(custoBaseadoReal)}</h3>
        </div>
      </div>

      {/* PAINEL: O QUE FAZER AGORA (MOTOR DE ALERTAS) */}
      {(parcelasAtrasadas > 0 || parcelasProximas.length > 0 || contratosPendentes > 0 || contratosSemAnexo > 0 || (dataCasamento && convidadosPendentes > 0 && diasRestantes < 30) || tarefasUrgentes > 0) && (
        <div className="animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            O Que Fazer Agora
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: 'var(--text)' }}>Pendências que exigem sua atenção imediata.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {parcelasAtrasadas > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}><span style={{ color: '#ef4444' }}>•</span> <strong>{parcelasAtrasadas}</strong> parcela(s) em atraso!</div>}
            {contratosPendentes > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}><span style={{ color: '#f59e0b' }}>•</span> <strong>{contratosPendentes}</strong> fornecedor(es) sem cronograma financeiro gerado.</div>}
            {contratosSemAnexo > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}><span style={{ color: '#ef4444' }}>•</span> <strong>{contratosSemAnexo}</strong> fornecedor(es) sem contrato (PDF/Link) anexado.</div>}
            {tarefasUrgentes > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}><span style={{ color: '#ef4444' }}>•</span> <strong>{tarefasUrgentes}</strong> tarefa(s) na Checklist marcadas como Urgente.</div>}
            {parcelasProximas.length > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}><span style={{ color: 'var(--accent)' }}>•</span> <strong>{parcelasProximas.length}</strong> parcela(s) vencendo nos próximos 7 dias.</div>}
            {(dataCasamento && convidadosPendentes > 0 && diasRestantes < 30) && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}><span style={{ color: '#ef4444' }}>•</span> Faltando menos de 1 mês, há <strong>{convidadosPendentes}</strong> respostas pendentes.</div>}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* BATERIA DE BOTÕES DO HUB (OS 15 MÓDULOS) */}
      {/* ======================================= */}
      
      <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1rem' }}>Pessoas & Espaço</h3>
      <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: 'var(--text)' }}>Quem convidar e onde acomodar na festa.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setConvidadosAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Convidados</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Gestão e Confirmação de Presença</span></div>
        </button>
        <button onClick={() => setMesasAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Mesas</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Acomodação visual</span></div>
        </button>
      </div>

      <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1rem' }}>Dinheiro & Contratos</h3>
      <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: 'var(--text)' }}>Gestão completa de fornecedores e controle de pagamentos.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setOrcamentoAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Orçamento</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Fatiar o Teto</span></div>
        </button>
        <button onClick={() => setPlannerAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Fornecedores</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Pesquisas e Fechados</span></div>
        </button>
        <button onClick={() => setPagamentosAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Pagamentos</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Gerar parcelas</span></div>
        </button>
        <button onClick={() => setDocumentosAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Documentos</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Links dos contratos</span></div>
        </button>
      </div>

      <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1rem' }}>Planejamento & Estratégia</h3>
      <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: 'var(--text)' }}>Acompanhe metas financeiras, simule cenários e organize o cronograma.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setChecklistAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Checklist</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Tarefas do evento</span></div>
        </button>
        <button onClick={() => setCronogramaAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>O Grande Dia</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Timeline da festa</span></div>
        </button>
        <button onClick={() => setMetasAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Cofrinho</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Poupança e metas</span></div>
        </button>
        <button onClick={() => setSimuladorAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-9 5 18 3-10 4 3h4"></path></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Simulador</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Cenários "E se..."</span></div>
        </button>
      </div>

      <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1rem' }}>O Pós-Festa</h3>
      <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: 'var(--text)' }}>Presentes, viagem de núpcias e fechamento do evento.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setPresentesAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Presentes</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Listas e cotas virtuais</span></div>
        </button>
        <button onClick={() => setLuaDeMelAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-.5-.5-2.5 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-4 4-3-1-2 2 5 5 2-2-1-3 4-4 4 6l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg></div>
          <div><span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.9rem' }}>Lua de Mel</span><span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>Viagem e despesas</span></div>
        </button>
      </div>
      
      <button onClick={() => setPosCasamentoAberto(true)} style={{ width: '100%', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', padding: '16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Gerar Relatório Final Auditado
      </button>

      {/* RENDERIZAÇÃO INVISÍVEL DOS MODAIS */}
      <CasamentoModalSetup setupAberto={setupAberto} setSetupAberto={setSetupAberto} casalId={casalId} dataAtual={dataCasamento} tetoAtual={tetoCasamento} />
      <CasamentoModalOrcamento orcamentoAberto={orcamentoAberto} setOrcamentoAberto={setOrcamentoAberto} casalId={casalId} tetoCasamento={tetoCasamento} categoriasPlanejado={categoriasPlanejado} formatMoney={formatMoney} />
      <CasamentoModalConvidados convidadosAberto={convidadosAberto} setConvidadosAberto={setConvidadosAberto} casalId={casalId} convidados={convidados} />
      <CasamentoModalChecklist checklistAberto={checklistAberto} setChecklistAberto={setChecklistAberto} casalId={casalId} tarefas={tarefas} dataCasamento={dataCasamento} />
      <CasamentoModalCronograma cronogramaAberto={cronogramaAberto} setCronogramaAberto={setCronogramaAberto} casalId={casalId} eventos={eventosCronograma} />
      <CasamentoModalDocumentos documentosAberto={documentosAberto} setDocumentosAberto={setDocumentosAberto} casalId={casalId} fornecedores={fornecedores} />
      <CasamentoModalPlanner plannerAberto={plannerAberto} setPlannerAberto={setPlannerAberto} casalId={casalId} fornecedores={fornecedores} formatMoney={formatMoney} tetoCasamento={tetoCasamento} valorComprometido={valorComprometido} />
      <CasamentoModalMesas mesasAberto={mesasAberto} setMesasAberto={setMesasAberto} casalId={casalId} convidados={convidados} />
      <CasamentoModalLuaDeMel luaDeMelAberto={luaDeMelAberto} setLuaDeMelAberto={setLuaDeMelAberto} casalId={casalId} formatMoney={formatMoney} />
      <CasamentoModalPresentes presentesAberto={presentesAberto} setPresentesAberto={setPresentesAberto} casalId={casalId} formatMoney={formatMoney} />
      <CasamentoModalMetas metasAberto={metasAberto} setMetasAberto={setMetasAberto} casalId={casalId} formatMoney={formatMoney} tetoCasamento={tetoCasamento} dataCasamento={dataCasamento} />
      <CasamentoModalSimulador simuladorAberto={simuladorAberto} setSimuladorAberto={setSimuladorAberto} formatMoney={formatMoney} tetoAtual={tetoCasamento} valorComprometidoAtual={valorComprometido} convidadosAtuais={convidados.length} />
      <CasamentoModalPagamentos pagamentosAberto={pagamentosAberto} setPagamentosAberto={setPagamentosAberto} casalId={casalId} fornecedores={fornecedores} formatMoney={formatMoney} />
      <CasamentoModalPosCasamento posCasamentoAberto={posCasamentoAberto} setPosCasamentoAberto={setPosCasamentoAberto} formatMoney={formatMoney} tetoCasamento={tetoCasamento} valorComprometido={valorComprometido} valorPago={valorPago} fornecedores={fornecedores} convidados={convidados} tarefas={tarefas} dataCasamento={dataCasamento} />
      <CasamentoModalIA iaAberto={iaAberto} setIaAberto={setIaAberto} fornecedores={fornecedores} tetoCasamento={tetoCasamento} valorComprometido={valorComprometido} diasRestantes={diasRestantes} formatMoney={formatMoney} tarefas={tarefas} convidados={convidados} valorPoupado={valorPoupado} parcelasProximas={parcelasProximas} parcelasAtrasadas={parcelasAtrasadas} />
     <CasamentoModalMuralIdeias muralAberto={muralAberto} setMuralAberto={setMuralAberto} casalId={casalId} />

    </div>
  );
};