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
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Ícones do Menu Inferior
  const navItems = [
    { 
      id: 'hub', 
      label: 'Início',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'hub' ? "2.5" : "2"}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
    },
    { 
      id: 'lazer', 
      label: 'Lazer',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'lazer' ? "2.5" : "2"}><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
    },
    { 
      id: 'desafio200', 
      label: 'Acelerar',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'desafio200' ? "2.5" : "2"}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-1 1.05l-3.91.52"></path><path d="M14 14.66V17c0 .55.47.98 1 1.05l3.91.52"></path><path d="M18 4v5c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z"></path></svg>
    },
    { 
      id: 'metas', 
      label: 'Metas',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'metas' ? "2.5" : "2"}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
    },
    { 
      id: 'conexao', 
      label: 'Conexão',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'conexao' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    },
    { 
      id: 'configuracoes', 
      label: 'Perfil',
      icon: user?.photoURL ? (
        <img src={user.photoURL} alt="Perfil" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: activeTab === 'configuracoes' ? '2px solid var(--accent)' : 'none' }} />
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'configuracoes' ? "2.5" : "2"}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      )
    }
  ];

  return (
    <div className="mobile-app-container">
      {/* 🧹 CABEÇALHO REMOVIDO PARA DAR MAIS ESPAÇO À TELA */}

      <main className="mobile-app-content">
        {children}
      </main>

      <nav className="bottom-nav">
        {navItems.map(item => (
          <div 
            key={item.id} 
            className={`bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <div className="bottom-nav-icon">
              {item.icon}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};