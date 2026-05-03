import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase'; // Ajuste o caminho se necessário
import { frases, versiculos } from './mensagens'; 

export const HubScreen = ({ 
  setActiveView, parceiro1, parceiro2, formatMoney,
  casalId, // Novo prop que o CasalTab está passando
  contribuicoes, setContribuicoes, despesasRapidas, 
  desafioP1, desafioP2, novoDepositoAberto, setNovoDepositoAberto,
  depMes, setDepMes, depP1, setDepP1, depP2, setDepP2
}: any) => {

  const [mostrarExtratoCompleto, setMostrarExtratoCompleto] = useState(false);
  const [depLocal, setDepLocal] = useState('');
  
  const [versiculoDia] = useState(() => {
    return versiculos[Math.floor(Math.random() * versiculos.length)];
  });

  const [fraseDia] = useState(() => {
    return frases[Math.floor(Math.random() * frases.length)];
  });

  const [textoVersiculo, refVersiculo] = versiculoDia.split(' - ');

  const totalDesafioP1 = desafioP1.reduce((a: number, b: number) => a + b, 0);
  const totalDesafioP2 = desafioP2.reduce((a: number, b: number) => a + b, 0);
  const totalDepositosP1 = contribuicoes.reduce((acc: number, curr: any) => acc + (Number(curr.p1Contr) || 0), 0);
  const totalDepositosP2 = contribuicoes.reduce((acc: number, curr: any) => acc + (Number(curr.p2Contr) || 0), 0);
  
  const totalP1 = totalDepositosP1 + totalDesafioP1;
  const totalP2 = totalDepositosP2 + totalDesafioP2;
  const totalCofre = totalP1 + totalP2;

  const percP1 = totalCofre > 0 ? (totalP1 / totalCofre) * 100 : 50;
  const percP2 = totalCofre > 0 ? (totalP2 / totalCofre) * 100 : 50;

  // Unifica e ordena as movimentações pela data de criação real do Firebase
  const extratoUnificado = [
    ...contribuicoes.map((c: any) => ({
      id: c.id,
      tipo: 'entrada',
      titulo: 'Depósito',
      data: c.mesData,
      valor: Number(c.p1Contr || 0) + Number(c.p2Contr || 0),
      detalhe: `${c.local ? `${c.local} | ` : ''}${parceiro1}: ${formatMoney(c.p1Contr || 0)} - ${parceiro2}: ${formatMoney(c.p2Contr || 0)}`,
      timestamp: c.createdAt?.toMillis() || 0
    })),
    ...despesasRapidas.map((d: any) => ({
      id: d.id,
      tipo: 'saida',
      titulo: d.desc,
      data: d.data,
      valor: Number(d.valor || 0),
      detalhe: `Pago por ${d.pagoPor}`,
      timestamp: d.createdAt?.toMillis() || 0
    }))
  ].sort((a, b) => b.timestamp - a.timestamp); // Agora a ordenação funciona com os dados do Firebase

  const extratoExibido = mostrarExtratoCompleto ? extratoUnificado : extratoUnificado.slice(0, 3);

  // Função assíncrona conectada ao Firebase
  const handleSalvar = async () => {
    if (!depP1 && !depP2) return;
    if (!casalId) {
      alert("Erro de conexão. Vínculo do casal não encontrado.");
      return;
    }

    try {
      // Salva direto na nuvem. O useEffect do CasalTab vai atualizar a tela sozinho!
      await addDoc(collection(db, 'casais', casalId, 'contribuicoes'), {
        mesData: depMes || 'Mês Atual',
        local: depLocal || 'Não informado',
        p1Contr: Number(depP1 || 0),
        p2Contr: Number(depP2 || 0),
        createdAt: serverTimestamp() // Cria uma data oficial do servidor do Google
      });

      // Limpa o formulário apenas se der sucesso
      setNovoDepositoAberto(false); 
      setDepMes(''); 
      setDepP1(''); 
      setDepP2('');
      setDepLocal('');
    } catch (error) {
      console.error("Erro ao salvar depósito:", error);
      alert("Houve um erro ao salvar seu depósito. Tente novamente.");
    }
  };

  return (
    <div className="hub-fintech-container animate-fade-in">
      
      {/* CAIXA DO VERSÍCULO - TOPO */}
      <div style={{ 
        display: 'flex',
        gap: '16px',
        background: 'var(--bg)', 
        padding: '20px', 
        marginBottom: '24px', 
        borderRadius: '12px',
        border: '1px solid var(--border)',
        alignItems: 'flex-start'
      }}>
        {/* Ícone de Aspas */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--border)" opacity="0.5" flexShrink="0">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontStyle: 'italic', color: 'var(--text-h)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            "{textoVersiculo}"
          </span>
          {refVersiculo && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              — {refVersiculo}
            </span>
          )}
        </div>
      </div>

      {/* 1. CARTÃO DE SALDO CENTRAL */}
      <div className="hub-balance-card">
        <div className="hub-balance-label">Saldo Conjunto</div>
        <h1 className="hub-balance-value">{formatMoney(totalCofre)}</h1>
        
        <div className="split-bar-container" style={{ width: '100%', maxWidth: '350px', height: '10px', marginBottom: '20px' }}>
          <div className="split-p1" style={{ width: `${percP1}%` }}></div>
          <div className="split-p2" style={{ width: `${percP2}%` }}></div>
        </div>
        
        {/* NOVA ÁREA DE INFORMAÇÕES INDIVIDUAIS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '350px', fontSize: '0.9rem' }}>
          {/* Informações Parceiro 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-h)', fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }}></span> 
              {parceiro1}
            </span>
            <span style={{ color: 'var(--text)' }}>{formatMoney(totalP1)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.8 }}>{percP1.toFixed(1)}% do total</span>
          </div>

          {/* Informações Parceiro 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-h)', fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></span> 
              {parceiro2}
            </span>
            <span style={{ color: 'var(--text)' }}>{formatMoney(totalP2)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.8 }}>{percP2.toFixed(1)}% do total</span>
          </div>
        </div>
      </div>

      {/* 2. ATALHOS RÁPIDOS */}
      <div className="hub-actions-wrapper">
        <div className="hub-actions-list">
          
          <div className="action-btn" onClick={() => setNovoDepositoAberto(!novoDepositoAberto)} style={{ borderColor: novoDepositoAberto ? 'var(--accent)' : 'var(--border)' }}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span className="action-label">Depositar</span>
          </div>
          
          <div className="action-btn" onClick={() => setActiveView('desafio200')}>
            <div className="action-icon" style={{ color: '#f59e0b' }}>
              {/* Ícone de Troféu para o Acelerador */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.47.98-1 1.05l-3.91.52"></path>
                <path d="M14 14.66V17c0 .55.47.98 1 1.05l3.91.52"></path>
                <path d="M18 4v5c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z"></path>
              </svg>
            </div>
            <span className="action-label">Acelerador</span>
          </div>
          
          <div className="action-btn" onClick={() => setActiveView('lazer')}>
            <div className="action-icon" style={{ color: '#ec4899' }}>
              {/* Ícone de Sorriso para o Lazer */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <span className="action-label">Lazer</span>
          </div>

          <div className="action-btn" onClick={() => setActiveView('metas')}>
            <div className="action-icon" style={{ color: '#8b5cf6' }}>
              {/* Ícone de Estrela para Metas */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <span className="action-label">Metas</span>
          </div>

          {/* BALANÇA COMENTADA / INATIVADA 
          <div className="action-btn" onClick={() => setActiveView('equilibrio')}>
            <div className="action-icon" style={{ color: '#3b82f6' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18"></path><rect x="3" y="15" width="6" height="6" rx="1"></rect><rect x="15" y="15" width="6" height="6" rx="1"></rect><path d="M12 7l-9 4"></path><path d="M12 7l9 4"></path>
              </svg>
            </div>
            <span className="action-label">Balança</span>
          </div>
          */}
        </div>
      </div>

      {/* MODAL DE DEPÓSITO */}
      {novoDepositoAberto && (
        <div className="simulator-box animate-fade-in" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--accent)' }}>Registrar Depósito</h4>
          <div className="simulator-row"><span>Mês/Ref.</span><input type="text" value={depMes} onChange={e => setDepMes(e.target.value)} placeholder="Ex: Março" style={{ width: '130px', background: 'var(--bg)', color: 'var(--text-h)', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} /></div>
          <div className="simulator-row"><span>Instituição/Local</span><input type="text" value={depLocal} onChange={e => setDepLocal(e.target.value)} placeholder="Ex: Poupança, Nubank" style={{ width: '130px', background: 'var(--bg)', color: 'var(--text-h)', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} /></div>
          <div className="simulator-row"><span>Valor {parceiro1}</span><input type="number" value={depP1} onChange={e => setDepP1(e.target.value)} placeholder="0,00" style={{ width: '130px', background: 'var(--bg)', color: 'var(--text-h)', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} /></div>
          <div className="simulator-row"><span>Valor {parceiro2}</span><input type="number" value={depP2} onChange={e => setDepP2(e.target.value)} placeholder="0,00" style={{ width: '130px', background: 'var(--bg)', color: 'var(--text-h)', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} /></div>
          <button className="primary" onClick={handleSalvar} style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Salvar</button>
        </div>
      )}

      {/* CAIXA DA FRASE - ANTES DO EXTRATO */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderLeft: '3px solid #8b5cf6',
        background: 'rgba(139, 92, 246, 0.05)', 
        padding: '16px',
        marginBottom: '24px',
        borderRadius: '0 8px 8px 0',
      }}>
        {/* Ícone de Lâmpada / Insight */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink="0">
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
        <p style={{ margin: 0, color: 'var(--text-h)', fontSize: '0.9rem', fontWeight: 500 }}>
          {fraseDia}
        </p>
      </div>

      {/* 3. EXTRATO (LISTA) */}
      <div className="extrato-container">
        <div className="extrato-header">
          <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Últimas Movimentações</h3>
          <button 
            onClick={() => setMostrarExtratoCompleto(!mostrarExtratoCompleto)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {mostrarExtratoCompleto ? 'Ocultar' : 'Ver tudo'}
          </button>
        </div>

        <div>
          {extratoExibido.map((item: any) => (
            <div key={`${item.tipo}-${item.id}`} className={`extrato-item ${item.tipo}`}>
              <div className="extrato-icon-box">
                {item.tipo === 'entrada' 
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                }
              </div>
              <div className="extrato-info">
                <span className="extrato-titulo">{item.titulo}</span>
                <span className="extrato-data" style={{ fontSize: '0.8rem' }}>{item.data} • {item.detalhe}</span>
              </div>
              <div className="extrato-valor" style={{ color: item.tipo === 'entrada' ? '#10b981' : 'var(--text-h)' }}>
                {item.tipo === 'entrada' ? '+' : '-'}{formatMoney(item.valor)}
              </div>
            </div>
          ))}
          
          {extratoUnificado.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text)', padding: '16px 0' }}>Nenhuma movimentação registrada.</p>
          )}
        </div>
      </div>

    </div>
  );
};