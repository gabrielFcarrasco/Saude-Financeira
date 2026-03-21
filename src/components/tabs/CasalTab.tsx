import React, { useState } from 'react';
import { enviarEmailConviteCasal } from '../../services/email';
import { auth } from '../../services/firebase';

export const CasalTab: React.FC = () => {
  const [emailParceiro, setEmailParceiro] = useState('');
  const [loading, setLoading] = useState(false);
  const [conviteEnviado, setConviteEnviado] = useState(false);

  const handleEnviarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailParceiro) return;
    
    setLoading(true);
    try {
      const user = auth.currentUser;
      const nomeUsuarioAtual = user?.displayName || 'Um usuário';
      
      // Gera um token aleatório simples para o link de convite
      const tokenAleatorio = Math.random().toString(36).substring(2, 15);

      // Dispara o e-mail usando o nosso serviço
      await enviarEmailConviteCasal(emailParceiro, nomeUsuarioAtual, tokenAleatorio);
      
      setConviteEnviado(true);
      setEmailParceiro('');
    } catch (error) {
      alert("Erro ao enviar o convite. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>Renda Conjunta</h1>
          <p style={{ color: 'var(--text)', margin: 0 }}>
            Planejem o futuro juntos. Sincronize contas e divida metas.
          </p>
        </div>
      </div>

      <div className="form-grid-2">
        {/* Card Informativo Esquerdo */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'linear-gradient(145deg, var(--bg) 0%, var(--social-bg) 100%)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)', fontSize: '1.3rem' }}>Por que unir as finanças?</h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--text)', lineHeight: '1.6', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong>Transparência Total:</strong> Vejam as despesas da casa em um único extrato compartilhado.</li>
              <li><strong>Cofre do Casal:</strong> Criem metas juntos para viagens, casamento ou compra de imóveis.</li>
              <li><strong>Privacidade Mantida:</strong> Vocês escolhem quais contas são conjuntas e quais são individuais.</li>
            </ul>
          </div>
        </div>

        {/* Card de Formulário Direito */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {conviteEnviado ? (
            <div style={{ textAlign: 'center', padding: '20px' }} className="animate-fade-in">
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Convite Enviado!</h3>
              <p style={{ color: 'var(--text)', marginBottom: '24px' }}>Aguarde o seu parceiro(a) aceitar o convite na caixa de e-mail dele(a) para sincronizar as contas.</p>
              <button className="primary" onClick={() => setConviteEnviado(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}>
                Enviar novo convite
              </button>
            </div>
          ) : (
            <>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Convidar Parceiro(a)</h3>
              <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.95rem' }}>
                Enviaremos um link de acesso seguro para o e-mail do seu parceiro(a).
              </p>

              <form onSubmit={handleEnviarConvite}>
                <div className="form-group">
                  <label>E-mail do Parceiro(a)</label>
                  <input 
                    type="email" 
                    value={emailParceiro} 
                    onChange={e => setEmailParceiro(e.target.value)} 
                    placeholder="amor@email.com"
                    required
                    style={{ background: 'var(--code-bg)' }}
                  />
                </div>
                
                <button type="submit" className="primary" disabled={loading} style={{ width: '100%', padding: '14px', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {loading ? 'Enviando...' : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                      Enviar Convite Oficial
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};