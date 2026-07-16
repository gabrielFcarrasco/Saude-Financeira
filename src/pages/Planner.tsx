import { useState } from 'react';
import { PlannerLayout } from '../components/planner/PlannerLayout';
import { CasalTab } from '../components/casal/CasalTab';
import { ConfiguracoesTab } from '../components/tabs/ConfiguracoesTab';


export const Planner = () => {
  // A aba padrão agora é o Hub (Início)
  const [activeTab, setActiveTab] = useState('hub');

  return (
    <PlannerLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate-fade-in" style={{ height: '100%' }}>
        
        {/* Se clicar em Perfil, abre Configurações. Senão, abre a tela do Casal passando a aba escolhida */}
        {activeTab === 'configuracoes' ? (
          <ConfiguracoesTab />
        ) : (
          <CasalTab activeView={activeTab} setActiveView={setActiveTab} />
        )}
        
      </div>
    </PlannerLayout>
  );
};