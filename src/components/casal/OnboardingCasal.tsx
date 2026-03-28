import React from 'react';
import "./CasalTab.css"

interface OnboardingCasalProps {
  statusVinculo: 'sem_vinculo' | 'aguardando' | 'convite_recebido';
  emailConvite: string;
  setEmailConvite: (email: string) => void;
  parceiro1: string; 
  onEnviarConvite: (e: React.FormEvent) => void;
  onAceitarConvite: () => void;
  onRecusarConvite: () => void;
  onCancelarConvite: () => void;
}

export const OnboardingCasal: React.FC<OnboardingCasalProps> = ({
  statusVinculo,
  emailConvite,
  setEmailConvite,
  parceiro1,
  onEnviarConvite,
  onAceitarConvite,
  onRecusarConvite,
  onCancelarConvite
}) => {
  return (
    <div className="onboarding-wrapper">
      
      {/* TELA 1: ENVIAR CONVITE (Apresentação dos Benefícios) */}
      {statusVinculo === 'sem_vinculo' && (
        <div className="onboarding-card">
          {/* Cabeçalho do Cartão */}
          <div className="onboarding-header">
            <div className="onboarding-icon-box icon-purple">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h1 className="onboarding-title">Gestão Financeira a Dois</h1>
            <p className="onboarding-subtitle">
              O dinheiro não precisa ser um tabu. Conecte sua conta com a do seu parceiro e construam um futuro sólido baseados na transparência e no planejamento conjunto.
            </p>
          </div>

          <div className="onboarding-body">
            {/* Coluna Esquerda: Por que fazer isso? */}
            <div className="onboarding-features-list">
              <h3 className="onboarding-section-title">Por que unir as finanças?</h3>
              
              <div className="onboarding-feature">
                <div className="onboarding-feature-icon" style={{ color: 'var(--accent)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>
                <div className="onboarding-feature-text">
                  <h4>Metas Aceleradas</h4>
                  <p>Unam forças para alcançar grandes objetivos mais rápido, como a compra de um imóvel ou uma viagem especial.</p>
                </div>
              </div>

              <div className="onboarding-feature">
                <div className="onboarding-feature-icon" style={{ color: '#10b981' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div className="onboarding-feature-text">
                  <h4>Cofre Transparente</h4>
                  <p>Saibam exatamente quanto possuem guardado em conjunto, com o registro detalhado de quem contribuiu com o quê.</p>
                </div>
              </div>

              <div className="onboarding-feature">
                <div className="onboarding-feature-icon" style={{ color: '#3b82f6' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"></path><rect x="3" y="15" width="6" height="6" rx="1"></rect><rect x="15" y="15" width="6" height="6" rx="1"></rect><path d="M12 7l-9 4"></path><path d="M12 7l9 4"></path></svg>
                </div>
                <div className="onboarding-feature-text">
                  <h4>Divisão Justa</h4>
                  <p>Mantenham o controle de quem pagou as despesas do dia a dia para que as contas fiquem sempre equilibradas.</p>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Formulário */}
            <div className="onboarding-form-box">
              <h3 className="onboarding-form-title">Comece agora</h3>
              <p className="onboarding-form-desc">Envie um convite para o parceiro(a).</p>
              
              <form onSubmit={onEnviarConvite} className="onboarding-form">
                <div className="onboarding-input-group">
                  <label>E-mail do convite</label>
                  <input 
                    type="email" 
                    placeholder="exemplo@email.com" 
                    value={emailConvite}
                    onChange={e => setEmailConvite(e.target.value)}
                    className="onboarding-input"
                    required
                  />
                </div>
                <button type="submit" className="btn-onboarding-primary">
                  Enviar Convite
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TELA 2: AGUARDANDO ACEITE */}
      {statusVinculo === 'aguardando' && (
        <div className="onboarding-card onboarding-card-small">
          <div className="onboarding-icon-box icon-blue">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <h2 className="onboarding-title">Convite Enviado</h2>
          <p className="onboarding-subtitle" style={{ marginBottom: '32px' }}>
            Falta muito pouco para vocês começarem a planejar juntos. O convite foi enviado para <strong>{emailConvite}</strong>. Assim que for aceito, o painel conjunto será liberado automaticamente.
          </p>
          <button onClick={onCancelarConvite} className="btn-onboarding-secondary">
            Cancelar envio e voltar
          </button>
        </div>
      )}

      {/* TELA 3: RECEBEU UM CONVITE */}
      {statusVinculo === 'convite_recebido' && (
        <div className="onboarding-card onboarding-card-small">
          <div className="onboarding-icon-box icon-green">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h2 className="onboarding-title">Você recebeu um convite</h2>
          <p className="onboarding-subtitle" style={{ marginBottom: '24px' }}>
            <strong>{parceiro1}</strong> convidou você para compartilhar o planejamento financeiro do casal.
          </p>
          
          <div className="onboarding-perks-box">
            <p className="onboarding-perks-title">O que será liberado:</p>
            <ul className="onboarding-perks-list">
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Cofre conjunto detalhado</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Orçamento livre e lazer</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Balança de despesas conjuntas</li>
            </ul>
          </div>
          
          <div className="btn-group">
            <button onClick={onRecusarConvite} className="btn-onboarding-secondary">
              Recusar
            </button>
            <button onClick={onAceitarConvite} className="btn-onboarding-primary btn-success">
              Aceitar Convite
            </button>
          </div>
        </div>
      )}

    </div>
  );
};