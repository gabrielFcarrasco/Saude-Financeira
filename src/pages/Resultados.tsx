import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrilhaEducacional } from '../components/TrilhaEducacional';

export const Resultados = () => {
  const [perfil, setPerfil] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedProfile = localStorage.getItem('perfilFinanceiro');
    if (!savedProfile) {
      navigate('/quiz'); // Se não tiver perfil, manda pro quiz de novo
    } else {
      setPerfil(savedProfile);
    }
  }, [navigate]);

  if (!perfil) return null;

  return (
    <div className="main-content" style={{ paddingBottom: '64px', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="badge">Diagnóstico Finalizado</div>
      <h1 className="hero-title" style={{ fontSize: '40px', marginBottom: '40px', textAlign: 'center' }}>
        Trilha de <span style={{ color: 'var(--accent)' }}>Aprendizado</span>
      </h1>
      
      {/* Aqui entra a mágica do nosso novo componente */}
      <TrilhaEducacional perfil={perfil} />
      
    </div>
  );
};