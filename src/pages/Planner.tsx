import { useState } from 'react';
import { PlannerLayout } from '../components/planner/PlannerLayout';
import { CasalTab } from '../components/casal/CasalTab';
import { ConfiguracoesTab } from '../components/tabs/ConfiguracoesTab';

// ✨ IMPORTANDO O VIGILANTE (Ajuste o caminho da pasta se precisar!)
import { GlobalNotifier } from '../components/casal/GlobalNotifier'; 

export const Planner = () => {
  const [activeTab, setActiveTab] = useState('hub');

  return (
    <PlannerLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {/* ✨ ELE FICA AQUI! Vigiando as notificações não importa qual tela esteja aberta */}
      <GlobalNotifier />
      
      <div className="animate-fade-in" style={{ height: '100%' }}>
        {activeTab === 'configuracoes' ? (
          <ConfiguracoesTab />
        ) : (
          <CasalTab activeView={activeTab} setActiveView={setActiveTab} />
        )}
      </div>
    </PlannerLayout>
  );
};