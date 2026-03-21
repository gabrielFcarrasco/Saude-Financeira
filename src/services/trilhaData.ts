export const trilhaData = [
  {
    passo: 1,
    titulo: "Diagnóstico Profundo",
    tipo: "diagnostico",
    conteudo: {
      gastador: "Você foi classificado como Gastador. O seu dinheiro costuma acabar antes do mês e o uso do crédito virou uma extensão da sua renda. Não se sinta culpado, o sistema é desenhado para isso. Porém, a matemática é cruel: as taxas do rotativo do cartão e do cheque especial são as maiores do mercado e criam uma bola de neve impossível de acompanhar. O seu primeiro passo é estancar o sangramento: crie atrito financeiro, reduza os limites do seu Pix, guarde os cartões físicos e comece hoje mesmo a mapear o tamanho real das suas dívidas para atacá-las de forma estratégica.",
      despreocupado: "Você foi classificado como Despreocupado. Suas contas básicas costumam estar em dia, mas o que sobra é rapidamente consumido por viagens, jantares ou desejos imediatos. O perigo do seu perfil é a falsa sensação de segurança. Sem uma reserva de emergência robusta, qualquer imprevisto médico ou perda de emprego vai forçá-lo a entrar no cheque especial. Seu foco absoluto agora é aprender a se pagar primeiro: automatizar seus investimentos no instante em que o salário cai na conta, antes que você tenha a chance de gastar.",
      comprometido: "Você foi classificado como Comprometido. Parabéns! Você já tem uma vida financeira mais tranquila, foge de financiamentos caros e sabe a importância de poupar. Seu desafio nesta trilha não é mais 'cortar gastos na padaria', mas sim blindar o seu patrimônio contra a inflação, descobrindo investimentos mais rentáveis que a velha caderneta de poupança, entendendo a diferença entre PGBL e VGBL, e estruturando a matemática da sua Liberdade Financeira."
    }
  },
  {
    passo: 2,
    titulo: "As 3 Leis Universais do Dinheiro",
    tipo: "interativo",
    descricao: "Clique nos cards abaixo para revelar a estratégia por trás de cada regra de ouro. Sem dominar estes três pilares, nenhuma planilha do mundo vai salvar o seu orçamento.",
    cards: [
      {
        titulo: "🕒 1. A Regra das 24 Horas (O Filtro do Impulso)",
        resumo: "A barreira entre o desejo e a necessidade.",
        detalhe: "Com o Pix e o 'One-Click Buy', o dinheiro some em segundos. O comércio usa gatilhos de escassez ('Últimas unidades!') para forçar você a agir pela emoção. A regra é inegociável: viu algo que quer muito comprar e não é essencial? Adie a decisão para o dia seguinte. Dar 24 horas ao cérebro ativa o córtex pré-frontal (a área lógica), e você perceberá que a maioria dos impulsos morre após uma noite de sono."
      },
      {
        titulo: "🕵️ 2. O Rastreio dos 'Gastos Invisíveis'",
        resumo: "Como o seu dinheiro escorre pelo ralo sem você ver.",
        detalhe: "O seu orçamento raramente é destruído por uma compra gigante, mas sim pelos milhares de micro-gastos. O cafezinho diário, a tarifa de manutenção de conta de R$ 18,00 (que dá R$ 216 ao ano), assinaturas de streaming que você não usa, juros de atraso. O apontamento diário e implacável de cada centavo não é sobre ser 'mão de vaca', é sobre ter clareza cirúrgica de para onde sua vida está indo."
      },
      {
        titulo: "🛑 3. O Boicote ao Crédito Fácil",
        resumo: "A ilusão do Cheque Especial e do Consórcio.",
        detalhe: "O cheque especial NÃO é extensão do seu salário. Se você o usa frequentemente, está pagando para viver. Da mesma forma, entenda de uma vez por todas: consórcios e títulos de capitalização NÃO são investimentos. Eles não possuem remuneração por juros compostos e cobram altas taxas de administração. Servem apenas como 'poupança forçada' muito cara para quem não tem disciplina."
      }
    ]
  },
  {
    passo: 3,
    titulo: "Sua Defesa: O Código do Consumidor",
    tipo: "interativo",
    descricao: "As dívidas saíram do controle? O pânico e as ligações de cobrança não podem ditar as regras. Conheça as suas armas legais (CDC):",
    cards: [
      {
        titulo: "⚖️ Artigo 42: Fim da Cobrança Abusiva",
        resumo: "Você tem o direito de não ser constrangido.",
        detalhe: "Na cobrança de débitos, o consumidor inadimplente NÃO será exposto ao ridículo. As empresas de cobrança não podem ligar para o seu local de trabalho ameaçando seu emprego, nem deixar recados constrangedores com parentes ou vizinhos. Se isso ocorrer, você tem base legal para processar a instituição por danos morais."
      },
      {
        titulo: "📋 Artigo 43: O Acesso à Informação (SPC/Serasa)",
        resumo: "Seus dados não podem ser reféns do sistema.",
        detalhe: "Você tem direito a acessar, a qualquer momento, as informações existentes em cadastros e registros de proteção ao crédito. Se encontrar qualquer inexatidão, você pode exigir a correção imediata. Além disso, consumada a prescrição da dívida (geralmente 5 anos), seu nome DEVE ser retirado dos cadastros de inadimplência."
      },
      {
        titulo: "🤝 Estratégia de Renegociação de Trincheira",
        resumo: "Como sair do buraco de forma inteligente.",
        detalhe: "Nunca aceite o primeiro acordo do banco. Eles sempre embutem multas gigantescas. Junte dinheiro, espere os feirões de renegociação do Serasa e ofereça pagamento à vista com descontos que podem chegar a 90%. E o mais importante: priorize sempre as dívidas de cartão de crédito e cheque especial, pois os juros compostos delas são matematicamente impagáveis a longo prazo."
      }
    ]
  },
  {
    passo: 4,
    titulo: "Ferramentas: O Fim das Contas Mentais",
    tipo: "ferramentas",
    descricao: "Gerenciar dinheiro 'de cabeça' é a receita do fracasso. Delegue o trabalho pesado para os sistemas modernos:",
    ferramentas: [
      { nome: "📱 Aplicativos Open Finance (Mobills / Organizze)", desc: "Conectam-se ao seu banco (com segurança) e categorizam cada gasto do seu cartão e Pix automaticamente." },
      { nome: "💻 Notion (Templates Financeiros)", desc: "Para quem gosta de construir dashboards visuais e ter controle total sobre as variáveis de Planejado vs. Realizado." },
      { nome: "📊 Google Sheets", desc: "A planilha na nuvem. Acessível do celular ao PC, excelente para casais gerenciarem o orçamento familiar em tempo real." }
    ]
  },
  {
    passo: 5,
    titulo: "A Matemática da Riqueza",
    tipo: "investimentos",
    descricao: "A Poupança perde para a inflação. Para construir patrimônio real, você precisa dominar o seu perfil de investidor e os Juros Compostos."
  },
  {
    passo: 6,
    titulo: "E-book: As 4 Fases Financeiras",
    tipo: "ebook",
    descricao: "Você concluiu a teoria. Agora é hora de absorver a estratégia definitiva."
  }
];