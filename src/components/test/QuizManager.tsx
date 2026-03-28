import React, { useState } from 'react';
import { QuestionCard } from './QuestionCard';

// Perguntas baseadas nos perfis financeiros do SENAI
const questions = [
  {
    id: 1,
    question: "Como você lida com o seu salário no fim do mês?",
    options: [
      { label: "Gasto tudo e às vezes falta dinheiro.", value: "gastador" },
      { label: "Mantenho as contas em dia, mas gasto o que sobra com bens não duráveis.", value: "despreocupado" },
      { label: "Busco poupar uma parte e ter uma reserva financeira.", value: "comprometido" }
    ]
  },
  {
    id: 2,
    question: "Qual a sua relação com o Cartão de Crédito e Cheque Especial?",
    options: [
      { label: "Não consigo pagar a fatura integral e uso todo o cheque especial.", value: "gastador" },
      { label: "Uso eventualmente o cheque especial e parcelo compras.", value: "despreocupado" },
      { label: "Compro à vista. Se necessário, restrinjo gastos.", value: "comprometido" }
    ]
  }
];

export const QuizManager = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = (finalAnswers: string[]) => {
    // Lógica simples: qual valor apareceu mais vezes?
    const profileCounts = finalAnswers.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result = Object.keys(profileCounts).reduce((a, b) => 
      profileCounts[a] > profileCounts[b] ? a : b
    );

    // Salvando no cache do navegador!
    localStorage.setItem('perfilFinanceiro', result);
    alert(`Quiz finalizado! Seu perfil é: ${result.toUpperCase()}`);
    
    // Aqui depois faremos um redirecionamento ou mudaremos o estado para mostrar a tela <ResultadoPerfil />
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>Descubra seu Perfil Financeiro</h2>
      <QuestionCard 
        question={questions[currentQuestionIndex].question}
        options={questions[currentQuestionIndex].options}
        onAnswer={handleAnswer}
      />
      <p style={{ textAlign: 'center' }}>Pergunta {currentQuestionIndex + 1} de {questions.length}</p>
    </div>
  );
};