import React, { useState, useEffect } from 'react';
import { enviarConvitePlataforma } from '../../services/email';
import { auth, db } from '../../services/firebase';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';

// Tipagem para o nosso Modal Customizado
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
  
  // Estado que controla a exibição da janelinha flutuante (Modal)
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

  // FUNÇÃO: Enviar Convite
  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailConvidado) return;
    
    setLoading(true);
    const emailAdmin = auth.currentUser?.email || 'Admin';
    const sucesso = await enviarConvitePlataforma(emailConvidado, emailAdmin);
    
    if (sucesso) {
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Convite Enviado!',
        message: `O acesso para ${emailConvidado} foi liberado com sucesso. Eles já podem se cadastrar.`
      });
      setEmailConvidado('');
    } else {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Ops! Algo deu errado.',
        message: 'Não foi possível enviar o convite. Verifique sua conexão ou o console.'
      });
    }
    setLoading(false);
  };

  // FUNÇÃO: Confirmar e Remover Convite
  const handleRemoverConvite = (emailId: string) => {
    // Abre o modal perguntando se tem certeza
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Cancelar Convite',
      message: `Tem certeza que deseja remover o acesso de ${emailId}? Eles não poderão mais criar uma conta.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'convites_plataforma', emailId));
          fecharModal();
        } catch (error) {
          console.error("Erro ao remover convite:", error);
          setModal({ isOpen: true, type: 'error', title: 'Erro', message: 'Não foi possível remover o convite no momento.' });
        }
      }
    });
  };

  // SVGs dos Status e Botões
  const icons = {
    pendente: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    aceito: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
    successModal: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    errorModal: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
    confirmModal: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
      
      {/* CABEÇALHO */}
      <div className="page-header">
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Painel de Convites</h1>
          <p style={{ color: 'var(--text)', margin: 0 }}>Gerencie quem pode acessar o GC Planner.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* CARD DE ENVIAR CONVITE */}
        <div className="card" style={{ flex: '1', minWidth: '300px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Convidar Novo Usuário</h3>
          <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.95rem' }}>
            Libere o acesso para um novo e-mail.
          </p>

          <form onSubmit={handleConvidar}>
            <div className="form-group">
              <input 
                type="email" 
                value={emailConvidado} 
                onChange={e => setEmailConvidado(e.target.value)} 
                placeholder="email@doconvidado.com"
                required
                style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', borderRadius: '8px' }}
              />
            </div>
            <button type="submit" className="primary" disabled={loading} style={{ width: '100%', marginTop: '16px', padding: '14px' }}>
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </button>
          </form>
        </div>

        {/* PAINEL DE STATUS (LISTA) */}
        <div className="card" style={{ flex: '2', minWidth: '350px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Status dos Convites</h3>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {listaConvites.length === 0 ? (
              <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text)', margin: 0 }}>Nenhum convite enviado ainda.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {listaConvites.map((convite) => (
                  <li key={convite.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <strong style={{ color: 'var(--text-h)', display: 'block', fontSize: '0.95rem' }}>{convite.email}</strong>
                      <span style={{ color: 'var(--text)', fontSize: '0.8rem' }}>Convidado por {convite.convidadoPor}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', 
                        background: convite.status === 'pendente' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: convite.status === 'pendente' ? '#f59e0b' : '#10b981',
                        padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold'
                      }}>
                        {convite.status === 'pendente' ? icons.pendente : icons.aceito}
                        {convite.status === 'pendente' ? 'Pendente' : 'Aceito'}
                      </div>

                      <button 
                        onClick={() => handleRemoverConvite(convite.id)}
                        title="Cancelar Convite"
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'background 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
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

      {/* ======================================================== */}
      {/* O NOSSO MODAL MÁGICO (Substitui os alerts e confirms)    */}
      {/* ======================================================== */}
      {modal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '20px'
        }}>
          <div className="animate-fade-in" style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px',
            padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              {modal.type === 'success' && icons.successModal}
              {modal.type === 'error' && icons.errorModal}
              {modal.type === 'confirm' && icons.confirmModal}
            </div>
            
            <h2 style={{ color: 'var(--text-h)', margin: '0 0 12px 0', fontSize: '1.5rem' }}>{modal.title}</h2>
            <p style={{ color: 'var(--text)', margin: '0 0 24px 0', lineHeight: '1.6' }}>{modal.message}</p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {/* Se for uma confirmação, mostramos botões de Cancelar/Confirmar */}
              {modal.type === 'confirm' ? (
                <>
                  <button onClick={fecharModal} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Manter
                  </button>
                  <button onClick={modal.onConfirm} style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Sim, Remover
                  </button>
                </>
              ) : (
                /* Se for apenas sucesso ou erro, um único botão de "Entendi" resolve */
                <button className="primary" onClick={fecharModal} style={{ width: '100%', padding: '12px' }}>
                  Entendi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};