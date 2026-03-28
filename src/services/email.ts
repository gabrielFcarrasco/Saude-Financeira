import { doc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const DOMINIO = "https://gcsaudefinanceira.vercel.app";

// Estilos globais unificados para manter o padrão visual limpo e claro
const tema = {
  fundoTela: '#f8fafc', // Cinza muito claro (fundo do email)
  fundoCard: '#ffffff', // Branco (fundo da carta)
  textoBase: '#475569', // Cinza chumbo (texto corrido)
  Titulo: '#0f172a',    // Quase preto (títulos)
  roxoClaro: '#f3e8ff', // Fundo de destaque
  roxoPrimario: '#8b5cf6', // Cor principal GC
  borda: '#e2e8f0'      // Linhas finas
};

/**
 * 1. E-MAIL DE BOAS-VINDAS
 */
export const enviarEmailBoasVindas = async (emailDestino: string, nomeUsuario: string) => {
  const htmlBoasVindas = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${tema.fundoTela}; color: ${tema.textoBase};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${tema.fundoTela}; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: ${tema.fundoCard}; border-radius: 16px; border: 1px solid ${tema.borda}; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              
              <tr>
                <td align="center" style="padding: 40px 0 20px 0; border-bottom: 1px solid ${tema.borda}; background-color: #fafafa;">
                  <h1 style="color: ${tema.roxoPrimario}; margin: 0; font-size: 24px; letter-spacing: -0.5px; font-weight: 800;">GC Planner</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 22px; color: ${tema.Titulo};">Olá, ${nomeUsuario}! Que bom ter você aqui.</h2>
                  
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    Bem-vindo(a) ao seu novo espaço de organização financeira. O <strong>GC Planner</strong> foi criado para que você tenha total clareza sobre o seu dinheiro, sem planilhas complexas ou telas confusas. Queremos que você foque no que realmente importa: viver bem e alcançar seus objetivos.
                  </p>
                  
                  <div style="background-color: ${tema.fundoTela}; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid ${tema.borda};">
                    <h3 style="color: ${tema.Titulo}; margin-top: 0; margin-bottom: 16px; font-size: 16px;">O que você já pode começar a usar:</h3>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="24" valign="top" style="padding-bottom: 12px; font-size: 16px;">🎯</td>
                        <td style="font-size: 15px; padding-bottom: 12px; line-height: 1.5;"><strong>Cofre e Metas:</strong> Defina seus objetivos e veja o progresso de forma visual.</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding-bottom: 12px; font-size: 16px;">☕</td>
                        <td style="font-size: 15px; padding-bottom: 12px; line-height: 1.5;"><strong>Orçamento Livre:</strong> Planeje saídas e momentos de lazer sem peso na consciência.</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding-bottom: 12px; font-size: 16px;">🤝</td>
                        <td style="font-size: 15px; padding-bottom: 12px; line-height: 1.5;"><strong>Finanças a Dois:</strong> Convide seu parceiro(a) para planejarem o futuro juntos.</td>
                      </tr>
                    </table>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="${DOMINIO}/login" style="display: inline-block; background-color: ${tema.roxoPrimario}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 8px;">
                          Acessar meu Painel
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await addDoc(collection(db, 'mail'), {
      to: emailDestino,
      message: {
        subject: 'Bem-vindo(a) ao GC Planner! Seu novo momento financeiro começou.',
        html: htmlBoasVindas
      }
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de boas-vindas:", error);
  }
};


/**
 * 2. E-MAIL DE CONVITE PARA CASAL (RENDA CONJUNTA)
 */
export const enviarEmailConviteCasal = async (emailDestino: string, nomeQuemConvidou: string, tokenConvite: string) => {
  const htmlConvite = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${tema.fundoTela}; color: ${tema.textoBase};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${tema.fundoTela}; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: ${tema.fundoCard}; border-radius: 16px; border: 1px solid ${tema.borda}; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              
              <tr>
                <td align="center" style="padding: 40px 0 20px 0; border-bottom: 1px solid ${tema.borda}; background-color: #fafafa;">
                  <h1 style="color: ${tema.roxoPrimario}; margin: 0; font-size: 24px; letter-spacing: -0.5px; font-weight: 800;">GC Planner</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 40px; margin-bottom: 16px;">💌</div>
                    <h2 style="margin: 0; font-size: 22px; color: ${tema.Titulo};">Você recebeu um convite especial.</h2>
                  </div>
                  
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                    <strong>${nomeQuemConvidou}</strong> convidou você para sincronizar as contas e compartilhar o planejamento financeiro de vocês no GC Planner.
                  </p>
                  
                  <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 32px; border-radius: 4px; border-top: 1px solid ${tema.borda}; border-right: 1px solid ${tema.borda}; border-bottom: 1px solid ${tema.borda};">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #047857;">O que vocês farão juntos:</h3>
                    <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.5;">
                      <strong>• Cofre Transparente:</strong> Acompanhem o saldo e o crescimento do dinheiro do casal no mesmo painel.
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.5;">
                      <strong>• Balança de Gastos:</strong> Mantenham a justiça financeira sobre quem pagou o último passeio de forma leve e automática.
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.5;">
                      <strong>• Acelerador de Metas:</strong> Unam forças para alcançar grandes objetivos mais rápido.
                    </p>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="${DOMINIO}/aceitar-convite?token=${tokenConvite}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 8px;">
                          Aceitar Convite e Entrar
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await addDoc(collection(db, 'mail'), {
      to: emailDestino,
      message: {
        subject: `${nomeQuemConvidou} convidou você para planejarem o futuro juntos!`,
        html: htmlConvite
      }
    });
  } catch (error) {
    console.error("Erro ao enviar convite casal:", error);
  }
};


/**
 * 3. E-MAIL DE CONVITE DA PLATAFORMA (Enviado pelo Admin)
 */
export const enviarConvitePlataforma = async (emailConvidado: string, emailAdmin: string) => {
  const htmlConvite = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${tema.fundoTela}; color: ${tema.textoBase};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${tema.fundoTela}; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: ${tema.fundoCard}; border-radius: 16px; border: 1px solid ${tema.borda}; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              
              <tr>
                <td align="center" style="padding: 40px 0 20px 0; border-bottom: 1px solid ${tema.borda}; background-color: #fafafa;">
                  <h1 style="color: ${tema.roxoPrimario}; margin: 0; font-size: 24px; letter-spacing: -0.5px; font-weight: 800;">GC Planner</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 22px; color: ${tema.Titulo};">Seu acesso foi liberado.</h2>
                  </div>
                  
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
                    Olá! <strong>${emailAdmin}</strong> liberou a sua entrada no GC Planner. Aceite o convite abaixo para criar sua conta e descobrir uma forma mais leve e inteligente de organizar suas finanças.
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="${DOMINIO}/login" style="display: inline-block; background-color: ${tema.roxoPrimario}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 8px;">
                          Criar Minha Conta
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 13px; color: #94a3b8; margin-top: 32px; text-align: center; line-height: 1.5;">
                    Nota de segurança: O acesso foi concedido exclusivamente para este e-mail (${emailConvidado}). Certifique-se de usar o mesmo endereço ao fazer seu primeiro login.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await setDoc(doc(db, 'convites_plataforma', emailConvidado.toLowerCase()), {
      email: emailConvidado.toLowerCase(),
      convidadoPor: emailAdmin,
      status: 'pendente',
      criadoEm: serverTimestamp()
    });

    await addDoc(collection(db, 'mail'), {
      to: emailConvidado,
      message: {
        subject: 'Você foi convidado(a) para usar o GC Planner',
        html: htmlConvite
      }
    });
    
    return true; 
  } catch (error) {
    console.error("Erro ao enviar convite:", error);
    return false; 
  }
};

export const marcarConviteComoAceito = async (emailConvidado: string) => {
  try {
    const conviteRef = doc(db, 'convites_plataforma', emailConvidado.toLowerCase());
    await updateDoc(conviteRef, {
      status: 'aceito'
    });
    console.log("Status do convite atualizado para ACEITO com sucesso!");
  } catch (error) {
    console.error("Erro ao tentar atualizar o status do convite:", error);
  }
};