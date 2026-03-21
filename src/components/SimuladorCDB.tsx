import React, { useState } from 'react';

export const SimuladorCDB = () => {
  // Estados para os inputs do usuário
  const [aporteMensal, setAporteMensal] = useState<number>(100);
  const [meses, setMeses] = useState<number>(240);
  
  // Estados para os resultados
  const [resultadoPoupanca, setResultadoPoupanca] = useState<number | null>(null);
  const [resultadoCDB, setResultadoCDB] = useState<number | null>(null);

  const calcularRendimentos = (e: React.FormEvent) => {
    e.preventDefault();

    // Taxas mensais simuladas
    const taxaPoupanca = 0.005; // 0,5% ao mês (Padrão histórico)
    const taxaCDB = 0.008;      // 0,8% ao mês (Exemplo de CDB prefixado moderado)

    // Função interna que aplica a fórmula de juros compostos para aportes mensais
    const simular = (taxa: number) => {
      return aporteMensal * ((Math.pow(1 + taxa, meses) - 1) / taxa);
    };

    setResultadoPoupanca(simular(taxaPoupanca));
    setResultadoCDB(simular(taxaCDB));
  };

  // Função para formatar o valor em Reais (BRL)
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="card">
      <h2 style={{ color: 'var(--accent)' }}>Simulador de Investimentos</h2>
      <p style={{ marginBottom: '24px' }}>
        Veja como pequenos valores se transformam no futuro[cite: 369].
      </p>

      <form onSubmit={calcularRendimentos}>
        <div className="form-group">
          <label htmlFor="aporte">Aporte Mensal (R$)</label>
          <input 
            type="number" 
            id="aporte" 
            min="10"
            value={aporteMensal} 
            onChange={(e) => setAporteMensal(Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="meses">Prazo (em meses)</label>
          <input 
            type="number" 
            id="meses" 
            min="1"
            value={meses} 
            onChange={(e) => setMeses(Number(e.target.value))}
            required
          />
        </div>

        <button type="submit" className="primary" style={{ width: '100%' }}>
          Calcular Projeção
        </button>
      </form>

      {/* Área de Resultados - Só aparece após calcular */}
      {resultadoPoupanca !== null && resultadoCDB !== null && (
        <div style={{ marginTop: '32px', padding: '16px', background: 'var(--social-bg)', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>Resultado em {meses} meses</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <span><strong>Poupança</strong> (Conservador):</span>
            <span style={{ color: 'var(--text-h)', fontWeight: 'bold' }}>{formatarMoeda(resultadoPoupanca)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>CDB Prefixado</strong> (Moderado):</span>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{formatarMoeda(resultadoCDB)}</span>
          </div>
          
          <p style={{ fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
            *Valores brutos projetados. O CDB possui incidência de Imposto de Renda sobre o lucro.
          </p>
        </div>
      )}
    </div>
  );
};