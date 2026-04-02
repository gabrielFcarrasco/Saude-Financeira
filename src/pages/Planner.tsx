import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { PlannerLayout } from '../components/planner/PlannerLayout';
import { db, auth } from '../services/firebase';
import './Planner.css';

// Importações dos componentes isolados
import { ResumoTab } from '../components/tabs/ResumoTab';
import { LancamentosTab } from '../components/tabs/LancamentosTab';
import { OrcamentoTab } from '../components/tabs/OrcamentoTab';
import { MetasTab } from '../components/tabs/MetasTab';
import { QuitacaoTab } from '../components/tabs/QuitacaoTab';
import { CasalTab } from '../components/casal/CasalTab';
import { AdminTab } from '../components/tabs/AdminTab';
import { ConfiguracoesTab } from '../components/tabs/ConfiguracoesTab';

export const Planner = () => {
  // 1. Estados de Navegação
  const [activeTab, setActiveTab] = useState('resumo');
  const [isLoading, setIsLoading] = useState(true);

  // 2. Estados Globais (Os dados puros da Base de Dados)
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [dividas, setDividas] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);

  // ==================== FIREBASE REAL-TIME ====================
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Busca APENAS as transações deste utilizador
    const qTransacoes = query(collection(db, 'transacoes'), where('userId', '==', user.uid));
    const unsubT = onSnapshot(qTransacoes, (s) => {
      const dados = s.docs.map(d => ({ id: d.id, ...d.data() }));
      dados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setTransacoes(dados);
    });

    // Busca APENAS os compromissos deste utilizador
    const qDividas = query(collection(db, 'dividas'), where('userId', '==', user.uid));
    const unsubD = onSnapshot(qDividas, (s) => {
      const dados = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setDividas(dados);
    });

    // Busca APENAS as metas deste utilizador (para usar APENAS na aba de Metas)
    const qMetas = query(collection(db, 'metas'), where('userId', '==', user.uid));
    const unsubM = onSnapshot(qMetas, (s) => {
      const dados = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setMetas(dados);
    });

    setTimeout(() => setIsLoading(false), 800);
    
    // Limpeza para evitar fugas de memória (memory leaks)
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

      {activeTab === 'configuracoes' && <ConfiguracoesTab />}

    </PlannerLayout>
  );
};