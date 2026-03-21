

interface Option {
  label: string;
  value: string; // 'A', 'B' ou 'C'
}

interface QuestionCardProps {
  question: string;
  options: Option[];
  onAnswer: (value: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, options, onAnswer }) => {
  return (
    <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', maxWidth: '500px', margin: '20px auto' }}>
      <h3 style={{ marginBottom: '20px' }}>{question}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {options.map((option, index) => (
          <button 
            key={index} 
            onClick={() => onAnswer(option.value)}
            style={{ padding: '10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};