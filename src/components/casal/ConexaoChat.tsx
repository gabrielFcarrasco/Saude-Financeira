import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, onSnapshot, arrayUnion, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ICON_SEND = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='22' y1='2' x2='11' y2='13'/%3E%3Cpolygon points='22 2 15 22 11 13 2 9 22 2'/%3E%3C/svg%3E";
const ICON_HEART = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ef4444' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/%3E%3C/svg%3E";
const ICON_CHART = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='3' y1='9' x2='21' y2='9'/%3E%3Cline x1='9' y1='21' x2='9' y2='9'/%3E%3C/svg%3E";
const ICON_SMILE = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M8 14s1.5 2 4 2 4-2 4-2'/%3E%3Cline x1='9' y1='9' x2='9.01' y2='9'/%3E%3Cline x1='15' y1='9' x2='15.01' y2='9'/%3E%3C/svg%3E";
const ICON_CHECK = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E";
const ICON_FOOD = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 8h1a4 4 0 0 1 0 8h-1'/%3E%3Cpath d='M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z'/%3E%3Cline x1='6' y1='1' x2='6' y2='4'/%3E%3Cline x1='10' y1='1' x2='10' y2='4'/%3E%3Cline x1='14' y1='1' x2='14' y2='4'/%3E%3C/svg%3E";
const ICON_CHECK_SENT = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E";
const ICON_CHECK_READ = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 6 7 17l-5-5'/%3E%3Cpath d='m22 10-7.5 7.5L13 16'/%3E%3C/svg%3E";
const ICON_EMOJI_NEUTRAL = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M8 14s1.5 2 4 2 4-2 4-2'/%3E%3Cline x1='9' y1='9' x2='9.01' y2='9'/%3E%3Cline x1='15' y1='9' x2='15.01' y2='9'/%3E%3C/svg%3E";

export const ConexaoChat = ({ 
  casalId, currentUserRole, meuNome, minhaCor, formatMoney, totalCofre, limiteMensalLazer, saidas 
}: any) => {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novoTexto, setNovoTexto] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);
  const [emojis, setEmojis] = useState<any[]>([]);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const meuRoleUpper = currentUserRole.toUpperCase(); 

  useEffect(() => {
    fetch('https://emoji-api.com/categories/smileys-emotion?access_key=13843fb195298870e0d73f763a7fa67840e859ba')
      .then(res => res.json())
      .then(data => { if (data && data.length > 0) setEmojis(data); })
      .catch(e => console.log("Erro ao buscar emojis:", e));
  }, []);

  useEffect(() => {
    if (!casalId) return;
    const atualizarPresenca = async () => {
      await updateDoc(doc(db, 'casais', casalId), { [`lastSeen${meuRoleUpper}`]: serverTimestamp() });
    };
    atualizarPresenca();
    const interval = setInterval(atualizarPresenca, 60000); 
    return () => clearInterval(interval);
  }, [casalId, meuRoleUpper]);

  useEffect(() => {
    if (!casalId) return;
    const q = query(collection(db, 'casais', casalId, 'chat'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMensagens(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      msgs.forEach(msg => {
        if (msg.sender !== currentUserRole && !msg.lida) {
          updateDoc(doc(db, 'casais', casalId, 'chat', msg.id), { lida: true });
        }
      });
    });
    return () => unsub();
  }, [casalId, currentUserRole]);

  const formatarHora = (timestamp: any) => {
    if (!timestamp) return '...';
    const data = timestamp.toDate();
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleInputText = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNovoTexto(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    if (!casalId) return;
    await updateDoc(doc(db, 'casais', casalId), { [`typing${meuRoleUpper}`]: true, [`lastSeen${meuRoleUpper}`]: serverTimestamp() });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await updateDoc(doc(db, 'casais', casalId), { [`typing${meuRoleUpper}`]: false });
    }, 2000);
  };

  const addEmoji = (emojiChar: string) => {
    setNovoTexto(prev => prev + emojiChar);
    setMostrarEmojis(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem(novoTexto);
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
  };

  // Removido o isAutomatica para as mensagens rápidas irem como o usuário!
  const enviarMensagem = async (texto: string) => {
    if (!texto.trim() || !casalId) return;
    setIsProcessando(true);
    const msg = texto.trim();
    setNovoTexto('');
    setMostrarEmojis(false);
    clearTimeout(typingTimeoutRef.current);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      await updateDoc(doc(db, 'casais', casalId), { [`typing${meuRoleUpper}`]: false });

      await addDoc(collection(db, 'casais', casalId, 'chat'), {
        texto: msg,
        sender: currentUserRole,
        isAutomatica: false, // Agora todas vão com o seu balãozinho!
        lida: false,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'casais', casalId), {
        notificacoes: arrayUnion({
          id: Date.now().toString(),
          texto: `Nova mensagem de ${meuNome}: ${msg}`,
          lida: false,
          createdAt: new Date().toISOString()
        })
      });
      
    } catch (error) {} finally { setIsProcessando(false); }
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
    enviarMensagem(textoResumo);
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
              background: isMine ? minhaCor : 'var(--code-bg)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'absolute', bottom: '4px', right: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text)' }}>
                  {formatarHora(msg.createdAt)}
                </span>
                {isMine && (
                  <img src={msg.lida ? ICON_CHECK_READ : ICON_CHECK_SENT} style={{ width: 14, height: 14, opacity: msg.lida ? 1 : 0.7 }} alt="status" />
                )}
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: '24px', padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {mensagens.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text)', margin: 'auto', fontSize: '0.9rem', background: 'var(--code-bg)', padding: '8px 16px', borderRadius: '16px', border: '1px solid var(--border)' }}>Inicie a conversa!</p>
        ) : (
          renderMensagens()
        )}
        <div ref={chatEndRef} />
      </div>

      {novoTexto.trim() === '' && (
        <div className="animate-fade-in" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
          <button onClick={gerarResumoAutomatico} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', border: `1px solid rgba(59, 130, 246, 0.4)`, color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
            <img src={ICON_CHART} style={{ width: 14, height: 14 }} alt="chart" /> Saldo do Casal
          </button>
          <button onClick={() => enviarMensagem("Te amo demais! ❤️")} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', border: `1px solid rgba(239, 68, 68, 0.4)`, color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
            <img src={ICON_HEART} style={{ width: 14, height: 14 }} alt="heart" /> Te amo!
          </button>
          <button onClick={() => enviarMensagem("Tô com tanta saudade de você...")} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', background: 'rgba(139, 92, 246, 0.1)', border: `1px solid rgba(139, 92, 246, 0.4)`, color: '#8b5cf6', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
            <img src={ICON_SMILE} style={{ width: 14, height: 14 }} alt="smile" /> Tô com sdds
          </button>
          <button onClick={() => enviarMensagem("Bora jantar fora hoje?")} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', background: 'rgba(249, 115, 22, 0.1)', border: `1px solid rgba(249, 115, 22, 0.4)`, color: '#f97316', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
            <img src={ICON_FOOD} style={{ width: 14, height: 14 }} alt="food" /> Bora jantar?
          </button>
          <button onClick={() => enviarMensagem("Já estou saindo!")} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', border: `1px solid rgba(16, 185, 129, 0.4)`, color: '#10b981', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
            <img src={ICON_CHECK} style={{ width: 14, height: 14 }} alt="check" /> Já tô saindo!
          </button>
        </div>
      )}

      {mostrarEmojis && (
        <div style={{ position: 'absolute', bottom: '60px', left: 0, right: '60px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '12px', maxHeight: '200px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))', gap: '8px', zIndex: 10, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
          {emojis.slice(0, 150).map((emoji: any) => (
            <button key={emoji.slug} onClick={() => addEmoji(emoji.character)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '4px' }}>
              {emoji.character}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'flex-end', position: 'relative' }}>
        
        <div style={{ flex: 1, background: 'var(--code-bg)', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', padding: '8px 12px' }}>
          <button onClick={() => setMostrarEmojis(!mostrarEmojis)} style={{ background: 'transparent', border: 'none', padding: '4px 8px 4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={ICON_EMOJI_NEUTRAL} style={{ width: 22, height: 22 }} alt="emoji" />
          </button>
          
          <textarea 
            ref={inputRef}
            rows={1}
            value={novoTexto} 
            onChange={handleInputText} 
            onKeyDown={handleKeyDown}
            placeholder="Mensagem" 
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-h)', outline: 'none', fontSize: '1rem', resize: 'none', minHeight: '24px', maxHeight: '120px', padding: '2px 0', fontFamily: 'inherit', lineHeight: '1.4' }}
          />
          
          {/* REMOVIDO O CLIPS DAQUI! */}
        </div>

        <button 
          onClick={() => enviarMensagem(novoTexto)}
          disabled={!novoTexto.trim() || isProcessando}
          style={{ background: minhaCor, border: 'none', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: !novoTexto.trim() ? 0.5 : 1, transition: '0.2s', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        >
          <img src={ICON_SEND} alt="Enviar" style={{ width: '20px', height: '20px', transform: 'translateX(-2px)' }} />
        </button>

      </div>
    </div>
  );
};