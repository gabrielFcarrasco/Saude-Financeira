import React from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const OrcamentoModalAgenda = ({
  agendaAberto, setAgendaAberto, casalId,
  agendaP1, agendaP2, currentUserRole,
  parceiro1, parceiro2, corP1, corP2,
  abrirNovoPlanoComData // ✨ Nova função recebida do Pai
}: any) => {

  if (!agendaAberto) return null;

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const dias = Array.from({length: diasNoMes}, (_, i) => i + 1);
  const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long' });
  
  // ✨ Descobre em que dia da semana cai o dia 1 para alinhar o calendário
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); 

  const minhaAgenda = currentUserRole === 'p1' ? agendaP1 : agendaP2;
  const campoAtualizacao = currentUserRole === 'p1' ? 'agendaP1' : 'agendaP2';

  const toggleDia = async (dia: number) => {
    const diaStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    let novaAgenda = [...minhaAgenda];

    if (novaAgenda.includes(diaStr)) novaAgenda = novaAgenda.filter((d: string) => d !== diaStr);
    else novaAgenda.push(diaStr);

    await updateDoc(doc(db, 'casais', casalId), { [campoAtualizacao]: novaAgenda });
  };

  const matches = agendaP1.filter((d: string) => agendaP2.includes(d)).sort();

  const handleAgendarMatch = (dataStr: string) => {
    setAgendaAberto(false);
    abrirNovoPlanoComData(dataStr); // Abre o planner já com a data preenchida!
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="animate-slide-up" style={{ background: 'var(--bg)', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: '500px', padding: '32px 24px 60px', maxHeight: '85vh', overflowY: 'auto' }}>
        
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '10px', margin: '0 auto 24px' }}></div>
        
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', textAlign: 'center' }}>Match de Agendas 📅</h3>
        <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '0.85rem', textAlign: 'center', lineHeight: '1.4' }}>
          Selecione os seus dias livres em <span style={{textTransform: 'capitalize', fontWeight: 'bold', color: 'var(--accent)'}}>{mesNome}</span>.
        </p>

        {/* LEGENDA VISUAL COMPACTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: 'var(--code-bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <span style={{ color: corP1, display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:10, height:10, borderRadius:'50%', background: corP1}}></div> {parceiro1}</span>
          <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:12, height:12, borderRadius:'50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.8)'}}></div> MATCH</span>
          <span style={{ color: corP2, display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:10, height:10, borderRadius:'50%', background: corP2}}></div> {parceiro2}</span>
        </div>

        {/* ✨ GRELHA DO CALENDÁRIO CORRIGIDA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '24px' }}>
          {/* Cabeçalho dos dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>{d}</div>
          ))}
          
          {/* Espaços vazios para alinhar o dia 1 */}
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`empty-${i}`} />)}

          {dias.map(dia => {
            const diaStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const isP1 = agendaP1.includes(diaStr);
            const isP2 = agendaP2.includes(diaStr);
            const isMatch = isP1 && isP2;
            
            let bgColor = 'var(--code-bg)'; let textColor = 'var(--text)'; let border = '1px solid var(--border)'; let transform = 'none';

            if (isMatch) { bgColor = '#f59e0b'; textColor = '#fff'; border = 'none'; transform = 'scale(1.05)'; } 
            else if (isP1) { bgColor = `${corP1}20`; textColor = corP1; border = `1px solid ${corP1}`; } 
            else if (isP2) { bgColor = `${corP2}20`; textColor = corP2; border = `1px solid ${corP2}`; }

            return (
              <button key={dia} onClick={() => toggleDia(dia)} style={{ aspectRatio: '1', borderRadius: '10px', background: bgColor, color: textColor, border: border, fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: transform, padding: 0 }}>
                {dia}
              </button>
            );
          })}
        </div>

        {/* ✨ LISTA DE MATCHES COM BOTÃO DE AGENDAR */}
        {matches.length > 0 && (
          <div className="animate-fade-in" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Dias Livres Juntos</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {matches.map(m => {
                 const dataFormatada = m.split('-').reverse().join('/');
                 return (
                   <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--code-bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                     <span style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>{dataFormatada}</span>
                     <button onClick={() => handleAgendarMatch(m)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                       Marcar Passeio
                     </button>
                   </div>
                 )
              })}
            </div>
          </div>
        )}

        <button onClick={() => setAgendaAberto(false)} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '1rem' }}>
          Fechar
        </button>
      </div>
    </div>,
    document.body
  );
};