import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DicaCard } from '../components/DicaCard';

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
    <div className="main-content">
      <div className="badge">Análise Concluída</div>
      <h1>Seu perfil é: <span style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{perfil}</span></h1>
      
      <p style={{ maxWidth: '600px', marginBottom: '32px', fontSize: '1.1rem' }}>
        Com base no seu resultado, preparamos uma trilha específica para ajudar você a alcançar o equilíbrio e a prosperidade financeira.
      </p>

      {/* Renderização Condicional baseada no Perfil */}
      
      {perfil === 'gastador' && (
        <>
          <DicaCard 
            titulo="Corte o Crédito Fácil" 
            conteudo="Não utilize o cartão de crédito se não consegue pagar a fatura em dia[cite: 160]. As taxas de juros são as mais altas do mercado e devem ser evitadas[cite: 221]." 
          />
          <DicaCard 
            titulo="Priorize e Renegocie" 
            conteudo="Faça uma relação de todas as dívidas e priorize as maiores e com juros mais altos[cite: 321, 323]. Tente renegociar buscando melhores prazos e juros mais baixos[cite: 322]." 
          />
        </>
      )}

      {perfil === 'despreocupado' && (
        <>
          <DicaCard 
            titulo="Evite Compras por Impulso" 
            conteudo="Sempre que possível, adie a compra para o dia seguinte[cite: 71]. Isso dará tempo para refletir se o produto é realmente necessário[cite: 72]." 
          />
          <DicaCard 
            titulo="Cuidado com os Pequenos Gastos" 
            conteudo="Faça o apontamento diário de todas as despesas[cite: 152]. Pequenos gastos diários que parecem insignificantes podem consumir boa parte do seu orçamento[cite: 197]." 
          />
        </>
      )}

      {perfil === 'comprometido' && (
        <>
          <DicaCard 
            titulo="Mantenha a Reserva" 
            conteudo="Continue buscando conhecimentos para a vida financeira e mantendo sua reserva monetária para o futuro[cite: 54, 55]." 
          />
          <DicaCard 
            titulo="Faça o Dinheiro Trabalhar" 
            conteudo="Como suas contas estão equilibradas, foque em opções de investimento de acordo com seu perfil (Conservador, Moderado ou Arrojado)[cite: 151, 374]." 
          />
        </>
      )}

      <button className="primary" style={{ marginTop: '32px' }} onClick={() => navigate('/login')}>
        Criar meu Planner Completo
      </button>
    </div>
  );
};