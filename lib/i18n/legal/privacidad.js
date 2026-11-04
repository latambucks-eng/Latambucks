// Texto legal: Política de Privacidad (español, inglés y portugués).

export default {
  es: {
    title: "Política de Privacidad",
    subtitle: "Cómo LatamBucks recopila, usa y protege tus datos personales.",
    updated: "Última actualización: octubre 2026",
    sections: [
      {
        title: "1. Introducción",
        paragraphs: [
          "LatamBucks (\"la Plataforma\", \"nosotros\") es una plataforma de microtareas que permite a usuarios de Latinoamérica ganar recompensas completando tareas, encuestas, viendo videos patrocinados y participando en muros de ofertas de proveedores externos. Esta Política de Privacidad describe qué datos recopilamos, cómo los usamos, con quién los compartimos y qué derechos tenés sobre tu información.",
          "Al registrarte y usar la Plataforma, aceptás las prácticas descritas en esta política. Si no estás de acuerdo, no debés utilizar la Plataforma.",
          "Esta política complementa los Términos y Condiciones y las Normas de la Comunidad, que también forman parte del marco legal de la Plataforma.",
        ],
      },
      {
        title: "2. Responsable del tratamiento de datos",
        paragraphs: [
          "El responsable de la recopilación y tratamiento de los datos personales en la Plataforma es LatamBucks, operado desde Argentina. Para ejercer tus derechos sobre tus datos personales, podés contactarnos a través del **canal oficial de soporte dentro de la plataforma**.",
        ],
      },
      {
        title: "3. Datos que recopilamos",
        paragraphs: [
          "**Datos de cuenta:** al registrarte recopilamos tu correo electrónico, nombre de usuario, país de residencia y contraseña (almacenada de forma cifrada, nunca en texto plano).",
          "**Datos de perfil:** código de referido (si fuiste invitado por otro usuario), saldo disponible, saldo pendiente, puntos por referidos e historial de actividad (tareas completadas, videos vistos, encuestas respondidas).",
          "**Datos de retiro:** cuando solicitás un retiro, recopilamos el correo electrónico de tu cuenta de Payoneer (u otro medio de pago habilitado) para procesar el pago.",
          "**Datos técnicos:** dirección IP, tipo de navegador, sistema operativo, dispositivo y datos de sesión. Estos datos se usan para seguridad, prevención de fraude y cumplimiento de las políticas de los proveedores externos.",
          "**Datos de actividad:** registro de tareas completadas, postbacks recibidos de proveedores externos, disputas abiertas y comunicaciones con soporte.",
          "**Capturas de pantalla:** cuando subís una prueba de tarea local, la imagen se almacena en un bucket privado de Supabase y solo es accesible por el anunciante correspondiente y el equipo de administración.",
        ],
      },
      {
        title: "4. Finalidad del tratamiento",
        paragraphs: ["Usamos tus datos personales para:"],
        bullets: [
          "Crear y mantener tu cuenta de usuario.",
          "Acreditar puntos y procesar retiros de fondos.",
          "Gestionar el sistema de referidos y comisiones (10% al patrocinador).",
          "Verificar tu identidad y prevenir fraude, cuentas múltiples y uso de VPN.",
          "Comunicarnos contigo sobre tu cuenta, retiros, disputas y avisos del sistema.",
          "Cumplir con las políticas de los proveedores externos de ofertas y encuestas.",
          "Mejorar la Plataforma, detectar errores y prevenir abusos.",
          "Medir el rendimiento de campañas publicitarias y optimizar la adquisición de usuarios.",
        ],
      },
      {
        title: "5. Proveedores externos de ofertas y encuestas",
        paragraphs: [
          "La Plataforma integra muros de ofertas y encuestas de proveedores externos, entre ellos **CPX Research**, **TimeWall**, **TheoremReach**, **CPAGrip**, **RapidoReach** y **Monetag** (videos patrocinados), así como cualquier otro proveedor que se incorpore en el futuro.",
          "Cuando abrís una oferta o encuesta de un proveedor externo, tu **ID de usuario** (UUID interno) y, en algunos casos, tu correo electrónico, se comparten con ese proveedor para vincular la recompensa con tu cuenta. El proveedor puede recopilar datos adicionales de forma independiente (datos demográficos, respuestas de encuestas, comportamiento en su plataforma), los cuales se rigen por su propia política de privacidad.",
          "LatamBucks **no es responsable** del tratamiento que los proveedores externos hagan de los datos que recopilen directamente. Te recomendamos revisar las políticas de privacidad de cada proveedor antes de participar en sus ofertas.",
          "Los proveedores externos envían notificaciones automáticas (postbacks) a la Plataforma para confirmar que completaste una oferta. Estos postbacks contienen tu ID de usuario, el ID de transacción y la cantidad de puntos a acreditar, y se validan mediante firmas criptográficas (MD5 o SHA-256) para garantizar su autenticidad.",
        ],
      },
      {
        title: "6. Base de datos y almacenamiento",
        paragraphs: [
          "Los datos de la Plataforma se almacenan en **Supabase**, un proveedor de infraestructura en la nube. La información de tu cuenta, perfil, saldo e historial se guarda en bases de datos protegidas con Row-Level Security (RLS), que asegura que cada usuario solo pueda acceder a sus propios datos.",
          "Las capturas de pantalla de pruebas de tareas se almacenan en un bucket privado con acceso restringido mediante políticas RLS: solo el anunciante de la campaña correspondiente y los administradores pueden verlas.",
          "Las operaciones sensibles (acreditación de saldo, comisiones de referidos, reversiones de puntos) se ejecutan exclusivamente mediante funciones de backend con credenciales de servicio (service_role), nunca desde el cliente, para garantizar la integridad de los datos.",
        ],
      },
      {
        title: "7. Cookies y almacenamiento local",
        paragraphs: [
          "La Plataforma utiliza cookies y almacenamiento local del navegador (localStorage) para:",
        ],
        bullets: [
          "Mantener tu sesión iniciada entre visitas.",
          "Recordar preferencias de interfaz y pestaña activa.",
          "Prevenir el disparo duplicado de eventos de conversión publicitaria.",
        ],
        closing: [
          "No utilizamos cookies de terceros con fines de seguimiento publicitario más allá de la medición de conversiones de Google Ads (ver sección 9).",
          "Podés borrar las cookies y el almacenamiento local desde la configuración de tu navegador en cualquier momento; esto requerirá que vuelvas a iniciar sesión.",
        ],
      },
      {
        title: "8. Compartir datos con terceros",
        paragraphs: [
          "No vendemos ni alquilamos tus datos personales. Compartimos información con terceros únicamente en los siguientes casos:",
        ],
        bullets: [
          "**Proveedores externos de ofertas:** tu ID de usuario y, según el proveedor, tu correo electrónico, para vincular recompensas (ver sección 5).",
          "**Procesadores de pago:** el correo electrónico de tu cuenta de Payoneer u otro medio habilitado, exclusivamente para procesar retiros solicitados por vos.",
          "**Infraestructura:** Supabase (base de datos y almacenamiento de archivos) y el proveedor de hosting de la Plataforma, necesarios para el funcionamiento del servicio.",
          "**Canal de WhatsApp:** unirte al canal oficial es voluntario. WhatsApp (Meta) procesa los datos de tu cuenta de mensajería bajo su propia política de privacidad; los administradores del canal no acceden a tu número de teléfono.",
          "**Cumplimiento legal:** cuando sea requerido por autoridad competente o para prevenir fraude, abuso o actividad ilegal.",
        ],
      },
      {
        title: "9. Publicidad y medición de conversiones",
        paragraphs: [
          "La Plataforma utiliza **Google Ads** para promocionar la app y medir la efectividad de las campañas publicitarias. Google puede registrar conversiones cuando un usuario se registra (SIGNUP) o envía un formulario de contacto (CONTACT).",
          "Para evitar el doble conteo, la Plataforma usa un identificador único por usuario almacenado en localStorage. La verificación de si una cuenta es nueva (creada en las últimas 24 horas) se realiza en el servidor.",
          "Google procesa estos datos según su propia política de privacidad. Podés obtener más información en [policies.google.com/privacy](https://policies.google.com/privacy).",
        ],
      },
      {
        title: "10. Seguridad de los datos",
        paragraphs: ["Implementamos medidas técnicas y organizativas para proteger tus datos:"],
        bullets: [
          "Contraseñas almacenadas con cifrado unidireccional (hash).",
          "Row-Level Security (RLS) en todas las tablas de la base de datos.",
          "Credenciales de servicio (service_role) nunca expuestas al cliente.",
          "Postbacks de proveedores validados con firmas criptográficas (MD5/SHA-256).",
          "Filtros de IP para endpoints de postback de proveedores externos.",
          "Funciones backend para operaciones privilegiadas (acreditación, reversiones, retiros).",
        ],
        closing: [
          "Ningún sistema es 100% seguro. Si detectás una vulnerabilidad, te pedimos que la reportés a través del canal de soporte en lugar de aprovecharla.",
        ],
      },
      {
        title: "11. Retención de datos",
        paragraphs: [
          "Conservamos tus datos mientras tu cuenta esté activa. Si tu cuenta es suspendida por fraude o infracción a las normas, los datos se conservan por el tiempo necesario para resolver disputas pendientes y cumplir con obligaciones legales.",
          "El historial de tareas, postbacks y auditoría se conserva de forma indefinida para prevenir fraude recurrente y mantener la trazabilidad de las transacciones.",
          "Las capturas de pantalla de pruebas pueden eliminarse una vez que la tarea es aprobada o rechazada definitivamente, salvo en casos de disputa o investigación de fraude.",
        ],
      },
      {
        title: "12. Privacidad de menores",
        paragraphs: [
          "La Plataforma está dirigida exclusivamente a personas **mayores de 18 años**. No recopilamos deliberadamente datos de menores de edad. Si creés que un menor nos proporcionó datos sin consentimiento parental, contactános a través del canal de soporte para proceder a la eliminación de la cuenta.",
        ],
      },
      {
        title: "13. Transferencias internacionales",
        paragraphs: [
          "Tus datos pueden ser procesados y almacenados en servidores ubicados fuera de Argentina y Latinoamérica, incluyendo Estados Unidos y la Unión Europea, donde se encuentran los proveedores de infraestructura (Supabase) y los proveedores externos de ofertas. Al usar la Plataforma, aceptás que tus datos sean transferidos y procesados en estas jurisdicciones, sujetos a las medidas de seguridad descritas en esta política.",
        ],
      },
      {
        title: "14. Tus derechos",
        paragraphs: ["Tenés los siguientes derechos sobre tus datos personales:"],
        bullets: [
          "**Acceso:** solicitar una copia de los datos que tenemos sobre vos.",
          "**Rectificación:** corregir datos inexactos o desactualizados.",
          "**Eliminación:** solicitar la baja de tu cuenta y la eliminación de tus datos, salvo cuando debamos conservarlos por obligaciones legales o prevención de fraude.",
          "**Oposición:** oponerte al tratamiento de tus datos para ciertas finalidades.",
          "**Portabilidad:** recibir tus datos en un formato estructurado y reutilizable.",
        ],
        closing: [
          "Para ejercer estos derechos, contactános a través del **canal oficial de soporte dentro de la plataforma**. Respondemos a las solicitudes en un plazo razonable.",
          "La eliminación de tu cuenta implica la pérdida de los saldos y puntos acumulados que no hayan sido retirados previamente, sin derecho a compensación.",
        ],
      },
      {
        title: "15. Prohibición de VPN y su relación con la privacidad",
        paragraphs: [
          "El uso de VPN, proxies o herramientas de suplantación de ubicación está **estrictamente prohibido**. Esta prohibición no solo protege a la Plataforma, sino que es necesaria para cumplir con las políticas de los proveedores externos, que requieren que los datos demográficos y de ubicación sean veraces.",
          "La detección de uso de VPN puede implicar el análisis de tu dirección IP y patrones de conexión. Esta información se usa exclusivamente para prevenir fraude y no se comparte con terceros, salvo cuando un proveedor externo requiera confirmar el cumplimiento de sus políticas.",
        ],
      },
      {
        title: "16. Cambios a esta política",
        paragraphs: [
          "Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas, en la legislación aplicable o en los servicios de proveedores externos. Te notificaremos sobre cambios significativos a través de un aviso del sistema dentro de la Plataforma.",
          "La fecha de la última actualización se indica al final de este documento. Te recomendamos revisar esta política periódicamente.",
        ],
      },
      {
        title: "17. Contacto",
        paragraphs: [
          "Si tenés preguntas sobre esta Política de Privacidad o sobre el tratamiento de tus datos personales, podés contactarnos a través del **canal oficial de soporte dentro de la plataforma**. Si tenés problemas para ingresar a tu cuenta, utilizá el enlace \"¿Problemas para ingresar a tu cuenta?\" que se encuentra al pie de esta página.",
        ],
      },
    ],
  },

  en: {
    title: "Privacy Policy",
    subtitle: "How LatamBucks collects, uses and protects your personal data.",
    updated: "Last updated: October 2026",
    sections: [
      {
        title: "1. Introduction",
        paragraphs: [
          "LatamBucks (\"the Platform\", \"we\") is a microtask platform that lets users in Latin America earn rewards by completing tasks, surveys, watching sponsored videos and taking part in offer walls from external providers. This Privacy Policy describes what data we collect, how we use it, who we share it with and what rights you have over your information.",
          "By signing up and using the Platform you accept the practices described in this policy. If you disagree, you must not use the Platform.",
          "This policy complements the Terms & Conditions and the Community Rules, which are also part of the Platform's legal framework.",
        ],
      },
      {
        title: "2. Data controller",
        paragraphs: [
          "The controller of the collection and processing of personal data on the Platform is LatamBucks, operated from Argentina. To exercise your rights over your personal data, you can contact us through the **official support channel inside the platform**.",
        ],
      },
      {
        title: "3. Data we collect",
        paragraphs: [
          "**Account data:** when you sign up we collect your email, username, country of residence and password (stored encrypted, never in plain text).",
          "**Profile data:** referral code (if you were invited by another user), available balance, pending balance, referral points and activity history (tasks completed, videos watched, surveys answered).",
          "**Withdrawal data:** when you request a withdrawal we collect the email of your Payoneer account (or other enabled payment method) to process the payment.",
          "**Technical data:** IP address, browser type, operating system, device and session data. This data is used for security, fraud prevention and compliance with external providers' policies.",
          "**Activity data:** log of completed tasks, postbacks received from external providers, disputes opened and support communications.",
          "**Screenshots:** when you upload a local task proof, the image is stored in a private Supabase bucket and is only accessible to the relevant advertiser and the administration team.",
        ],
      },
      {
        title: "4. Purpose of processing",
        paragraphs: ["We use your personal data to:"],
        bullets: [
          "Create and maintain your user account.",
          "Credit points and process fund withdrawals.",
          "Manage the referral and commission system (10% to the sponsor).",
          "Verify your identity and prevent fraud, multiple accounts and VPN use.",
          "Communicate with you about your account, withdrawals, disputes and system notices.",
          "Comply with the policies of external offer and survey providers.",
          "Improve the Platform, detect errors and prevent abuse.",
          "Measure advertising campaign performance and optimise user acquisition.",
        ],
      },
      {
        title: "5. External offer and survey providers",
        paragraphs: [
          "The Platform integrates offer walls and surveys from external providers, including **CPX Research**, **TimeWall**, **TheoremReach**, **CPAGrip**, **RapidoReach** and **Monetag** (sponsored videos), as well as any other provider added in the future.",
          "When you open an offer or survey from an external provider, your **user ID** (internal UUID) and, in some cases, your email are shared with that provider to link the reward to your account. The provider may independently collect additional data (demographics, survey answers, behaviour on its platform), which is governed by its own privacy policy.",
          "LatamBucks **is not responsible** for how external providers process the data they collect directly. We recommend reviewing each provider's privacy policy before taking part in their offers.",
          "External providers send automatic notifications (postbacks) to the Platform to confirm you completed an offer. These postbacks contain your user ID, the transaction ID and the number of points to credit, and are validated with cryptographic signatures (MD5 or SHA-256) to guarantee their authenticity.",
        ],
      },
      {
        title: "6. Database and storage",
        paragraphs: [
          "The Platform's data is stored on **Supabase**, a cloud infrastructure provider. Your account, profile, balance and history are kept in databases protected with Row-Level Security (RLS), which ensures each user can only access their own data.",
          "Task proof screenshots are stored in a private bucket with access restricted by RLS policies: only the advertiser of the relevant campaign and administrators can view them.",
          "Sensitive operations (crediting balances, referral commissions, point reversals) run exclusively through backend functions with service credentials (service_role), never from the client, to guarantee data integrity.",
        ],
      },
      {
        title: "7. Cookies and local storage",
        paragraphs: [
          "The Platform uses cookies and browser local storage (localStorage) to:",
        ],
        bullets: [
          "Keep you signed in between visits.",
          "Remember interface preferences and the active tab.",
          "Prevent duplicate firing of advertising conversion events.",
        ],
        closing: [
          "We do not use third-party cookies for ad tracking beyond Google Ads conversion measurement (see section 9).",
          "You can delete cookies and local storage from your browser settings at any time; this will require you to sign in again.",
        ],
      },
      {
        title: "8. Sharing data with third parties",
        paragraphs: [
          "We do not sell or rent your personal data. We share information with third parties only in the following cases:",
        ],
        bullets: [
          "**External offer providers:** your user ID and, depending on the provider, your email, to link rewards (see section 5).",
          "**Payment processors:** the email of your Payoneer account or other enabled method, exclusively to process withdrawals you requested.",
          "**Infrastructure:** Supabase (database and file storage) and the Platform's hosting provider, required to run the service.",
          "**WhatsApp channel:** joining the official channel is voluntary. WhatsApp (Meta) processes your messaging account data under its own privacy policy; channel administrators cannot see your phone number.",
          "**Legal compliance:** when required by a competent authority or to prevent fraud, abuse or illegal activity.",
        ],
      },
      {
        title: "9. Advertising and conversion measurement",
        paragraphs: [
          "The Platform uses **Google Ads** to promote the app and measure advertising campaign effectiveness. Google may record conversions when a user signs up (SIGNUP) or submits a contact form (CONTACT).",
          "To avoid double counting, the Platform uses a unique per-user identifier stored in localStorage. Checking whether an account is new (created in the last 24 hours) is done on the server.",
          "Google processes this data under its own privacy policy. More information at [policies.google.com/privacy](https://policies.google.com/privacy).",
        ],
      },
      {
        title: "10. Data security",
        paragraphs: ["We implement technical and organisational measures to protect your data:"],
        bullets: [
          "Passwords stored with one-way encryption (hash).",
          "Row-Level Security (RLS) on every database table.",
          "Service credentials (service_role) never exposed to the client.",
          "Provider postbacks validated with cryptographic signatures (MD5/SHA-256).",
          "IP filters on external providers' postback endpoints.",
          "Backend functions for privileged operations (crediting, reversals, withdrawals).",
        ],
        closing: [
          "No system is 100% secure. If you find a vulnerability, please report it through the support channel instead of exploiting it.",
        ],
      },
      {
        title: "11. Data retention",
        paragraphs: [
          "We keep your data while your account is active. If your account is suspended for fraud or a breach of the rules, data is kept for the time needed to resolve pending disputes and comply with legal obligations.",
          "Task, postback and audit history is kept indefinitely to prevent repeat fraud and keep transactions traceable.",
          "Proof screenshots may be deleted once the task is definitively approved or rejected, except in cases of dispute or fraud investigation.",
        ],
      },
      {
        title: "12. Minors' privacy",
        paragraphs: [
          "The Platform is intended exclusively for people **over 18**. We do not knowingly collect data from minors. If you believe a minor provided us with data without parental consent, contact us through the support channel so we can delete the account.",
        ],
      },
      {
        title: "13. International transfers",
        paragraphs: [
          "Your data may be processed and stored on servers located outside Argentina and Latin America, including the United States and the European Union, where the infrastructure provider (Supabase) and external offer providers are located. By using the Platform you accept that your data is transferred and processed in these jurisdictions, subject to the security measures described in this policy.",
        ],
      },
      {
        title: "14. Your rights",
        paragraphs: ["You have the following rights over your personal data:"],
        bullets: [
          "**Access:** request a copy of the data we hold about you.",
          "**Rectification:** correct inaccurate or outdated data.",
          "**Erasure:** request closing your account and deleting your data, except where we must keep it for legal obligations or fraud prevention.",
          "**Objection:** object to the processing of your data for certain purposes.",
          "**Portability:** receive your data in a structured, reusable format.",
        ],
        closing: [
          "To exercise these rights, contact us through the **official support channel inside the platform**. We answer requests within a reasonable period.",
          "Deleting your account means losing balances and accumulated points not previously withdrawn, with no right to compensation.",
        ],
      },
      {
        title: "15. VPN ban and its link to privacy",
        paragraphs: [
          "Using VPNs, proxies or location-spoofing tools is **strictly forbidden**. This ban not only protects the Platform but is necessary to comply with external providers' policies, which require truthful demographic and location data.",
          "Detecting VPN use may involve analysing your IP address and connection patterns. This information is used exclusively to prevent fraud and is not shared with third parties, except where an external provider requires confirmation of policy compliance.",
        ],
      },
      {
        title: "16. Changes to this policy",
        paragraphs: [
          "We may update this Privacy Policy to reflect changes in our practices, applicable law or external providers' services. We will notify you of significant changes through a system notice inside the Platform.",
          "The last update date is shown at the end of this document. We recommend reviewing this policy periodically.",
        ],
      },
      {
        title: "17. Contact",
        paragraphs: [
          "If you have questions about this Privacy Policy or the processing of your personal data, you can contact us through the **official support channel inside the platform**. If you have trouble signing in to your account, use the \"Trouble signing in to your account?\" link at the bottom of this page.",
        ],
      },
    ],
  },

  pt: {
    title: "Política de Privacidade",
    subtitle: "Como o LatamBucks coleta, usa e protege seus dados pessoais.",
    updated: "Última atualização: outubro de 2026",
    sections: [
      {
        title: "1. Introdução",
        paragraphs: [
          "O LatamBucks (\"a Plataforma\", \"nós\") é uma plataforma de microtarefas que permite aos usuários da América Latina ganhar recompensas completando tarefas, pesquisas, assistindo a vídeos patrocinados e participando de murais de ofertas de provedores externos. Esta Política de Privacidade descreve quais dados coletamos, como os usamos, com quem os compartilhamos e quais direitos você tem sobre suas informações.",
          "Ao se cadastrar e usar a Plataforma, você aceita as práticas descritas nesta política. Se não concordar, não deve usar a Plataforma.",
          "Esta política complementa os Termos e Condições e as Regras da Comunidade, que também fazem parte do marco legal da Plataforma.",
        ],
      },
      {
        title: "2. Responsável pelo tratamento dos dados",
        paragraphs: [
          "O responsável pela coleta e tratamento dos dados pessoais na Plataforma é o LatamBucks, operado a partir da Argentina. Para exercer seus direitos sobre seus dados pessoais, você pode nos contatar pelo **canal oficial de suporte dentro da plataforma**.",
        ],
      },
      {
        title: "3. Dados que coletamos",
        paragraphs: [
          "**Dados de conta:** ao se cadastrar coletamos seu e-mail, nome de usuário, país de residência e senha (armazenada de forma criptografada, nunca em texto simples).",
          "**Dados de perfil:** código de indicação (se você foi convidado por outro usuário), saldo disponível, saldo pendente, pontos por indicações e histórico de atividade (tarefas concluídas, vídeos assistidos, pesquisas respondidas).",
          "**Dados de saque:** quando você solicita um saque, coletamos o e-mail da sua conta Payoneer (ou outro meio de pagamento habilitado) para processar o pagamento.",
          "**Dados técnicos:** endereço IP, tipo de navegador, sistema operacional, dispositivo e dados de sessão. Esses dados são usados para segurança, prevenção de fraude e cumprimento das políticas dos provedores externos.",
          "**Dados de atividade:** registro de tarefas concluídas, postbacks recebidos de provedores externos, disputas abertas e comunicações com o suporte.",
          "**Capturas de tela:** quando você envia uma prova de tarefa local, a imagem é armazenada em um bucket privado do Supabase e só é acessível pelo anunciante correspondente e pela equipe de administração.",
        ],
      },
      {
        title: "4. Finalidade do tratamento",
        paragraphs: ["Usamos seus dados pessoais para:"],
        bullets: [
          "Criar e manter sua conta de usuário.",
          "Creditar pontos e processar saques de fundos.",
          "Gerenciar o sistema de indicações e comissões (10% ao patrocinador).",
          "Verificar sua identidade e prevenir fraude, contas múltiplas e uso de VPN.",
          "Comunicar-nos com você sobre sua conta, saques, disputas e avisos do sistema.",
          "Cumprir as políticas dos provedores externos de ofertas e pesquisas.",
          "Melhorar a Plataforma, detectar erros e prevenir abusos.",
          "Medir o desempenho das campanhas publicitárias e otimizar a aquisição de usuários.",
        ],
      },
      {
        title: "5. Provedores externos de ofertas e pesquisas",
        paragraphs: [
          "A Plataforma integra murais de ofertas e pesquisas de provedores externos, entre eles **CPX Research**, **TimeWall**, **TheoremReach**, **CPAGrip**, **RapidoReach** e **Monetag** (vídeos patrocinados), assim como qualquer outro provedor incorporado no futuro.",
          "Quando você abre uma oferta ou pesquisa de um provedor externo, seu **ID de usuário** (UUID interno) e, em alguns casos, seu e-mail são compartilhados com esse provedor para vincular a recompensa à sua conta. O provedor pode coletar dados adicionais de forma independente (dados demográficos, respostas de pesquisas, comportamento na sua plataforma), que são regidos por sua própria política de privacidade.",
          "O LatamBucks **não é responsável** pelo tratamento que os provedores externos fazem dos dados que coletam diretamente. Recomendamos revisar as políticas de privacidade de cada provedor antes de participar das suas ofertas.",
          "Os provedores externos enviam notificações automáticas (postbacks) à Plataforma para confirmar que você completou uma oferta. Esses postbacks contêm seu ID de usuário, o ID da transação e a quantidade de pontos a creditar, e são validados por assinaturas criptográficas (MD5 ou SHA-256) para garantir sua autenticidade.",
        ],
      },
      {
        title: "6. Banco de dados e armazenamento",
        paragraphs: [
          "Os dados da Plataforma são armazenados no **Supabase**, um provedor de infraestrutura em nuvem. As informações da sua conta, perfil, saldo e histórico ficam em bancos de dados protegidos com Row-Level Security (RLS), que garante que cada usuário só possa acessar seus próprios dados.",
          "As capturas de tela das provas de tarefas são armazenadas em um bucket privado com acesso restrito por políticas RLS: apenas o anunciante da campanha correspondente e os administradores podem vê-las.",
          "As operações sensíveis (crédito de saldo, comissões de indicações, reversões de pontos) são executadas exclusivamente por funções de backend com credenciais de serviço (service_role), nunca pelo cliente, para garantir a integridade dos dados.",
        ],
      },
      {
        title: "7. Cookies e armazenamento local",
        paragraphs: [
          "A Plataforma utiliza cookies e armazenamento local do navegador (localStorage) para:",
        ],
        bullets: [
          "Manter sua sessão iniciada entre visitas.",
          "Lembrar preferências de interface e a aba ativa.",
          "Evitar o disparo duplicado de eventos de conversão publicitária.",
        ],
        closing: [
          "Não utilizamos cookies de terceiros para rastreamento publicitário além da medição de conversões do Google Ads (ver seção 9).",
          "Você pode apagar os cookies e o armazenamento local nas configurações do seu navegador a qualquer momento; isso exigirá que você entre novamente.",
        ],
      },
      {
        title: "8. Compartilhamento de dados com terceiros",
        paragraphs: [
          "Não vendemos nem alugamos seus dados pessoais. Compartilhamos informações com terceiros apenas nos seguintes casos:",
        ],
        bullets: [
          "**Provedores externos de ofertas:** seu ID de usuário e, conforme o provedor, seu e-mail, para vincular recompensas (ver seção 5).",
          "**Processadores de pagamento:** o e-mail da sua conta Payoneer ou outro meio habilitado, exclusivamente para processar saques solicitados por você.",
          "**Infraestrutura:** Supabase (banco de dados e armazenamento de arquivos) e o provedor de hospedagem da Plataforma, necessários para o funcionamento do serviço.",
          "**Canal de WhatsApp:** entrar no canal oficial é voluntário. O WhatsApp (Meta) processa os dados da sua conta de mensageria sob sua própria política de privacidade; os administradores do canal não acessam seu número de telefone.",
          "**Cumprimento legal:** quando exigido por autoridade competente ou para prevenir fraude, abuso ou atividade ilegal.",
        ],
      },
      {
        title: "9. Publicidade e medição de conversões",
        paragraphs: [
          "A Plataforma utiliza **Google Ads** para promover o app e medir a eficácia das campanhas publicitárias. O Google pode registrar conversões quando um usuário se cadastra (SIGNUP) ou envia um formulário de contato (CONTACT).",
          "Para evitar a contagem dupla, a Plataforma usa um identificador único por usuário armazenado no localStorage. A verificação de se uma conta é nova (criada nas últimas 24 horas) é feita no servidor.",
          "O Google processa esses dados conforme sua própria política de privacidade. Mais informações em [policies.google.com/privacy](https://policies.google.com/privacy).",
        ],
      },
      {
        title: "10. Segurança dos dados",
        paragraphs: ["Implementamos medidas técnicas e organizacionais para proteger seus dados:"],
        bullets: [
          "Senhas armazenadas com criptografia unidirecional (hash).",
          "Row-Level Security (RLS) em todas as tabelas do banco de dados.",
          "Credenciais de serviço (service_role) nunca expostas ao cliente.",
          "Postbacks de provedores validados com assinaturas criptográficas (MD5/SHA-256).",
          "Filtros de IP nos endpoints de postback dos provedores externos.",
          "Funções de backend para operações privilegiadas (créditos, reversões, saques).",
        ],
        closing: [
          "Nenhum sistema é 100% seguro. Se você detectar uma vulnerabilidade, pedimos que a reporte pelo canal de suporte em vez de aproveitá-la.",
        ],
      },
      {
        title: "11. Retenção de dados",
        paragraphs: [
          "Mantemos seus dados enquanto sua conta estiver ativa. Se sua conta for suspensa por fraude ou infração às regras, os dados são mantidos pelo tempo necessário para resolver disputas pendentes e cumprir obrigações legais.",
          "O histórico de tarefas, postbacks e auditoria é mantido indefinidamente para prevenir fraude recorrente e manter a rastreabilidade das transações.",
          "As capturas de tela das provas podem ser eliminadas depois que a tarefa é aprovada ou rejeitada definitivamente, salvo em casos de disputa ou investigação de fraude.",
        ],
      },
      {
        title: "12. Privacidade de menores",
        paragraphs: [
          "A Plataforma é destinada exclusivamente a pessoas **maiores de 18 anos**. Não coletamos deliberadamente dados de menores. Se você acredita que um menor nos forneceu dados sem consentimento dos pais, contate-nos pelo canal de suporte para que possamos excluir a conta.",
        ],
      },
      {
        title: "13. Transferências internacionais",
        paragraphs: [
          "Seus dados podem ser processados e armazenados em servidores localizados fora da Argentina e da América Latina, incluindo Estados Unidos e União Europeia, onde estão os provedores de infraestrutura (Supabase) e os provedores externos de ofertas. Ao usar a Plataforma, você aceita que seus dados sejam transferidos e processados nessas jurisdições, sujeitos às medidas de segurança descritas nesta política.",
        ],
      },
      {
        title: "14. Seus direitos",
        paragraphs: ["Você tem os seguintes direitos sobre seus dados pessoais:"],
        bullets: [
          "**Acesso:** solicitar uma cópia dos dados que temos sobre você.",
          "**Retificação:** corrigir dados inexatos ou desatualizados.",
          "**Exclusão:** solicitar o encerramento da conta e a exclusão dos seus dados, exceto quando devamos mantê-los por obrigações legais ou prevenção de fraude.",
          "**Oposição:** opor-se ao tratamento dos seus dados para certas finalidades.",
          "**Portabilidade:** receber seus dados em formato estruturado e reutilizável.",
        ],
        closing: [
          "Para exercer esses direitos, contate-nos pelo **canal oficial de suporte dentro da plataforma**. Respondemos às solicitações em prazo razoável.",
          "A exclusão da sua conta implica a perda dos saldos e pontos acumulados que não tenham sido sacados anteriormente, sem direito a compensação.",
        ],
      },
      {
        title: "15. Proibição de VPN e sua relação com a privacidade",
        paragraphs: [
          "O uso de VPN, proxies ou ferramentas de falsificação de localização é **estritamente proibido**. Essa proibição não apenas protege a Plataforma, mas é necessária para cumprir as políticas dos provedores externos, que exigem que os dados demográficos e de localização sejam verdadeiros.",
          "A detecção de uso de VPN pode envolver a análise do seu endereço IP e dos padrões de conexão. Essas informações são usadas exclusivamente para prevenir fraude e não são compartilhadas com terceiros, salvo quando um provedor externo exigir confirmação do cumprimento de suas políticas.",
        ],
      },
      {
        title: "16. Alterações desta política",
        paragraphs: [
          "Podemos atualizar esta Política de Privacidade para refletir mudanças em nossas práticas, na legislação aplicável ou nos serviços de provedores externos. Avisaremos sobre mudanças significativas por meio de um aviso do sistema dentro da Plataforma.",
          "A data da última atualização é indicada no final deste documento. Recomendamos revisar esta política periodicamente.",
        ],
      },
      {
        title: "17. Contato",
        paragraphs: [
          "Se tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados pessoais, você pode nos contatar pelo **canal oficial de suporte dentro da plataforma**. Se tiver problemas para entrar na sua conta, use o link \"Problemas para entrar na sua conta?\" no rodapé desta página.",
        ],
      },
    ],
  },
};