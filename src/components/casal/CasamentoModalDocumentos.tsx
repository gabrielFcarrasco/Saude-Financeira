import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CATEGORIAS_DOC = ['Contrato', 'Orçamento', 'Recibo', 'Comprovante', 'Documentação', 'Outros'];

export const CasamentoModalDocumentos = ({
  documentosAberto, setDocumentosAberto, casalId, fornecedores
}: any) => {

  const [documentos, setDocumentos] = useState<any[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Contrato');
  const [fornecedorId, setFornecedorId] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  const [isProcessando, setIsProcessando] = useState(false);

  useEffect(() => {
    if (!casalId || !documentosAberto) return;
    const qDocs = query(collection(db, 'casais', casalId, 'documentos'));
    const unsub = onSnapshot(qDocs, (snap) => {
      setDocumentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [casalId, documentosAberto]);

  if (!documentosAberto) return null;

  const abrirFormNovo = () => {
    setIdEdicao(null); setNome(''); setCategoria('Contrato'); setFornecedorId(''); setLinkUrl('');
    setFormAberto(true);
  };

  const abrirFormEdicao = (d: any) => {
    setIdEdicao(d.id); setNome(d.nome); setCategoria(d.categoria); setFornecedorId(d.fornecedorId || ''); setLinkUrl(d.linkUrl || '');
    setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!casalId || !nome || !linkUrl) return;
    setIsProcessando(true);
    try {
      const payload = { nome, categoria, fornecedorId, linkUrl, updatedAt: serverTimestamp() };
      if (idEdicao) {
        await updateDoc(doc(db, 'casais', casalId, 'documentos', idEdicao), payload);
      } else {
        await addDoc(collection(db, 'casais', casalId, 'documentos'), { ...payload, createdAt: serverTimestamp() });
      }
      setFormAberto(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessando(false);
    }
  };

  const handleExcluir = async () => {
    if (!idEdicao || !window.confirm("Apagar este documento?")) return;
    setIsProcessando(true);
    try {
      await deleteDoc(doc(db, 'casais', casalId, 'documentos', idEdicao));
      setFormAberto(false);
    } catch (e) {} finally { setIsProcessando(false); }
  };

  const getFornecedorNome = (fId: string) => {
    const f = fornecedores.find((x: any) => x.id === fId);
    return f ? f.nome : 'Geral';
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '600px', padding: '32px 24px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px', flexShrink: 0 }}></div>
        
        {!formAberto ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>Documentos e Contratos</h3>
              <button onClick={() => setDocumentosAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              {documentos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: 'var(--code-bg)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
                  <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Nenhum documento anexado. Guarde links para seus contratos do Google Drive, PDFs ou fotos de recibos aqui.</p>
                </div>
              ) : (
                documentos.map((d: any) => (
                  <div key={d.id} style={{ background: 'var(--bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, overflow: 'hidden' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nome}</h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold' }}>{d.categoria}</span>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }}></span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{getFornecedorNome(d.fornecedorId)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'var(--accent)', color: '#fff', padding: '8px 12px', borderRadius: '10px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>Abrir</a>
                      <button onClick={() => abrirFormEdicao(d)} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button onClick={abrirFormNovo} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px', cursor: 'pointer', flexShrink: 0 }}>
              + Adicionar Documento
            </button>
          </>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.2rem' }}>{idEdicao ? 'Editar Documento' : 'Novo Documento'}</h3>
              <button onClick={() => setFormAberto(false)} style={{ background: 'var(--code-bg)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Nome do Arquivo</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Contrato Fotografia PDF" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    {CATEGORIAS_DOC.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Fornecedor Relacionado</label>
                  <select value={fornecedorId} onChange={e => setFornecedorId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', marginTop: '8px', fontSize: '1rem', outline: 'none' }}>
                    <option value="">Nenhum / Geral</option>
                    {fornecedores.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 'bold', textTransform: 'uppercase' }}>Link de Acesso (Drive, PDF web, etc)</label>
                <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--accent)', marginTop: '8px', fontSize: '1rem', outline: 'none' }} />
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
              <button onClick={handleSalvar} disabled={isProcessando || !nome || !linkUrl} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (!nome || !linkUrl || isProcessando) ? 0.5 : 1 }}>
                {isProcessando ? 'Salvando...' : 'Salvar Arquivo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};