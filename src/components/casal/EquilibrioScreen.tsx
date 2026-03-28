import React, { useState, useEffect } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const EquilibrioScreen = ({ 
  setActiveView, casalId, despesasRapidas, parceiro1, parceiro2, formatMoney, icons 
}: any) => {
  
  const [isProcessando, setIsProcessando] = useState(false);

  // ==========================================
  // LÓGICA DE ZERAR AUTOMATICAMENTE NO MÊS NOVO
  // ==========================================
  useEffect(() => {
    if (!casalId || despesasRapidas.length === 0) return;

    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();

    // Verifica se há algum gasto com data de criação de um mês/ano anterior
    const temGastoAntigo = despesasRapidas.some((gasto: any) => {
      // Se não tiver createdAt, ignora para não quebrar
      if (!gasto.createdAt) return false; 
      
      // Converte o Timestamp do Firebase para uma Data do JavaScript
      const dataGasto = gasto.createdAt.toDate ? gasto.createdAt.toDate() : new Date();
      
      return dataGasto.getMonth() !== mesAtual || dataGasto.getFullYear() !== anoAtual;
    });

    // Se detectou gastos de meses passados, zera tudo silenciosamente
    if (temGastoAntigo) {
      const zerarAutomatico = async () => {
        try {
          const batch = writeBatch(db);
          despesasRapidas.forEach((gasto: any) => {
            const docRef = doc(db, 'casais', casalId, 'despesas_rapidas', gasto.id);
            batch.delete(docRef);
          });
          await batch.commit();
        } catch (error) {
          console.error("Erro na limpeza automática da balança:", error);
        }
      };
      
      zerarAutomatico();
    }
  }, [despesasRapidas, casalId]);


  // Cálculos de Gastos
  const gastosP1 = despesasRapidas
    .filter((d: any) => d.pagoPor === parceiro1)
    .reduce((acc: number, curr: any) => acc + (Number(curr.valor) || 0), 0);
    
  const gastosP2 = despesasRapidas
    .filter((d: any) => d.pagoPor === parceiro2)
    .reduce((acc: number, curr: any) => acc + (Number(curr.valor) || 0), 0);

  const total = gastosP1 + gastosP2;
  const diferenca = Math.abs(gastosP1 - gastosP2);
  const quemEstaDevendo = gastosP1 > gastosP2 ? parceiro2 : parceiro1;
  const quemGastouMais = gastosP1 > gastosP2 ? parceiro1 : parceiro2;

  const posicaoBalanca = total > 0 ? (gastosP1 / total) * 100 : 50;

  // Função Manual de Zerar
  const handleZerarBalanca = async () => {
    if (!casalId || despesasRapidas.length === 0) return;
    
    if (window.confirm(`Deseja zerar o histórico de gastos? Isso marcará o equilíbrio atual como resolvido.`)) {
      try {
        setIsProcessando(true);
        const batch = writeBatch(db);
        
        despesasRapidas.forEach((gasto: any) => {
          const docRef = doc(db, 'casais', casalId, 'despesas_rapidas', gasto.id);
          batch.delete(docRef);
        });

        await batch.commit();

      } catch (error) {
        console.error("Erro ao zerar a balança:", error);
        alert("Ocorreu um erro ao tentar zerar a balança. Tente novamente.");
      } finally {
        setIsProcessando(false);
      }
    }
  };

  return (
    <div className="hub-fintech-container animate-fade-in">
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button className="btn-voltar" onClick={() => setActiveView('hub')} style={{ margin: 0 }} disabled={isProcessando}>
          {icons.voltar} Voltar
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Nossa Balança</h2>
          <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Mantendo tudo justo e leve</span>
        </div>
      </div>

      {/* CARD PRINCIPAL DA BALANÇA */}
      <div className="hub-balance-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden', opacity: isProcessando ? 0.7 : 1 }}>
        <span className="hub-balance-label">Diferença Atual</span>
        <h1 style={{ fontSize: '3.5rem', color: 'var(--text-h)', margin: '8px 0' }}>{formatMoney(diferenca)}</h1>
        <p style={{ color: 'var(--text)', marginBottom: '32px' }}>
          {diferenca === 0 
            ? "Vocês estão em perfeito equilíbrio!" 
            : `${quemGastouMais} investiu mais nos últimos rolês.`}
        </p>

        {/* VISUAL DA BALANÇA (GANGORRA) */}
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto 24px auto' }}>
          <div style={{ 
            width: '100%', 
            height: '6px', 
            background: 'var(--border)', 
            borderRadius: '10px', 
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            {/* Marcador Central */}
            <div style={{ 
              position: 'absolute', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              width: '2px', 
              height: '16px', 
              background: 'var(--text)',
              zIndex: 1
            }}></div>

            {/* O "Peso" da Balança */}
            <div style={{ 
              position: 'absolute', 
              left: `${posicaoBalanca}%`, 
              transform: 'translateX(-50%)', 
              width: '24px', 
              height: '24px', 
              background: posicaoBalanca > 50 ? 'var(--accent)' : '#10b981',
              borderRadius: '50%',
              border: '4px solid var(--bg)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: 'left 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <span style={{ color: 'var(--accent)' }}>{parceiro1}<br/>{formatMoney(gastosP1)}</span>
            <span style={{ color: '#10b981', textAlign: 'right' }}>{parceiro2}<br/>{formatMoney(gastosP2)}</span>
          </div>
        </div>

        {/* BOTÃO ZERAR MANUAL */}
        {diferenca > 0 && (
          <button 
            onClick={handleZerarBalanca}
            disabled={isProcessando}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: '8px', cursor: isProcessando ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
          >
            {isProcessando ? 'Zerando...' : 'Zerar Balança'}
          </button>
        )}
      </div>

      {/* SUGESTÃO DE PRÓXIMO PASSO */}
      <div style={{ 
        background: 'rgba(59, 130, 246, 0.05)', 
        border: '1px solid rgba(59, 130, 246, 0.2)', 
        padding: '20px', 
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{ color: '#3b82f6', flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M4 12H2"></path>
            <path d="M22 12h-2"></path>
            <path d="M19.07 4.93l-1.41 1.41"></path>
            <path d="M6.34 17.66l-1.41 1.41"></path>
            <path d="M19.07 19.07l-1.41-1.41"></path>
            <path d="M6.34 6.34l-1.41 1.41"></path>
          </svg>
        </div>
        <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {diferenca < 20 
            ? "Vocês estão mandando muito bem! Que tal um sorvete para comemorar esse equilíbrio?" 
            : `Para equilibrar, o próximo rolê (até ${formatMoney(diferenca * 2)}) poderia ser por conta de ${quemEstaDevendo}.`}
        </p>
      </div>

      {/* HISTÓRICO DE QUEM PAGOU O QUÊ */}
      <div className="extrato-container">
        <h3 style={{ color: 'var(--text-h)', marginBottom: '20px' }}>O que rolou nos últimos rolês</h3>
        
        {despesasRapidas.length > 0 ? (
          despesasRapidas.map((gasto: any) => (
            <div key={gasto.id} className="extrato-item" style={{ borderLeft: `4px solid ${gasto.pagoPor === parceiro1 ? 'var(--accent)' : '#10b981'}` }}>
              <div className="extrato-info" style={{ paddingLeft: '12px' }}>
                <span className="extrato-titulo">{gasto.desc}</span>
                <span className="extrato-data">{gasto.data} • Pago por <strong style={{color: gasto.pagoPor === parceiro1 ? 'var(--accent)' : '#10b981'}}>{gasto.pagoPor}</strong></span>
              </div>
              <div className="extrato-valor" style={{ color: 'var(--text-h)' }}>
                {formatMoney(gasto.valor)}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text)', padding: '40px' }}>Tudo equilibrado. Nenhum gasto recente!</p>
        )}
      </div>

    </div>
  );
};