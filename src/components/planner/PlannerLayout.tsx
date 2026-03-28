import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { GeminiWidget } from '../gemini/GeminiWidget';
import "../../pages/Planner.css";

interface PlannerLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const PlannerLayout: React.FC<PlannerLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Puxamos os dados do usuário logado no Firebase
  const user = auth.currentUser;
  const nomeUsuario = user?.displayName || 'Usuário';
  const emailUsuario = user?.email || '';
  const inicial = nomeUsuario.charAt(0).toUpperCase(); // Pega a primeira letra do nome

  // Definição dos ícones em SVG para manter o padrão Premium
  const icons = {
    resumo: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    lancamentos: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>,
    orcamento: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    metas: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>,
    quitacao: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
    casal: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  };

  // Puxa o e-mail do .env e compara com o usuário logado
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const IS_ADMIN = emailUsuario === adminEmail;

  const navItems = [
    { id: 'resumo', icon: icons.resumo, label: 'Panorama Geral' },
    { id: 'lancamentos', icon: icons.lancamentos, label: 'Extrato de Gastos' },
    { id: 'orcamento', icon: icons.orcamento, label: 'Estratégia de Equilíbrio' }, 
    { id: 'metas', icon: icons.metas, label: 'Cofre de Objetivos' },
    { id: 'quitacao', icon: icons.quitacao, label: 'Compromissos' },
    { id: 'casal', icon: icons.casal, label: 'Renda Conjunta' },
    
    // A mágica acontece aqui: A aba só entra na lista se IS_ADMIN for true
    ...(IS_ADMIN ? [{ 
      id: 'admin', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>, 
      label: 'Painel Admin' 
    }] : [])
  ];
  
  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
  };

  // Função para Deslogar com Segurança
  const handleLogout = async () => {
    await auth.signOut(); // Desloga do Firebase
    navigate('/'); // Manda de volta pra Home
  };

  return (
    <div className="dashboard-container">
      {/* Overlay para fechar o menu no mobile ao clicar fora */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo clicável que redireciona para a Home */}
          <div 
            onClick={() => navigate('/')} 
            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <h2 className="logo-text" style={{ fontSize: '1.4rem', margin: 0 }}>GC {'</>'}</h2>
            <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text)', fontWeight: 500 }}>Planner Inteligente</p>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div 
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span> 
              <span className="nav-label">{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto', padding: '24px' }}>
          
          {/* NOVO: BLOCO DE PERFIL DO USUÁRIO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--code-bg)', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
              {inicial}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, color: 'var(--text-h)', fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nomeUsuario}
              </p>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {emailUsuario}
              </p>
            </div>
          </div>

          {/* Botão de Sair Atualizado para usar o handleLogout */}
          <button className="logout-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="dashboard-content">
        {/* Header visível apenas no Mobile */}
        <div className="mobile-header">
          <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            Menu
          </button>
          <h2 className="logo-text" style={{ fontSize: '1.1rem', margin: 0 }}>GC {'</>'}</h2>
        </div>

        {children}
      </main>

      <GeminiWidget />
    </div>
  );
};