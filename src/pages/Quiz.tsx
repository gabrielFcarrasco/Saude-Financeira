import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizData } from '../services/quizData';

export const Quiz = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    
    if (currentIndex < quizData.length - 1) {
      setAnswers(newAnswers);
      setCurrentIndex(currentIndex + 1);
    } else {
      // Finaliza o quiz e descobre o perfil predominante
      const profileCounts = newAnswers.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const finalProfile = Object.keys(profileCounts).reduce((a, b) => 
        profileCounts[a] > profileCounts[b] ? a : b
      );

      // Salva no localStorage e vai para a página de resultados
      localStorage.setItem('perfilFinanceiro', finalProfile);
      navigate('/resultados');
    }
  };

  const currentQuestion = quizData[currentIndex];

  return (
    <div className="main-content">
      <div className="badge">Pergunta {currentIndex + 1} de {quizData.length}</div>
      <div className="card">
        <h2>{currentQuestion.question}</h2>
        <div className="options-grid">
          {currentQuestion.options.map((option, index) => (
            <button 
              key={index} 
              className="option-btn" 
              onClick={() => handleAnswer(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};