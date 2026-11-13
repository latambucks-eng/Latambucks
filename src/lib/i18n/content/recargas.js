// Textos de la recarga de saldo publicitario (cripto + PayPal manual)
// y de la sección de aprobación en el panel de administrador.
export const RECARGAS = {
  es: {
    title: "Recargar saldo publicitario",
    sub: "1 USD = 1.000 pts · Cripto o PayPal",
    tabs: { crypto: "Cripto (NOWPayments)", paypal: "PayPal / Tarjeta" },
    pts: "{n} pts",
    cryptoNote:
      "El saldo se acredita automáticamente cuando se confirma el pago (1-3 confirmaciones de red). El cobro lo procesa NOWPayments.",
    cryptoErr: "No se pudo iniciar el pago. Intentá de nuevo.",
    cryptoOk: "¡Pago recibido! Tu saldo se acredita en unos segundos.",
    paypalIntro: "Elegí el paquete y pagá en PayPal. Acreditamos el saldo al verificar el pago.",
    paypalNotice:
      "Pagá en PayPal y pegá abajo el ID de transacción o el correo con el que pagaste.",
    payBtn: "Pagar ${m} USD en PayPal",
    inputLbl: "Tu correo de LatamBucks o ID de transacción",
    inputPh: "ej: mi@correo.com o 8AB12345CD678901E",
    send: "Confirmar pago enviado",
    sent: "¡Solicitud enviada! Acreditamos tu saldo apenas verifiquemos el pago (normalmente en menos de 24 h).",
    formErr: "Escribí tu correo o ID de transacción para que podamos verificar el pago.",
    err: "No se pudo enviar la solicitud. Intentá de nuevo.",
    admin: {
      title: "Recargas PayPal pendientes",
      empty: "No hay recargas PayPal pendientes.",
      email: "Usuario",
      amount: "Monto",
      points: "Puntos",
      comprobante: "Comprobante declarado",
      approve: "Aprobar y acreditar",
      reject: "Rechazar",
      approved: "Recarga acreditada",
      rejected: "Solicitud rechazada",
      err: "No se pudo procesar la solicitud.",
      loading: "Cargando recargas…",
    },
  },
  en: {
    title: "Top up advertising balance",
    sub: "1 USD = 1,000 pts · Crypto or PayPal",
    tabs: { crypto: "Crypto (NOWPayments)", paypal: "PayPal / Card" },
    pts: "{n} pts",
    cryptoNote:
      "Your balance is credited automatically once the payment is confirmed (1-3 network confirmations). The charge is processed by NOWPayments.",
    cryptoErr: "Could not start the payment. Please try again.",
    cryptoOk: "Payment received! Your balance will be credited in a few seconds.",
    paypalIntro: "Pick a package and pay with PayPal. We credit the balance once the payment is verified.",
    paypalNotice:
      "Pay with PayPal and paste the transaction ID or the email you paid with below.",
    payBtn: "Pay ${m} USD with PayPal",
    inputLbl: "Your LatamBucks email or transaction ID",
    inputPh: "e.g. me@email.com or 8AB12345CD678901E",
    send: "Confirm payment sent",
    sent: "Request sent! We credit your balance as soon as we verify the payment (usually within 24 hours).",
    formErr: "Enter your email or transaction ID so we can verify the payment.",
    err: "Could not send the request. Please try again.",
    admin: {
      title: "Pending PayPal top-ups",
      empty: "No pending PayPal top-ups.",
      email: "User",
      amount: "Amount",
      points: "Points",
      comprobante: "Declared proof",
      approve: "Approve and credit",
      reject: "Reject",
      approved: "Top-up credited",
      rejected: "Request rejected",
      err: "Could not process the request.",
      loading: "Loading top-ups…",
    },
  },
  pt: {
    title: "Recarregar saldo publicitário",
    sub: "1 USD = 1.000 pts · Cripto ou PayPal",
    tabs: { crypto: "Cripto (NOWPayments)", paypal: "PayPal / Cartão" },
    pts: "{n} pts",
    cryptoNote:
      "O saldo é creditado automaticamente quando o pagamento é confirmado (1-3 confirmações de rede). A cobrança é processada pela NOWPayments.",
    cryptoErr: "Não foi possível iniciar o pagamento. Tente novamente.",
    cryptoOk: "Pagamento recebido! Seu saldo será creditado em alguns segundos.",
    paypalIntro: "Escolha o pacote e pague com PayPal. Creditamos o saldo ao verificar o pagamento.",
    paypalNotice:
      "Pague com PayPal e cole abaixo o ID da transação ou o e-mail com o qual pagou.",
    payBtn: "Pagar ${m} USD com PayPal",
    inputLbl: "Seu e-mail do LatamBucks ou ID de transação",
    inputPh: "ex: meu@email.com ou 8AB12345CD678901E",
    send: "Confirmar pagamento enviado",
    sent: "Solicitação enviada! Creditamos seu saldo assim que verificarmos o pagamento (normalmente em menos de 24 h).",
    formErr: "Informe seu e-mail ou ID de transação para que possamos verificar o pagamento.",
    err: "Não foi possível enviar a solicitação. Tente novamente.",
    admin: {
      title: "Recargas PayPal pendentes",
      empty: "Não há recargas PayPal pendentes.",
      email: "Usuário",
      amount: "Valor",
      points: "Pontos",
      comprobante: "Comprovante declarado",
      approve: "Aprovar e creditar",
      reject: "Rejeitar",
      approved: "Recarga creditada",
      rejected: "Solicitação rejeitada",
      err: "Não foi possível processar a solicitação.",
      loading: "Carregando recargas…",
    },
  },
};

// Enlaces oficiales de PayPal Business (NCP) por paquete.
export const PAYPAL_LINKS = {
  5: "https://www.paypal.com/ncp/payment/86SYXCFKGV3FJ",
  10: "https://www.paypal.com/ncp/payment/TFUDJCCNHJ466",
  20: "https://www.paypal.com/ncp/payment/GK6M365TFM5YN",
  50: "https://www.paypal.com/ncp/payment/8HKBLZZ9KKUUJ",
  100: "https://www.paypal.com/ncp/payment/3CQQPAQ8DDK4L",
};

export const PAQUETES_USD = [5, 10, 20, 50, 100];

export function getRecargas(lang) {
  return RECARGAS[lang] || RECARGAS.es;
}
