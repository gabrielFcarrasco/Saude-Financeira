import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../services/firebase';

// IMPORTAÇÃO DOS MODAIS
import { CasamentoModalSetup } from './CasamentoModalSetup';
import { CasamentoModalOrcamento } from './CasamentoModalOrcamento';
import { CasamentoModalConvidados } from './CasamentoModalConvidados';
import { CasamentoModalChecklist, calcularUrgenciaTarefa, normalizarFase } from './CasamentoModalChecklist';
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

    const unsubFornecedores = onSnapshot(query(collection(db, 'casais', casalId, 'fornecedores')), (snap) => setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubConvidados = onSnapshot(query(collection(db, 'casais', casalId, 'convidados')), (snap) => setConvidados(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTarefas = onSnapshot(query(collection(db, 'casais', casalId, 'tarefas')), (snap) => setTarefas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCronograma = onSnapshot(query(collection(db, 'casais', casalId, 'cronograma')), (snap) => {
      setEventosCronograma(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCarregando(false);
    });

    return () => { unsubCasal(); unsubFornecedores(); unsubConvidados(); unsubTarefas(); unsubCronograma(); };
  }, [casalId]);

  if (carregando) return null;

  // --- CÁLCULOS E FORMATAÇÃO DE DATA ---
  let diasRestantes = 0;
  let diasRestantesVal: number | null = null;
  let dataFormatada = 'Data a definir';
  
  if (dataCasamento) {
    const dataAlvo = new Date(dataCasamento + 'T12:00:00');
    const hoje = new Date();
    diasRestantes = Math.ceil((dataAlvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    diasRestantesVal = diasRestantes;
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    dataFormatada = `${dataAlvo.getDate()} de ${meses[dataAlvo.getMonth()]} de ${dataAlvo.getFullYear()}`;
  }

  // --- MATEMÁTICAS E CÁLCULOS DO HUB ---
  const fornecedoresFechados = fornecedores.filter(f => f.status === 'fechado');
  const valorComprometido = fornecedoresFechados.reduce((acc, f) => acc + Number(f.valor || 0), 0);
  const valorPago = fornecedoresFechados.reduce((acc, f) => acc + (f.parcelas?.filter((p:any) => p.pago).reduce((s:any, p:any) => s + p.valor, 0) || 0), 0);
  const valorDisponivel = tetoCasamento > 0 ? (tetoCasamento - valorComprometido) : 0;

  const economiaTotal = fornecedoresFechados.reduce((acc, f) => {
    const eco = (Number(f.valorInicial) || 0) - (Number(f.valor) || 0);
    return acc + (eco > 0 ? eco : 0);
  }, 0);

  // --- CÁLCULO INDIVIDUAL DE PESSOAS VS CONVITES ---
  let totalPessoasReais = 0;
  let convidadosConfirmados = 0;
  let convidadosPendentes = 0;
  let convidadosRecusados = 0;

  convidados.forEach((c: any) => {
    if (c.membros && Array.isArray(c.membros) && c.membros.length > 0) {
      c.membros.forEach((m: any) => {
        totalPessoasReais++;
        if (m.status === 'confirmado') convidadosConfirmados++;
        else if (m.status === 'recusado') convidadosRecusados++;
        else convidadosPendentes++;
      });
    } else {
      // Compatibilidade com registros legados sem lista de membros
      const st = c.status || 'pendente';
      const acomp = Number(c.acompanhantesPermitidos || 0);
      const qtdNesteConvite = 1 + acomp;
      
      totalPessoasReais += qtdNesteConvite;
      if (st === 'confirmado') convidadosConfirmados += qtdNesteConvite;
      else if (st === 'recusado') convidadosRecusados += qtdNesteConvite;
      else convidadosPendentes += qtdNesteConvite;
    }
  });

  const totalConvitesGrupos = convidados.length;
  const custoBaseadoReal = totalPessoasReais > 0 ? (valorComprometido / totalPessoasReais) : 0;
  
  const hojeDate = new Date();
  const proximaSemanaDate = new Date();
  proximaSemanaDate.setDate(hojeDate.getDate() + 7);

  let parcelasAtrasadas = 0; let parcelasProximas: any[] = []; let contratosPendentes = 0; let contratosSemAnexo = 0;
  
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

  // SEPARAÇÃO INTELIGENTE DE TAREFAS URGENTES / FOCO DO MÊS
  const todasTarefasUrgentes = tarefas
    .filter(t => t.status !== 'concluida')
    .map(t => ({ ...t, urgInfo: calcularUrgenciaTarefa(t, diasRestantesVal) }))
    .filter(t => t.urgInfo.ehUrgente);

  // Ordena para que tarefas Em Atraso fiquem no topo
  const orderMap: Record<string, number> = { 'atrasada': 1, 'foco': 2, 'urgente': 3 };
  todasTarefasUrgentes.sort((a, b) => (orderMap[a.urgInfo.nivel] || 4) - (orderMap[b.urgInfo.nivel] || 4));

  const tarefasUrgentesContagem = todasTarefasUrgentes.length;
  const tarefasAtrasadasContagem = todasTarefasUrgentes.filter(t => t.urgInfo.nivel === 'atrasada').length;
  const tarefasUrgentesLista = todasTarefasUrgentes.slice(0, 3);

  // CÁLCULO PRECISO DE SAÚDE FINANCEIRA
  let scoreSaude = 100;

  if (tetoCasamento > 0) {
    if (valorComprometido > tetoCasamento) scoreSaude -= 40;
    else if (valorComprometido > tetoCasamento * 0.9) scoreSaude -= 15;
  }

  scoreSaude -= (parcelasAtrasadas * 15);
  scoreSaude -= (tarefasAtrasadasContagem * 5);
  
  const penalidadeContratos = Math.min(20, contratosPendentes * 3);
  scoreSaude -= penalidadeContratos;

  if (convidadosPendentes > 0 && diasRestantesVal !== null && diasRestantesVal < 30) {
    scoreSaude -= 10;
  }

  scoreSaude = Math.max(0, Math.min(100, scoreSaude));

  let saudeLabel = 'Excelente'; let saudeCor = '#10b981';
  if (scoreSaude < 50) { saudeLabel = 'Crítico'; saudeCor = '#ef4444'; }
  else if (scoreSaude < 80) { saudeLabel = 'Atenção'; saudeCor = '#f59e0b'; }
  else if (scoreSaude < 95) { saudeLabel = 'Saudável'; saudeCor = '#3b82f6'; }

  return (
    <div className="hub-fintech-container animate-fade-in" style={{ paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* BARRA SUPERIOR (IA & CONFIG) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setIaAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', transition: '0.2s', fontWeight: 'bold', fontSize: '0.85rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 2.5 1.5 4 3 5.5s1 2.5 1 3.5h2c0-1 .5-2 1-3.5s3-3 3-5.5a5 5 0 0 0-5-5z"/></svg>
          Assessor IA
        </button>
        <button onClick={() => setSetupAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-h)', transition: '0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>

      {/* HERO CARD */}
      <div className="animate-fade-in" style={{ 
        background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', 
        borderRadius: '32px', 
        padding: '36px 24px', 
        textAlign: 'center', 
        color: '#ffffff', 
        marginBottom: '24px', 
        position: 'relative', 
        overflow: 'hidden', 
        boxShadow: '0 15px 35px rgba(138, 43, 226, 0.2)' 
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '150px', height: '150px', background: 'rgba(0,0,0,0.15)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
        
        <span style={{ display: 'inline-block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800', color: '#ffffff', opacity: 0.9, marginBottom: '12px' }}>O Grande Dia</span>

        {dataCasamento ? (
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '3.8rem', fontWeight: '900', color: '#ffffff', lineHeight: '1', textShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>{diasRestantes < 0 ? 'Chegou!' : diasRestantes}</h1>
            <span style={{ display: 'block', fontSize: '0.9rem', color: '#ffffff', opacity: 0.9, fontWeight: '600', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>{diasRestantes < 0 ? 'O grande momento aconteceu.' : diasRestantes === 1 ? 'dia restante' : 'dias restantes'}</span>
            <div style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.15)', padding: '8px 20px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.25)', fontWeight: '600', fontSize: '0.9rem', color: '#ffffff' }}>{dataFormatada}</div>
          </div>
        ) : (
          <div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '1.8rem', fontWeight: '800', color: '#ffffff' }}>Data a definir</h2>
            <button onClick={() => setSetupAberto(true)} style={{ background: '#ffffff', color: 'var(--accent)', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Configurar Data</button>
          </div>
        )}
      </div>

      {/* MURAL ESPECIAL */}
      <button onClick={() => setMuralAberto(true)} className="animate-fade-in" style={{ width: '100%', background: 'linear-gradient(90deg, #ff7eb3 0%, #ff758c 100%)', border: 'none', padding: '20px 24px', borderRadius: '24px', marginBottom: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 20px rgba(255, 117, 140, 0.3)', transition: 'transform 0.2s', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.25)', padding: '12px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" stroke="none" color="#fff"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Mural Especial</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.95)', fontSize: '0.85rem' }}>Nossas inspirações e jornada.</p>
          </div>
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>

      {/* AVISO DE SETUP */}
      {(!dataCasamento || tetoCasamento === 0) && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px', borderRadius: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#f59e0b', fontSize: '0.95rem' }}>Complete o seu perfil</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Defina a data e o teto de gastos para liberar a saúde financeira.</span>
          </div>
          <button onClick={() => setSetupAberto(true)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Configurar</button>
        </div>
      )}

      {/* PAINEL: SAÚDE FINANCEIRA */}
      <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '1px' }}>Saúde Financeira</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <h3 style={{ margin: 0, color: saudeCor, fontSize: '1.8rem' }}>{scoreSaude}<span style={{ fontSize: '1rem', color: 'var(--text)', opacity: 0.5 }}>/100</span></h3>
              <span style={{ background: `${saudeCor}15`, color: saudeCor, padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>{saudeLabel}</span>
            </div>
          </div>
          {economiaTotal > 0 && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '12px', color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Economizou {formatMoney(economiaTotal)}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Teto Máximo</span>
            <span style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-h)', fontWeight: '900', marginTop: '4px' }}>{formatMoney(tetoCasamento)}</span>
          </div>
          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Disponível</span>
            <span style={{ display: 'block', fontSize: '1.1rem', color: valorDisponivel >= 0 ? 'var(--text-h)' : '#ef4444', fontWeight: '900', marginTop: '4px' }}>{formatMoney(valorDisponivel)}</span>
          </div>
          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px dashed var(--border)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Contratado</span>
            <span style={{ display: 'block', fontSize: '1.1rem', color: '#f59e0b', fontWeight: '900', marginTop: '4px' }}>{formatMoney(valorComprometido)}</span>
          </div>
          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px dashed var(--border)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Já Pago</span>
            <span style={{ display: 'block', fontSize: '1.1rem', color: '#10b981', fontWeight: '900', marginTop: '4px' }}>{formatMoney(valorPago)}</span>
          </div>
        </div>
      </div>

      {/* PAINEL: CONVIDADOS E CUSTO REAL POR PESSOA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div onClick={() => setConvidadosAberto(true)} style={{ background: 'var(--bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '6px', borderRadius: '8px', color: '#0ea5e9' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem' }}>Convidados</h3>
          </div>
          
          <h2 style={{ margin: '0 0 2px 0', fontSize: '1.8rem', color: 'var(--text-h)', fontWeight: '900' }}>
            {totalPessoasReais} <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 'normal' }}>pessoas</span>
          </h2>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text)', marginBottom: '12px' }}>
            em {totalConvitesGrupos} {totalConvitesGrupos === 1 ? 'convite / família' : 'convites / famílias'}
          </span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
              {convidadosConfirmados} Confirmados
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
              {convidadosPendentes} Pendentes
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Custo / Pessoa</span>
          <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.5rem' }}>{formatMoney(custoBaseadoReal)}</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--text)', marginTop: '8px' }}>
            Valor contratado ÷ {totalPessoasReais} pessoas.
          </span>
        </div>
      </div>

      {/* FOCO IMEDIATO (URGÊNCIAS DINÂMICAS) */}
      {tarefasUrgentesLista.length > 0 && (
        <div className="animate-fade-in" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></span>
              Foco Imediato
            </h3>
            <button onClick={() => setChecklistAberto(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>Ver todas ({tarefasUrgentesContagem})</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tarefasUrgentesLista.map(tarefa => {
              const info = tarefa.urgInfo;
              return (
                 <div key={tarefa.id} onClick={() => setChecklistAberto(true)} style={{ background: 'var(--code-bg)', border: `1px solid ${info.cor}40`, borderLeft: `4px solid ${info.cor}`, padding: '16px', borderRadius: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                   <div>
                     <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '0.95rem' }}>{tarefa.titulo || tarefa.nome || 'Tarefa'}</span>
                     <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{normalizarFase(tarefa.fase)} • {tarefa.categoria || 'Geral'}</span>
                   </div>
                   <div style={{ background: `${info.cor}15`, color: info.cor, padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                     {info.badge}
                   </div>
                 </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALERTAS OPERACIONAIS */}
      {(parcelasAtrasadas > 0 || parcelasProximas.length > 0 || contratosPendentes > 0 || contratosSemAnexo > 0 || (dataCasamento && convidadosPendentes > 0 && diasRestantes < 30)) && (
        <div className="animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Atenção Necessária
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {parcelasAtrasadas > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)', display: 'flex', gap: '8px' }}><span style={{ color: '#ef4444', fontWeight: 'bold' }}>•</span> <span><strong>{parcelasAtrasadas}</strong> parcela(s) em atraso!</span></div>}
            {contratosPendentes > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)', display: 'flex', gap: '8px' }}><span style={{ color: '#f59e0b', fontWeight: 'bold' }}>•</span> <span><strong>{contratosPendentes}</strong> fornecedor(es) sem cronograma gerado.</span></div>}
            {contratosSemAnexo > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)', display: 'flex', gap: '8px' }}><span style={{ color: '#ef4444', fontWeight: 'bold' }}>•</span> <span><strong>{contratosSemAnexo}</strong> fornecedor(es) sem contrato em anexo.</span></div>}
            {parcelasProximas.length > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)', display: 'flex', gap: '8px' }}><span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>•</span> <span><strong>{parcelasProximas.length}</strong> parcela(s) vencendo nos próximos 7 dias.</span></div>}
            {(dataCasamento && convidadosPendentes > 0 && diasRestantes < 30) && <div style={{ fontSize: '0.85rem', color: 'var(--text-h)', display: 'flex', gap: '8px' }}><span style={{ color: '#ef4444', fontWeight: 'bold' }}>•</span> <span>Faltando 1 mês, há <strong>{convidadosPendentes}</strong> pessoas pendentes de RSVP.</span></div>}
          </div>
        </div>
      )}

      {/* MÓDULOS DE AÇÃO */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.2rem' }}>Pessoas & Espaço</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button onClick={() => setConvidadosAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Convidados</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Gestão e Presença</span>
          </button>
          <button onClick={() => setMesasAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Mesas</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Organização no salão</span>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.2rem' }}>Dinheiro & Contratos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button onClick={() => setOrcamentoAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Orçamento</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Divisão do Teto</span>
          </button>
          <button onClick={() => setPlannerAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Fornecedores</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Gestão e Pesquisa</span>
          </button>
          <button onClick={() => setPagamentosAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Pagamentos</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Parcelas e Vencimentos</span>
          </button>
          <button onClick={() => setDocumentosAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Documentos</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Contratos e Links</span>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.2rem' }}>Planejamento & Estratégia</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          <button onClick={() => setChecklistAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', position: 'relative' }}>
            {tarefasUrgentesContagem > 0 && (
              <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {tarefasUrgentesContagem}
              </div>
            )}
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Checklist</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Tarefas do evento</span>
          </button>
          
          <button onClick={() => setCronogramaAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>O Grande Dia</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Timeline da festa</span>
          </button>
          <button onClick={() => setMetasAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Cofrinho</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Poupança e Metas</span>
          </button>
          <button onClick={() => setSimuladorAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-9 5 18 3-10 4 3h4"></path></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Simulador</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Cenários "E se..."</span>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.2rem' }}>O Pós-Festa</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button onClick={() => setPresentesAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Presentes</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Listas Virtuais</span>
          </button>
          <button onClick={() => setLuaDeMelAberto(true)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '24px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-.5-.5-2.5 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-4 4-3-1-2 2 5 5 2-2-1-3 4-4 4 6l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg></div>
            <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-h)', fontSize: '1rem', marginBottom: '4px' }}>Lua de Mel</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Viagem e Orçamento</span>
          </button>
        </div>
      </div>
      
      <button onClick={() => setPosCasamentoAberto(true)} style={{ width: '100%', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', padding: '18px', borderRadius: '24px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', transition: '0.2s' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Gerar Relatório Final Auditado
      </button>

      {/* RENDERIZAÇÃO DOS MODAIS */}
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
      <CasamentoModalSimulador simuladorAberto={simuladorAberto} setSimuladorAberto={setSimuladorAberto} formatMoney={formatMoney} tetoAtual={tetoCasamento} valorComprometidoAtual={valorComprometido} convidadosAtuais={totalPessoasReais} />
      <CasamentoModalPagamentos pagamentosAberto={pagamentosAberto} setPagamentosAberto={setPagamentosAberto} casalId={casalId} fornecedores={fornecedores} formatMoney={formatMoney} />
      <CasamentoModalPosCasamento posCasamentoAberto={posCasamentoAberto} setPosCasamentoAberto={setPosCasamentoAberto} formatMoney={formatMoney} tetoCasamento={tetoCasamento} valorComprometido={valorComprometido} valorPago={valorPago} fornecedores={fornecedores} convidados={convidados} tarefas={tarefas} dataCasamento={dataCasamento} />
      <CasamentoModalIA iaAberto={iaAberto} setIaAberto={setIaAberto} fornecedores={fornecedores} tetoCasamento={tetoCasamento} valorComprometido={valorComprometido} diasRestantes={diasRestantes} formatMoney={formatMoney} tarefas={tarefas} convidados={convidados} valorPoupado={valorPoupado} parcelasProximas={parcelasProximas} parcelasAtrasadas={parcelasAtrasadas} />
      <CasamentoModalMuralIdeias muralAberto={muralAberto} setMuralAberto={setMuralAberto} casalId={casalId} />

    </div>
  );
};