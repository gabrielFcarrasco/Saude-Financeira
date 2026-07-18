import React, { useState, useEffect } from 'react';
import { enviarConvitePlataforma } from '../../services/email';
import { auth, db } from '../../services/firebase';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';

interface ModalConfig {
  isOpen: boolean;
  type: 'success' | 'error' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
}

export const AdminTab: React.FC = () => {
  const [emailConvidado, setEmailConvidado] = useState('');
  const [loading, setLoading] = useState(false);
  const [listaConvites, setListaConvites] = useState<any[]>([]);
  
  const [modal, setModal] = useState<ModalConfig>({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    const q = query(collection(db, 'convites_plataforma'), orderBy('criadoEm', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convites = snapshot.docs.map(documento => ({ id: documento.id, ...documento.data() }));
      setListaConvites(convites);
    });
    return () => unsubscribe();
  }, []);

  const fecharModal = () => setModal({ ...modal, isOpen: false });

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailConvidado) return;
    
    setLoading(true);
    const emailAdmin = auth.currentUser?.email || 'Admin';
    const sucesso = await enviarConvitePlataforma(emailConvidado, emailAdmin);
    
    if (sucesso) {
      setModal({ isOpen: true, type: 'success', title: 'Convite Enviado!', message: `O acesso para ${emailConvidado} foi liberado com sucesso. Eles já podem se cadastrar no app.` });
      setEmailConvidado('');
    } else {
      setModal({ isOpen: true, type: 'error', title: 'Ops! Algo deu errado.', message: 'Não foi possível enviar o convite. Verifique sua conexão ou o console.' });
    }
    setLoading(false);
  };

  const handleRemoverConvite = (emailId: string) => {
    setModal({
      isOpen: true, type: 'confirm', title: 'Cancelar Convite',
      message: `Tem certeza que deseja remover o acesso de ${emailId}? O usuário não poderá mais criar uma conta.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'convites_plataforma', emailId));
          fecharModal();
        } catch (error) {
          setModal({ isOpen: true, type: 'error', title: 'Erro', message: 'Não foi possível remover o convite no momento.' });
        }
      }
    });
  };

  const icons = {
    pendente: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    aceito: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    trash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* CABEÇALHO */}
      <div style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div>
          <h1 style={{ margin: '0 0 4px 0', color: 'var(--text-h)', fontSize: '1.4rem' }}>Painel de Convites</h1>
          <p style={{ color: 'var(--text)', margin: 0, fontSize: '0.9rem' }}>Gerencie acessos na plataforma.</p>
        </div>
      </div>

      {/* 
        LAYOUT RESPONSIVO COM FLEXBOX
        Em telas grandes: eles ficam lado a lado (flex-basis: 300px)
        Em telas pequenas: eles quebram para colunas automaticamente
      */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        
        {/* COLUNA 1: FORMULÁRIO */}
        <div style={{ flex: '1 1 300px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', minWidth: 0 }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.2rem' }}>Convidar Usuário</h3>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>Libere o e-mail para registro.</p>
          </div>

          <form onSubmit={handleConvidar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 'bold', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>E-MAIL DO CONVIDADO</label>
              <input 
                type="email" 
                value={emailConvidado} 
                onChange={e => setEmailConvidado(e.target.value)} 
                placeholder="nome@exemplo.com"
                required
                style={{ width: '100%', padding: '16px', background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', borderRadius: '16px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: '0.2s', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Aguarde, enviando...' : 'Liberar Acesso'}
            </button>
          </form>
        </div>

        {/* COLUNA 2: LISTA DE CONVITES */}
        <div style={{ flex: '2 1 350px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', minWidth: 0 }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--code-bg)', background: 'var(--code-bg)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>Convites Ativos</h3>
          </div>
          
          <div style={{ flex: 1, maxHeight: '400px', overflowY: 'auto', padding: '16px' }}>
            {listaConvites.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '16px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <p style={{ margin: 0 }}>Nenhum convite na base de dados.</p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {listaConvites.map((convite) => (
                  <li key={convite.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--code-bg)', borderRadius: '16px', border: '1px solid transparent' }}>
                    
                    {/* minWidth 0 aqui resolve qualquer estouro de texto do email */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                      <strong style={{ color: 'var(--text-h)', display: 'block', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {convite.email}
                      </strong>
                      <span style={{ color: 'var(--text)', fontSize: '0.75rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                        Por {convite.convidadoPor}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: convite.status === 'pendente' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: convite.status === 'pendente' ? '#f59e0b' : '#10b981', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {convite.status === 'pendente' ? icons.pendente : icons.aceito}
                        <span className="hide-on-mobile">{convite.status === 'pendente' ? 'Pendente' : 'Aceito'}</span>
                      </div>

                      <button onClick={() => handleRemoverConvite(convite.id)} title="Remover" style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', transition: '0.2s' }}>
                        {icons.trash}
                      </button>
                    </div>

                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* MODAL MÁGICO */}
      {modal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px 32px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              {modal.type === 'success' && <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
              {modal.type === 'error' && <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>}
              {modal.type === 'confirm' && <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}
            </div>
            
            <h2 style={{ color: 'var(--text-h)', margin: '0 0 12px 0', fontSize: '1.6rem' }}>{modal.title}</h2>
            <p style={{ color: 'var(--text)', margin: '0 0 32px 0', lineHeight: '1.5', fontSize: '1rem' }}>{modal.message}</p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {modal.type === 'confirm' ? (
                <>
                  <button onClick={fecharModal} style={{ flex: 1, padding: '16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                  <button onClick={modal.onConfirm} style={{ flex: 1, padding: '16px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }}>Sim, Remover</button>
                </>
              ) : (
                <button onClick={fecharModal} style={{ width: '100%', padding: '16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem' }}>Entendi</button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@media (max-width: 480px) { .hide-on-mobile { display: none; } }`}</style>
    </div>
  );
};