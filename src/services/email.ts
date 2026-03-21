import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Envia o e-mail de Boas-Vindas quando o utilizador cria a conta.
 */
export const enviarEmailBoasVindas = async (emailDestino: string, nomeUsuario: string) => {
  const htmlBoasVindas = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
              <tr>
                <td align="center" style="padding: 40px 0 20px 0;">
                  <h1 style="color: #818cf8; margin: 0; font-size: 28px; letter-spacing: -1px;">GC &lt;/&gt;</h1>
                  <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Planner Inteligente</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px; text-align: center;">
                  <h2 style="margin-top: 0; font-size: 24px; color: #ffffff;">Olá, ${nomeUsuario}!</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
                    É oficial: acabou de dar o passo mais importante para assumir o controlo total do seu dinheiro. O <strong>GC Planner</strong> não é apenas um anotador de gastos, é o seu co-piloto na construção de património.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 32px;">
                    A sua conta já está configurada e pronta para receber os seus primeiros lançamentos e objetivos.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://seusite.com/login" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 16px 32px; border-radius: 8px;">
                          Aceder ao Meu Painel
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
    console.log("E-mail de boas-vindas na fila de envio!");
  } catch (error) {
    console.error("Erro ao enviar e-mail de boas-vindas:", error);
  }
};

/**
 * Envia o convite para a Renda Conjunta (Aba Casal).
 */
export const enviarEmailConviteCasal = async (emailDestino: string, nomeQuemConvidou: string, tokenConvite: string) => {
  const htmlConvite = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
              <tr>
                <td align="center" style="padding: 40px 0 20px 0;">
                  <h1 style="color: #818cf8; margin: 0; font-size: 28px; letter-spacing: -1px;">GC &lt;/&gt;</h1>
                  <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Renda Conjunta</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px; text-align: center;">
                  <h2 style="margin-top: 0; font-size: 24px; color: #ffffff;">Recebeu um convite especial!</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
                    Olá! <strong>${nomeQuemConvidou}</strong> convidou-o(a) para sincronizar os objetivos e criar um painel financeiro partilhado no GC Planner.
                  </p>
                  <div style="background-color: #0f172a; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 32px; text-align: left; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                      <strong>O que significa isto?</strong><br>
                      Ao aceitar, terão um "Cofre Casal" para juntar dinheiro para metas conjuntas e poderão visualizar o orçamento da família num só lugar, com total transparência.
                    </p>
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://seusite.com/aceitar-convite?token=${tokenConvite}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 16px 32px; border-radius: 8px;">
                          Aceitar Convite e Começar
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
        subject: `${nomeQuemConvidou} quer planear o futuro consigo! 💑`,
        html: htmlConvite
      }
    });
    console.log("E-mail de convite na fila de envio!");
  } catch (error) {
    console.error("Erro ao enviar e-mail de convite:", error);
  }
};

export const enviarConvitePlataforma = async (emailConvidado: string, emailAdmin: string) => {
  const htmlConvite = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
              <tr>
                <td style="padding: 40px; text-align: center;">
                  <h1 style="color: #818cf8; margin: 0 0 16px 0;">Convite VIP: GC Planner</h1>
                  <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin-bottom: 32px;">
                    Você foi selecionado(a) por <strong>${emailAdmin}</strong> para ter acesso exclusivo antecipado ao nosso Planner Financeiro Inteligente.
                  </p>
                  <a href="https://seusite.com/login" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 16px 32px; border-radius: 8px;">
                    Criar Minha Conta
                  </a>
                  <p style="font-size: 12px; color: #64748b; margin-top: 32px;">
                    Atenção: Apenas este e-mail (${emailConvidado}) tem autorização para concluir o cadastro.
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
    // 1. GRAVA NA LISTA VIP (Usamos o e-mail como ID do documento para facilitar a busca)
    await setDoc(doc(db, 'convites_plataforma', emailConvidado.toLowerCase()), {
      email: emailConvidado.toLowerCase(),
      convidadoPor: emailAdmin,
      status: 'pendente',
      criadoEm: serverTimestamp()
    });

    // 2. DISPARA O E-MAIL
    await addDoc(collection(db, 'mail'), {
      to: emailConvidado,
      message: {
        subject: 'Você recebeu um Acesso VIP ao GC Planner! 💎',
        html: htmlConvite
      }
    });
    
    return true; // Sucesso
  } catch (error) {
    console.error("Erro ao enviar convite VIP:", error);
    return false; // Falha
  }
};