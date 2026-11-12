// Texto legal: Preguntas Frecuentes (español, inglés y portugués).
// Formato pregunta/respuesta: cada ítem usa "q" + paragraphs/bullets.

export default {
  es: {
    qa: true,
    title: "Preguntas Frecuentes",
    subtitle: "Todo lo que necesitás saber sobre cómo funciona LatamBucks.",
    sections: [
      {
        q: "¿Qué es LatamBucks?",
        paragraphs: [
          "LatamBucks es una plataforma de microtareas que te permite ganar recompensas (puntos) completando actividades como responder encuestas y realizar tareas locales de anunciantes. Los puntos acumulados pueden canjearse por dinero real a través de Payoneer, Airtm o PayPal (USD para todos los países).",
        ],
      },
      {
        q: "¿Cómo me registro?",
        paragraphs: [
          "Ingresá tu correo electrónico y una contraseña en la pantalla de inicio. Seleccioná tu país de residencia y aceptás los Términos y Condiciones. La creación de cuenta es gratuita y no tiene costo alguno.",
        ],
      },
      {
        q: "¿Cómo gano puntos?",
        paragraphs: ["Existen varias formas de ganar puntos:"],
        bullets: [
          "**1. Encuestas:** completá encuestas de nuestros proveedores asociados (CPX Research, TheoremReach, TimeWall y RapidoReach). Los puntos se acreditan automáticamente al finalizar.",
          "**2. Tareas de anunciantes:** visitá el enlace de una campaña, cumplí la consigna (por ejemplo, visitar una web o red social) y subí la captura de pantalla como prueba. El anunciante aprueba o rechaza tu envío.",
          "**3. Apps y juegos (CPAGrip):** descargá apps o jugá y sumá puntos al instante con acreditación automática.",
          "**4. Bono de bienvenida:** al registrarte recibís 500 puntos ($0.50 USD) de regalo para empezar.",
          "**5. Referidos:** invitá a tus amigos con tu código de referido y ganá un 10% de comisión sobre sus ganancias.",
          "**6. Multiplicador de puntos:** convertí en más puntos los puntos que ya ganaste en encuestas usando tus giros diarios gratuitos (ver la pregunta sobre el multiplicador).",
        ],
      },
      {
        q: "¿El multiplicador de puntos es una apuesta o un juego de azar?",
        paragraphs: [
          "**No.** El Multiplicador (la \"ruleta\" de puntos) es un **incentivo de gamificación**: un módulo gratuito y opcional que te permite convertir en más puntos los puntos que ya ganaste respondiendo encuestas. No es un casino, una casa de apuestas, una lotería ni un juego de azar con dinero real.",
          "No pagás nada para participar y no podés depositar dinero: los giros son gratuitos (4 por día, con requisitos y límites según tu país) y **solo se usan puntos que obtuviste vos en encuestas válidas**. Los bonos y el saldo promocional no se pueden usar en el multiplicador.",
          "Los puntos no son dinero: son una unidad de recompensa virtual que recién se convierte en USD cuando se aprueba un retiro. El resultado de cada giro se acredita **siempre como puntos**, nunca como efectivo, y en un giro solo destinás puntos que ya tenés: nunca quedás en deuda ni obligado a pagar nada.",
          "La plataforma puede cambiar, limitar o deshabilitar el multiplicador (reglas, probabilidades, topes diarios) con previo aviso. Usar bots, scripts, cuentas múltiples o VPN para alterar resultados o límites es fraude y esos puntos se anulan. El detalle legal completo está en los Términos y Condiciones (sección 18).",
          "Además, **todos los sistemas de gamificación están sujetos a cambios**: podemos modificar sus reglas, quitarlos o crear nuevos incentivos en el futuro para mejorar el sitio, siempre con aviso previo en la plataforma.",
        ],
      },
      {
        q: "¿Cómo consigo giros en el multiplicador y cuántos tengo?",
        paragraphs: [
          "Cada encuesta o tarea externa **aprobada** con al menos el mínimo de tu país te da **1 giro**: 500 pts en Tier 1 (EE.UU. y países principales), 150 pts en Tier 2 (España) y 50 pts en Tier 3 (Latinoamérica y resto). Cuentan las conversiones de las **últimas 24 horas**.",
          "Podés tener hasta **4 giros cada 24 horas** y la ventana es móvil: cada giro se libera cuando la encuesta que lo generó sale de las últimas 24 h. Arriba de la ruleta ves cuántos te quedan (\"Giros disponibles: X de 4\").",
          "Si no tenés giros, el botón de la ruleta te lleva directo a las encuestas para que consigas uno. Las tareas internas y los videos no generan giros.",
        ],
      },
      {
        q: "¿Qué pasa si en un giro me sale x0.5 o x1.0? ¿Pierdo puntos?",
        paragraphs: [
          "El premio se calcula como **apuesta × multiplicador**: con x1.5 tu saldo de encuestas sube un 50% de lo apostado, con x1.1 sube un 10%, con x1.0 queda igual y con x0.5 se descuenta la mitad de lo apostado.",
          "Nunca perdés más de lo que pusiste en ese giro y **nunca quedás en deuda**: el giro solo afecta los puntos que apostaste. El bono de bienvenida y el saldo promocional no se tocan, porque no se pueden apostar.",
          "Hay un **tope de ganancia neta cada 24 h** por país: si lo alcanzás, la ruleta te avisa y podés volver a girar cuando el tope se libere.",
        ],
      },
      {
        q: "¿Cuáles son las probabilidades y los límites del multiplicador?",
        paragraphs: [
          "**Tabla de probabilidades:** x1.1 = 45% · x1.0 = 30% · x0.5 = 20% · x1.5 = 5%. Cada giro es independiente del anterior: las chances no se acumulan ni se pueden \"cargar\" de un giro a otro.",
          "**Límites por país:** Tier 1 (EE.UU. y países principales) encuesta mínima 500 pts y apuesta máxima 1,000 pts por giro; Tier 2 (España) 150 pts y 400 pts; Tier 3 (Latinoamérica y resto) 50 pts y 200 pts.",
          "También aplican un máximo de 4 giros cada 24 h y un tope de ganancia neta diaria. Los valores exactos de tu país están en la ruleta, en \"Límites y probabilidades por país\", y el detalle legal en los Términos y Condiciones (sección 18).",
        ],
      },
      {
        q: "¿Cuánto vale cada punto?",
        paragraphs: [
          "**1000 puntos equivalen a 1 USD** (dólar estadounidense). El saldo se expresa y abona en USD para todos los usuarios, independientemente de su país de residencia.",
          "Los puntos disponibles son los que ya podés retirar; los puntos pendientes están en proceso de validación (por ejemplo, tareas esperando aprobación del anunciante o encuestas siendo auditadas por el proveedor externo).",
        ],
      },
      {
        q: "¿Cuál es el mínimo de retiro?",
        paragraphs: [
          "El monto mínimo es de **5000 puntos (5 USD)** para todos los países. Este mínimo está sujeto a cambios y modificaciones futuras sin previo aviso por parte de la administración de la plataforma.",
        ],
      },
      {
        q: "¿Qué métodos de pago puedo usar para retirar?",
        paragraphs: [
          "Todos los retiros se procesan en dólares estadounidenses (USD). Los métodos de pago disponibles para todos los usuarios, sin distinción de país, son:",
        ],
        bullets: [
          "**Payoneer:** se abona al correo electrónico de tu cuenta Payoneer. Deberás registrar tu correo y el nombre del titular en la pestaña \"Retiros\".",
          "**Airtm:** se abona al correo electrónico de tu cuenta Airtm. Deberás registrar tu correo y el nombre del titular.",
          "**PayPal:** se abona al correo electrónico de tu cuenta PayPal. **PayPal cobra una comisión estándar por recibir pagos internacionales** (aprox. 4.49% + tarifa fija, variable según el país receptor). Consultá las comisiones vigentes en paypal.com/fees antes de elegir este método.",
        ],
        closing: [
          "La plataforma podrá habilitar, modificar o deshabilitar medios de pago en el futuro. Los canales oficiales de distribución de pagos serán comunicados a través de la app y esta página de preguntas frecuentes.",
        ],
      },
      {
        q: "¿Cuándo se realiza el corte y el pago?",
        paragraphs: [
          "El corte de facturación se realiza de forma **automática todos los jueves a las 16:00 hs de Argentina**. Si tu saldo disponible supera el mínimo exigido en ese momento, pasa automáticamente a estado \"Pago en Proceso\". Los pagos correspondientes se **procesan y envían todos los viernes** a través del método asignado a tu país.",
        ],
      },
      {
        q: "¿Qué pasa si hay demoras en la acreditación de mi pago?",
        paragraphs: [
          "Pueden existir retrasos en la acreditación de los fondos, dado que dependemos enteramente de las normativas, revisiones y tiempos de procesamiento de plataformas de terceros (Payoneer, Airtm y PayPal). Ante cualquier demora, la plataforma notificará de inmediato a la comunidad especificando el método afectado. La plataforma deslinda toda responsabilidad legal por demoras externas originadas en los proveedores de pago o en sus procesos de auditoría.",
        ],
      },
      {
        q: "¿Qué hago si completé una encuesta o tarea y no recibí mis puntos?",
        paragraphs: [
          "La plataforma **no es responsable por puntos, créditos o recompensas que no hayan sido otorgados** tras completar encuestas, descargas de aplicaciones, registros o tareas. Estos módulos corresponden a proveedores externos y son ellos quienes auditan, validan y aprueban de forma exclusiva el cumplimiento correcto de cada acción. Ante cualquier inconveniente, deberás realizar el reclamo directamente a los proveedores mediante los siguientes canales oficiales incluidos en la app:",
          "**CPX Research (Encuestas y Tareas):** si una encuesta completada con éxito no acreditó tus puntos, ingresá al menú de tres líneas de su sección de ofertas, andá a la opción \"Help\" (Ayuda) y abrí un ticket de soporte. También podés contactarlos a través de su sitio oficial [cpx-research.com](https://www.cpx-research.com/) o al correo [hello@cpx-research.com](mailto:hello@cpx-research.com).",
          "**TimeWall (Muro de Ofertas y Microtareas):** si completaste una oferta del muro de TimeWall y no recibiste tus puntos, abrí un ticket de soporte desde el menú dentro del muro de ofertas, o contactá a TimeWall en su página oficial de soporte [timewall.io/contactus](https://timewall.io/contactus).",
          "**Monetag (Instalaciones de Apps, Juegos y Ofertas):** si cumpliste con todos los requisitos de una tarea y no recibiste tus puntos, abrí el menú de la oferta dentro de nuestro sitio, hacé clic en la opción \"Status / Report an Issue\" de Monetag, o contactá directamente a su mesa de ayuda. También podés escribir a sus correos oficiales de atención técnica: [support@monetag.com](mailto:support@monetag.com) o [contact.us@monetag.com](mailto:contact.us@monetag.com).",
          "**TheoremReach (Encuestas premium):** si completaste una encuesta del muro de TheoremReach y no recibiste tus puntos, abrí un ticket de soporte desde el menú dentro del muro, o escribiles a su correo oficial de usuarios [support@theoremreach.com](mailto:support@theoremreach.com). También podés usar su formulario: [info.theoremreach.com/contact](https://info.theoremreach.com/contact/).",
          "**CPAGrip (Apps, Juegos y Ofertas):** si descargaste una app o completaste una oferta de CPAGrip y no recibiste tus puntos, abrí el menú de la oferta dentro del muro y buscá la opción de soporte, o contactá a CPAGrip a través de su sitio oficial [cpagrip.com](https://www.cpagrip.com).",
          "**RapidoReach (Encuestas y Ofertas):** si completaste una encuesta u oferta del muro de RapidoReach y no recibiste tus puntos, esperá el tiempo de acreditación indicado por el proveedor y, si el problema continúa, abrí un ticket desde el menú de soporte del propio muro o escribiles a [support@rapidoreach.com](mailto:support@rapidoreach.com). Formulario oficial: [rapidoreach.com/contactus](https://www.rapidoreach.com/contactus).",
        ],
      },
      {
        q: "¿Puedo usar VPN o cambiar mi ubicación?",
        paragraphs: [
          "**No.** El uso de VPN, proxies, o cualquier herramienta destinada a ocultar, simular o alterar tu ubicación geográfica real está **estrictamente prohibido**.",
          "Esta prohibición es un requisito obligatorio de los proveedores externos de ofertas y encuestas (CPX Research, TimeWall, RapidoReach, Monetag y otros). El uso de VPN puede provocar la cancelación de la cuenta de la Plataforma ante los proveedores, afectando a toda la comunidad.",
          "La plataforma cuenta con sistemas de detección de VPN y proxies. Las cuentas que infrinjan esta regla serán **eliminadas de forma permanente, aun cuando contengan fondos o puntos acumulados, y sin previo aviso**. La pérdida de los saldos no será reembolsable ni reclamable bajo ningún concepto.",
        ],
      },
      {
        q: "¿Cómo retiro mis ganancias?",
        paragraphs: [
          "Desde la pestaña \"Retiros\", guardá tus datos de cobro (Payoneer, Airtm o PayPal). El sistema procesa automáticamente tu saldo cada jueves a las 16:00 hs de Argentina si superás el mínimo exigido. El pago se envía el viernes siguiente. No necesitás solicitar el retiro manualmente.",
        ],
      },
      {
        q: "¿Cómo funciona el sistema de referidos?",
        paragraphs: [
          "Cada usuario tiene un código de referido único. Compartilo con tus contactos: cuando alguien se registra usando tu código, pasás a ser su patrocinador y recibís una **comisión del 10%** sobre los puntos que gane al completar microtareas válidas. La comisión se acredita automáticamente y se suma a tu saldo. La comisión no aplica sobre bonos de bienvenida ni saldo promocional; solo sobre microtareas completadas. Si la tarea del referido es rechazada o revertida, la comisión también se revierte.",
        ],
      },
      {
        q: "¿Qué es el bono de bienvenida?",
        paragraphs: [
          "Al registrarte recibís automáticamente **500 puntos ($0.50 USD)** de bono de bienvenida. Este bono se acredita una sola vez y podés usarlo para retirar o para crear campañas como anunciante. Si creás una campaña, el saldo bono se consume primero y está **exento de la comisión del 30%** de la plataforma. El bono es revocable si se detecta fraude o cuenta múltiple. **No se puede apostar en la ruleta Multiplicador:** ahí solo se juegan puntos ganados en encuestas.",
        ],
      },
      {
        q: "¿Qué es el saldo promocional?",
        paragraphs: [
          "El saldo promocional es un crédito de regalo que la plataforma puede acreditar por promociones o compensaciones especiales. A diferencia del saldo disponible, el saldo promocional **no es retirable** y solo puede usarse para crear campañas dentro de la plataforma. Al usarlo para fondear una campaña se aplica la comisión del 30%. Puede tener fecha de vencimiento, que se comunicará mediante un aviso del sistema.",
        ],
      },
      {
        q: "¿Qué pasa si mi tarea es rechazada?",
        paragraphs: [
          "Si un anunciante rechaza tu prueba de tarea, tenés un plazo de **24 horas** para abrir una disputa explicando por qué considerás que el rechazo fue injustificado. Nuestro equipo administrativo revisa la disputa y resuelve a favor del usuario o del anunciante.",
        ],
      },
      {
        q: "¿Qué pasa si el anunciante no revisa mi tarea?",
        paragraphs: [
          "Si una tarea lleva más de **48 horas** sin ser revisada por el anunciante, el sistema la aprueba automáticamente y los puntos se acreditan a tu balance.",
        ],
      },
      {
        q: "Soy anunciante, ¿cómo publico una campaña?",
        paragraphs: [
          "Desde la sección \"Anunciar Aquí\", completá los datos de tu campaña (título, enlace, puntos por visita, cantidad de visitas). El sistema calcula el costo total incluyendo una comisión del 30% de la plataforma. Realizás el pago por Payoneer, Airtm o PayPal y, una vez aprobado el pago por el administrador, la campaña queda activa para que los usuarios la realicen.",
        ],
      },
      {
        q: "¿Cómo reviso las pruebas de los usuarios?",
        paragraphs: [
          "Si sos anunciante, accedé a la pestaña \"Anunciante\" desde el menú inferior. Allí verás todas las pruebas pendientes de tus campañas, con la captura de pantalla y el texto de prueba. Podés aprobar o rechazar cada envío. Recordá que las pruebas no revisadas en 48 horas se aprueban automáticamente.",
        ],
      },
      {
        q: "¿Puedo tener varias cuentas?",
        paragraphs: [
          "No. Cada persona puede tener una sola cuenta. La creación de cuentas múltiples para manipular el sistema de referidos o inflar ganancias está prohibida y resulta en la suspensión permanente de todas las cuentas involucradas.",
        ],
      },
      {
        q: "¿Desde qué países puedo usar LatamBucks?",
        paragraphs: [
          "LatamBucks está disponible para usuarios de Latinoamérica y del resto del mundo. Al registrarte, seleccionás tu país de residencia. La disponibilidad de encuestas y tareas puede variar según el país.",
        ],
      },
      {
        q: "¿Cómo contacto al soporte?",
        paragraphs: [
          "Para consultas sobre tu cuenta, retiros o disputas, comunicate a [latambucks@gmail.com](mailto:latambucks@gmail.com). Nuestro equipo responde en horarios hábiles.",
        ],
      },
    ],
  },

  en: {
    qa: true,
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about how LatamBucks works.",
    sections: [
      {
        q: "What is LatamBucks?",
        paragraphs: [
          "LatamBucks is a microtask platform that lets you earn rewards (points) by completing activities such as answering surveys and doing local advertiser tasks. Accumulated points can be redeemed for real money through Payoneer, Airtm or PayPal (USD for every country).",
        ],
      },
      {
        q: "How do I sign up?",
        paragraphs: [
          "Enter your email and a password on the home screen. Select your country of residence and accept the Terms & Conditions. Creating an account is completely free.",
        ],
      },
      {
        q: "How do I earn points?",
        paragraphs: ["There are several ways to earn points:"],
        bullets: [
          "**1. Surveys:** complete surveys from our partner providers (CPX Research, TheoremReach, TimeWall and RapidoReach). Points are credited automatically when you finish.",
          "**2. Advertiser tasks:** visit a campaign link, follow the instruction (for example, visiting a website or social profile) and upload a screenshot as proof. The advertiser approves or rejects your submission.",
          "**3. Apps and games (CPAGrip):** download apps or play games and earn points instantly with automatic crediting.",
          "**4. Welcome bonus:** when you sign up you receive 500 points ($0.50 USD) as a gift to get started.",
          "**5. Referrals:** invite friends with your referral code and earn a 10% commission on their earnings.",
          "**6. Points Multiplier:** turn points you already earned on surveys into more points with your free daily spins (see the multiplier question below).",
        ],
      },
      {
        q: "Is the points multiplier betting or a game of chance?",
        paragraphs: [
          "**No.** The Multiplier (the points \"wheel\") is a **gamification incentive**: a free, optional feature that lets you turn points you already earned by answering surveys into more points. It is not a casino, a betting house, a lottery or a game of chance played with real money.",
          "You pay nothing to take part and you cannot deposit money: spins are free (4 per day, with requirements and limits that depend on your country) and **only points you earned on valid surveys are used**. Bonuses and promotional balance cannot be used in the multiplier.",
          "Points are not money: they are a virtual reward unit that only turns into USD once a withdrawal is approved. Every spin's result is credited **always as points**, never as cash, and in a spin you only commit points you already hold: you never end up in debt or owing anything.",
          "The platform may change, limit or disable the multiplier (rules, odds, daily caps) with prior notice. Using bots, scripts, multiple accounts or a VPN to alter results or limits is fraud and those points are void. The full legal detail is in the Terms & Conditions (section 18).",
          "Also, **every gamification system is subject to change**: we may modify its rules, remove it or add new incentives in the future to improve the site, always with prior notice on the platform.",
        ],
      },
      {
        q: "How do I get multiplier spins and how many do I have?",
        paragraphs: [
          "Every **approved** survey or external task worth at least your country's minimum gives you **1 spin**: 500 pts in Tier 1 (US and main countries), 150 pts in Tier 2 (Spain) and 50 pts in Tier 3 (Latin America and the rest). Conversions from the **last 24 hours** count.",
          "You can hold up to **4 spins every 24 hours** and the window rolls: each spin is released once the survey that generated it leaves the last 24 h. Above the wheel you can see how many you have left (\"Spins available: X of 4\").",
          "If you have no spins, the wheel button takes you straight to the surveys so you can earn one. Internal tasks and videos do not generate spins.",
        ],
      },
      {
        q: "What happens if a spin lands on x0.5 or x1.0? Do I lose points?",
        paragraphs: [
          "The prize is calculated as **bet × multiplier**: with x1.5 your survey balance grows by 50% of the bet, with x1.1 by 10%, with x1.0 it stays the same and with x0.5 half of the bet is deducted.",
          "You never lose more than what you put into that spin and **you never end up in debt**: a spin only affects the points you bet. The welcome bonus and promotional balance are untouched, because they cannot be bet.",
          "Each country has a **daily net-profit cap**: if you reach it, the wheel tells you and you can spin again once the cap is released.",
        ],
      },
      {
        q: "What are the multiplier's odds and limits?",
        paragraphs: [
          "**Odds table:** x1.1 = 45% · x1.0 = 30% · x0.5 = 20% · x1.5 = 5%. Every spin is independent of the previous one: chances do not build up or \"load\" from one spin to the next.",
          "**Country limits:** Tier 1 (US and main countries) minimum survey 500 pts and maximum bet 1,000 pts per spin; Tier 2 (Spain) 150 pts and 400 pts; Tier 3 (Latin America and the rest) 50 pts and 200 pts.",
          "A maximum of 4 spins every 24 h and a daily net-profit cap also apply. Your country's exact values are on the wheel, under \"Limits and odds by country\", and the legal detail is in the Terms & Conditions (section 18).",
        ],
      },
      {
        q: "How much is each point worth?",
        paragraphs: [
          "**1000 points equal 1 USD** (US dollar). Balances are expressed and paid in USD for all users, regardless of their country of residence.",
          "Available points are the ones you can already withdraw; pending points are under validation (for example, tasks awaiting advertiser approval or surveys being audited by the external provider).",
        ],
      },
      {
        q: "What is the minimum withdrawal?",
        paragraphs: [
          "The minimum is **5000 points (5 USD)** for every country. This minimum may change in the future without prior notice from the platform administration.",
        ],
      },
      {
        q: "Which payment methods can I use to withdraw?",
        paragraphs: [
          "All withdrawals are processed in US dollars (USD). The payment methods available to every user, regardless of country, are:",
        ],
        bullets: [
          "**Payoneer:** paid to your Payoneer account email. You must register your email and the account holder's name in the \"Withdrawals\" tab.",
          "**Airtm:** paid to your Airtm account email. You must register your email and the account holder's name.",
          "**PayPal:** paid to your PayPal account email. **PayPal charges a standard fee for receiving international payments** (about 4.49% + a fixed fee, which varies by receiving country). Check the current fees at paypal.com/fees before choosing this method.",
        ],
        closing: [
          "The platform may enable, change or disable payment methods in the future. Official payout channels will be announced in the app and on this FAQ page.",
        ],
      },
      {
        q: "When is the cutoff and the payment made?",
        paragraphs: [
          "The billing cutoff is **automatic every Thursday at 16:00 (Argentina time)**. If your available balance exceeds the minimum required at that moment, it automatically moves to \"Payment in Progress\". The corresponding payments are **processed and sent every Friday** through the method assigned to your country.",
        ],
      },
      {
        q: "What if my payment takes longer to arrive?",
        paragraphs: [
          "Delays can happen because we depend entirely on the rules, reviews and processing times of third-party platforms (Payoneer, Airtm and PayPal). If there is any delay, the platform will immediately notify the community, specifying the affected method. The platform disclaims all legal liability for external delays caused by payment providers or their audit processes.",
        ],
      },
      {
        q: "What do I do if I completed a survey or task and didn't get my points?",
        paragraphs: [
          "The platform **is not responsible for points, credits or rewards not granted** after completing surveys, app downloads, sign-ups or tasks. Those modules belong to external providers, and they exclusively audit, validate and approve the correct completion of each action. If you have an issue, you must claim directly with the providers through these official channels included in the app:",
          "**CPX Research (Surveys and Tasks):** if a successfully completed survey did not credit your points, open the three-line menu in its offers section, go to \"Help\" and open a support ticket. You can also contact them through their official site [cpx-research.com](https://www.cpx-research.com/) or at [hello@cpx-research.com](mailto:hello@cpx-research.com).",
          "**TimeWall (Offer Wall and Microtasks):** if you completed an offer on the TimeWall wall and did not receive your points, open a support ticket from the menu inside the offer wall, or contact TimeWall on its official support page [timewall.io/contactus](https://timewall.io/contactus).",
          "**Monetag (App Installs, Games and Offers):** if you met all the requirements of a task and did not receive your points, open the offer menu on our site, click Monetag's \"Status / Report an Issue\" option, or contact their help desk directly. You can also write to their official support emails: [support@monetag.com](mailto:support@monetag.com) or [contact.us@monetag.com](mailto:contact.us@monetag.com).",
          "**TheoremReach (Premium surveys):** if you completed a survey on the TheoremReach wall and did not receive your points, open a support ticket from the menu inside the wall, or write to their official user support email [support@theoremreach.com](mailto:support@theoremreach.com). You can also use their contact form: [info.theoremreach.com/contact](https://info.theoremreach.com/contact/).",
          "**CPAGrip (Apps, Games and Offers):** if you downloaded an app or completed a CPAGrip offer and did not receive your points, open the offer menu inside the wall and look for the support option, or contact CPAGrip through its official site [cpagrip.com](https://www.cpagrip.com).",
          "**RapidoReach (Surveys and Offers):** if you completed a survey or offer on the RapidoReach wall and did not receive your points, wait for the crediting time indicated by the provider and, if the problem continues, open a ticket from the wall's own support menu or write to [support@rapidoreach.com](mailto:support@rapidoreach.com). Official form: [rapidoreach.com/contactus](https://www.rapidoreach.com/contactus).",
        ],
      },
      {
        q: "Can I use a VPN or change my location?",
        paragraphs: [
          "**No.** Using VPNs, proxies or any tool meant to hide, simulate or alter your real geographic location is **strictly forbidden**.",
          "This ban is a mandatory requirement of external offer and survey providers (CPX Research, TimeWall, RapidoReach, Monetag and others). Using a VPN can lead to the Platform's account being cancelled with the providers, affecting the whole community.",
          "The platform has VPN and proxy detection systems. Accounts that breach this rule will be **permanently deleted, even if they hold funds or accumulated points, and without prior notice**. Lost balances are not refundable or claimable under any circumstance.",
        ],
      },
      {
        q: "How do I withdraw my earnings?",
        paragraphs: [
          "In the \"Withdrawals\" tab, save your payout details (Payoneer, Airtm or PayPal). The system processes your balance automatically every Thursday at 16:00 (Argentina time) if you are above the minimum required. Payment is sent the following Friday. You don't need to request the withdrawal manually.",
        ],
      },
      {
        q: "How does the referral system work?",
        paragraphs: [
          "Every user has a unique referral code. Share it with your contacts: when someone signs up with your code, you become their sponsor and receive a **10% commission** on the points they earn by completing valid microtasks. The commission is credited automatically and added to your balance. It does not apply to welcome bonuses or promotional balance; only to completed microtasks. If the referral's task is rejected or reversed, the commission is reversed too.",
        ],
      },
      {
        q: "What is the welcome bonus?",
        paragraphs: [
          "When you sign up you automatically receive **500 points ($0.50 USD)** as a welcome bonus. It is credited once and you can use it to withdraw or to create campaigns as an advertiser. If you create a campaign, the bonus balance is consumed first and is **exempt from the platform's 30% commission**. The bonus is revocable if fraud or multiple accounts are detected. **It cannot be bet on the Multiplier wheel:** only points earned from surveys can be played there.",
        ],
      },
      {
        q: "What is promotional balance?",
        paragraphs: [
          "Promotional balance is a gift credit the platform may add for promotions or special compensations. Unlike available balance, promotional balance **cannot be withdrawn** and can only be used to create campaigns inside the platform. When used to fund a campaign the 30% commission applies. It may have an expiry date, which will be announced through a system notice.",
        ],
      },
      {
        q: "What happens if my task is rejected?",
        paragraphs: [
          "If an advertiser rejects your task proof, you have **24 hours** to open a dispute explaining why you consider the rejection unjustified. Our administrative team reviews the dispute and rules in favour of the user or the advertiser.",
        ],
      },
      {
        q: "What if the advertiser doesn't review my task?",
        paragraphs: [
          "If a task goes more than **48 hours** without being reviewed by the advertiser, the system approves it automatically and the points are credited to your balance.",
        ],
      },
      {
        q: "I'm an advertiser, how do I publish a campaign?",
        paragraphs: [
          "In the \"Advertise Here\" section, fill in your campaign details (title, link, points per visit, number of visits). The system calculates the total cost including a 30% platform commission. You pay through Payoneer, Airtm or PayPal and, once the administrator approves the payment, the campaign becomes active for users to complete.",
        ],
      },
      {
        q: "How do I review users' proofs?",
        paragraphs: [
          "If you are an advertiser, open the \"Advertiser\" tab from the bottom menu. There you will see all pending proofs for your campaigns, with the screenshot and the proof text. You can approve or reject each submission. Remember that proofs not reviewed within 48 hours are approved automatically.",
        ],
      },
      {
        q: "Can I have several accounts?",
        paragraphs: [
          "No. Each person may have only one account. Creating multiple accounts to manipulate the referral system or inflate earnings is forbidden and results in the permanent suspension of every account involved.",
        ],
      },
      {
        q: "From which countries can I use LatamBucks?",
        paragraphs: [
          "LatamBucks is available to users in Latin America and the rest of the world. When signing up you select your country of residence. The availability of surveys and tasks may vary by country.",
        ],
      },
      {
        q: "How do I contact support?",
        paragraphs: [
          "For questions about your account, withdrawals or disputes, write to [latambucks@gmail.com](mailto:latambucks@gmail.com). Our team replies during business hours.",
        ],
      },
    ],
  },

  pt: {
    qa: true,
    title: "Perguntas Frequentes",
    subtitle: "Tudo o que você precisa saber sobre como o LatamBucks funciona.",
    sections: [
      {
        q: "O que é o LatamBucks?",
        paragraphs: [
          "O LatamBucks é uma plataforma de microtarefas que permite ganhar recompensas (pontos) completando atividades como responder pesquisas e realizar tarefas locais de anunciantes. Os pontos acumulados podem ser trocados por dinheiro real via Payoneer, Airtm ou PayPal (USD para todos os países).",
        ],
      },
      {
        q: "Como faço meu cadastro?",
        paragraphs: [
          "Informe seu e-mail e uma senha na tela inicial. Selecione seu país de residência e aceite os Termos e Condições. A criação da conta é gratuita e não tem nenhum custo.",
        ],
      },
      {
        q: "Como ganho pontos?",
        paragraphs: ["Existem várias formas de ganhar pontos:"],
        bullets: [
          "**1. Pesquisas:** complete pesquisas dos nossos provedores parceiros (CPX Research, TheoremReach, TimeWall e RapidoReach). Os pontos são creditados automaticamente ao final.",
          "**2. Tarefas de anunciantes:** visite o link de uma campanha, cumpra a orientação (por exemplo, visitar um site ou rede social) e envie a captura de tela como prova. O anunciante aprova ou rejeita o envio.",
          "**3. Apps e jogos (CPAGrip):** baixe apps ou jogue e some pontos na hora, com crédito automático.",
          "**4. Bônus de boas-vindas:** ao se cadastrar você recebe 500 pontos ($0,50 USD) de presente para começar.",
          "**5. Indicações:** convide amigos com seu código de indicação e ganhe 10% de comissão sobre os ganhos deles.",
          "**6. Multiplicador de pontos:** transforme em mais pontos os pontos que você já ganhou em pesquisas usando seus giros diários gratuitos (veja a pergunta sobre o multiplicador).",
        ],
      },
      {
        q: "O multiplicador de pontos é uma aposta ou um jogo de azar?",
        paragraphs: [
          "**Não.** O Multiplicador (a \"roleta\" de pontos) é um **incentivo de gamificação**: um módulo gratuito e opcional que permite transformar em mais pontos os pontos que você já ganhou respondendo pesquisas. Não é um cassino, uma casa de apostas, uma loteria nem um jogo de azar com dinheiro real.",
          "Você não paga nada para participar e não pode depositar dinheiro: os giros são gratuitos (4 por dia, com requisitos e limites que dependem do seu país) e **só são usados pontos que você ganhou em pesquisas válidas**. Bônus e saldo promocional não podem ser usados no multiplicador.",
          "Os pontos não são dinheiro: são uma unidade de recompensa virtual que só se converte em USD quando um saque é aprovado. O resultado de cada giro é creditado **sempre como pontos**, nunca como dinheiro, e em um giro você só destina pontos que já tem: você nunca fica em dívida nem deve nada.",
          "A plataforma pode alterar, limitar ou desabilitar o multiplicador (regras, probabilidades, tetos diários) com aviso prévio. Usar bots, scripts, contas múltiplas ou VPN para alterar resultados ou limites é fraude e esses pontos são anulados. O detalhe legal completo está nos Termos e Condições (seção 18).",
          "Além disso, **todos os sistemas de gamificação estão sujeitos a alterações**: podemos modificar suas regras, removê-los ou criar novos incentivos no futuro para melhorar o site, sempre com aviso prévio na plataforma.",
        ],
      },
      {
        q: "Como consigo giros no multiplicador e quantos eu tenho?",
        paragraphs: [
          "Cada pesquisa ou tarefa externa **aprovada** com pelo menos o mínimo do seu país dá **1 giro**: 500 pts no Tier 1 (EUA e países principais), 150 pts no Tier 2 (Espanha) e 50 pts no Tier 3 (América Latina e restante). Contam as conversões das **últimas 24 horas**.",
          "Você pode ter até **4 giros a cada 24 horas** e a janela é móvel: cada giro é liberado quando a pesquisa que o gerou sai das últimas 24 h. Acima da roleta você vê quantos ainda tem (\"Giros disponíveis: X de 4\").",
          "Se não tiver giros, o botão da roleta leva direto às pesquisas para você conseguir um. Tarefas internas e vídeos não geram giros.",
        ],
      },
      {
        q: "O que acontece se um giro cair em x0.5 ou x1.0? Perco pontos?",
        paragraphs: [
          "O prêmio é calculado como **aposta × multiplicador**: com x1.5 seu saldo de pesquisas sobe 50% do que foi apostado, com x1.1 sobe 10%, com x1.0 fica igual e com x0.5 é descontada a metade do que foi apostado.",
          "Você nunca perde mais do que colocou naquele giro e **nunca fica em dívida**: o giro afeta só os pontos que você apostou. O bônus de boas-vindas e o saldo promocional não são afetados, porque não podem ser apostados.",
          "Cada país tem um **teto de lucro líquido a cada 24 h**: se você o atingir, a roleta avisa e você pode girar de novo quando o teto for liberado.",
        ],
      },
      {
        q: "Quais são as probabilidades e os limites do multiplicador?",
        paragraphs: [
          "**Tabela de probabilidades:** x1.1 = 45% · x1.0 = 30% · x0.5 = 20% · x1.5 = 5%. Cada giro é independente do anterior: as chances não se acumulam nem se \"carregam\" de um giro para outro.",
          "**Limites por país:** Tier 1 (EUA e países principais) pesquisa mínima 500 pts e aposta máxima 1.000 pts por giro; Tier 2 (Espanha) 150 pts e 400 pts; Tier 3 (América Latina e restante) 50 pts e 200 pts.",
          "Também se aplicam um máximo de 4 giros a cada 24 h e um teto de lucro líquido diário. Os valores exatos do seu país estão na roleta, em \"Limites e probabilidades por país\", e o detalhe legal nos Termos e Condições (seção 18).",
        ],
      },
      {
        q: "Quanto vale cada ponto?",
        paragraphs: [
          "**1000 pontos equivalem a 1 USD** (dólar americano). O saldo é expresso e pago em USD para todos os usuários, independentemente do país de residência.",
          "Os pontos disponíveis são os que você já pode sacar; os pontos pendentes estão em processo de validação (por exemplo, tarefas aguardando aprovação do anunciante ou pesquisas em auditoria pelo provedor externo).",
        ],
      },
      {
        q: "Qual é o mínimo de saque?",
        paragraphs: [
          "O valor mínimo é de **5000 pontos (5 USD)** para todos os países. Esse mínimo está sujeito a alterações futuras sem aviso prévio por parte da administração da plataforma.",
        ],
      },
      {
        q: "Quais meios de pagamento posso usar para sacar?",
        paragraphs: [
          "Todos os saques são processados em dólares americanos (USD). Os meios de pagamento disponíveis para todos os usuários, sem distinção de país, são:",
        ],
        bullets: [
          "**Payoneer:** pago no e-mail da sua conta Payoneer. Você deve cadastrar seu e-mail e o nome do titular na aba \"Saques\".",
          "**Airtm:** pago no e-mail da sua conta Airtm. Você deve cadastrar seu e-mail e o nome do titular.",
          "**PayPal:** pago no e-mail da sua conta PayPal. **O PayPal cobra uma comissão padrão por receber pagamentos internacionais** (aprox. 4,49% + tarifa fixa, variável conforme o país recebedor). Consulte as comissões vigentes em paypal.com/fees antes de escolher esse método.",
        ],
        closing: [
          "A plataforma poderá habilitar, alterar ou desabilitar meios de pagamento no futuro. Os canais oficiais de distribuição de pagamentos serão comunicados pelo app e nesta página de perguntas frequentes.",
        ],
      },
      {
        q: "Quando acontecem o corte e o pagamento?",
        paragraphs: [
          "O corte de faturamento é feito de forma **automática toda quinta-feira às 16h (horário da Argentina)**. Se seu saldo disponível superar o mínimo exigido naquele momento, ele passa automaticamente para o estado \"Pagamento em Processo\". Os pagamentos correspondentes são **processados e enviados todas as sextas-feiras** pelo método atribuído ao seu país.",
        ],
      },
      {
        q: "E se houver atraso no crédito do meu pagamento?",
        paragraphs: [
          "Pode haver atrasos no crédito dos fundos, pois dependemos inteiramente das normas, revisões e prazos de processamento de plataformas de terceiros (Payoneer, Airtm e PayPal). Em caso de atraso, a plataforma notificará imediatamente a comunidade, indicando o método afetado. A plataforma isenta-se de toda responsabilidade legal por atrasos externos originados nos provedores de pagamento ou em seus processos de auditoria.",
        ],
      },
      {
        q: "O que faço se completei uma pesquisa ou tarefa e não recebi meus pontos?",
        paragraphs: [
          "A plataforma **não é responsável por pontos, créditos ou recompensas não concedidos** após completar pesquisas, downloads de aplicativos, cadastros ou tarefas. Esses módulos pertencem a provedores externos, e são eles que auditam, validam e aprovam de forma exclusiva o cumprimento correto de cada ação. Em caso de problema, você deve reclamar diretamente aos provedores pelos seguintes canais oficiais incluídos no app:",
          "**CPX Research (Pesquisas e Tarefas):** se uma pesquisa concluída com sucesso não creditou seus pontos, abra o menu de três linhas da seção de ofertas, vá à opção \"Help\" (Ajuda) e abra um ticket de suporte. Você também pode contatá-los pelo site oficial [cpx-research.com](https://www.cpx-research.com/) ou pelo e-mail [hello@cpx-research.com](mailto:hello@cpx-research.com).",
          "**TimeWall (Mural de Ofertas e Microtarefas):** se você completou uma oferta do mural do TimeWall e não recebeu seus pontos, abra um ticket de suporte no menu dentro do mural de ofertas ou contate o TimeWall na página oficial de suporte [timewall.io/contactus](https://timewall.io/contactus).",
          "**Monetag (Instalações de Apps, Jogos e Ofertas):** se você cumpriu todos os requisitos de uma tarefa e não recebeu seus pontos, abra o menu da oferta dentro do nosso site, clique na opção \"Status / Report an Issue\" da Monetag ou contate diretamente a central de ajuda. Você também pode escrever para os e-mails oficiais de suporte técnico: [support@monetag.com](mailto:support@monetag.com) ou [contact.us@monetag.com](mailto:contact.us@monetag.com).",
          "**TheoremReach (Pesquisas premium):** se você completou uma pesquisa do mural do TheoremReach e não recebeu seus pontos, abra um ticket de suporte no menu dentro do mural ou escreva para o e-mail oficial de usuários [support@theoremreach.com](mailto:support@theoremreach.com). Você também pode usar o formulário: [info.theoremreach.com/contact](https://info.theoremreach.com/contact/).",
          "**CPAGrip (Apps, Jogos e Ofertas):** se você baixou um app ou completou uma oferta da CPAGrip e não recebeu seus pontos, abra o menu da oferta dentro do mural e procure a opção de suporte, ou contate a CPAGrip pelo site oficial [cpagrip.com](https://www.cpagrip.com).",
          "**RapidoReach (Pesquisas e Ofertas):** se você completou uma pesquisa ou oferta do mural do RapidoReach e não recebeu seus pontos, aguarde o prazo de crédito indicado pelo provedor e, se o problema continuar, abra um ticket no menu de suporte do próprio mural ou escreva para [support@rapidoreach.com](mailto:support@rapidoreach.com). Formulário oficial: [rapidoreach.com/contactus](https://www.rapidoreach.com/contactus).",
        ],
      },
      {
        q: "Posso usar VPN ou mudar minha localização?",
        paragraphs: [
          "**Não.** O uso de VPN, proxies ou qualquer ferramenta destinada a ocultar, simular ou alterar sua localização geográfica real é **estritamente proibido**.",
          "Essa proibição é um requisito obrigatório dos provedores externos de ofertas e pesquisas (CPX Research, TimeWall, RapidoReach, Monetag e outros). O uso de VPN pode provocar o cancelamento da conta da Plataforma junto aos provedores, afetando toda a comunidade.",
          "A plataforma conta com sistemas de detecção de VPN e proxies. As contas que infringirem essa regra serão **eliminadas de forma permanente, mesmo que contenham fundos ou pontos acumulados, e sem aviso prévio**. A perda dos saldos não será reembolsável nem reclamável sob nenhuma hipótese.",
        ],
      },
      {
        q: "Como saco meus ganhos?",
        paragraphs: [
          "Na aba \"Saques\", salve seus dados de recebimento (Payoneer, Airtm ou PayPal). O sistema processa seu saldo automaticamente toda quinta-feira às 16h (horário da Argentina) se você superar o mínimo exigido. O pagamento é enviado na sexta-feira seguinte. Você não precisa solicitar o saque manualmente.",
        ],
      },
      {
        q: "Como funciona o sistema de indicações?",
        paragraphs: [
          "Cada usuário tem um código de indicação único. Compartilhe com seus contatos: quando alguém se cadastra usando seu código, você passa a ser o patrocinador e recebe uma **comissão de 10%** sobre os pontos que ele ganhar ao completar microtarefas válidas. A comissão é creditada automaticamente e somada ao seu saldo. A comissão não se aplica a bônus de boas-vindas nem saldo promocional; apenas a microtarefas concluídas. Se a tarefa do indicado for rejeitada ou revertida, a comissão também é revertida.",
        ],
      },
      {
        q: "O que é o bônus de boas-vindas?",
        paragraphs: [
          "Ao se cadastrar você recebe automaticamente **500 pontos ($0,50 USD)** de bônus de boas-vindas. Esse bônus é creditado uma única vez e você pode usá-lo para sacar ou para criar campanhas como anunciante. Se criar uma campanha, o saldo bônus é consumido primeiro e é **isento da comissão de 30%** da plataforma. O bônus é revogável se for detectada fraude ou conta múltipla. **Não pode ser apostado na roleta Multiplicador:** ali só se jogam pontos ganhos em pesquisas.",
        ],
      },
      {
        q: "O que é o saldo promocional?",
        paragraphs: [
          "O saldo promocional é um crédito de presente que a plataforma pode creditar por promoções ou compensações especiais. Diferente do saldo disponível, o saldo promocional **não é sacável** e só pode ser usado para criar campanhas dentro da plataforma. Ao usá-lo para financiar uma campanha, aplica-se a comissão de 30%. Pode ter data de validade, que será comunicada por meio de um aviso do sistema.",
        ],
      },
      {
        q: "E se minha tarefa for rejeitada?",
        paragraphs: [
          "Se um anunciante rejeitar sua prova de tarefa, você tem **24 horas** para abrir uma disputa explicando por que considera a rejeição injustificada. Nossa equipe administrativa revisa a disputa e decide a favor do usuário ou do anunciante.",
        ],
      },
      {
        q: "E se o anunciante não revisar minha tarefa?",
        paragraphs: [
          "Se uma tarefa ficar mais de **48 horas** sem revisão do anunciante, o sistema a aprova automaticamente e os pontos são creditados ao seu saldo.",
        ],
      },
      {
        q: "Sou anunciante, como publico uma campanha?",
        paragraphs: [
          "Na seção \"Anunciar Aqui\", preencha os dados da sua campanha (título, link, pontos por visita, quantidade de visitas). O sistema calcula o custo total incluindo uma comissão de 30% da plataforma. Você realiza o pagamento por Payoneer, Airtm ou PayPal e, depois que o administrador aprovar o pagamento, a campanha fica ativa para os usuários realizarem.",
        ],
      },
      {
        q: "Como reviso as provas dos usuários?",
        paragraphs: [
          "Se você é anunciante, acesse a aba \"Anunciante\" no menu inferior. Lá você verá todas as provas pendentes das suas campanhas, com a captura de tela e o texto da prova. Você pode aprovar ou rejeitar cada envio. Lembre-se de que as provas não revisadas em 48 horas são aprovadas automaticamente.",
        ],
      },
      {
        q: "Posso ter várias contas?",
        paragraphs: [
          "Não. Cada pessoa pode ter apenas uma conta. A criação de contas múltiplas para manipular o sistema de indicações ou inflar ganhos é proibida e resulta na suspensão permanente de todas as contas envolvidas.",
        ],
      },
      {
        q: "De quais países posso usar o LatamBucks?",
        paragraphs: [
          "O LatamBucks está disponível para usuários da América Latina e do resto do mundo. Ao se cadastrar, você seleciona seu país de residência. A disponibilidade de pesquisas e tarefas pode variar conforme o país.",
        ],
      },
      {
        q: "Como falo com o suporte?",
        paragraphs: [
          "Para dúvidas sobre sua conta, saques ou disputas, escreva para [latambucks@gmail.com](mailto:latambucks@gmail.com). Nossa equipe responde em horário comercial.",
        ],
      },
    ],
  },
};
