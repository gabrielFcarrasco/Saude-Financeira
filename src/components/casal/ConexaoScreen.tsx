import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

import { ConexaoChat } from './ConexaoChat';
import { ConexaoAlinhamento } from './ConexaoAlinhamento';

export const ConexaoScreen = ({ 
  casalId, currentUserRole, meuNome, parceiro1, parceiro2, corP1, corP2,
  formatMoney, totalCofre, limiteMensalLazer, saidas 
}: any) => {

  const [abaAtiva, setAbaAtiva] = useState<'chat' | 'alinhamento'>('chat');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<any>(null);

  const minhaCor = currentUserRole === 'p1' ? corP1 : corP2;
  const nomeParceiro = currentUserRole === 'p1' ? parceiro2 : parceiro1;
  const partnerRoleUpper = currentUserRole === 'p1' ? 'P2' : 'P1';

  // Escuta o status do Parceiro para o Cabeçalho
  useEffect(() => {
    if (!casalId) return;
    const unsub = onSnapshot(doc(db, 'casais', casalId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPartnerTyping(data[`typing${partnerRoleUpper}`] || false);
        setPartnerLastSeen(data[`lastSeen${partnerRoleUpper}`] || null);
      }
    });
    return () => unsub();
  }, [casalId, partnerRoleUpper]);

  // Lógica corrigida do Visto por último
  const formatarLastSeen = (timestamp: any) => {
    if (!timestamp) return ''; // Se não houver registro no banco ainda, não exibe nada falso
    
    // Proteção caso o firebase retorne o timestamp em formato diferente
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const agora = new Date();
    const diffMinutos = (agora.getTime() - data.getTime()) / 60000;
    
    if (diffMinutos < 2) return 'Online';
    
    const ontem = new Date(agora);
    ontem.setDate(ontem.getDate() - 1);
    
    if (data.getDate() === agora.getDate() && data.getMonth() === agora.getMonth()) {
        return `Visto hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (data.getDate() === ontem.getDate() && data.getMonth() === ontem.getMonth()) {
        return `Visto ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `Visto em ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', paddingBottom: '20px' }}>
      
      {/* HEADER FIXO */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--text-h)', margin: '0 0 4px 0', fontSize: '1.4rem' }}>
            {abaAtiva === 'chat' ? nomeParceiro : 'Nosso Espaço'}
          </h2>
          {abaAtiva === 'chat' && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: partnerTyping ? minhaCor : 'var(--text)', fontWeight: partnerTyping ? 'bold' : 'normal', transition: '0.3s' }}>
              {partnerTyping ? 'digitando...' : formatarLastSeen(partnerLastSeen)}
            </p>
          )}
        </div>
      </div>

      {/* ABAS */}
      <div style={{ display: 'flex', background: 'var(--code-bg)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '16px', flexShrink: 0 }}>
        <button onClick={() => setAbaAtiva('chat')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: abaAtiva === 'chat' ? 'var(--bg)' : 'transparent', color: abaAtiva === 'chat' ? 'var(--text-h)' : 'var(--text)', fontWeight: 'bold', boxShadow: abaAtiva === 'chat' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: '0.2s', cursor: 'pointer' }}>
          Conversa
        </button>
        <button onClick={() => setAbaAtiva('alinhamento')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: abaAtiva === 'alinhamento' ? 'var(--bg)' : 'transparent', color: abaAtiva === 'alinhamento' ? 'var(--text-h)' : 'var(--text)', fontWeight: 'bold', boxShadow: abaAtiva === 'alinhamento' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: '0.2s', cursor: 'pointer' }}>
          Alinhamento
        </button>
      </div>

      {/* FILHOS RENDERIZADOS */}
      {abaAtiva === 'chat' ? (
        <ConexaoChat 
          casalId={casalId} 
          currentUserRole={currentUserRole} 
          meuNome={meuNome} 
          minhaCor={minhaCor}
          formatMoney={formatMoney} 
          totalCofre={totalCofre} 
          limiteMensalLazer={limiteMensalLazer} 
          saidas={saidas} 
        />
      ) : (
        <ConexaoAlinhamento 
          casalId={casalId} 
          meuNome={meuNome} 
        />
      )}
      
    </div>
  );
};