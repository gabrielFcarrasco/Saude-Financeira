import React, { useState } from 'react';
import { enviarConvitePlataforma } from '../../services/email';
import { auth } from '../../services/firebase';

export const AdminTab: React.FC = () => {
  const [emailConvidado, setEmailConvidado] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailConvidado) return;
    
    setLoading(true);
    const emailAdmin = auth.currentUser?.email || 'Admin';
    
    const sucesso = await enviarConvitePlataforma(emailConvidado, emailAdmin);
    
    if (sucesso) {
      alert(`Convite enviado com sucesso para ${emailConvidado}! Eles já podem se cadastrar.`);
      setEmailConvidado('');
    } else {
      alert("Erro ao enviar convite. Verifique o console.");
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: '#8b5cf6' }}>Painel do Arquiteto (Admin)</h1>
          <p style={{ color: 'var(--text)', margin: 0 }}>Área restrita. Gerencie o acesso à plataforma.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '500px', border: '1px solid #8b5cf6' }}>
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Emitir Passe VIP</h3>
        <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Qual e-mail terá permissão para se cadastrar no sistema?
        </p>

        <form onSubmit={handleConvidar}>
          <div className="form-group">
            <input 
              type="email" 
              value={emailConvidado} 
              onChange={e => setEmailConvidado(e.target.value)} 
              placeholder="email@doconvidado.com"
              required
            />
          </div>
          <button type="submit" className="primary" disabled={loading} style={{ width: '100%', padding: '14px', background: '#8b5cf6', borderColor: '#8b5cf6' }}>
            {loading ? 'Processando e-mail...' : 'Autorizar E-mail e Enviar Convite'}
          </button>
        </form>
      </div>
    </div>
  );
};