// Contenido de la guía interactiva (español, inglés y portugués).
// Cada paso se empareja por posición con STEP_META en GuiaInteractiva.

export const GUIA = {
  es: {
    ui: {
      progreso: "Guía para empezar · {n} de {total}",
      atras: "Atrás",
      siguiente: "Siguiente",
      empezar: "Empezar ahora",
      cerrarExplorar: "Cerrar y explorar por mi cuenta",
      cerrar: "Cerrar guía",
      aria: "Guía interactiva para empezar",
      pasoAria: "Ir al paso {n}: {titulo}",
      tip: "Tip: ",
    },
    steps: [
      {
        title: "Empezá a ganar en pocos minutos",
        subtitle: "LatamBucks te paga por tareas simples que podés hacer desde el celular.",
        bullets: [
          "Todo se mide en Pts: 1.000 Pts = USD 1.",
          "El mínimo de cobro es de 5.000 Pts (USD 5).",
          "Los puntos se acreditan solos en tu saldo: no tenés que reclamarlos.",
        ],
        tip: "Te muestro las secciones en orden de pago: encuestas, juegos y tareas de anunciantes son las que más dejan.",
      },
      {
        title: "Encuestas: la vía más rápida",
        subtitle: "Es lo que más puntos deja por minuto. Empezá por acá.",
        bullets: [
          "En Encuestas ves cada encuesta con sus puntos y minutos estimados antes de entrar.",
          "Se abren en una pestaña nueva del proveedor (CPX, TheoremReach, TimeWall o RapidoReach).",
          "Respondé con atención y sin apuro: si el proveedor detecta respuestas apuradas, no paga.",
          "Si te descalifican, igual suele quedar un pago por el tiempo que dedicaste.",
        ],
        tip: "Que una encuesta se cierre y te descalifique no es un error tuyo: tu perfil demográfico no encajaba con ese estudio puntual. Cerrá y pasá a la siguiente, que sí puede calzar. Y por el tiempo que le pusiste, muchas veces igual te acreditan puntos de incentivo.",
        cta: "Ver encuestas disponibles",
      },
      {
        title: "Probá juegos y ofertas",
        subtitle: "Instalar una app o jugar unos minutos paga muy bien por el tiempo invertido.",
        bullets: [
          "En Ofertas encontrás los juegos de TimeWall y las ofertas de CPAGrip, ordenadas por pago.",
          "Cumplí la condición exacta (por ejemplo, llegar a cierto nivel) antes de cerrar el juego.",
          "Cuando volvés a la app, tu saldo se actualiza automáticamente en pocos segundos.",
        ],
        tip: "Arrancá por las ofertas de pago medio: se completan rápido y no te frustran como las de muchas horas.",
        cta: "Ver juegos y ofertas",
      },
      {
        title: "Tareas de anunciantes",
        subtitle: "Microtareas de marcas reales: mirar, opinar, probar y cobrar.",
        bullets: [
          "En Tareas de anunciantes ves campañas con instrucciones claras y pago fijo.",
          "Subí la prueba que te piden (captura o comprobante) para que se apruebe.",
          "Seguí el estado en tu historial: pendiente, aprobada o con observaciones.",
        ],
        tip: "Leé todas las instrucciones antes de empezar: la mayoría de los rechazos pasa por saltear un paso.",
        cta: "Ver tareas disponibles",
      },
      {
        title: "Multiplicá tus puntos",
        subtitle: "Solo con puntos de encuestas, con topes claros y sin sorpresas.",
        bullets: [
          "Hasta 4 giros cada 24 h: 45% x1.1 · 30% x1.0 · 20% x0.5 · 5% x1.5.",
          "Cada encuesta aprobada de 50 pts o más te da 1 giro (150 en España, 500 en EE.UU.).",
          "Apuesta máxima: 200 pts por giro (400 en España, 1,000 en EE.UU.). El bono de bienvenida no se apuesta.",
        ],
        cta: "Ir a Multiplicar",
      },
      {
        title: "Cómo cobrás tus puntos",
        subtitle: "Los retiros se procesan solos, una vez por semana.",
        bullets: [
          "Mínimo: 5.000 Pts (USD 5).",
          "Corte: jueves 16:00 (hora argentina). Si pasás el mínimo antes, cobrás el viernes.",
          "El primer retiro de cada cuenta pasa por una auditoría de 24 horas hábiles.",
          "Cargá tu método de pago y tu país en el perfil con anticipación.",
        ],
        tip: "Si querés cobrar automáticamente cada semana, no actives la retención de pagos.",
        cta: "Ver mi saldo y retiros",
      },
      {
        title: "Sumá con tus amigos",
        subtitle: "Compartí tu código y ganá el 10% de comisión de por vida sobre lo que ellos generen.",
        bullets: [
          "Tu código de referido está en tu Perfil: compartilo por WhatsApp o redes.",
          "Tu amigo lo carga al registrarse y queda vinculado a vos para siempre.",
          "Ganás el 10% de cada tarea que esa persona complete, de por vida, y se acredita solo.",
        ],
        cta: "Ver mis referidos",
      },
      {
        title: "Cuidá tu cuenta y tus puntos",
        subtitle: "Tres reglas para que no pierdas nada.",
        bullets: [
          "Una cuenta por persona y datos reales: el antifraude revisa antes de pagar.",
          "No uses VPN ni bloqueadores mientras hacés encuestas: los proveedores anulan el pago.",
          "Si algo no se acreditó, escribí a Soporte desde tu Perfil con una captura.",
        ],
        tip: "Ya sabés todo lo necesario. Arrancá por encuestas: es donde vas a ver tu primer cobro más rápido.",
      },
    ],
  },

  en: {
    ui: {
      progreso: "Getting started · {n} of {total}",
      atras: "Back",
      siguiente: "Next",
      empezar: "Start now",
      cerrarExplorar: "Close and explore on my own",
      cerrar: "Close guide",
      aria: "Interactive getting-started guide",
      pasoAria: "Go to step {n}: {titulo}",
      tip: "Tip: ",
    },
    steps: [
      {
        title: "Start earning in a few minutes",
        subtitle: "LatamBucks pays you for simple tasks you can do from your phone.",
        bullets: [
          "Everything is measured in Pts: 1,000 Pts = USD 1.",
          "The minimum payout is 5,000 Pts (USD 5).",
          "Points are credited to your balance automatically: you don't have to claim them.",
        ],
        tip: "I'll show you the sections in order of payout: surveys, games and advertiser tasks pay the most.",
      },
      {
        title: "Surveys: the fastest route",
        subtitle: "It's what pays the most points per minute. Start here.",
        bullets: [
          "In Surveys you see each survey with its points and estimated minutes before entering.",
          "They open in a new tab from the provider (CPX, TheoremReach, TimeWall or RapidoReach).",
          "Answer carefully and without rushing: if the provider detects rushed answers, it doesn't pay.",
          "If you get disqualified, you usually still get a payment for the time you spent.",
        ],
        tip: "A survey closing and disqualifying you isn't your mistake: your demographic profile didn't match that specific study. Close it and move to the next one, which may fit. And for the time you put in, you often still get incentive points.",
        cta: "See available surveys",
      },
      {
        title: "Try games and offers",
        subtitle: "Installing an app or playing for a few minutes pays very well for the time invested.",
        bullets: [
          "In Offers you'll find TimeWall games and CPAGrip offers, sorted by payout.",
          "Meet the exact condition (for example, reaching a certain level) before closing the game.",
          "When you come back to the app, your balance updates automatically in a few seconds.",
        ],
        tip: "Start with medium-payout offers: they complete fast and won't frustrate you like the many-hour ones.",
        cta: "See games and offers",
      },
      {
        title: "Advertiser tasks",
        subtitle: "Microtasks from real brands: look, comment, try and get paid.",
        bullets: [
          "In Advertiser tasks you see campaigns with clear instructions and fixed pay.",
          "Upload the proof they ask for (screenshot or receipt) so it can be approved.",
          "Follow the status in your history: pending, approved or with remarks.",
        ],
        tip: "Read all the instructions before starting: most rejections happen because a step is skipped.",
        cta: "See available tasks",
      },
      {
        title: "Multiply your points",
        subtitle: "Survey points only, with clear caps and no surprises.",
        bullets: [
          "Up to 4 spins every 24 h: 45% x1.1 · 30% x1.0 · 20% x0.5 · 5% x1.5.",
          "Every approved survey of 50 pts or more gives you 1 spin (150 in Spain, 500 in the US).",
          "Max bet: 200 pts per spin (400 in Spain, 1,000 in the US). The welcome bonus can't be bet.",
        ],
        cta: "Go to Multiply",
      },
      {
        title: "How you cash out your points",
        subtitle: "Withdrawals are processed automatically, once a week.",
        bullets: [
          "Minimum: 5,000 Pts (USD 5).",
          "Cutoff: Thursday 16:00 (Argentina time). If you're above the minimum before then, you're paid on Friday.",
          "The first withdrawal of each account goes through a 24-business-hour audit.",
          "Load your payment method and country in your profile in advance.",
        ],
        tip: "If you want to be paid automatically every week, don't enable payment retention.",
        cta: "See my balance and withdrawals",
      },
      {
        title: "Earn with your friends",
        subtitle: "Share your code and earn a 10% lifetime commission on what they generate.",
        bullets: [
          "Your referral code is in your Profile: share it on WhatsApp or social.",
          "Your friend enters it when signing up and stays linked to you for good.",
          "You earn 10% of every task that person completes, for life, credited automatically.",
        ],
        cta: "See my referrals",
      },
      {
        title: "Protect your account and your points",
        subtitle: "Three rules so you don't lose anything.",
        bullets: [
          "One account per person with real data: anti-fraud reviews before paying.",
          "Don't use VPNs or blockers while doing surveys: providers void the payment.",
          "If something wasn't credited, write to Support from your Profile with a screenshot.",
        ],
        tip: "You now know everything you need. Start with surveys: that's where you'll see your first payout fastest.",
      },
    ],
  },

  pt: {
    ui: {
      progreso: "Guia para começar · {n} de {total}",
      atras: "Voltar",
      siguiente: "Próximo",
      empezar: "Começar agora",
      cerrarExplorar: "Fechar e explorar por conta própria",
      cerrar: "Fechar guia",
      aria: "Guia interativo para começar",
      pasoAria: "Ir para o passo {n}: {titulo}",
      tip: "Dica: ",
    },
    steps: [
      {
        title: "Comece a ganhar em poucos minutos",
        subtitle: "O LatamBucks paga por tarefas simples que você pode fazer pelo celular.",
        bullets: [
          "Tudo é medido em Pts: 1.000 Pts = USD 1.",
          "O valor mínimo de saque é 5.000 Pts (USD 5).",
          "Os pontos são creditados sozinhos no seu saldo: você não precisa resgatá-los.",
        ],
        tip: "Vou mostrar as seções na ordem de pagamento: pesquisas, jogos e tarefas de anunciantes são as que mais rendem.",
      },
      {
        title: "Pesquisas: o caminho mais rápido",
        subtitle: "É o que mais rende pontos por minuto. Comece por aqui.",
        bullets: [
          "Em Pesquisas você vê cada pesquisa com seus pontos e minutos estimados antes de entrar.",
          "Elas abrem numa nova aba do provedor (CPX, TheoremReach, TimeWall ou RapidoReach).",
          "Responda com atenção e sem pressa: se o provedor detectar respostas apressadas, não paga.",
          "Se você for desclassificado, geralmente ainda fica um pagamento pelo tempo dedicado.",
        ],
        tip: "Uma pesquisa fechar e te desclassificar não é erro seu: seu perfil demográfico não combinava com aquele estudo específico. Feche e passe para a próxima, que pode combinar. E pelo tempo que você dedicou, muitas vezes ainda creditam pontos de incentivo.",
        cta: "Ver pesquisas disponíveis",
      },
      {
        title: "Experimente jogos e ofertas",
        subtitle: "Instalar um app ou jogar alguns minutos paga muito bem pelo tempo investido.",
        bullets: [
          "Em Ofertas você encontra os jogos do TimeWall e as ofertas da CPAGrip, ordenadas por pagamento.",
          "Cumpra a condição exata (por exemplo, chegar a certo nível) antes de fechar o jogo.",
          "Quando você volta ao app, seu saldo é atualizado automaticamente em poucos segundos.",
        ],
        tip: "Comece pelas ofertas de pagamento médio: são concluídas rápido e não frustram como as de muitas horas.",
        cta: "Ver jogos e ofertas",
      },
      {
        title: "Tarefas de anunciantes",
        subtitle: "Microtarefas de marcas reais: olhar, opinar, testar e receber.",
        bullets: [
          "Em Tarefas de anunciantes você vê campanhas com instruções claras e pagamento fixo.",
          "Envie a prova que pedem (captura ou comprovante) para que seja aprovada.",
          "Acompanhe o status no seu histórico: pendente, aprovada ou com observações.",
        ],
        tip: "Leia todas as instruções antes de começar: a maioria das rejeições acontece por pular um passo.",
        cta: "Ver tarefas disponíveis",
      },
      {
        title: "Multiplique seus pontos",
        subtitle: "Somente com pontos de pesquisas, com limites claros e sem surpresas.",
        bullets: [
          "Até 4 giros a cada 24 h: 45% x1.1 · 30% x1.0 · 20% x0.5 · 5% x1.5.",
          "Cada enquete aprovada de 50 pts ou mais dá 1 giro (150 na Espanha, 500 nos EUA).",
          "Aposta máxima: 200 pts por giro (400 na Espanha, 1,000 nos EUA). O bônus de boas-vindas não pode ser apostado.",
        ],
        cta: "Ir para Multiplicar",
      },
      {
        title: "Como você recebe seus pontos",
        subtitle: "Os saques são processados sozinhos, uma vez por semana.",
        bullets: [
          "Mínimo: 5.000 Pts (USD 5).",
          "Corte: quinta-feira 16:00 (horário da Argentina). Se passar o mínimo antes, você recebe na sexta.",
          "O primeiro saque de cada conta passa por uma auditoria de 24 horas úteis.",
          "Cadastre seu método de pagamento e seu país no perfil com antecedência.",
        ],
        tip: "Se quiser receber automaticamente toda semana, não ative a retenção de pagamentos.",
        cta: "Ver meu saldo e saques",
      },
      {
        title: "Some com seus amigos",
        subtitle: "Compartilhe seu código e ganhe 10% de comissão para sempre sobre o que eles gerarem.",
        bullets: [
          "Seu código de indicação está no seu Perfil: compartilhe no WhatsApp ou nas redes.",
          "Seu amigo insere ao se cadastrar e fica vinculado a você para sempre.",
          "Você ganha 10% de cada tarefa que essa pessoa concluir, para sempre, creditado sozinho.",
        ],
        cta: "Ver minhas indicações",
      },
      {
        title: "Cuide da sua conta e dos seus pontos",
        subtitle: "Três regras para não perder nada.",
        bullets: [
          "Uma conta por pessoa e dados reais: o antifraude revisa antes de pagar.",
          "Não use VPN nem bloqueadores enquanto faz pesquisas: os provedores anulam o pagamento.",
          "Se algo não foi creditado, escreva para o Suporte pelo Perfil com uma captura.",
        ],
        tip: "Você já sabe tudo o que precisa. Comece pelas pesquisas: é onde vai ver seu primeiro recebimento mais rápido.",
      },
    ],
  },
};
