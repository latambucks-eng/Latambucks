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
            q: "Hice una encuesta en CPX Research y no recibí mis puntos",
            a: [
              "Las encuestas las gestiona **CPX Research**, un proveedor externo. LatamBucks **no controla la aprobación** de encuestas; es CPX quien audita y valida. Si completaste una encuesta y no te acreditó:",
              "1. Abrí el menú de tres líneas (☰) dentro de la sección de ofertas de CPX.",
              "2. Andá a **\"Help\" (Ayuda)** y abrí un ticket.",
              "También podés contactarlos directamente: [cpx-research.com](https://www.cpx-research.com/) · hello@cpx-research.com",
            ],
          },
          {
            q: "Hice una oferta de TimeWall y no recibí mis puntos",
            a: [
              "Las ofertas y microtareas de **TimeWall** las gestiona ese proveedor externo; LatamBucks **no controla su aprobación**. Si completaste una oferta y no se acreditó:",
              "1. Abrí el muro de TimeWall y usá el chat de soporte que aparece dentro del propio muro.",
              "2. Indicá la oferta realizada, la fecha y tu correo de usuario.",
              "También podés contactarlos directamente desde su página oficial: [timewall.io/contactus](https://timewall.io/contactus).",
            ],
          },
          {
            q: "Hice una encuesta de TheoremReach y no recibí mis puntos",
            a: [
              "Las encuestas de **TheoremReach** las audita ese proveedor externo. Si completaste una encuesta y no se acreditó:",
              "1. Abrí el muro de TheoremReach y buscá la opción **\"Support\"** dentro del propio muro.",
              "2. Esperá 24 horas antes de reclamar e incluí el identificador de la encuesta.",
              "Contacto oficial: [info.theoremreach.com/contact](https://info.theoremreach.com/contact/) · support@theoremreach.com",
            ],
          },
          {
            q: "Hice una encuesta de RapidoReach y no recibí mis puntos",
            a: [
              "Las encuestas y ofertas de **RapidoReach** las valida ese proveedor externo. Si completaste una y no se acreditó:",
              "1. Esperá el tiempo de acreditación que indica el proveedor.",
              "2. Si el problema continúa, abrí un ticket desde el muro de RapidoReach.",
              "Contacto oficial: [rapidoreach.com/contactus](https://www.rapidoreach.com/contactus) · support@rapidoreach.com",
            ],
          },
          {
            q: "Instalé una app o completé una oferta y no recibí puntos",
            a: [
              "Las apps, juegos y ofertas de este tipo las gestiona cada proveedor externo: **TimeWall**, **TheoremReach**, **RapidoReach** y **CPAGrip**. LatamBucks **no controla su aprobación**. Si cumpliste todos los requisitos y no te acreditó:",
              "1. Volvé al muro del proveedor donde hiciste la oferta y abrí su opción de soporte o ticket.",
              "2. Indicá la app u oferta realizada, la fecha y tu correo de usuario.",
              "Contacto oficial de cada proveedor: [timewall.io/contactus](https://timewall.io/contactus) · [TheoremReach](https://info.theoremreach.com/contact/) (support@theoremreach.com) · [RapidoReach](https://www.rapidoreach.com/contactus) (support@rapidoreach.com) · [CPAGrip](https://www.cpagrip.com/contact.php)",
              "LatamBucks no es responsable por puntos no otorgados por proveedores externos.",
            ],
          },
        ],
      },
      {
        id: "reversos",
        titulo: "Reversos de proveedores",
        items: [
          {
            q: "¿Qué es un reverso y por qué me descontaron puntos?",
            a: [
              "El proveedor externo que gestiona la encuesta u oferta (**CPX Research**, **TimeWall**, **TheoremReach** o **RapidoReach**) audita la tarea **después** de acreditarla. Si la considera inválida, la anula y pide que se descuenten los puntos: eso es un **reverso**.",
              "LatamBucks **no decide** el reverso: lo aplica el proveedor y nosotros solo lo reflejamos en tu saldo, en tu historial de tareas y en tus avisos.",
            ],
          },
          {
            q: "¿Por qué motivos aplican un reverso?",
            a: [
              "• Datos demográficos inventados o que no coinciden con tu perfil.",
              "• Respuestas al azar, contestadas “a la rápida”, o encuesta cerrada antes de terminar.",
              "• Uso de VPN, proxy o ubicación alterada, o más de una cuenta / dispositivo.",
              "• La misma oferta completada dos veces, o una app desinstalada antes del plazo que pedía el anunciante.",
              "• El anunciante canceló o rechazó la oferta durante su auditoría.",
            ],
          },
          {
            q: "¿Cómo evito que me reviertan puntos?",
            a: [
              "Respondé con sinceridad y con tus datos reales, leé cada pregunta, esperá la pantalla final de confirmación y no cierres la encuesta antes, usá una sola cuenta y sin VPN, y no repitas la misma oferta. Si una oferta pide instalar una app, mantenela el tiempo indicado.",
            ],
          },
          {
            q: "¿Dónde veo si me revirtieron puntos?",
            a: [
              "Todos los reversos aparecen en **tu historial de tareas** y en **Avisos** (dentro de tu perfil), con el proveedor, el monto descontado y la fecha. No se ocultan ni se aplican en silencio.",
              "Si creés que el reverso fue un error, reclamá directamente al proveedor: sus contactos oficiales están en las preguntas anteriores.",
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
            q: "I completed a CPX Research survey and didn't receive my points",
            a: [
              "Surveys are managed by **CPX Research**, an external provider. LatamBucks **does not control survey approval**; CPX audits and validates them. If you completed a survey and it wasn't credited:",
              "1. Open the three-line menu (☰) inside the CPX offers section.",
              "2. Go to **\"Help\"** and open a ticket.",
              "You can also contact them directly: [cpx-research.com](https://www.cpx-research.com/) · hello@cpx-research.com",
            ],
          },
          {
            q: "I completed a TimeWall offer and didn't receive my points",
            a: [
              "Offers and microtasks on **TimeWall** are managed by that external provider; LatamBucks **does not control their approval**. If you completed an offer and it wasn't credited:",
              "1. Open the TimeWall wall and use the support chat inside the wall itself.",
              "2. Include the offer you completed, the date and your user email.",
              "You can also contact them directly through their official page: [timewall.io/contactus](https://timewall.io/contactus).",
            ],
          },
          {
            q: "I completed a TheoremReach survey and didn't receive my points",
            a: [
              "Surveys on **TheoremReach** are audited by that external provider. If you completed a survey and it wasn't credited:",
              "1. Open the TheoremReach wall and look for the **\"Support\"** link inside the wall itself.",
              "2. Wait 24 hours before claiming and include the survey ID.",
              "Official contact: [info.theoremreach.com/contact](https://info.theoremreach.com/contact/) · support@theoremreach.com",
            ],
          },
          {
            q: "I completed a RapidoReach survey and didn't receive my points",
            a: [
              "Surveys and offers on **RapidoReach** are validated by that external provider. If you completed one and it wasn't credited:",
              "1. Wait for the crediting time indicated by the provider.",
              "2. If the problem continues, open a ticket from the RapidoReach wall.",
              "Official contact: [rapidoreach.com/contactus](https://www.rapidoreach.com/contactus) · support@rapidoreach.com",
            ],
          },
          {
            q: "I installed an app or completed an offer and didn't get points",
            a: [
              "Apps, games and this type of offers are managed by each external provider: **TimeWall**, **TheoremReach**, **RapidoReach** and **CPAGrip**. LatamBucks **doesn't control their approval**. If you met every requirement and weren't credited:",
              "1. Go back to the provider's wall where you did the offer and open its support or ticket option.",
              "2. Include the app or offer you completed, the date and your user email.",
              "Official contact for each provider: [timewall.io/contactus](https://timewall.io/contactus) · [TheoremReach](https://info.theoremreach.com/contact/) (support@theoremreach.com) · [RapidoReach](https://www.rapidoreach.com/contactus) (support@rapidoreach.com) · [CPAGrip](https://www.cpagrip.com/contact.php)",
              "LatamBucks is not responsible for points not granted by external providers.",
            ],
          },
        ],
      },
      {
        id: "reversos",
        titulo: "Provider reversals",
        items: [
          {
            q: "What is a reversal and why were my points deducted?",
            a: [
              "The external provider that manages the survey or offer (**CPX Research**, **TimeWall**, **TheoremReach** or **RapidoReach**) audits the task **after** crediting it. If it considers it invalid, it voids it and asks for the points to be deducted: that is a **reversal**.",
              "LatamBucks **doesn't decide** the reversal: the provider applies it and we only reflect it in your balance, your task history and your notices.",
            ],
          },
          {
            q: "What reasons do they use to apply a reversal?",
            a: [
              "• Invented demographic data that doesn't match your profile.",
              "• Random answers, rushing through, or closing the survey before finishing.",
              "• VPN, proxy or altered location, or more than one account / device.",
              "• The same offer completed twice, or an app uninstalled before the period the advertiser required.",
              "• The advertiser cancelled or rejected the offer during its audit.",
            ],
          },
          {
            q: "How do I avoid reversals?",
            a: [
              "Answer honestly with your real data, read every question, wait for the final confirmation screen and don't close the survey early, use a single account without VPN, and never repeat the same offer. If an offer asks you to install an app, keep it for the required time.",
            ],
          },
          {
            q: "Where can I see if points were reversed?",
            a: [
              "Every reversal shows up in **your task history** and in **Notices** (inside your profile), with the provider, the deducted amount and the date. They are never hidden or applied silently.",
              "If you believe the reversal was a mistake, claim it directly with the provider: their official contacts are in the questions above.",
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
            q: "Fiz uma pesquisa na CPX Research e não recebi meus pontos",
            a: [
              "As pesquisas são gerenciadas pela **CPX Research**, um provedor externo. O LatamBucks **não controla a aprovação** das pesquisas; é a CPX quem audita e valida. Se você completou uma pesquisa e não foi creditado:",
              "1. Abra o menu de três linhas (☰) dentro da seção de ofertas da CPX.",
              "2. Vá em **\"Help\" (Ajuda)** e abra um ticket.",
              "Você também pode contatá-los diretamente: [cpx-research.com](https://www.cpx-research.com/) · hello@cpx-research.com",
            ],
          },
          {
            q: "Fiz uma oferta do TimeWall e não recebi meus pontos",
            a: [
              "As ofertas e microtarefas do **TimeWall** são gerenciadas por esse provedor externo; o LatamBucks **não controla a aprovação**. Se você completou uma oferta e ela não foi creditada:",
              "1. Abra o mural do TimeWall e use o chat de suporte dentro do próprio mural.",
              "2. Informe a oferta realizada, a data e seu e-mail de usuário.",
              "Você também pode contatá-los pela página oficial: [timewall.io/contactus](https://timewall.io/contactus).",
            ],
          },
          {
            q: "Fiz uma pesquisa do TheoremReach e não recebi meus pontos",
            a: [
              "As pesquisas do **TheoremReach** são auditadas por esse provedor externo. Se você completou uma pesquisa e ela não foi creditada:",
              "1. Abra o mural do TheoremReach e procure a opção **\"Support\"** dentro do próprio mural.",
              "2. Aguarde 24 horas antes de reclamar e inclua o identificador da pesquisa.",
              "Contato oficial: [info.theoremreach.com/contact](https://info.theoremreach.com/contact/) · support@theoremreach.com",
            ],
          },
          {
            q: "Fiz uma pesquisa do RapidoReach e não recebi meus pontos",
            a: [
              "As pesquisas e ofertas do **RapidoReach** são validadas por esse provedor externo. Se você completou uma e ela não foi creditada:",
              "1. Aguarde o prazo de crédito indicado pelo provedor.",
              "2. Se o problema continuar, abra um ticket no mural do RapidoReach.",
              "Contato oficial: [rapidoreach.com/contactus](https://www.rapidoreach.com/contactus) · support@rapidoreach.com",
            ],
          },
          {
            q: "Instalei um app ou completei uma oferta e não recebi pontos",
            a: [
              "Apps, jogos e ofertas desse tipo são gerenciados por cada provedor externo: **TimeWall**, **TheoremReach**, **RapidoReach** e **CPAGrip**. O LatamBucks **não controla a aprovação**. Se você cumpriu todos os requisitos e não foi creditado:",
              "1. Volte ao mural do provedor onde fez a oferta e abra a opção de suporte ou ticket.",
              "2. Informe o app ou oferta realizada, a data e seu e-mail de usuário.",
              "Contato oficial de cada provedor: [timewall.io/contactus](https://timewall.io/contactus) · [TheoremReach](https://info.theoremreach.com/contact/) (support@theoremreach.com) · [RapidoReach](https://www.rapidoreach.com/contactus) (support@rapidoreach.com) · [CPAGrip](https://www.cpagrip.com/contact.php)",
              "O LatamBucks não é responsável por pontos não concedidos por provedores externos.",
            ],
          },
        ],
      },
      {
        id: "reversos",
        titulo: "Reversões de provedores",
        items: [
          {
            q: "O que é uma reversão e por que descontaram meus pontos?",
            a: [
              "O provedor externo que gerencia a pesquisa ou oferta (**CPX Research**, **TimeWall**, **TheoremReach** ou **RapidoReach**) audita a tarefa **depois** de creditá-la. Se a considera inválida, anula e pede o desconto dos pontos: isso é uma **reversão**.",
              "O LatamBucks **não decide** a reversão: o provedor aplica e nós apenas refletimos no seu saldo, no seu histórico de tarefas e nos seus avisos.",
            ],
          },
          {
            q: "Por quais motivos aplicam uma reversão?",
            a: [
              "• Dados demográficos inventados ou que não coincidem com o seu perfil.",
              "• Respostas aleatórias, feitas com pressa, ou pesquisa fechada antes de terminar.",
              "• Uso de VPN, proxy ou localização alterada, ou mais de uma conta / dispositivo.",
              "• A mesma oferta feita duas vezes, ou um app desinstalado antes do prazo exigido pelo anunciante.",
              "• O anunciante cancelou ou recusou a oferta durante a auditoria.",
            ],
          },
          {
            q: "Como evito que revertam meus pontos?",
            a: [
              "Responda com sinceridade e com seus dados reais, leia cada pergunta, espere a tela final de confirmação e não feche a pesquisa antes, use uma única conta e sem VPN, e não repita a mesma oferta. Se a oferta pede para instalar um app, mantenha-o pelo tempo indicado.",
            ],
          },
          {
            q: "Onde vejo se reverteram meus pontos?",
            a: [
              "Todas as reversões aparecem no **seu histórico de tarefas** e em **Avisos** (dentro do seu perfil), com o provedor, o valor descontado e a data. Não são escondidas nem aplicadas em silêncio.",
              "Se acredita que a reversão foi um erro, reclame diretamente com o provedor: os contatos oficiais estão nas perguntas acima.",
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