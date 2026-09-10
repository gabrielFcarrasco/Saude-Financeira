import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const CasamentoModalCronograma = ({
  cronogramaAberto, setCronogramaAberto, casalId, eventos
}: any) => {

  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  const [horario, setHorario] = useState('10:00');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [responsavel, setResponsavel] = useState('');

  const [isProcessando, setIsProcessando] = useState(false);

  if (!cronogramaAberto) return null;

  const eventosOrdenados = [...eventos].sort((a, b) => a.horario.localeCompare(b.horario));

  const abrirFormNovo = () => {
    setIdEdicao(null); setHorario('10:00'); setTitulo(''); setDescricao(''); setLocalizacao(''); setResponsavel('');
    setFormAberto(true);
  };

  const abrirFormEdicao = (e: any) => {
    setIdEdicao(e.id); setHorario(e.horario); setTitulo(e.titulo); setDescricao(e.descricao || ''); setLocalizacao(e.localizacao || ''); setResponsavel(e.responsavel || '');
    setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !titulo || !horario) return;
    setIsProcessando(true);
    try {
      const payload = { horario, titulo, descricao, localizacao, responsavel, updatedAt: serverTimestamp() };
      if (idEdicao) {
        await updateDoc(doc(db, 'casais', casalId, 'cronograma', idEdicao), payload);
      } else {
        await addDoc(collection(db, 'casais', casalId, 'cronograma'), { ...payload, createdAt: serverTimestamp() });
      }
      setFormAberto(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Remover este evento do cronograma?")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'cronograma', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Cronograma do Dia</h3>
              <button onClick={() => setCronogramaAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1, overflowY: 'auto', position: 'relative' }}>
              {eventosOrdenados.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text)', marginTop: '24px', fontSize: '0.9rem' }}>Nenhum evento agendado para o dia.</p>
              ) : (
                <div style={{ borderLeft: '2px dashed var(--border)', marginLeft: '12px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {eventosOrdenados.map((ev: any) => (
                    <div key={ev.id} onClick={() => abrirFormEdicao(ev)} style={{ position: 'relative', background: 'var(--code-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <div style={{ position: 'absolute', left: '-33px', top: '16px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent)', border: '4px solid var(--bg)' }}></div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>{ev.horario}</span>
                          <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1.05rem' }}>{ev.titulo}</h4>
                        </div>
                      </div>
                      
                      {ev.descricao && <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.4' }}>{ev.descricao}</p>}
                      
                      {(ev.localizacao || ev.responsavel) && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                          {ev.localizacao && <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>📍 {ev.localizacao}</span>}
                          {ev.responsavel && <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>👤 {ev.responsavel}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '24px', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)' }}>
              + Adicionar Evento
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Evento' : 'Novo Evento'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Horário</label>
                  <input type="time" value={horario} onChange={e => setHorario(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Título do Evento</label>
                  <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Dia da Noiva, Fotos..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Descrição Rápida</label>
                <textarea rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none', resize: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Local</label>
                  <input type="text" value={localizacao} onChange={e => setLocalizacao(e.target.value)} placeholder="Ex: Hotel, Igreja..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Responsável</label>
                  <input type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Ex: Fotógrafo, Cerimonial..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              {idEdicao && (
                <button onClick={handleExcluir} disabled={isProcessando} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={isProcessando || !titulo || !horario} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!titulo || !horario || isProcessando) ? 0.5 : 1 }}>
                {isProcessando ? 'Salvando...' : 'Salvar Evento'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};