// Contenido del panel de Soporte (español, inglés y portugués).
// Soporta **negrita** y [enlaces](https://...) en los textos de respuesta.

export const SOPORTE = {
  es: {
    ui: {
      title: "Soporte y Ayuda",
      sub: "Resolvé tus dudas: FAQ, proveedores y contacto directo",
      intro:
        "Antes de escribirnos, revisá las preguntas frecuentes. La mayoría de las consultas se resuelven acá. Si después de leer todavía necesitás ayuda, al final vas a encontrar el formulario de contacto.",
      aviso:
        "No olvides revisar los **Términos y Condiciones** y las **Normas** de la plataforma para conocer en detalle tus derechos y obligaciones como usuario o anunciante.",
      contactoTitulo: "¿No encontraste la respuesta?",
      contactoDesc: "Escribinos a nuestro correo oficial y te responderemos a tu email registrado.",
      respTitle: "Tiempo de respuesta: hasta 72 horas hábiles",
      unCorreo: "Enviá un solo correo.",
      unCorreoSub: " Mandar múltiples emails sobre el mismo problema **solo retrasa el proceso** de atención.",
      datosTitle: "Datos a incluir en tu correo:",
      datos1: "• Captura de pantalla del problema",
      datos2: "• Tu correo de usuario registrado en LatamBucks",
      datos3: "• Descripción breve de lo que ocurrió",
    },
    secciones: [
      {
        id: "como-funciona",
        titulo: "Cómo funciona LatamBucks",
        items: [
          {
            q: "¿Qué es LatamBucks y cómo gano puntos?",
            a: [
              "LatamBucks es una plataforma de microtareas. Ganás puntos completando **videos recompensados**, **encuestas** y **tareas locales** de anunciantes. Los puntos se canjean por dinero real vía Payoneer, Airtm o PayPal (USD para todos los países).",
            ],
          },
          {
            q: "¿Cuál es la diferencia entre saldo disponible y pendiente?",
            a: [
              "**Disponible:** puntos ya validados, listos para retirar.",
              "**Pendiente:** puntos en validación (ej. tareas esperando que el anunciante apruebe, o videos en proceso).",
            ],
          },
          {
            q: "¿Cómo funciona el ciclo de pago semanal?",
            a: [
              "El corte es **automático todos los jueves a las 16:00 hs (Argentina)**. Si tu saldo disponible supera el mínimo, pasa a \"Pago en Proceso\". Los pagos se envían **los viernes** por Payoneer, Airtm o PayPal según el método elegido.",
            ],
          },
          {
            q: "¿Cómo funcionan los referidos?",
            a: [
              "Compartí tu código de referido. Cuando alguien se registra con tu código y completa tareas, ganás el **10% en puntos** de lo que él genera. Se acredita automáticamente a tu saldo disponible.",
            ],
          },
        ],
      },
      {
        id: "puntos-proveedores",
        titulo: "No me acreditaron puntos de encuestas o tareas",
        items: [
          {
            q: "Hice una encuesta y no recibí mis puntos",
            a: [
              "Las encuestas las gestiona **CPX Research**, un proveedor externo. LatamBucks **no controla la aprobación** de encuestas; es CPX quien audita y valida. Si completaste una encuesta y no te acreditó:",
              "1. Abrí el menú de tres líneas (☰) dentro de la sección de ofertas de CPX.",
              "2. Andá a **\"Help\" (Ayuda)** y abrí un ticket.",
              "También podés contactarlos directamente: [cpx-research.com](https://www.cpx-research.com/) · hello@cpx-research.com",
            ],
          },
          {
            q: "Instalé una app / completé una oferta y no recibí puntos",
            a: [
              "Las ofertas de apps y juegos las gestiona **Monetag**. Si cumpliste todos los requisitos y no te acreditó:",
              "1. Abrí el menú de la oferta dentro de la sección de Monetag.",
              "2. Tocá **\"Status / Report an Issue\"**.",
              "O escribí directamente a soporte técnico: support@monetag.com · contact.us@monetag.com",
              "LatamBucks no es responsable por puntos no otorgados por proveedores externos.",
            ],
          },
        ],
      },
      {
        id: "cuenta",
        titulo: "Problemas con mi cuenta",
        items: [
          {
            q: "Mi cuenta fue suspendida y creo que fue un error",
            a: [
              "Las suspensiones se aplican por violaciones a las normas (VPN, cuentas múltiples, fraude). Si creés que fue un error, escribinos a latambucks@gmail.com desde tu correo registrado, explicando tu situación. Nuestro equipo revisa cada caso.",
              "No crees una cuenta nueva mientras dure la suspensión: eso agrava la situación.",
            ],
          },
          {
            q: "¿Puedo usar VPN o cambiar mi ubicación?",
            a: [
              "**No.** El uso de VPN, proxies o herramientas para alterar tu ubicación está prohibido. Las cuentas que lo hagan serán eliminadas permanentemente, con pérdida de todos los saldos, sin previo aviso ni derecho a reclamo.",
            ],
          },
          {
            q: "¿Puedo tener varias cuentas?",
            a: [
              "No. Una persona = una cuenta. Las cuentas múltiples para manipular referidos o inflar ganancias resultan en la suspensión permanente de todas las cuentas involucradas.",
            ],
          },
        ],
      },
      {
        id: "retiros-reembolsos",
        titulo: "Retiros y reembolsos",
        items: [
          {
            q: "¿Cuál es el mínimo de retiro?",
            a: [
              "El mínimo es de **5000 puntos (5 USD)** para todos los países. Puede modificarse sin previo aviso por parte de la administración.",
            ],
          },
          {
            q: "Soy anunciante y mi pago de campaña aún no fue aprobado, ¿puedo reembolsar?",
            a: [
              "El reembolso de campañas **solo se acepta mientras el pago esté pendiente de aprobación**. Una vez que el administrador aprueba el pago y la campaña queda activa, **no proceden reembolsos**.",
              "Si tu pago está pendiente y querés cancelar, escribinos a latambucks@gmail.com indicando el motivo.",
            ],
          },
          {
            q: "Mi tarea fue rechazada injustificadamente, ¿qué hago?",
            a: [
              "Tenés **24 horas** desde el rechazo para abrir una disputa desde el historial de tareas, explicando por qué considerás que fue injusto. El equipo administrativo revisa y resuelve. Si el anunciante no responde en **48 horas**, la tarea se aprueba automáticamente.",
            ],
          },
          {
            q: "Hay demora en la acreditación de mi pago",
            a: [
              "Los pagos dependen de Payoneer, Airtm y PayPal (plataformas externas). Pueden existir demoras por normativas o auditorías de estos proveedores. LatamBucks notificará a la comunidad si hay un método afectado y deslinda responsabilidad por demoras externas.",
            ],
          },
        ],
      },
    ],
  },

  en: {
    ui: {
      title: "Support & Help",
      sub: "Get answers: FAQ, providers and direct contact",
      intro:
        "Before writing to us, check the frequently asked questions. Most queries are solved here. If you still need help after reading, you'll find the contact form at the end.",
      aviso:
        "Don't forget to review the **Terms & Conditions** and the **Rules** of the platform to learn in detail your rights and obligations as a user or advertiser.",
      contactoTitulo: "Didn't find the answer?",
      contactoDesc: "Write to our official email and we'll reply to your registered email.",
      respTitle: "Response time: up to 72 business hours",
      unCorreo: "Send a single email.",
      unCorreoSub: " Sending multiple emails about the same issue **only delays** the support process.",
      datosTitle: "Details to include in your email:",
      datos1: "• Screenshot of the problem",
      datos2: "• Your LatamBucks registered user email",
      datos3: "• Brief description of what happened",
    },
    secciones: [
      {
        id: "como-funciona",
        titulo: "How LatamBucks works",
        items: [
          {
            q: "What is LatamBucks and how do I earn points?",
            a: [
              "LatamBucks is a microtask platform. You earn points by completing **rewarded videos**, **surveys** and local **advertiser tasks**. Points can be redeemed for real money via Payoneer, Airtm or PayPal (USD for every country).",
            ],
          },
          {
            q: "What's the difference between available and pending balance?",
            a: [
              "**Available:** points already validated, ready to withdraw.",
              "**Pending:** points under validation (e.g. tasks waiting for advertiser approval, or videos in process).",
            ],
          },
          {
            q: "How does the weekly payment cycle work?",
            a: [
              "The cutoff is **automatic every Thursday at 16:00 (Argentina time)**. If your available balance is above the minimum, it moves to \"Payment in Progress\". Payments are sent **on Fridays** via Payoneer, Airtm or PayPal depending on the method you chose.",
            ],
          },
          {
            q: "How do referrals work?",
            a: [
              "Share your referral code. When someone signs up with your code and completes tasks, you earn **10% in points** of what they generate. It's credited automatically to your available balance.",
            ],
          },
        ],
      },
      {
        id: "puntos-proveedores",
        titulo: "Points from surveys or tasks weren't credited",
        items: [
          {
            q: "I completed a survey and didn't receive my points",
            a: [
              "Surveys are managed by **CPX Research**, an external provider. LatamBucks **does not control survey approval**; CPX audits and validates them. If you completed a survey and it wasn't credited:",
              "1. Open the three-line menu (☰) inside the CPX offers section.",
              "2. Go to **\"Help\"** and open a ticket.",
              "You can also contact them directly: [cpx-research.com](https://www.cpx-research.com/) · hello@cpx-research.com",
            ],
          },
          {
            q: "I installed an app / completed an offer and didn't get points",
            a: [
              "App and game offers are managed by **Monetag**. If you met all the requirements and it wasn't credited:",
              "1. Open the offer menu inside the Monetag section.",
              "2. Tap **\"Status / Report an Issue\"**.",
              "Or write directly to technical support: support@monetag.com · contact.us@monetag.com",
              "LatamBucks is not responsible for points not granted by external providers.",
            ],
          },
        ],
      },
      {
        id: "cuenta",
        titulo: "Account issues",
        items: [
          {
            q: "My account was suspended and I think it was a mistake",
            a: [
              "Suspensions are applied for rule violations (VPN, multiple accounts, fraud). If you believe it was a mistake, write to latambucks@gmail.com from your registered email explaining your situation. Our team reviews every case.",
              "Don't create a new account while the suspension lasts: that makes the situation worse.",
            ],
          },
          {
            q: "Can I use a VPN or change my location?",
            a: [
              "**No.** Using VPNs, proxies or tools to alter your location is forbidden. Accounts that do it will be permanently deleted, losing all balances, without prior notice and with no right to claim.",
            ],
          },
          {
            q: "Can I have several accounts?",
            a: [
              "No. One person = one account. Multiple accounts to manipulate referrals or inflate earnings result in the permanent suspension of every account involved.",
            ],
          },
        ],
      },
      {
        id: "retiros-reembolsos",
        titulo: "Withdrawals and refunds",
        items: [
          {
            q: "What is the minimum withdrawal?",
            a: [
              "The minimum is **5000 points (5 USD)** for every country. It may change without prior notice from the administration.",
            ],
          },
          {
            q: "I'm an advertiser and my campaign payment wasn't approved yet, can I get a refund?",
            a: [
              "Campaign refunds **are only accepted while the payment is pending approval**. Once the administrator approves the payment and the campaign is active, **refunds don't apply**.",
              "If your payment is pending and you want to cancel, write to latambucks@gmail.com stating the reason.",
            ],
          },
          {
            q: "My task was rejected unfairly, what do I do?",
            a: [
              "You have **24 hours** from the rejection to open a dispute from your task history, explaining why you consider it unfair. The administration team reviews and resolves it. If the advertiser doesn't respond within **48 hours**, the task is approved automatically.",
            ],
          },
          {
            q: "My payment is taking longer to be credited",
            a: [
              "Payments depend on Payoneer, Airtm and PayPal (external platforms). Delays can happen due to their rules or audits. LatamBucks will notify the community if a method is affected and disclaims responsibility for external delays.",
            ],
          },
        ],
      },
    ],
  },

  pt: {
    ui: {
      title: "Suporte e Ajuda",
      sub: "Tire suas dúvidas: FAQ, provedores e contato direto",
      intro:
        "Antes de nos escrever, revise as perguntas frequentes. A maioria das consultas é resolvida aqui. Se depois de ler você ainda precisar de ajuda, no final vai encontrar o formulário de contato.",
      aviso:
        "Não esqueça de revisar os **Termos e Condições** e as **Regras** da plataforma para conhecer em detalhe seus direitos e obrigações como usuário ou anunciante.",
      contactoTitulo: "Não encontrou a resposta?",
      contactoDesc: "Escreva para o nosso e-mail oficial e responderemos no seu e-mail cadastrado.",
      respTitle: "Tempo de resposta: até 72 horas úteis",
      unCorreo: "Envie um único e-mail.",
      unCorreoSub: " Enviar vários e-mails sobre o mesmo problema **só atrasa** o atendimento.",
      datosTitle: "Dados a incluir no seu e-mail:",
      datos1: "• Captura de tela do problema",
      datos2: "• Seu e-mail de usuário cadastrado no LatamBucks",
      datos3: "• Descrição breve do que aconteceu",
    },
    secciones: [
      {
        id: "como-funciona",
        titulo: "Como funciona o LatamBucks",
        items: [
          {
            q: "O que é o LatamBucks e como ganho pontos?",
            a: [
              "O LatamBucks é uma plataforma de microtarefas. Você ganha pontos completando **vídeos recompensados**, **pesquisas** e **tarefas locais** de anunciantes. Os pontos são trocados por dinheiro real via Payoneer, Airtm ou PayPal (USD para todos os países).",
            ],
          },
          {
            q: "Qual a diferença entre saldo disponível e pendente?",
            a: [
              "**Disponível:** pontos já validados, prontos para sacar.",
              "**Pendente:** pontos em validação (ex. tarefas aguardando aprovação do anunciante, ou vídeos em processo).",
            ],
          },
          {
            q: "Como funciona o ciclo de pagamento semanal?",
            a: [
              "O corte é **automático toda quinta-feira às 16:00 (horário da Argentina)**. Se seu saldo disponível superar o mínimo, ele passa para \"Pagamento em Processo\". Os pagamentos são enviados **nas sextas-feiras** por Payoneer, Airtm ou PayPal conforme o método escolhido.",
            ],
          },
          {
            q: "Como funcionam as indicações?",
            a: [
              "Compartilhe seu código de indicação. Quando alguém se cadastra com seu código e completa tarefas, você ganha **10% em pontos** do que essa pessoa gera. É creditado automaticamente no seu saldo disponível.",
            ],
          },
        ],
      },
      {
        id: "puntos-proveedores",
        titulo: "Não creditaram meus pontos de pesquisas ou tarefas",
        items: [
          {
            q: "Fiz uma pesquisa e não recebi meus pontos",
            a: [
              "As pesquisas são gerenciadas pela **CPX Research**, um provedor externo. O LatamBucks **não controla a aprovação** das pesquisas; é a CPX quem audita e valida. Se você completou uma pesquisa e não foi creditado:",
              "1. Abra o menu de três linhas (☰) dentro da seção de ofertas da CPX.",
              "2. Vá em **\"Help\" (Ajuda)** e abra um ticket.",
              "Você também pode contatá-los diretamente: [cpx-research.com](https://www.cpx-research.com/) · hello@cpx-research.com",
            ],
          },
          {
            q: "Instalei um app / completei uma oferta e não recebi pontos",
            a: [
              "As ofertas de apps e jogos são gerenciadas pela **Monetag**. Se você cumpriu todos os requisitos e não foi creditado:",
              "1. Abra o menu da oferta dentro da seção da Monetag.",
              "2. Toque em **\"Status / Report an Issue\"**.",
              "Ou escreva diretamente para o suporte técnico: support@monetag.com · contact.us@monetag.com",
              "O LatamBucks não é responsável por pontos não concedidos por provedores externos.",
            ],
          },
        ],
      },
      {
        id: "cuenta",
        titulo: "Problemas com a minha conta",
        items: [
          {
            q: "Minha conta foi suspensa e acredito que foi um erro",
            a: [
              "As suspensões são aplicadas por violações das regras (VPN, contas múltiplas, fraude). Se você acredita que foi um erro, escreva para latambucks@gmail.com pelo seu e-mail cadastrado, explicando sua situação. Nossa equipe revisa cada caso.",
              "Não crie uma nova conta enquanto durar a suspensão: isso agrava a situação.",
            ],
          },
          {
            q: "Posso usar VPN ou mudar minha localização?",
            a: [
              "**Não.** O uso de VPN, proxies ou ferramentas para alterar sua localização é proibido. As contas que fizerem isso serão excluídas permanentemente, com perda de todos os saldos, sem aviso prévio e sem direito a reclamação.",
            ],
          },
          {
            q: "Posso ter várias contas?",
            a: [
              "Não. Uma pessoa = uma conta. As contas múltiplas para manipular indicações ou inflar ganhos resultam na suspensão permanente de todas as contas envolvidas.",
            ],
          },
        ],
      },
      {
        id: "retiros-reembolsos",
        titulo: "Saques e reembolsos",
        items: [
          {
            q: "Qual é o mínimo de saque?",
            a: [
              "O mínimo é de **5000 pontos (5 USD)** para todos os países. Pode ser alterado sem aviso prévio pela administração.",
            ],
          },
          {
            q: "Sou anunciante e meu pagamento de campanha ainda não foi aprovado, posso reembolsar?",
            a: [
              "O reembolso de campanhas **só é aceito enquanto o pagamento estiver pendente de aprovação**. Depois que o administrador aprova o pagamento e a campanha fica ativa, **não há reembolsos**.",
              "Se o seu pagamento está pendente e quer cancelar, escreva para latambucks@gmail.com indicando o motivo.",
            ],
          },
          {
            q: "Minha tarefa foi rejeitada injustamente, o que faço?",
            a: [
              "Você tem **24 horas** a partir da rejeição para abrir uma disputa no histórico de tarefas, explicando por que considera injusto. A equipe administrativa revisa e resolve. Se o anunciante não responder em **48 horas**, a tarefa é aprovada automaticamente.",
            ],
          },
          {
            q: "Há atraso no crédito do meu pagamento",
            a: [
              "Os pagamentos dependem da Payoneer, Airtm e PayPal (plataformas externas). Podem existir atrasos por normas ou auditorias desses provedores. O LatamBucks notificará a comunidade se houver um método afetado e isenta-se de responsabilidade por atrasos externos.",
            ],
          },
        ],
      },
    ],
  },
};