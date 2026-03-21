import React, { useState } from 'react';
import { trilhaData } from '../services/trilhaData';
import { SimuladorCDB } from './SimuladorCDB';
import './TrilhaEducacional.css';

interface TrilhaProps {
  perfil: string;
}

export const TrilhaEducacional: React.FC<TrilhaProps> = ({ perfil }) => {
  const [passoAtual, setPassoAtual] = useState(1);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const totalPassos = trilhaData.length;

  const avancar = () => {
    setExpandedCard(null);
    setPassoAtual((prev) => Math.min(prev + 1, totalPassos));
  };
  const voltar = () => {
    setExpandedCard(null);
    setPassoAtual((prev) => Math.max(prev - 1, 1));
  };

  const toggleCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const dadosPasso = trilhaData.find(d => d.passo === passoAtual);
  if (!dadosPasso) return null;

  return (
    <div className="card" style={{ maxWidth: '900px', width: '100%', margin: '0 auto', position: 'relative' }}>

      {/* Barra de Progresso Dinâmica */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
        {[...Array(totalPassos)].map((_, index) => (
          <div 
            key={index} 
            style={{ 
              height: '8px', 
              flex: 1, 
              borderRadius: '4px',
              background: index + 1 <= passoAtual ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s ease'
            }} 
          />
        ))}
      </div>

      <div style={{ minHeight: '450px' }}>
        <h2 style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: '16px', letterSpacing: '-0.5px' }}>
          {dadosPasso.passo}. {dadosPasso.titulo}
        </h2>

        {/* ================= DIAGNÓSTICO ================= */}
        {dadosPasso.tipo === 'diagnostico' && dadosPasso.conteudo && (
          <div className="step-content animate-fade-in">
            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text)' }}>
              {dadosPasso.conteudo[perfil as keyof typeof dadosPasso.conteudo]}
            </p>
          </div>
        )}

        {/* ================= CARDS INTERATIVOS (ACCORDION) ================= */}
        {dadosPasso.tipo === 'interativo' && (
          <div className="step-content animate-fade-in">
            <p style={{ fontSize: '1.15rem', marginBottom: '32px', color: 'var(--text)' }}>{dadosPasso.descricao}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {dadosPasso.cards?.map((card, idx) => (
                <div key={idx} className={`interactive-card ${expandedCard === idx ? 'expanded' : ''}`}>
                  <div className="interactive-header" onClick={() => toggleCard(idx)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>{card.titulo}</span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 'normal' }}>{card.resumo}</span>
                    </div>
                    {/* Ícone chevron SVG substituindo o emoji de seta */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedCard === idx ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s ease' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  <div className="interactive-body">
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.7', margin: 0, color: 'var(--text)' }}>
                      {card.detalhe}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= FERRAMENTAS ================= */}
        {dadosPasso.tipo === 'ferramentas' && (
          <div className="step-content animate-fade-in">
            <p style={{ fontSize: '1.2rem', lineHeight: '1.7', marginBottom: '32px', color: 'var(--text)' }}>{dadosPasso.descricao}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {dadosPasso.ferramentas?.map((ferramenta, idx) => (
                <div key={idx} style={{ background: 'var(--code-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: '1.2rem', display: 'block', marginBottom: '12px', color: 'var(--accent)' }}>{ferramenta.nome}</strong>
                  <p style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text)', lineHeight: '1.5' }}>{ferramenta.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= INVESTIMENTOS & SIMULADOR ================= */}
        {dadosPasso.tipo === 'investimentos' && (
          <div className="step-content animate-fade-in">
            <p style={{ fontSize: '1.15rem', marginBottom: '32px', color: 'var(--text)' }}>{dadosPasso.descricao}</p>
            <SimuladorCDB />
          </div>
        )}

        {/* ================= O E-BOOK FINAL ================= */}
        {dadosPasso.tipo === 'ebook' && (
          <div className="step-content animate-fade-in">
            <p style={{ fontSize: '1.2rem', marginBottom: '32px', textAlign: 'center', color: 'var(--text)' }}>{dadosPasso.descricao}</p>

            <div className="ebook-container">
              {/* Capa do Livro em CSS Puro */}
              <div className="ebook-cover">
                <h3 style={{ color: '#fff', fontSize: '1.5rem', textAlign: 'center', margin: '0 0 16px 0', lineHeight: '1.2' }}>
                  As 4 Fases<br/><span style={{ color: 'var(--accent)' }}>Financeiras</span>
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>O mapa definitivo da riqueza.</p>
                <div style={{ position: 'absolute', bottom: '15px', right: '15px', color: 'var(--accent)' }}>GC</div>
              </div>

              {/* Informações de Download */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--text-h)' }}>O Guia Definitivo</h3>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '24px', color: 'var(--text)' }}>
                  Descubra exatamente onde você está e o que precisa fazer para avançar: 
                  <br/><br/>
                  <strong>1. Endividamento</strong> (A sobrevivência)<br/>
                  <strong>2. Equilíbrio</strong> (O empate técnico)<br/>
                  <strong>3. Acumulação</strong> (Os juros ao seu favor)<br/>
                  <strong>4. Liberdade Financeira</strong> (O dinheiro trabalha por você)
                </p>
                
                {/* Botão transformado em Link de Download Nativo com ícone SVG */}
                <a 
                  href="/Ebook/Finanças Pessoais - As 4 Fases da Vida Financeira (Gabriel Carrasco).pdf" 
                  download="Guia As 4Fases Financeiras- Gabriel Carrasco.pdf"
                  className="primary" 
                  style={{ padding: '16px 32px', fontSize: '1.15rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', textDecoration: 'none', boxSizing: 'border-box', borderRadius: '8px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Baixar E-book Gratuito (PDF)
                </a>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= NAVEGAÇÃO ================= */}
    <div className="trilha-nav">
        <button 
          className="btn-nav-secundary"
          onClick={voltar} 
          disabled={passoAtual === 1} 
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Passo Anterior
        </button>

        {passoAtual < totalPassos ? (
          <button className="primary btn-nav-primary" onClick={avancar}>
            Próximo Passo
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        ) : (
          <button className="primary btn-nav-primary btn-final" onClick={() => window.location.href = '/'}>
            Finalizar Jornada
          </button>
        )}
      </div>

    </div>
  );
};