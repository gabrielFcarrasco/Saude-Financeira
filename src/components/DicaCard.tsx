

interface DicaCardProps {
  titulo: string;
  conteudo: string;
}

export const DicaCard: React.FC<DicaCardProps> = ({ titulo, conteudo }) => {
  return (
    <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
      <h3 style={{ marginBottom: '8px', color: 'var(--accent)' }}>{titulo}</h3>
      <p style={{ lineHeight: '1.6' }}>{conteudo}</p>
    </div>
  );
};