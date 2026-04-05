<div align="center">
  <h1>📱 GC Planner | API & Database Docs</h1>
  <p><i>Guia de Arquitetura, Regras de Negócio e Modelagem de Dados para a Equipe Mobile</i></p>

  ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
  ![Firestore](https://img.shields.io/badge/Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
  ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
</div>

---

> ⚠️ **Aviso aos Desenvolvedores Mobile:** Este documento mapeia as regras cruciais e a estrutura exata do Firebase Firestore utilizada na versão Web. **Siga este Schema rigorosamente** para garantir a paridade de dados e evitar quebras de layout entre as plataformas.

## 📑 Índice

1. [Arquitetura Geral](#-1-arquitetura-geral)
2. [Modelagem de Dados (Schemas)](#-2-modelagem-de-dados-schemas)
3. [Regras de Negócio Críticas](#-3-regras-de-negócio-críticas)
4. [Integrações Externas](#-4-integrações-externas)

---

## 🏗️ 1. Arquitetura Geral

Nossa arquitetura prioriza a leitura rápida e a separação de domínios para facilitar a escalabilidade do aplicativo.

* **Backend / BaaS:** Firebase (Authentication & Firestore).
* **Isolamento de Domínios:** Cada funcionalidade (`transacoes`, `dividas`, `metas`) possui sua própria coleção root. **Não utilizamos sub-coleções aninhadas** para facilitar queries globais.
* **Vínculo de Usuário:** Todo documento criado OBRIGATORIAMENTE carrega a propriedade `userId` (UID do Firebase Auth) para garantir a segurança via *Firebase Security Rules*.

---

## 🗄️ 2. Modelagem de Dados (Schemas)

Abaixo estão os modelos de dados que devem ser refletidos nas suas *Data Classes* (Swift/Kotlin) ou *Interfaces* (TypeScript).

### 💸 A. Coleção: `transacoes`
Armazena todo o fluxo de caixa (Extrato Inteligente). É a coleção primária do app.

```typescript
// Path: /transacoes/{docId}
interface Transacao {
  userId: string;
  tipo: 'despesa' | 'receita';
  descricao: string;
  valor: number;           // Float (ex: 150.50)
  data: string;            // Formato ISO "YYYY-MM-DD"
  categoria: string;       // "Lazer", "Investimentos", "Salário", etc.
  subCategoria?: string;   // Opcional
  conta: string;           // Ex: "Nubank", "Inter"
  status: 'pago' | 'pendente';
  criadoEm: Timestamp;     // Firebase serverTimestamp()
}