import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { PlannerLayout } from '../components/planner/PlannerLayout';
import { db } from '../services/firebase';
import './Planner.css';

// Importações dos componentes isolados
import { ResumoTab } from '../components/tabs/ResumoTab';
import { LancamentosTab } from '../components/tabs/LancamentosTab';
import { OrcamentoTab } from '../components/tabs/OrcamentoTab';
import { MetasTab } from '../components/tabs/MetasTab';
import { QuitacaoTab } from '../components/tabs/QuitacaoTab';
import { CasalTab } from '../components/casal/CasalTab';
import { AdminTab } from '../components/tabs/AdminTab';

export const Planner = () => {
  // 1. Estados de Navegação
  const [activeTab, setActiveTab] = useState('resumo');
  const [isLoading, setIsLoading] = useState(true);

  // 2. Estados Globais (Os dados puros do Banco)
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [dividas, setDividas] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);

  // ==================== FIREBASE REAL-TIME ====================
  useEffect(() => {
    // Busca as transações
    const unsubT = onSnapshot(query(collection(db, 'transacoes'), orderBy('data', 'desc')), (s) => 
      setTransacoes(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    // Busca os compromissos (dívidas)
    const unsubD = onSnapshot(query(collection(db, 'dividas'), orderBy('criadoEm', 'desc')), (s) => 
      setDividas(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    // Busca os objetivos (metas)
    const unsubM = onSnapshot(query(collection(db, 'metas'), orderBy('criadoEm', 'asc')), (s) => 
      setMetas(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    setTimeout(() => setIsLoading(false), 800);
    
    // Limpeza para evitar vazamento de memória
    return () => { unsubT(); unsubD(); unsubM(); };
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2 className="pulse-text">Sincronizando dados...</h2>
      </div>
    );
  }

  return (
    <PlannerLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {/* ==================== RENDERIZAÇÃO DAS ABAS ==================== */}
      
      {activeTab === 'resumo' && (
        <ResumoTab 
          transacoes={transacoes} 
          dividas={dividas} 
          // Redireciona o usuário para a aba de Lançamentos quando ele clica no botão
          abrirModalLancamento={() => setActiveTab('lancamentos')} 
        />
      )}
      
      {activeTab === 'lancamentos' && (
        <LancamentosTab 
          transacoes={transacoes} 
        />
      )}
      
      {activeTab === 'orcamento' && (
        <OrcamentoTab 
          transacoes={transacoes} 
        />
      )}
      
      {activeTab === 'metas' && (
        <MetasTab 
          transacoes={transacoes} 
          metas={metas} 
        />
      )}
      
      {activeTab === 'quitacao' && (
        <QuitacaoTab 
          dividas={dividas} 
          transacoes={transacoes} 
        />
      )}

      {activeTab === 'casal' && (
        <CasalTab />
      )}
      
      {activeTab === 'admin' && (
        <AdminTab />
      )}

    </PlannerLayout>
  );
};