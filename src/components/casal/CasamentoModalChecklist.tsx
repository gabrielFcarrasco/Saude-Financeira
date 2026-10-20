import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CATEGORIAS = ['Cerimônia', 'Recepção', 'Vestuário', 'Beleza', 'Fornecedores', 'Convidados', 'Decoração', 'Lua de Mel', 'Financeiro', 'Documentação'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];

// Cronograma Mês a Mês Oficial com extensão para +12 Meses (até 18 Meses)
export const FASES_TIMELINE = [
  '18 Meses Antes',
  '15 Meses Antes',
  '14 Meses Antes',
  '13 Meses Antes',
  '12 Meses Antes',
  '11 Meses Antes',
  '10 Meses Antes',
  '9 Meses Antes',
  '8 Meses Antes',
  '7 Meses Antes',
  '6 Meses Antes',
  '5 Meses Antes',
  '4 Meses Antes',
  '3 Meses Antes',
  '2 Meses Antes',
  '1 Mês Antes',
  '2 Semanas Antes',
  'Semana do Casamento',
  'Véspera do Casamento',
  'Dia do Casamento',
  'Pós-Casamento',
  'Sem Fase Específica'
];

// Mapeamento de Fases Legadas para Garantir Compatibilidade Automática
export const MAPEAMENTO_LEGADO: Record<string, string> = {
  '18 a 24 Meses Antes': '18 Meses Antes',
  '12 a 18 Meses Antes': '12 Meses Antes',
  '9 a 11 Meses Antes': '10 Meses Antes',
  '6 a 8 Meses Antes': '7 Meses Antes',
  '3 a 5 Meses Antes': '4 Meses Antes',
  '1 a 2 Meses Antes': '1 Mês Antes',
  'Mês do Casamento': '1 Mês Antes'
};

export const normalizarFase = (faseRaw: string) => {
  if (!faseRaw) return 'Sem Fase Específica';
  if (MAPEAMENTO_LEGADO[faseRaw]) return MAPEAMENTO_LEGADO[faseRaw];
  if (FASES_TIMELINE.includes(faseRaw)) return faseRaw;
  return 'Sem Fase Específica';
};

// Mapeamento de deslocamento de dias para cálculo matemático de urgência
export const FASE_DESLOCAMENTO_DIAS: Record<string, number> = {
  '18 Meses Antes': 540,
  '15 Meses Antes': 450,
  '14 Meses Antes': 420,
  '13 Meses Antes': 390,
  '12 Meses Antes': 365,
  '11 Meses Antes': 335,
  '10 Meses Antes': 300,
  '9 Meses Antes': 270,
  '8 Meses Antes': 240,
  '7 Meses Antes': 210,
  '6 Meses Antes': 180,
  '5 Meses Antes': 150,
  '4 Meses Antes': 120,
  '3 Meses Antes': 90,
  '2 Meses Antes': 60,
  '1 Mês Antes': 30,
  '2 Semanas Antes': 14,
  'Semana do Casamento': 7,
  'Véspera do Casamento': 1,
  'Dia do Casamento': 0,
  'Pós-Casamento': -7,
  'Sem Fase Específica': 0
};

export const calcularUrgenciaTarefa = (tarefa: any, diasRestantesCasamento: number | null) => {
  if (tarefa.status === 'concluida') {
    return { nivel: 'concluida', badge: '✔️ Concluída', cor: '#10b981', ehUrgente: false };
  }

  if (diasRestantesCasamento === null) {
    if (tarefa.prioridade === 'Urgente') {
      return { nivel: 'urgente', badge: '⚡ Urgente', cor: '#ef4444', ehUrgente: true };
    }
    return { nivel: 'normal', badge: 'Pendente', cor: 'var(--text)', ehUrgente: false };
  }

  const faseNormal = normalizarFase(tarefa.fase);
  const diasFase = FASE_DESLOCAMENTO_DIAS[faseNormal] ?? 0;

  // 1. Atrasada (a fase já passou e a tarefa não foi concluída)
  if (faseNormal !== 'Sem Fase Específica' && diasRestantesCasamento < diasFase - 15) {
    return { nivel: 'atrasada', badge: '🔴 Em Atraso', cor: '#ef4444', ehUrgente: true };
  }

  // 2. Foco Atual (estamos na janela dessa fase)
  if (faseNormal !== 'Sem Fase Específica' && Math.abs(diasRestantesCasamento - diasFase) <= 20) {
    return { nivel: 'foco', badge: '⚡ Foco Atual', cor: '#f59e0b', ehUrgente: true };
  }

  // 3. Futura (ainda não chegou o momento dessa fase)
  if (faseNormal !== 'Sem Fase Específica' && diasRestantesCasamento > diasFase + 20) {
    return { nivel: 'futura', badge: '⏳ No Aguardo', cor: 'var(--text)', ehUrgente: false };
  }

  if (tarefa.prioridade === 'Urgente') {
    return { nivel: 'urgente', badge: '⚡ Urgente', cor: '#ef4444', ehUrgente: true };
  }

  return { nivel: 'normal', badge: 'Pendente', cor: 'var(--text)', ehUrgente: false };
};

export const CasamentoModalChecklist = ({
  checklistAberto, setChecklistAberto, casalId, tarefas, dataCasamento
}: any) => {

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Cerimônia');
  const [prioridade, setPrioridade] = useState('Média');
  const [fase, setFase] = useState('12 Meses Antes');
  const [prazo, setPrazo] = useState('');
  const [status, setStatus] = useState('pendente');
  const [observacao, setObservacao] = useState('');

  const [isProcessando, setIsProcessando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todas'); // todas, pendentes, concluidas

  // --- CÁLCULO DE DIAS RESTANTES PARA O CASAMENTO ---
  const diasRestantesCasamento = useMemo(() => {
    if (!dataCasamento) return null;
    const dataAlvo = new Date(dataCasamento + 'T12:00:00');
    const hoje = new Date();
    return Math.ceil((dataAlvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  }, [dataCasamento]);

  // --- AGRUPAMENTO E FILTRAGEM COM NORMALIZAÇÃO ---
  const tarefasFiltradas = tarefas.filter((t: any) => {
    if (filtroStatus === 'concluidas') return t.status === 'concluida';
    if (filtroStatus === 'pendentes') return t.status !== 'concluida';
    return true;
  });

  const tarefasAgrupadas = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    FASES_TIMELINE.forEach(f => grupos[f] = []);
    
    tarefasFiltradas.forEach((t: any) => {
      const faseNormal = normalizarFase(t.fase);
      if (grupos[faseNormal]) {
        grupos[faseNormal].push(t);
      } else {
        grupos['Sem Fase Específica'].push(t);
      }
    });
    return grupos;
  }, [tarefasFiltradas]);

  const progresso = tarefas.length > 0 
    ? Math.round((tarefas.filter((t: any) => t.status === 'concluida').length / tarefas.length) * 100) 
    : 0;

  if (!checklistAberto) return null;

  // --- CONTROLES DE FORMULÁRIO ---
  const abrirFormNovo = () => {
    setIdEdicao(null); setTitulo(''); setCategoria('Cerimônia'); setPrioridade('Média'); 
    setFase('12 Meses Antes'); setPrazo(''); setStatus('pendente'); setObservacao('');
    setFormAberto(true);
  };

  const abrirFormEdicao = (t: any) => {
    setIdEdicao(t.id); setTitulo(t.titulo); setCategoria(t.categoria); setPrioridade(t.prioridade); 
    setFase(normalizarFase(t.fase)); setPrazo(t.prazo || ''); setStatus(t.status); setObservacao(t.observacao || '');
    setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !titulo) return;
    setIsProcessando(true);
    try {
      const payload = { titulo, categoria, prioridade, fase, prazo, status, observacao, updatedAt: serverTimestamp() };
      if (idEdicao) await updateDoc(doc(db, 'casais', casalId, 'tarefas', idEdicao), payload);
      else await addDoc(collection(db, 'casais', casalId, 'tarefas'), { ...payload, createdAt: serverTimestamp() });
      setFormAberto(false);
    } catch (e) { console.error(e); } finally { setIsProcessando(false); }
  };

  const alternarStatusRapido = async (id: string, statusAtual: string, e: any) => {
    e.stopPropagation();
    if (!casalId) return;
    const novoStatus = statusAtual === 'concluida' ? 'pendente' : 'concluida';
    await updateDoc(doc(db, 'casais', casalId, 'tarefas', id), { status: novoStatus, updatedAt: serverTimestamp() });
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Remover esta tarefa?")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'tarefas', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  // --- GERADOR AUTOMÁTICO COMPLETO COM SUPORTE A +12 MESES ---
  const gerarChecklistAutomatico = async () => {
    if (!casalId || !window.confirm("Isso irá gerar a linha do tempo completa mês a mês com todas as etapas essenciais. Continuar?")) return;
    setIsProcessando(true);
    try {
      const batch = writeBatch(db);

      const calcularPrazo = (diasAntes: number) => {
        if (!dataCasamento) return '';
        const data = new Date(dataCasamento + 'T12:00:00');
        data.setDate(data.getDate() - diasAntes);
        return data.toISOString().split('T')[0];
      };

      const tarefasBase = [
        // 18 meses antes (Planejamento estendido para +12 meses)
        { titulo: 'Definir meta financeira inicial e estimativa de aportes', categoria: 'Financeiro', prioridade: 'Alta', fase: '18 Meses Antes', prazo: calcularPrazo(540) },
        { titulo: 'Criar pasta de referências e inspirações de casamentos', categoria: 'Decoração', prioridade: 'Média', fase: '18 Meses Antes', prazo: calcularPrazo(540) },
        { titulo: 'Alinhar expectativas iniciais do casal e estilo do evento', categoria: 'Cerimônia', prioridade: 'Alta', fase: '18 Meses Antes', prazo: calcularPrazo(540) },

        // 15 meses antes
        { titulo: 'Pesquisar cidades e regiões preferidas para o casamento', categoria: 'Recepção', prioridade: 'Média', fase: '15 Meses Antes', prazo: calcularPrazo(450) },
        { titulo: 'Montar primeira estimativa do tamanho do evento (nº de convidados)', categoria: 'Convidados', prioridade: 'Alta', fase: '15 Meses Antes', prazo: calcularPrazo(450) },

        // 14 meses antes
        { titulo: 'Pesquisar valores médios dos principais fornecedores da região', categoria: 'Financeiro', prioridade: 'Média', fase: '14 Meses Antes', prazo: calcularPrazo(420) },

        // 13 meses antes
        { titulo: 'Estabelecer prioridades máximas do casal (ex: comida, foto, festa)', categoria: 'Financeiro', prioridade: 'Alta', fase: '13 Meses Antes', prazo: calcularPrazo(390) },

        // 12 meses antes
        { titulo: 'Definir a data ou o período do casamento', categoria: 'Financeiro', prioridade: 'Urgente', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Definir o estilo: clássico, rústico, moderno, praia ou campo', categoria: 'Decoração', prioridade: 'Alta', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Estabelecer o orçamento total do casamento', categoria: 'Financeiro', prioridade: 'Urgente', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Definir quanto cada um pode contribuir', categoria: 'Financeiro', prioridade: 'Alta', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Criar uma reserva para imprevistos', categoria: 'Financeiro', prioridade: 'Média', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Definir a quantidade aproximada de convidados', categoria: 'Convidados', prioridade: 'Urgente', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Decidir entre cerimônia e festa, apenas civil ou celebração intimista', categoria: 'Cerimônia', prioridade: 'Alta', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Escolher a cidade e a região do evento', categoria: 'Cerimônia', prioridade: 'Alta', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Pesquisar espaços para cerimônia e recepção', categoria: 'Recepção', prioridade: 'Urgente', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Criar uma planilha de despesas e pagamentos', categoria: 'Financeiro', prioridade: 'Média', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Criar uma pasta compartilhada para contratos, recibos e referências', categoria: 'Documentação', prioridade: 'Média', fase: '12 Meses Antes', prazo: calcularPrazo(365) },
        { titulo: 'Conversar sobre expectativas, prioridades e limites financeiros', categoria: 'Financeiro', prioridade: 'Alta', fase: '12 Meses Antes', prazo: calcularPrazo(365) },

        // 11 meses antes
        { titulo: 'Visitar salões, sítios, chácaras, igrejas ou outros espaços', categoria: 'Recepção', prioridade: 'Urgente', fase: '11 Meses Antes', prazo: calcularPrazo(335) },
        { titulo: 'Verificar capacidade, acessibilidade e estacionamento', categoria: 'Recepção', prioridade: 'Alta', fase: '11 Meses Antes', prazo: calcularPrazo(335) },
        { titulo: 'Conferir regras de som, decoração, buffet e horário', categoria: 'Recepção', prioridade: 'Alta', fase: '11 Meses Antes', prazo: calcularPrazo(335) },
        { titulo: 'Reservar o local da cerimônia e da recepção', categoria: 'Cerimônia', prioridade: 'Urgente', fase: '11 Meses Antes', prazo: calcularPrazo(335) },
        { titulo: 'Pesquisar assessoria ou cerimonialista', categoria: 'Fornecedores', prioridade: 'Alta', fase: '11 Meses Antes', prazo: calcularPrazo(335) },
        { titulo: 'Pesquisar buffet, fotógrafo e videomaker', categoria: 'Fornecedores', prioridade: 'Alta', fase: '11 Meses Antes', prazo: calcularPrazo(335) },
        { titulo: 'Solicitar orçamentos de pelo menos três fornecedores importantes', categoria: 'Fornecedores', prioridade: 'Média', fase: '11 Meses Antes', prazo: calcularPrazo(335) },
        { titulo: 'Ler contratos, multas, prazos e regras de cancelamento', categoria: 'Documentação', prioridade: 'Alta', fase: '11 Meses Antes', prazo: calcularPrazo(335) },
        { titulo: 'Confirmar o que está incluído em cada pacote', categoria: 'Fornecedores', prioridade: 'Média', fase: '11 Meses Antes', prazo: calcularPrazo(335) },
        { titulo: 'Registrar sinal, parcelas e vencimentos', categoria: 'Financeiro', prioridade: 'Alta', fase: '11 Meses Antes', prazo: calcularPrazo(335) },

        // 10 meses antes
        { titulo: 'Montar a lista preliminar de convidados', categoria: 'Convidados', prioridade: 'Urgente', fase: '10 Meses Antes', prazo: calcularPrazo(300) },
        { titulo: 'Separar familiares, amigos e colegas', categoria: 'Convidados', prioridade: 'Média', fase: '10 Meses Antes', prazo: calcularPrazo(300) },
        { titulo: 'Definir critérios para acompanhantes e crianças', categoria: 'Convidados', prioridade: 'Média', fase: '10 Meses Antes', prazo: calcularPrazo(300) },
        { titulo: 'Escolher padrinhos, madrinhas e testemunhas', categoria: 'Convidados', prioridade: 'Alta', fase: '10 Meses Antes', prazo: calcularPrazo(300) },
        { titulo: 'Conversar com os padrinhos sobre suas funções', categoria: 'Convidados', prioridade: 'Média', fase: '10 Meses Antes', prazo: calcularPrazo(300) },
        { titulo: 'Definir paleta de cores e estilo visual', categoria: 'Decoração', prioridade: 'Alta', fase: '10 Meses Antes', prazo: calcularPrazo(300) },
        { titulo: 'Criar referências de decoração e flores', categoria: 'Decoração', prioridade: 'Média', fase: '10 Meses Antes', prazo: calcularPrazo(300) },
        { titulo: 'Pesquisar celebrante, padre, pastor ou mestre de cerimônias', categoria: 'Cerimônia', prioridade: 'Alta', fase: '10 Meses Antes', prazo: calcularPrazo(300) },
        { titulo: 'Pesquisar música para cerimônia e festa', categoria: 'Fornecedores', prioridade: 'Média', fase: '10 Meses Antes', prazo: calcularPrazo(300) },
        { titulo: 'Verificar documentação e exigências do espaço religioso, se houver', categoria: 'Documentação', prioridade: 'Alta', fase: '10 Meses Antes', prazo: calcularPrazo(300) },

        // 9 meses antes
        { titulo: 'Contratar buffet e definir formato do serviço', categoria: 'Fornecedores', prioridade: 'Urgente', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Contratar fotógrafo e videomaker', categoria: 'Fornecedores', prioridade: 'Urgente', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Contratar DJ, banda ou músicos', categoria: 'Fornecedores', prioridade: 'Alta', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Reservar decoração e florista', categoria: 'Decoração', prioridade: 'Alta', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Pesquisar bolo e doces finos', categoria: 'Fornecedores', prioridade: 'Média', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Pesquisar cabelo e maquiagem', categoria: 'Beleza', prioridade: 'Média', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Pesquisar vestido de noiva e traje do noivo', categoria: 'Vestuário', prioridade: 'Alta', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Pesquisar alianças e opções de gravação', categoria: 'Cerimônia', prioridade: 'Média', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Definir se haverá site de casamento', categoria: 'Convidados', prioridade: 'Baixa', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Criar e-mail ou canal de contato para informações do evento', categoria: 'Convidados', prioridade: 'Baixa', fase: '9 Meses Antes', prazo: calcularPrazo(270) },
        { titulo: 'Começar a pesquisar destinos e custos da lua de mel', categoria: 'Lua de Mel', prioridade: 'Média', fase: '9 Meses Antes', prazo: calcularPrazo(270) },

        // 8 meses antes
        { titulo: 'Escolher ou encomendar o vestido de noiva', categoria: 'Vestuário', prioridade: 'Urgente', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Escolher ou encomendar o traje do noivo', categoria: 'Vestuário', prioridade: 'Alta', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Definir trajes ou orientações de cores para padrinhos, se desejado', categoria: 'Vestuário', prioridade: 'Média', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Pesquisar sapatos, véu, acessórios e joias', categoria: 'Vestuário', prioridade: 'Média', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Definir o estilo do convite e da papelaria', categoria: 'Convidados', prioridade: 'Alta', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Preparar lista de endereços e contatos dos convidados', categoria: 'Convidados', prioridade: 'Alta', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Pesquisar opções de lembrancinhas', categoria: 'Decoração', prioridade: 'Baixa', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Definir músicas especiais e momentos da cerimônia', categoria: 'Cerimônia', prioridade: 'Média', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Decidir se haverá entrada de crianças, daminhas ou pajens', categoria: 'Cerimônia', prioridade: 'Média', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Verificar a validade dos documentos necessários para o casamento civil', categoria: 'Documentação', prioridade: 'Alta', fase: '8 Meses Antes', prazo: calcularPrazo(240) },
        { titulo: 'Conferir passaportes e requisitos de entrada no destino da lua de mel', categoria: 'Lua de Mel', prioridade: 'Alta', fase: '8 Meses Antes', prazo: calcularPrazo(240) },

        // 7 meses antes
        { titulo: 'Fazer degustação do buffet', categoria: 'Fornecedores', prioridade: 'Alta', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Definir opções de pratos, acompanhamentos e sobremesas', categoria: 'Fornecedores', prioridade: 'Alta', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Verificar opções para restrições alimentares', categoria: 'Fornecedores', prioridade: 'Média', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Definir bebidas, bar e serviço de água', categoria: 'Fornecedores', prioridade: 'Média', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Escolher o bolo e os doces', categoria: 'Fornecedores', prioridade: 'Alta', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Planejar a disposição das mesas', categoria: 'Recepção', prioridade: 'Média', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Definir mesa dos noivos, mesa de doces e pontos de destaque', categoria: 'Decoração', prioridade: 'Média', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Planejar iluminação e sonorização', categoria: 'Recepção', prioridade: 'Média', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Definir atrações extras e pista de dança', categoria: 'Recepção', prioridade: 'Baixa', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Pesquisar transporte para os noivos e convidados, se necessário', categoria: 'Fornecedores', prioridade: 'Baixa', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Reservar hospedagem para convidados de outras cidades', categoria: 'Convidados', prioridade: 'Média', fase: '7 Meses Antes', prazo: calcularPrazo(210) },
        { titulo: 'Definir o que será oferecido como presente aos padrinhos', categoria: 'Convidados', prioridade: 'Média', fase: '7 Meses Antes', prazo: calcularPrazo(210) },

        // 6 meses antes
        { titulo: 'Dar entrada no processo de habilitação para casamento civil', categoria: 'Documentação', prioridade: 'Urgente', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Confirmar regime de bens e avaliar necessidade de pacto antenupcial', categoria: 'Documentação', prioridade: 'Alta', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Verificar documentos e prazos exigidos pelo cartório', categoria: 'Documentação', prioridade: 'Alta', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Definir destino, datas e orçamento da lua de mel', categoria: 'Lua de Mel', prioridade: 'Alta', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Reservar passagens e hospedagem para a lua de mel', categoria: 'Lua de Mel', prioridade: 'Alta', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Conferir seguro-viagem e documentos de viagem', categoria: 'Lua de Mel', prioridade: 'Média', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Escolher alianças e providenciar ajustes ou gravações', categoria: 'Cerimônia', prioridade: 'Alta', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Fazer prova do vestido e do traje', categoria: 'Vestuário', prioridade: 'Média', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Definir maquiagem, penteado e acessórios', categoria: 'Beleza', prioridade: 'Média', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Escolher convites e iniciar produção', categoria: 'Convidados', prioridade: 'Urgente', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Definir lista de presentes ou cotas para lua de mel', categoria: 'Convidados', prioridade: 'Média', fase: '6 Meses Antes', prazo: calcularPrazo(180) },
        { titulo: 'Criar site com data, local, dress code e hospedagem', categoria: 'Convidados', prioridade: 'Média', fase: '6 Meses Antes', prazo: calcularPrazo(180) },

        // 5 meses antes
        { titulo: 'Enviar Save the Date / avisos antecipados', categoria: 'Convidados', prioridade: 'Alta', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Acompanhar a produção dos convites impressos', categoria: 'Convidados', prioridade: 'Média', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Definir decoração floral e elementos da cerimônia', categoria: 'Decoração', prioridade: 'Alta', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Escolher o buquê da noiva', categoria: 'Decoração', prioridade: 'Média', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Definir lapelas, corsages ou flores dos familiares', categoria: 'Decoração', prioridade: 'Baixa', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Escolher lembrancinhas e embalagens', categoria: 'Decoração', prioridade: 'Média', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Definir livro de assinaturas, plaquinhas e sinalização', categoria: 'Decoração', prioridade: 'Baixa', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Planejar o roteiro da cerimônia', categoria: 'Cerimônia', prioridade: 'Alta', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Definir votos e discursos, se desejado', categoria: 'Cerimônia', prioridade: 'Média', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Escolher músicas de entrada, alianças, saída e primeira dança', categoria: 'Cerimônia', prioridade: 'Média', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Verificar necessidades de acessibilidade dos convidados', categoria: 'Convidados', prioridade: 'Média', fase: '5 Meses Antes', prazo: calcularPrazo(150) },
        { titulo: 'Conferir os pagamentos realizados e atualizar o orçamento', categoria: 'Financeiro', prioridade: 'Alta', fase: '5 Meses Antes', prazo: calcularPrazo(150) },

        // 4 meses antes
        { titulo: 'Enviar os convites dentro do prazo adequado', categoria: 'Convidados', prioridade: 'Urgente', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Definir prazo de confirmação de presença (RSVP)', categoria: 'Convidados', prioridade: 'Alta', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Revisar nomes, endereços e informações do convite', categoria: 'Convidados', prioridade: 'Média', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Organizar lista de convidados por família ou grupo', categoria: 'Convidados', prioridade: 'Média', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Planejar transporte, estacionamento e hospedagem', categoria: 'Fornecedores', prioridade: 'Média', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Definir a programação preliminar do dia', categoria: 'Cerimônia', prioridade: 'Alta', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Conferir o tempo contratado para montagem e desmontagem', categoria: 'Recepção', prioridade: 'Média', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Alinhar horários de entrega com os fornecedores', categoria: 'Fornecedores', prioridade: 'Alta', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Definir quem receberá presentes e orientará os convidados', categoria: 'Recepção', prioridade: 'Baixa', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Planejar plano B para chuva em eventos ao ar livre', categoria: 'Recepção', prioridade: 'Urgente', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Confirmar necessidades de gerador, cobertura ou climatização', categoria: 'Recepção', prioridade: 'Alta', fase: '4 Meses Antes', prazo: calcularPrazo(120) },
        { titulo: 'Planejar alimentação da equipe de fornecedores', categoria: 'Fornecedores', prioridade: 'Média', fase: '4 Meses Antes', prazo: calcularPrazo(120) },

        // 3 meses antes
        { titulo: 'Fazer prova do vestido e agendar ajustes finais', categoria: 'Vestuário', prioridade: 'Alta', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Fazer prova do traje do noivo', categoria: 'Vestuário', prioridade: 'Alta', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Agendar testes de cabelo e maquiagem', categoria: 'Beleza', prioridade: 'Média', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Confirmar data, horário e local da cerimônia civil', categoria: 'Documentação', prioridade: 'Urgente', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Entregar os documentos solicitados pelo cartório', categoria: 'Documentação', prioridade: 'Urgente', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Confirmar celebrante e roteiro da cerimônia', categoria: 'Cerimônia', prioridade: 'Alta', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Revisar músicas com DJ, banda ou músicos', categoria: 'Fornecedores', prioridade: 'Média', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Confirmar cardápio, bebidas e quantidade estimada', categoria: 'Fornecedores', prioridade: 'Alta', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Definir distribuição preliminar das mesas', categoria: 'Recepção', prioridade: 'Média', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Confirmar bolo, doces, flores e lembrancinhas', categoria: 'Fornecedores', prioridade: 'Alta', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Planejar fotos com familiares e padrinhos', categoria: 'Fornecedores', prioridade: 'Média', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Organizar lista de fotos indispensáveis', categoria: 'Fornecedores', prioridade: 'Baixa', fase: '3 Meses Antes', prazo: calcularPrazo(90) },
        { titulo: 'Verificar vacinas, vistos e documentos exigidos para viagens', categoria: 'Lua de Mel', prioridade: 'Alta', fase: '3 Meses Antes', prazo: calcularPrazo(90) },

        // 2 meses antes
        { titulo: 'Cobrar confirmações de presença pendentes (RSVP)', categoria: 'Convidados', prioridade: 'Urgente', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Atualizar a lista final provisória de convidados', categoria: 'Convidados', prioridade: 'Alta', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Revisar todos os contratos e valores em aberto', categoria: 'Financeiro', prioridade: 'Alta', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Confirmar os horários de cada fornecedor', categoria: 'Fornecedores', prioridade: 'Alta', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Revisar decoração e disposição do espaço', categoria: 'Decoração', prioridade: 'Média', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Definir entrada dos noivos, padrinhos e familiares', categoria: 'Cerimônia', prioridade: 'Média', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Escrever ou revisar os votos', categoria: 'Cerimônia', prioridade: 'Média', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Comprar acessórios, sapatos e itens que faltam', categoria: 'Vestuário', prioridade: 'Média', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Organizar presentes ou lembranças dos padrinhos', categoria: 'Convidados', prioridade: 'Baixa', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Preparar documentos e cópias necessários para o evento', categoria: 'Documentação', prioridade: 'Alta', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Definir quem ficará responsável por pagamentos e gorjetas', categoria: 'Financeiro', prioridade: 'Média', fase: '2 Meses Antes', prazo: calcularPrazo(60) },
        { titulo: 'Revisar o orçamento e separar verba para despesas finais', categoria: 'Financeiro', prioridade: 'Alta', fase: '2 Meses Antes', prazo: calcularPrazo(60) },

        // 1 mês antes
        { titulo: 'Confirmar número final de convidados com o buffet', categoria: 'Fornecedores', prioridade: 'Urgente', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Enviar a lista final aos fornecedores', categoria: 'Fornecedores', prioridade: 'Alta', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Fechar o mapa de mesas', categoria: 'Recepção', prioridade: 'Alta', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Confirmar cerimônia, recepção e horários de acesso', categoria: 'Cerimônia', prioridade: 'Alta', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Fazer a última prova do vestido e do traje', categoria: 'Vestuário', prioridade: 'Alta', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Retirar ou agendar a retirada das alianças', categoria: 'Cerimônia', prioridade: 'Alta', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Confirmar entrega do buquê e das flores', categoria: 'Decoração', prioridade: 'Média', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Confirmar bolo, doces, bebidas e lembrancinhas', categoria: 'Fornecedores', prioridade: 'Alta', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Conferir pagamentos finais e guardar comprovantes', categoria: 'Financeiro', prioridade: 'Urgente', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Preparar cronograma com contatos dos fornecedores', categoria: 'Fornecedores', prioridade: 'Alta', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Separar documentos, alianças e votos', categoria: 'Cerimônia', prioridade: 'Alta', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Organizar mala da lua de mel', categoria: 'Lua de Mel', prioridade: 'Média', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Separar roupas e itens para o dia seguinte', categoria: 'Vestuário', prioridade: 'Baixa', fase: '1 Mês Antes', prazo: calcularPrazo(30) },
        { titulo: 'Confirmar quem levará e buscará os pertences no local', categoria: 'Recepção', prioridade: 'Média', fase: '1 Mês Antes', prazo: calcularPrazo(30) },

        // 2 semanas antes
        { titulo: 'Confirmar presença dos fornecedores principais', categoria: 'Fornecedores', prioridade: 'Alta', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },
        { titulo: 'Reconfirmar horários e endereços de entrega', categoria: 'Fornecedores', prioridade: 'Alta', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },
        { titulo: 'Checar previsão do tempo e plano alternativo', categoria: 'Recepção', prioridade: 'Alta', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },
        { titulo: 'Fazer o mapa de mesas definitivo', categoria: 'Recepção', prioridade: 'Alta', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },
        { titulo: 'Separar roupas, sapatos e acessórios completos', categoria: 'Vestuário', prioridade: 'Alta', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },
        { titulo: 'Amaciar os sapatos com antecedência', categoria: 'Beleza', prioridade: 'Baixa', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },
        { titulo: 'Confirmar transporte e hospedagem', categoria: 'Lua de Mel', prioridade: 'Média', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },
        { titulo: 'Preparar kit de emergência do dia', categoria: 'Beleza', prioridade: 'Baixa', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },
        { titulo: 'Delegar tarefas aos familiares de confiança', categoria: 'Cerimônia', prioridade: 'Média', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },
        { titulo: 'Conferir documentos para cartório e viagem', categoria: 'Documentação', prioridade: 'Urgente', fase: '2 Semanas Antes', prazo: calcularPrazo(14) },

        // Semana do casamento
        { titulo: 'Fazer a última conferência com o cerimonialista', categoria: 'Fornecedores', prioridade: 'Urgente', fase: 'Semana do Casamento', prazo: calcularPrazo(7) },
        { titulo: 'Confirmar todos os fornecedores por mensagem ou telefone', categoria: 'Fornecedores', prioridade: 'Alta', fase: 'Semana do Casamento', prazo: calcularPrazo(7) },
        { titulo: 'Verificar entrega de alianças, vestido, traje e acessórios', categoria: 'Vestuário', prioridade: 'Urgente', fase: 'Semana do Casamento', prazo: calcularPrazo(7) },
        { titulo: 'Separar documentos pessoais e comprovantes importantes', categoria: 'Documentação', prioridade: 'Alta', fase: 'Semana do Casamento', prazo: calcularPrazo(7) },
        { titulo: 'Deixar os pagamentos previamente organizados', categoria: 'Financeiro', prioridade: 'Alta', fase: 'Semana do Casamento', prazo: calcularPrazo(7) },
        { titulo: 'Entregar lembrancinhas e itens decorativos a quem os transportará', categoria: 'Decoração', prioridade: 'Média', fase: 'Semana do Casamento', prazo: calcularPrazo(7) },
        { titulo: 'Fazer manicure e cuidados pessoais', categoria: 'Beleza', prioridade: 'Média', fase: 'Semana do Casamento', prazo: calcularPrazo(7) },
        { titulo: 'Preparar mala para a noite de núpcias', categoria: 'Lua de Mel', prioridade: 'Baixa', fase: 'Semana do Casamento', prazo: calcularPrazo(7) },
        { titulo: 'Preparar malas e documentos da lua de mel', categoria: 'Lua de Mel', prioridade: 'Média', fase: 'Semana do Casamento', prazo: calcularPrazo(7) },

        // Véspera do casamento
        { titulo: 'Conferir horário de cabelo e maquiagem', categoria: 'Beleza', prioridade: 'Alta', fase: 'Véspera do Casamento', prazo: calcularPrazo(1) },
        { titulo: 'Conferir horário de chegada dos profissionais', categoria: 'Fornecedores', prioridade: 'Alta', fase: 'Véspera do Casamento', prazo: calcularPrazo(1) },
        { titulo: 'Deixar vestido, traje, sapatos e acessórios organizados', categoria: 'Vestuário', prioridade: 'Urgente', fase: 'Véspera do Casamento', prazo: calcularPrazo(1) },
        { titulo: 'Separar alianças com a pessoa responsável', categoria: 'Cerimônia', prioridade: 'Urgente', fase: 'Véspera do Casamento', prazo: calcularPrazo(1) },
        { titulo: 'Deixar documentos e votos acessíveis', categoria: 'Cerimônia', prioridade: 'Alta', fase: 'Véspera do Casamento', prazo: calcularPrazo(1) },
        { titulo: 'Carregar celulares e baterias externas', categoria: 'Cerimônia', prioridade: 'Média', fase: 'Véspera do Casamento', prazo: calcularPrazo(1) },
        { titulo: 'Separar dinheiro ou cartão para emergências', categoria: 'Financeiro', prioridade: 'Média', fase: 'Véspera do Casamento', prazo: calcularPrazo(1) },

        // Dia do casamento
        { titulo: 'Tomar café da manhã reforçado e hidratar-se', categoria: 'Beleza', prioridade: 'Alta', fase: 'Dia do Casamento', prazo: calcularPrazo(0) },
        { titulo: 'Fazer cabelo e maquiagem conforme o cronograma', categoria: 'Beleza', prioridade: 'Urgente', fase: 'Dia do Casamento', prazo: calcularPrazo(0) },
        { titulo: 'Vestir-se com ajuda de alguém de confiança', categoria: 'Vestuário', prioridade: 'Alta', fase: 'Dia do Casamento', prazo: calcularPrazo(0) },
        { titulo: 'Conferir alianças e documentos com o responsável', categoria: 'Cerimônia', prioridade: 'Urgente', fase: 'Dia do Casamento', prazo: calcularPrazo(0) },
        { titulo: 'Garantir que buquê e lapelas estejam no local certo', categoria: 'Decoração', prioridade: 'Alta', fase: 'Dia do Casamento', prazo: calcularPrazo(0) },
        { titulo: 'Chegar à cerimônia conforme orientação do cerimonial', categoria: 'Cerimônia', prioridade: 'Urgente', fase: 'Dia do Casamento', prazo: calcularPrazo(0) },
        { titulo: 'Realizar a cerimônia e assinar a documentação', categoria: 'Cerimônia', prioridade: 'Urgente', fase: 'Dia do Casamento', prazo: calcularPrazo(0) },
        { titulo: 'Aproveitar a recepção e cada momento especial', categoria: 'Recepção', prioridade: 'Baixa', fase: 'Dia do Casamento', prazo: calcularPrazo(0) },

        // Pós-casamento
        { titulo: 'Conferir retirada de presentes, documentos e objetos pessoais', categoria: 'Recepção', prioridade: 'Alta', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) },
        { titulo: 'Verificar devolução de itens alugados', categoria: 'Fornecedores', prioridade: 'Urgente', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) },
        { titulo: 'Conferir cobranças e pagamentos finais', categoria: 'Financeiro', prioridade: 'Alta', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) },
        { titulo: 'Guardar contratos, recibos e certidão de casamento', categoria: 'Documentação', prioridade: 'Média', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) },
        { titulo: 'Acompanhar a entrega de fotos e vídeos', categoria: 'Fornecedores', prioridade: 'Média', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) },
        { titulo: 'Enviar agradecimentos aos convidados e padrinhos', categoria: 'Convidados', prioridade: 'Média', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) },
        { titulo: 'Atualizar sobrenome nos documentos (apenas se houver alteração legal)', categoria: 'Documentação', prioridade: 'Baixa', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) },
        { titulo: 'Guardar lembranças e selecionar fotos para o álbum', categoria: 'Decoração', prioridade: 'Baixa', fase: 'Pós-Casamento', prazo: calcularPrazo(-1) }
      ];

      tarefasBase.forEach(t => {
        const docRef = doc(collection(db, 'casais', casalId, 'tarefas'));
        batch.set(docRef, { ...t, status: 'pendente', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      await batch.commit();
    } catch (error) { console.error(error); } finally { setIsProcessando(false); }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '750px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Checklist Inteligente</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Cronograma mês a mês com priorização em tempo real.</span>
              </div>
              <button onClick={() => setChecklistAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            {/* BARRA DE PROGRESSO */}
            <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '24px', marginBottom: '24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-h)' }}>Progresso Geral</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent)' }}>{progresso}%</span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progresso}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), #10b981)', transition: 'width 0.5s ease-out' }}></div>
              </div>
            </div>

            {tarefas.length === 0 && (
              <div className="animate-fade-in" style={{ textAlign: 'center', padding: '32px 24px', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.02) 100%)', borderRadius: '24px', border: '1px solid rgba(244, 63, 94, 0.2)', marginBottom: '24px' }}>
                <h4 style={{ color: '#f43f5e', fontSize: '1.1rem', margin: '0 0 8px 0' }}>Sua Jornada Começa Aqui</h4>
                <p style={{ color: 'var(--text)', fontSize: '0.85rem', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  Gere a lista oficial completa dividida mês a mês. O sistema calcula a urgência de cada item dinamicamente com base na data do seu evento.
                </p>
                <button onClick={gerarChecklistAutomatico} disabled={isProcessando} style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '16px 24px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)' }}>
                  {isProcessando ? 'Gerando Cronograma...' : 'Criar Linha do Tempo Inteligente'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button onClick={() => setFiltroStatus('todas')} style={{ padding: '8px 16px', borderRadius: '12px', background: filtroStatus === 'todas' ? 'var(--text-h)' : 'transparent', color: filtroStatus === 'todas' ? 'var(--bg)' : 'var(--text)', border: filtroStatus === 'todas' ? 'none' : '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Todas ({tarefas.length})</button>
              <button onClick={() => setFiltroStatus('pendentes')} style={{ padding: '8px 16px', borderRadius: '12px', background: filtroStatus === 'pendentes' ? 'var(--accent)' : 'transparent', color: filtroStatus === 'pendentes' ? '#fff' : 'var(--text)', border: filtroStatus === 'pendentes' ? 'none' : '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Pendentes</button>
              <button onClick={() => setFiltroStatus('concluidas')} style={{ padding: '8px 16px', borderRadius: '12px', background: filtroStatus === 'concluidas' ? '#10b981' : 'transparent', color: filtroStatus === 'concluidas' ? '#fff' : 'var(--text)', border: filtroStatus === 'concluidas' ? 'none' : '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Concluídas</button>
            </div>

            {/* LISTA AGRUPADA MÊS A MÊS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {FASES_TIMELINE.map(faseName => {
                const listaFase = tarefasAgrupadas[faseName];
                if (!listaFase || listaFase.length === 0) return null;

                const concluidasNaFase = listaFase.filter((t: any) => t.status === 'concluida').length;
                const totalNaFase = listaFase.length;

                return (
                  <div key={faseName} className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.05rem', fontWeight: 'bold' }}>{faseName}</h4>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: concluidasNaFase === totalNaFase ? '#10b981' : 'var(--text)', background: 'var(--code-bg)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        {concluidasNaFase}/{totalNaFase} concluídas
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {listaFase.map((t: any) => {
                        const isConcluida = t.status === 'concluida';
                        const infoUrgencia = calcularUrgenciaTarefa(t, diasRestantesCasamento);

                        return (
                          <div key={t.id} onClick={() => abrirFormEdicao(t)} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--code-bg)', padding: '14px 16px', borderRadius: '18px', border: infoUrgencia.nivel === 'atrasada' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)', cursor: 'pointer', opacity: isConcluida ? 0.6 : 1, transition: '0.2s' }}>
                            
                            <button onClick={(e) => alternarStatusRapido(t.id, t.status, e)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: `2px solid ${isConcluida ? '#10b981' : 'var(--border)'}`, background: isConcluida ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: '0.2s' }}>
                              {isConcluida && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </button>
                            
                            <div style={{ flex: 1 }}>
                              <h5 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '0.92rem', textDecoration: isConcluida ? 'line-through' : 'none', lineHeight: '1.3' }}>{t.titulo}</h5>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '6px' }}>{t.categoria}</span>
                                <span style={{ fontSize: '0.7rem', color: infoUrgencia.cor, fontWeight: 'bold' }}>
                                  • {infoUrgencia.badge}
                                </span>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '20px', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0 }}>
              + Adicionar Tarefa Personalizada
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px', paddingRight: '4px' }}>
              
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>O que precisa ser feito?</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Degustação do Buffet..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Fase / Mês</label>
                  <select value={fase} onChange={e => setFase(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    {FASES_TIMELINE.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Data Limite (Opcional)</label>
                  <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Prioridade Manual</label>
                  <select value={prioridade} onChange={e => setPrioridade(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '0.9rem', outline: 'none' }}>
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                  <option value="pendente">Pendente</option>
                  <option value="concluida">Concluída ✔️</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Anotações / Links Relevantes</label>
                <textarea rows={3} value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Contatos, links de orçamento, ideias..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none', resize: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0, marginTop: '8px' }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '16px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '20px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={isProcessando || !titulo} style={{ flex: 2, padding: '16px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!titulo || isProcessando) ? 0.5 : 1 }}>
                {isProcessando ? 'Salvando...' : 'Salvar Tarefa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};