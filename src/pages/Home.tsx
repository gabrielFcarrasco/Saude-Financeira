import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <main className="home-main animate-fade-in">
      {/* Efeito visual de fundo (Glow) */}
      <div className="home-glow" />

      <div className="home-content-wrapper">
        
        <h1 className="home-hero-title">
          Transforme sua Saúde Financeira de forma <br /> <span className="text-accent">Inteligente.</span>
        </h1>
        
        <p className="home-hero-subtitle">
          Assuma o controle do seu dinheiro. Descubra seu perfil financeiro, aprenda a organizar seu orçamento e planeje seu futuro sem planilhas complexas.
        </p>
        
        <div className="home-cta-container">
          <button className="primary hero-btn" onClick={() => navigate('/quiz')}>
            Descobrir meu Perfil Financeiro
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* GRID DE CARDS (MANTIDO E CENTRALIZADO) */}
        <div className="home-features-grid">
          <div className="card home-feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </div>
            <h3>Diagnóstico Preciso</h3>
            <p>Identifique se você é Gastador, Despreocupado ou Comprometido e receba uma trilha personalizada.</p>
          </div>

          <div className="card home-feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h3>Controle de Gastos</h3>
            <p>Estratégias reais para cortar gastos invisíveis e evitar armadilhas de compras por impulso.</p>
          </div>

          <div className="card home-feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </div>
            <h3>Inteligência Financeira</h3>
            <p>Aprenda na prática como projetar seus rendimentos com Poupança, CDB, Ações e Previdência.</p>
          </div>
        </div>
      </div>
    </main>
  );
};