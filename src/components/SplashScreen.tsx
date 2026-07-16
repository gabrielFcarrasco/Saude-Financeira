import React, { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

// Sem emojis e com um tom mais relaxado
const FRASES_LOADING = [
  "Arrumando o cantinho de vocês...",
  "Organizando as caixinhas de lazer...",
  "Calculando os rolês do mês...",
  "Preparando tudo..."
];

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  
  const [fraseIndex, setFraseIndex] = useState(0);
  const [opacidadeTexto, setOpacidadeTexto] = useState(1);

  useEffect(() => {
    // 1. Barra enchendo de forma mais lenta (para acompanhar os 4s)
    const progressInterval = setInterval(() => {
      setProgress((old) => {
        // Sobe um pouquinho a cada tick para dar a sensação de processamento
        const next = old + Math.random() * 10 + 2;
        return next > 100 ? 100 : next;
      });
    }, 400);

    // 2. Frases trocando a cada 1.2s (dá tempo de ler com calma)
    const textInterval = setInterval(() => {
      setOpacidadeTexto(0);
      
      setTimeout(() => {
        setFraseIndex((prev) => (prev + 1) % FRASES_LOADING.length);
        setOpacidadeTexto(1);
      }, 200); 
      
    }, 1200);

    // 3. Aumentado para 4 segundos no total
    const timer = setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      setProgress(100);
      setIsFading(true); 
      
      setTimeout(onFinish, 600); 
    }, 6000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <>
      <style>
        {`
          @keyframes floatHeart {
            0% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-8px) scale(1.05); }
            100% { transform: translateY(0px) scale(1); }
          }
          @keyframes pulseGlow {
            0% { opacity: 0.4; filter: blur(20px); transform: scale(0.9); }
            50% { opacity: 0.8; filter: blur(35px); transform: scale(1.2); }
            100% { opacity: 0.4; filter: blur(20px); transform: scale(0.9); }
          }
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999999,
        background: 'var(--bg)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)', 
        opacity: isFading ? 0 : 1,
        pointerEvents: isFading ? 'none' : 'auto'
      }}>
        
        {/* ÍCONE ANIMADO */}
        <div style={{ position: 'relative', marginBottom: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          <div style={{
            position: 'absolute', width: '100px', height: '100px', 
            background: 'var(--accent)', borderRadius: '50%', zIndex: 0,
            animation: 'pulseGlow 3s ease-in-out infinite'
          }}></div>
          
          <div style={{
            position: 'absolute', width: '130px', height: '130px',
            border: '2px dashed rgba(138, 43, 226, 0.4)', borderRadius: '50%', zIndex: 1,
            animation: 'spinSlow 15s linear infinite'
          }}></div>

          <div style={{
            width: '90px', height: '90px', background: 'var(--code-bg)',
            borderRadius: '50%', border: '2px solid rgba(138, 43, 226, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 2, boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
            animation: 'floatHeart 3s ease-in-out infinite'
          }}>
            <Heart size={44} color="var(--accent)" fill="var(--accent)" style={{ zIndex: 2 }} />
            <Sparkles size={24} color="#f59e0b" style={{ position: 'absolute', top: '-12px', right: '-12px', animation: 'floatHeart 2.5s ease-in-out infinite reverse' }} />
          </div>
        </div>

        {/* TÍTULO */}
        <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.8rem', letterSpacing: '-0.5px', fontWeight: 'bold' }}>
          Hub do Casal
        </h2>
        
        {/* TEXTO DINÂMICO SEM EMOJIS */}
        <p style={{ 
          margin: '0 0 48px 0', 
          color: 'var(--text)', 
          fontSize: '1rem', 
          fontStyle: 'italic',
          transition: 'opacity 0.2s ease-in-out',
          opacity: opacidadeTexto,
          minHeight: '24px' 
        }}>
          {FRASES_LOADING[fraseIndex]}
        </p>

        {/* BARRA DE PROGRESSO */}
        <div style={{ width: '200px', height: '4px', background: 'var(--code-bg)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{
            width: `${progress}%`, height: '100%', 
            background: 'linear-gradient(90deg, var(--accent), #d946ef)',
            transition: 'width 0.2s ease-out', borderRadius: '10px'
          }}></div>
        </div>
      </div>
    </>
  );
};