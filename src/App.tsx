import { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

import { Header } from './components/test/Header';
import { Home } from './pages/Home';
import { Login } from './pages/Login'; 
import { Planner } from './pages/Planner';
import { Quiz } from './pages/Quiz';
import { Resultados } from './pages/Resultados';
// ✨ IMPORTAR O COMPONENTE DA SPLASH SCREEN (Ajuste o caminho se necessário)
import { SplashScreen } from './components/SplashScreen'; 

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--code-bg)' }}><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppContent = () => {
  const location = useLocation();
  // ✨ Novo estado: controla a exibição da Splash Screen
  const [showSplash, setShowSplash] = useState(true);

  const ocultarHeader = location.pathname === '/planner' || location.pathname === '/login' || location.pathname === '/';

  return (
    <>
      {/* 
        A Splash Screen fica por cima de tudo enquanto showSplash for true.
        Quando terminar o tempo definido no componente, ela chama o onFinish e libera o site.
      */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
      {!ocultarHeader && <Header />}
      
      <Routes>
        <Route path="/" element={<Navigate to="/planner" replace />} />
        <Route path="/inicio" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/resultados" element={<Resultados />} />
        
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