import { collection, onSnapshot, query, where } from 'firebase/firestore'; // <-- Removemos o orderBy daqui
import { useEffect, useState } from 'react';
import { PlannerLayout } from '../components/planner/PlannerLayout';
import { db, auth } from '../services/firebase'; // <-- IMPORTANTE: Adicionamos o auth aqui!
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
    // 1. Verifica quem é o usuário logado
    const user = auth.currentUser;
    if (!user) return;

    // 2. Busca APENAS as transações deste usuário
    const qTransacoes = query(collection(db, 'transacoes'), where('userId', '==', user.uid));
    const unsubT = onSnapshot(qTransacoes, (s) => {
      const dados = s.docs.map(d => ({ id: d.id, ...d.data() }));
      // Ordena localmente pela data (do mais recente para o mais antigo) para evitar erros de índice no Firebase
      dados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setTransacoes(dados);
    });

    // 3. Busca APENAS os compromissos deste usuário
    const qDividas = query(collection(db, 'dividas'), where('userId', '==', user.uid));
    const unsubD = onSnapshot(qDividas, (s) => {
      const dados = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setDividas(dados);
    });

    // 4. Busca APENAS as metas deste usuário
    const qMetas = query(collection(db, 'metas'), where('userId', '==', user.uid));
    const unsubM = onSnapshot(qMetas, (s) => {
      const dados = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setMetas(dados);
    });

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
