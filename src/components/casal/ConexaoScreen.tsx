import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, onSnapshot, arrayUnion, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

// ✨ ÍCONES BLINDADOS (Base64)
const ICON_SEND = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='22' y1='2' x2='11' y2='13'/%3E%3Cpolygon points='22 2 15 22 11 13 2 9 22 2'/%3E%3C/svg%3E";
const ICON_HEART = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ef4444' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/%3E%3C/svg%3E";
const ICON_CHART = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='3' y1='9' x2='21' y2='9'/%3E%3Cline x1='9' y1='21' x2='9' y2='9'/%3E%3C/svg%3E";
const ICON_SMILE = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M8 14s1.5 2 4 2 4-2 4-2'/%3E%3Cline x1='9' y1='9' x2='9.01' y2='9'/%3E%3Cline x1='15' y1='9' x2='15.01' y2='9'/%3E%3C/svg%3E";
const ICON_EDIT = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'/%3E%3C/svg%3E";
const ICON_CHECK_LIST = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E";
const ICON_CHECK = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E";
const ICON_FOOD = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 8h1a4 4 0 0 1 0 8h-1'/%3E%3Cpath d='M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z'/%3E%3Cline x1='6' y1='1' x2='6' y2='4'/%3E%3Cline x1='10' y1='1' x2='10' y2='4'/%3E%3Cline x1='14' y1='1' x2='14' y2='4'/%3E%3C/svg%3E";

// Ícones de Leitura estilo WhatsApp
const ICON_CHECK_SENT = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E";
const ICON_CHECK_READ = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 6 7 17l-5-5'/%3E%3Cpath d='m22 10-7.5 7.5L13 16'/%3E%3C/svg%3E";

export const ConexaoScreen = ({ 
  casalId, currentUserRole, meuNome, parceiro1, parceiro2, corP1, corP2,
  formatMoney, totalCofre, limiteMensalLazer, saidas 
}: any) => {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novoTexto, setNovoTexto] = useState('');
  
  const [pautas, setPautas] = useState<any[]>([]);
  const [novaPauta, setNovaPauta] = useState('');
  const [pautaEditandoId, setPautaEditandoId] = useState<string | null>(null);
  const [textoPautaEditado, setTextoPautaEditado] = useState('');

  const [abaAtiva, setAbaAtiva] = useState<'chat' | 'alinhamento'>('chat');
  const [isProcessando, setIsProcessando] = useState(false);
  
  // ✨ Status em Tempo Real
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<any>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const minhaCor = currentUserRole === 'p1' ? corP1 : corP2;
  const nomeParceiro = currentUserRole === 'p1' ? parceiro2 : parceiro1;
  const meuRoleUpper = currentUserRole.toUpperCase(); // 'P1' ou 'P2'
  const partnerRoleUpper = currentUserRole === 'p1' ? 'P2' : 'P1';

  // Atualizar meu "Visto por último"
  useEffect(() => {
    if (!casalId) return;
    const atualizarPresenca = async () => {
      await updateDoc(doc(db, 'casais', casalId), {
        [`lastSeen${meuRoleUpper}`]: serverTimestamp()
      });
    };
    atualizarPresenca();
    // Atualiza a cada 1 minuto enquanto estiver com a tela aberta
    const interval = setInterval(atualizarPresenca, 60000); 
    return () => clearInterval(interval);
  }, [casalId, meuRoleUpper]);

  // Escutar Digitação e Visto por último do Parceiro e Pautas
  useEffect(() => {
    if (!casalId) return;
    const unsub = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.pautasAlinhamento) setPautas(data.pautasAlinhamento);
        setPartnerTyping(data[`typing${partnerRoleUpper}`] || false);
        setPartnerLastSeen(data[`lastSeen${partnerRoleUpper}`] || null);
      }
    });
    return () => unsub();
  }, [casalId, partnerRoleUpper]);

  // Escutar o Chat e Marcar como Lida
  useEffect(() => {
    if (!casalId) return;
    const q = query(collection(db, 'casais', casalId, 'chat'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMensagens(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // ✨ Sistema de Leitura: Se a mensagem não é minha e não está lida, marca como lida!
      if (abaAtiva === 'chat') {
        msgs.forEach(msg => {
          if (msg.sender !== currentUserRole && !msg.lida) {
            updateDoc(doc(db, 'casais', casalId, 'chat', msg.id), { lida: true });
          }
        });
      }
    });
    return () => unsub();
  }, [casalId, currentUserRole, abaAtiva]);

  // Função para formatar o Visto por Último
  const formatarLastSeen = (timestamp: any) => {
    if (!timestamp) return 'Online há pouco';
    const data = timestamp.toDate();
    const agora = new Date();
    const diffMinutos = (agora.getTime() - data.getTime()) / 60000;
    
    if (diffMinutos < 2) return 'Online';
    
    const ontem = new Date(agora);
    ontem.setDate(ontem.getDate() - 1);
    
    if (data.getDate() === agora.getDate() && data.getMonth() === agora.getMonth()) {
        return `Visto hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (data.getDate() === ontem.getDate() && data.getMonth() === ontem.getMonth()) {
        return `Visto ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `Visto em ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatarHora = (timestamp: any) => {
    if (!timestamp) return '...';
    const data = timestamp.toDate();
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // ✨ Lógica de Digitação
  const handleTyping = async (e: any) => {
    setNovoTexto(e.target.value);
    if (!casalId) return;

    await updateDoc(doc(db, 'casais', casalId), {
      [`typing${meuRoleUpper}`]: true,
      [`lastSeen${meuRoleUpper}`]: serverTimestamp()
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await updateDoc(doc(db, 'casais', casalId), {
        [`typing${meuRoleUpper}`]: false
      });
    }, 2000);
  };

  const enviarMensagem = async (texto: string, isAutomatica: boolean = false) => {
    if (!texto.trim() || !casalId) return;
    setIsProcessando(true);
    const msg = texto.trim();
    setNovoTexto('');
    clearTimeout(typingTimeoutRef.current);

    try {
      await updateDoc(doc(db, 'casais', casalId), { [`typing${meuRoleUpper}`]: false });

      await addDoc(collection(db, 'casais', casalId, 'chat'), {
        texto: msg,
        sender: currentUserRole,
        isAutomatica: isAutomatica,
        lida: false,
        createdAt: serverTimestamp()
      });

      if (!isAutomatica) {
        await updateDoc(doc(db, 'casais', casalId), {
          notificacoes: arrayUnion({
            id: Date.now().toString(),
            texto: `Nova mensagem de ${meuNome}: ${msg}`,
            lida: false,
            createdAt: new Date().toISOString()
          })
        });
      }
    } catch (error) {
    } finally {
      setIsProcessando(false);
    }
  };

  const gerarResumoAutomatico = () => {
    const hoje = new Date();
    const mesAtualNum = hoje.getMonth();
    const anoAtualNum = hoje.getFullYear();
    let gastoEPlanejado = 0;

    (saidas || []).forEach((s: any) => {
      if (s.dataRaw) {
        const [anoStr, mesStr] = s.dataRaw.split('-');
        if (parseInt(anoStr) === anoAtualNum && parseInt(mesStr) - 1 === mesAtualNum) {
          gastoEPlanejado += Number(s.estimado || 0);
        }
      }
    });

    const restanteLazer = (limiteMensalLazer || 0) - gastoEPlanejado;
    const textoResumo = `📊 Resumo Atualizado:\n• Cofre do Casal: ${formatMoney(totalCofre || 0)}\n• Lazer Disponível: ${formatMoney(restanteLazer)}`;
    enviarMensagem(textoResumo, true);
  };

  const adicionarPauta = async () => {
    if (!novaPauta.trim() || !casalId) return;
    setIsProcessando(true);
    try {
      const novaPautaObj = {
        id: Date.now().toString(),
        texto: novaPauta.trim(),
        criadoPor: meuNome,
        concluido: false
      };
      await updateDoc(doc(db, 'casais', casalId), {
        pautasAlinhamento: arrayUnion(novaPautaObj)
      });
      setNovaPauta('');
    } catch (error) {} finally { setIsProcessando(false); }
  };

  const togglePauta = async (pauta: any) => {
    if (!casalId) return;
    const pautasAtualizadas = pautas.map(p => p.id === pauta.id ? { ...p, concluido: !p.concluido } : p);
    await updateDoc(doc(db, 'casais', casalId), { pautasAlinhamento: pautasAtualizadas });
  };

  const apagarPauta = async (pauta: any) => {
    if (!casalId) return;
    const pautasAtualizadas = pautas.filter(p => p.id !== pauta.id);
    await updateDoc(doc(db, 'casais', casalId), { pautasAlinhamento: pautasAtualizadas });
  };

  const iniciarEdicaoPauta = (pauta: any) => {
    setPautaEditandoId(pauta.id);
    setTextoPautaEditado(pauta.texto);
  };

  const salvarPautaEditada = async (id: string) => {
    if (!casalId || !textoPautaEditado.trim()) return;
    const pautasAtualizadas = pautas.map(p => p.id === id ? { ...p, texto: textoPautaEditado.trim() } : p);
    await updateDoc(doc(db, 'casais', casalId), { pautasAlinhamento: pautasAtualizadas });
    setPautaEditandoId(null);
  };

  const renderMensagens = () => {
    let ultimaData = '';
    const hojeData = new Date();
    const hojeStr = hojeData.toLocaleDateString('pt-BR');
    const ontemData = new Date(hojeData);
    ontemData.setDate(ontemData.getDate() - 1);
    const ontemStr = ontemData.toLocaleDateString('pt-BR');

    return mensagens.map((msg) => {
      const msgDate = msg.createdAt ? msg.createdAt.toDate() : new Date();
      const dateStr = msgDate.toLocaleDateString('pt-BR');
      let divisor = null;

      if (dateStr !== ultimaData) {
        ultimaData = dateStr;
        let label = dateStr;
        if (dateStr === hojeStr) label = 'Hoje';
        else if (dateStr === ontemStr) label = 'Ontem';

        divisor = (
          <div key={`data-${dateStr}`} style={{ textAlign: 'center', margin: '16px 0 8px 0', width: '100%' }}>
            <span style={{ background: 'var(--bg)', color: 'var(--text)', fontSize: '0.75rem', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid var(--border)' }}>
              {label}
            </span>
          </div>
        );
      }

      if (msg.isAutomatica) {
        return (
          <React.Fragment key={msg.id}>
            {divisor}
            <div style={{ textAlign: 'center', margin: '8px 0', width: '100%' }}>
              <span style={{ display: 'inline-block', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.8rem', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                {msg.texto}
              </span>
            </div>
          </React.Fragment>
        );
      }

      const isMine = msg.sender === currentUserRole;

      return (
        <React.Fragment key={msg.id}>
          {divisor}
          <div style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: isMine ? minhaCor : 'var(--bg)',
              color: isMine ? '#fff' : 'var(--text-h)',
              padding: '8px 10px 4px 12px',
              borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0',
              border: isMine ? 'none' : '1px solid var(--border)',
              fontSize: '0.95rem',
              lineHeight: '1.4',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '80px'
            }}>
              <span style={{ paddingBottom: '16px', whiteSpace: 'pre-wrap' }}>{msg.texto}</span>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                position: 'absolute', 
                bottom: '4px', 
                right: '8px' 
              }}>
                <span style={{ fontSize: '0.65rem', color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text)' }}>
                  {formatarHora(msg.createdAt)}
                </span>
                {/* ✨ Ícones de Visualização do WhatsApp */}
                {isMine && (
                  <img src={msg.lida ? ICON_CHECK_READ : ICON_CHECK_SENT} style={{ width: 14, height: 14, opacity: msg.lida ? 1 : 0.7 }} />
                )}
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', paddingBottom: '20px' }}>
      
      {/* ✨ HEADER DO CHAT COM STATUS ONLINE */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--text-h)', margin: '0 0 4px 0', fontSize: '1.4rem' }}>{abaAtiva === 'chat' ? nomeParceiro : 'Nosso Espaço'}</h2>
          {abaAtiva === 'chat' && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: partnerTyping ? minhaCor : 'var(--text)', fontWeight: partnerTyping ? 'bold' : 'normal', transition: '0.3s' }}>
              {partnerTyping ? 'digitando...' : formatarLastSeen(partnerLastSeen)}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', background: 'var(--code-bg)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '16px' }}>
        <button onClick={() => setAbaAtiva('chat')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: abaAtiva === 'chat' ? 'var(--bg)' : 'transparent', color: abaAtiva === 'chat' ? 'var(--text-h)' : 'var(--text)', fontWeight: 'bold', boxShadow: abaAtiva === 'chat' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: '0.2s', cursor: 'pointer' }}>
          Conversa
        </button>
        <button onClick={() => setAbaAtiva('alinhamento')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: abaAtiva === 'alinhamento' ? 'var(--bg)' : 'transparent', color: abaAtiva === 'alinhamento' ? 'var(--text-h)' : 'var(--text)', fontWeight: 'bold', boxShadow: abaAtiva === 'alinhamento' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: '0.2s', cursor: 'pointer' }}>
          Alinhamento
        </button>
      </div>

      {abaAtiva === 'chat' && (
        <>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
            {/* BOTÕES DE MENSAGENS RÁPIDAS (Agora com mensagens reais do dia a dia) */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
            
            {/* Botão de Sistema */}
            <button onClick={gerarResumoAutomatico} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', border: `1px solid rgba(59, 130, 246, 0.4)`, color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
              <img src={ICON_CHART} style={{ width: 16, height: 16 }} /> Saldo do Casal
            </button>

            {/* Mimos Rápidos */}
            <button onClick={() => enviarMensagem("Te amo demais! ❤️", true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', border: `1px solid rgba(239, 68, 68, 0.4)`, color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
              <img src={ICON_HEART} style={{ width: 16, height: 16 }} /> Te amo!
            </button>

            <button onClick={() => enviarMensagem("Tô com tanta saudade de você...", true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '20px', background: 'rgba(139, 92, 246, 0.1)', border: `1px solid rgba(139, 92, 246, 0.4)`, color: '#8b5cf6', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
              <img src={ICON_SMILE} style={{ width: 16, height: 16 }} /> Tô com sdds
            </button>

            <button onClick={() => enviarMensagem("Bora jantar fora hoje?", true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '20px', background: 'rgba(249, 115, 22, 0.1)', border: `1px solid rgba(249, 115, 22, 0.4)`, color: '#f97316', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
              <img src={ICON_FOOD} style={{ width: 16, height: 16 }} /> Bora jantar?
            </button>
            
            <button onClick={() => enviarMensagem("Já estou saindo!", true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', border: `1px solid rgba(16, 185, 129, 0.4)`, color: '#10b981', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
              <img src={ICON_CHECK} style={{ width: 16, height: 16 }} /> Já tô saindo!
            </button>
          </div>
          </div>

          <div style={{ 
            flex: 1, 
            background: 'var(--code-bg)', 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")', 
            borderRadius: '24px', 
            border: '1px solid var(--border)', 
            padding: '16px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            marginBottom: '16px' 
          }}>
            {mensagens.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text)', margin: 'auto', fontSize: '0.9rem', background: 'var(--bg)', padding: '8px 16px', borderRadius: '16px' }}>Inicie a conversa!</p>
            ) : (
              renderMensagens()
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ display: 'flex', gap: '12px', background: 'var(--code-bg)', padding: '6px 10px', borderRadius: '30px', border: '1px solid var(--border)', flexShrink: 0 }}>
            <input 
              type="text" 
              value={novoTexto} 
              onChange={handleTyping} 
              onKeyDown={e => e.key === 'Enter' && enviarMensagem(novoTexto)}
              placeholder="Mensagem..." 
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-h)', padding: '8px 12px', outline: 'none', fontSize: '1rem' }}
            />
            <button 
              onClick={() => enviarMensagem(novoTexto)}
              disabled={!novoTexto.trim() || isProcessando}
              style={{ background: minhaCor, border: 'none', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: !novoTexto.trim() ? 0.5 : 1, transition: '0.2s' }}
            >
              <img src={ICON_SEND} alt="Enviar" style={{ width: '18px', height: '18px', transform: 'translateX(-1px)' }} />
            </button>
          </div>
        </>
      )}

      {abaAtiva === 'alinhamento' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Pautas do Mês</h3>
            <p style={{ color: 'var(--text)', margin: '0 0 20px 0', fontSize: '0.9rem', lineHeight: '1.4' }}>Anote aqui assuntos importantes ou planos que precisam conversar na próxima reunião.</p>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={novaPauta} 
                onChange={e => setNovaPauta(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && adicionarPauta()}
                placeholder="Ex: Discutir teto do lazer" 
                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }}
              />
              <button 
                onClick={adicionarPauta}
                disabled={!novaPauta.trim() || isProcessando}
                style={{ padding: '0 20px', borderRadius: '16px', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Adicionar
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pautas.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text)', marginTop: '20px' }}>Nenhuma pauta anotada. Tudo alinhado!</p>
            ) : (
              pautas.map((pauta) => (
                <div key={pauta.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--code-bg)', padding: '16px 20px', borderRadius: '20px', border: `1px solid ${pauta.concluido ? 'var(--border)' : 'var(--accent)'}`, opacity: pauta.concluido ? 0.6 : 1, transition: '0.2s' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                    <div onClick={() => togglePauta(pauta)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: `2px solid ${pauta.concluido ? 'var(--text)' : 'var(--accent)'}`, background: pauta.concluido ? 'var(--text)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      {pauta.concluido && <img src={ICON_CHECK_LIST} style={{ width: 14, height: 14 }} />}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      {pautaEditandoId === pauta.id ? (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                          <input 
                            autoFocus
                            type="text" 
                            value={textoPautaEditado} 
                            onChange={(e) => setTextoPautaEditado(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && salvarPautaEditada(pauta.id)}
                            style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--accent)', color: 'var(--text-h)', padding: '4px 8px', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }} 
                          />
                          <button onClick={() => salvarPautaEditada(pauta.id)} style={{ background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '0 8px', cursor: 'pointer' }}>
                             <img src={ICON_CHECK_LIST} style={{ width: 16, height: 16, stroke: '#fff' }} />
                          </button>
                        </div>
                      ) : (
                        <p style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1rem', fontWeight: pauta.concluido ? 'normal' : 'bold', textDecoration: pauta.concluido ? 'line-through' : 'none', wordBreak: 'break-word' }}>
                          {pauta.texto}
                        </p>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Por {pauta.criadoPor}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!pauta.concluido && pautaEditandoId !== pauta.id && (
                      <button onClick={() => iniciarEdicaoPauta(pauta)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px' }}>
                        <img src={ICON_EDIT} style={{ width: 18, height: 18, opacity: 0.6 }} />
                      </button>
                    )}
                    <button onClick={() => apagarPauta(pauta)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', padding: '4px' }}>
                      ✕
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};