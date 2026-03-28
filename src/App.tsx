import { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

import { Header } from './components/test/Header';
import { Home } from './pages/Home';
import { Login } from './pages/Login'; // Importamos a nova página
import { Planner } from './pages/Planner';
import { Quiz } from './pages/Quiz';
import { Resultados } from './pages/Resultados';

// Componente Guardião: Se não tiver usuário logado, chuta pra tela de Login
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Escuta mudanças de login do Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--code-bg)' }}><div className="spinner"></div></div>;
  
  // Se não tem usuário, navega forçadamente para a página de login
  if (!user) return <Navigate to="/login" replace />;

  // Se tem usuário, libera o acesso à página protegida
  return children;
};

const AppContent = () => {
  const location = useLocation();

  // Oculta o header global nas páginas de sistema (Planner e Login)
  const ocultarHeader = location.pathname === '/planner' || location.pathname === '/login';

  return (
    <>
      {!ocultarHeader && <Header />}
      
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rotas do Quiz (Depende da sua regra de negócio se será público ou logado) */}
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/resultados" element={<Resultados />} />
        
        {/* Rotas Privadas e Blindadas */}
        <Route path="/planner" element={
          <PrivateRoute>
            <Planner />
          </PrivateRoute>
        } />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}