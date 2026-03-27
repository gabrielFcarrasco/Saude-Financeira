import { doc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const DOMINIO = "https://gcsaudefinanceira.vercel.app";

/**
 * 1. E-MAIL DE BOAS-VINDAS
 */
export const enviarEmailBoasVindas = async (emailDestino: string, nomeUsuario: string) => {
  const htmlBoasVindas = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
              <tr>
                <td align="center" style="padding: 40px 0 10px 0;">
                  <h1 style="color: #818cf8; margin: 0; font-size: 28px; letter-spacing: -1px;">GC &lt;/&gt;</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
                    <h2 style="margin: 0; font-size: 24px; color: #ffffff;">Fala, ${nomeUsuario}! Tudo pronto.</h2>
                  </div>
                  <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
                    A sua conta acabou de sair do forno! O <strong>GC Planner</strong> foi desenhado para ser o seu mapa definitivo rumo à liberdade financeira, sem planilhas chatas e com muita inteligência.
                  </p>
                  
                  <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #334155;">
                    <h3 style="color: #8b5cf6; margin-top: 0; margin-bottom: 16px; font-size: 16px;">O que você já pode fazer:</h3>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="24" valign="top" style="padding-bottom: 12px; font-size: 16px;">✔️</td>
                        <td style="color: #94a3b8; font-size: 15px; padding-bottom: 12px; line-height: 1.5;"><strong>Cofre Central:</strong> Acompanhe seu patrimônio crescer.</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding-bottom: 12px; font-size: 16px;">✔️</td>
                        <td style="color: #94a3b8; font-size: 15px; padding-bottom: 12px; line-height: 1.5;"><strong>Planejador de Rolês:</strong> Simule o fim de semana antes de sair de casa.</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding-bottom: 12px; font-size: 16px;">✔️</td>
                        <td style="color: #94a3b8; font-size: 15px; padding-bottom: 12px; line-height: 1.5;"><strong>Conta Conjunta:</strong> Convide seu +1 e unam as finanças no mesmo painel.</td>
                      </tr>
                    </table>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="${DOMINIO}/login" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 16px 32px; border-radius: 8px;">
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
        subject: 'Bem-vindo(a) ao seu novo futuro financeiro! 🚀',
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
    <body style="margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
              <tr>
                <td align="center" style="padding: 40px 0 10px 0;">
                  <h1 style="color: #818cf8; margin: 0; font-size: 28px; letter-spacing: -1px;">GC &lt;/&gt;</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">💖</div>
                    <h2 style="margin: 0; font-size: 24px; color: #ffffff;">Bora planejar o futuro juntos?</h2>
                  </div>
                  <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
                    Opa! <strong>${nomeQuemConvidou}</strong> te convidou para sincronizar as contas e criar um painel financeiro compartilhado no GC Planner.
                  </p>
                  
                  <div style="background-color: #0f172a; border-left: 4px solid #ec4899; padding: 20px; margin-bottom: 32px; border-radius: 4px; border-top: 1px solid #334155; border-right: 1px solid #334155; border-bottom: 1px solid #334155;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #ec4899;">Como funciona a Conta Conjunta:</h3>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                      <strong>1. O Cofre Central:</strong> Vocês vão ver o dinheiro somado crescendo no mesmo lugar.
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                      <strong>2. A Balança:</strong> O app calcula quem gastou mais no fim de semana para manter tudo justo.
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                      <strong>3. Desafio dos 200:</strong> Uma gamificação onde cada um completa cartelas para juntar mais de R$ 40 mil juntos.
                    </p>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="${DOMINIO}/aceitar-convite?token=${tokenConvite}" style="display: inline-block; background-color: #ec4899; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 16px 32px; border-radius: 8px;">
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
        subject: `${nomeQuemConvidou} quer planejar o futuro com você! 💑`,
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
    <body style="margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
              <tr>
                <td align="center" style="padding: 40px 0 10px 0;">
                  <h1 style="color: #818cf8; margin: 0; font-size: 28px; letter-spacing: -1px;">GC &lt;/&gt;</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎟️</div>
                    <h2 style="margin: 0; font-size: 24px; color: #ffffff;">Seu acesso chegou!</h2>
                  </div>
                  <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin-bottom: 32px; text-align: center;">
                    Fala aí! O <strong>${emailAdmin}</strong> acabou de liberar a sua entrada no GC Planner. Chegou a hora de mudar a forma como você lida com seu dinheiro.
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="${DOMINIO}/login" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 16px 32px; border-radius: 8px;">
                          Criar Minha Conta Agora
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 12px; color: #64748b; margin-top: 32px; text-align: center;">
                    Atenção: Apenas este e-mail (${emailConvidado}) está liberado para o cadastro no sistema.
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
        subject: 'Você foi convidado(a) para entrar no GC Planner! 💎',
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