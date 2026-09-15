import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, onSnapshot, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CATEGORIAS_MURAL = ['Inspiração', 'Lua de Mel', 'Decoração', 'Música', 'Look', 'Casa Nova', 'Outros'];

export const CasamentoModalMuralIdeias = ({
  muralAberto, setMuralAberto, casalId, usuarioAtual
}: any) => {

  const [ideias, setIdeias] = useState<any[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [ideiaFocada, setIdeiaFocada] = useState<any | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

  // Estados do Formulário
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [linkRef, setLinkRef] = useState('');
  const [imagemUrl, setImagemUrl] = useState(''); // NOVO: Estado para a Imagem
  const [categoria, setCategoria] = useState('Inspiração');
  
  // Estado de Comentário
  const [novoComentario, setNovoComentario] = useState('');

  // Simulação de usuário caso não venha na prop
  const userMock = usuarioAtual || { id: 'user_local', nome: 'Eu' };

  useEffect(() => {
    if (!casalId || !muralAberto) return;
    const q = query(collection(db, 'casais', casalId, 'ideias'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setIdeias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [casalId, muralAberto]);

  useEffect(() => {
    if (ideiaFocada) {
      const ideiaAtualizada = ideias.find(i => i.id === ideiaFocada.id);
      if (ideiaAtualizada) setIdeiaFocada(ideiaAtualizada);
    }
  }, [ideias]);

  if (!muralAberto) return null;

  const abrirFormNovo = () => {
    setTitulo(''); setDescricao(''); setLinkRef(''); setImagemUrl(''); setCategoria('Inspiração');
    setIdeiaFocada(null);
    setFormAberto(true);
  };

  const handleSalvarIdeia = async () => {
    if (!casalId || !titulo) return;
    setIsProcessando(true);
    try {
      await addDoc(collection(db, 'casais', casalId, 'ideias'), {
        titulo, descricao, linkRef, imagemUrl, categoria, // NOVO: imagemUrl salva no banco
        criadoPor: userMock.nome,
        criadoPorId: userMock.id,
        likes: [],
        comentarios: [],
        createdAt: serverTimestamp()
      });
      setFormAberto(false);
    } catch (e) { console.error(e); } finally { setIsProcessando(false); }
  };

  const handleExcluir = async (id: string) => {
    if (!window.confirm("Apagar esta ideia do mural?")) return;
    try { await deleteDoc(doc(db, 'casais', casalId, 'ideias', id)); setIdeiaFocada(null); } catch (e) {}
  };

  const toggleLike = async (ideia: any, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!casalId) return;
    const jaCurtiu = ideia.likes?.includes(userMock.id);
    const ref = doc(db, 'casais', casalId, 'ideias', ideia.id);
    try {
      await updateDoc(ref, {
        likes: jaCurtiu ? arrayRemove(userMock.id) : arrayUnion(userMock.id)
      });
    } catch (error) { console.error(error); }
  };

  const enviarComentario = async () => {
    if (!novoComentario.trim() || !ideiaFocada || !casalId) return;
    setIsProcessando(true);
    try {
      const comentarioObj = {
        id: Date.now().toString(),
        autor: userMock.nome,
        autorId: userMock.id,
        texto: novoComentario,
        data: new Date().toISOString()
      };
      await updateDoc(doc(db, 'casais', casalId, 'ideias', ideiaFocada.id), {
        comentarios: arrayUnion(comentarioObj)
      });
      setNovoComentario('');
    } catch (e) { console.error(e); } finally { setIsProcessando(false); }
  };

  return createPortal(
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.4)', // Fundo Glassmorphism
      backdropFilter: 'blur(8px)',   
      WebkitBackdropFilter: 'blur(8px)', 
      zIndex: 99999, 
      display: 'flex', 
      alignItems: 'flex-end', 
      justifyContent: 'center' 
    }}>
      
      {/* NOVO: Estilos embutidos para o Masonry Layout e Animações Hover */}
      <style>{`
        .masonry-grid {
          column-count: 2;
          column-gap: 16px;
        }
        @media (max-width: 600px) {
          .masonry-grid { column-count: 1; }
        }
        .card-ideia {
          break-inside: avoid;
          margin-bottom: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .card-ideia:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
      `}</style>

      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '800px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {/* TELA PRINCIPAL: O MURAL */}
        {!formAberto && !ideiaFocada && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✨ Mural dos Sonhos
                </h3>
              </div>
              <button onClick={() => setMuralAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(236, 72, 153, 0.3)', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ec4899', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                Regra de Ouro: Proibido Limites!
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', lineHeight: '1.5' }}>
                Este é o espaço livre de vocês. Viu uma referência incrível no Pinterest ou Instagram? Jogue aqui! O objetivo é descobrir o que agrada os dois. Se ambos curtirem o mesmo card, vocês darão um <strong>MATCH 🔥</strong>. Usem os comentários para refinar as ideias.
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {ideias.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text)' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>💭</span>
                  <p>O mural está em branco. Qual é a primeira grande ideia de vocês?</p>
                </div>
              ) : (
                /* NOVO: Layout Masonry estilo Pinterest */
                <div className="masonry-grid">
                  {ideias.map(ideia => {
                    const likesCount = ideia.likes?.length || 0;
                    const euCurti = ideia.likes?.includes(userMock.id);
                    const isMatch = likesCount >= 2; 

                    return (
                      <div key={ideia.id} onClick={() => setIdeiaFocada(ideia)} className="card-ideia" style={{ background: 'var(--code-bg)', borderRadius: '24px', padding: '20px', border: `2px solid ${isMatch ? '#ec4899' : 'var(--border)'}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                        
                        {isMatch && (
                          <div style={{ position: 'absolute', top: '-12px', right: '-10px', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#fff', fontSize: '0.7rem', fontWeight: '900', padding: '4px 10px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(236,72,153,0.4)', transform: 'rotate(5deg)', zIndex: 10 }}>
                            🔥 MATCH!
                          </div>
                        )}

                        {/* NOVO: Imagem de Capa no Card */}
                        {ideia.imagemUrl && (
                          <div style={{ margin: '-20px -20px 12px -20px', borderRadius: '22px 22px 0 0', overflow: 'hidden', height: '140px' }}>
                            <img src={ideia.imagemUrl} alt={ideia.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}

                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--bg)', padding: '4px 8px', borderRadius: '8px', alignSelf: 'flex-start' }}>{ideia.categoria}</span>
                        
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.1rem', lineHeight: '1.3' }}>{ideia.titulo}</h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ideia.descricao || 'Sem descrição'}</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
                            💬 {ideia.comentarios?.length || 0}
                          </span>
                          
                          <button onClick={(e) => toggleLike(ideia, e)} style={{ background: euCurti ? 'rgba(236, 72, 153, 0.1)' : 'var(--bg)', border: `1px solid ${euCurti ? '#ec4899' : 'var(--border)'}`, color: euCurti ? '#ec4899' : 'var(--text)', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={euCurti ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{likesCount}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0 }}>
              + Adicionar Nova Ideia
            </button>
          </div>
        )}

        {/* TELA DE INCLUSÃO (FORMULÁRIO) */}
        {formAberto && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>O que você tem em mente?</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Título / O que é?</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Casar de frente a uma lagoa" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '1rem', outline: 'none' }}>
                  {CATEGORIAS_MURAL.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* NOVO: Input para a URL da Imagem */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>URL da Imagem de Capa (Opcional)</label>
                <input type="url" value={imagemUrl} onChange={e => setImagemUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--accent)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Por que isso é legal? (Opcional)</label>
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Achei a nossa cara, imagina as fotos no pôr do sol..." rows={3} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none', resize: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Link de Referência (Opcional)</label>
                <input type="url" value={linkRef} onChange={e => setLinkRef(e.target.value)} placeholder="https://instagram.com/..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--accent)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setFormAberto(false)} disabled={isProcessando} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSalvarIdeia} disabled={isProcessando || !titulo} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!titulo || isProcessando) ? 0.5 : 1 }}>Lançar Ideia 🚀</button>
            </div>
          </div>
        )}

        {/* TELA DE FOCO (DETALHES E COMENTÁRIOS) */}
        {!formAberto && ideiaFocada && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <button onClick={() => setIdeiaFocada(null)} style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> Voltar
              </button>
              
              <button onClick={() => handleExcluir(ideiaFocada.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>Excluir</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '16px' }}>
              
              {/* CABEÇALHO DA IDEIA */}
              <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative' }}>
                
                {/* NOVO: Imagem de Capa no Foco */}
                {ideiaFocada.imagemUrl && (
                  <div style={{ margin: '-24px -24px 20px -24px', borderRadius: '24px 24px 0 0', overflow: 'hidden', height: '200px' }}>
                    <img src={ideiaFocada.imagemUrl} alt={ideiaFocada.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--bg)', padding: '4px 8px', borderRadius: '8px', marginBottom: '12px', display: 'inline-block' }}>{ideiaFocada.categoria}</span>
                <h2 style={{ margin: '0 0 12px 0', color: 'var(--text-h)', fontSize: '1.6rem', lineHeight: '1.2' }}>{ideiaFocada.titulo}</h2>
                {ideiaFocada.descricao && <p style={{ margin: '0 0 16px 0', color: 'var(--text)', lineHeight: '1.5', fontSize: '0.95rem' }}>{ideiaFocada.descricao}</p>}
                
                {ideiaFocada.linkRef && (
                  <a href={ideiaFocada.linkRef} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--accent)', color: '#fff', textDecoration: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    Abrir Referência
                  </a>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>Criado por {ideiaFocada.criadoPor}</span>
                  
                  <button onClick={(e) => toggleLike(ideiaFocada, e)} style={{ background: ideiaFocada.likes?.includes(userMock.id) ? '#ec4899' : 'var(--bg)', border: `2px solid ${ideiaFocada.likes?.includes(userMock.id) ? '#ec4899' : 'var(--border)'}`, color: ideiaFocada.likes?.includes(userMock.id) ? '#fff' : 'var(--text)', padding: '12px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s', transform: ideiaFocada.likes?.includes(userMock.id) ? 'scale(1.05)' : 'scale(1)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={ideiaFocada.likes?.includes(userMock.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span style={{ fontSize: '1rem', fontWeight: '900' }}>
                      {ideiaFocada.likes?.length >= 2 ? 'TEMOS UM MATCH!' : 'EU QUERO!'}
                    </span>
                  </button>
                </div>
              </div>

              {/* FÓRUM / COMENTÁRIOS */}
              <div>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', fontSize: '1.1rem' }}>Comentários ({ideiaFocada.comentarios?.length || 0})</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {(!ideiaFocada.comentarios || ideiaFocada.comentarios.length === 0) ? (
                    <p style={{ color: 'var(--text)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>Nenhum comentário ainda. O que você acha disso?</p>
                  ) : (
                    ideiaFocada.comentarios.map((c: any) => (
                      <div key={c.id} style={{ 
                        // NOVO: Cores e Bordas estilo WhatsApp
                        background: c.autorId === userMock.id ? 'var(--accent)' : 'var(--code-bg)', 
                        color: c.autorId === userMock.id ? '#fff' : 'var(--text-h)',
                        border: c.autorId === userMock.id ? 'none' : '1px solid var(--border)', 
                        padding: '12px 16px', 
                        borderRadius: c.autorId === userMock.id ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                        alignSelf: c.autorId === userMock.id ? 'flex-end' : 'flex-start', 
                        width: '85%' 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: c.autorId === userMock.id ? 'rgba(255,255,255,0.9)' : 'var(--accent)' }}>{c.autor}</span>
                          <span style={{ fontSize: '0.65rem', color: c.autorId === userMock.id ? 'rgba(255,255,255,0.7)' : 'var(--text)' }}>
                            {new Date(c.data).toLocaleDateString()} {new Date(c.data).getHours()}:{String(new Date(c.data).getMinutes()).padStart(2, '0')}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{c.texto}</p>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={novoComentario} onChange={e => setNovoComentario(e.target.value)} onKeyPress={e => e.key === 'Enter' && enviarComentario()} placeholder="Escreva seu comentário..." style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: '0.95rem', outline: 'none' }} />
                  <button onClick={enviarComentario} disabled={isProcessando || !novoComentario.trim()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: (!novoComentario.trim() || isProcessando) ? 0.5 : 1 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};