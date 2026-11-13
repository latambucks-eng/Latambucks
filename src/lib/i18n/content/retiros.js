// Textos del canje de retiros (tarjetas fijas de PayPal y Binance).
// Mismo patrón que guia.js / multiplicar.js: cada idioma es un objeto y el
// componente elige por `lang`; si falta un idioma, cae a español.

export const RETIROS = {
  es: {
    title: "Canjeá tus puntos",
    sub: "Elegí una tarjeta fija y pedí tu retiro. Los pedidos hechos antes del jueves 16:00 se pagan el viernes.",
    metodo: "Método de cobro",
    monto: "Elegí el monto",
    paypal: "PayPal",
    binance: "Binance USDT",
    paypalCampo: "Correo de tu cuenta PayPal",
    paypalPh: "tucorreo@email.com",
    binanceCampo: "Binance ID (UID) o correo vinculado",
    binancePh: "123456789 o tucorreo@email.com",
    titular: "Nombre del titular de la cuenta PayPal",
    titularPh: "Nombre Apellido",
    canjear: "Canjear {usd} USD",
    procesando: "Procesando…",
    ok: "¡Listo! Pediste {usd} USD por {metodo}. Queda pendiente hasta el pago del viernes.",
    minTier: "Tu mínimo es {min} pts ({usd} USD).",
    saldoEncuestas: "Saldo de encuestas",
    bonoNota: "Podés usar hasta 500 pts del bono de bienvenida. El resto tiene que venir de encuestas o de la ruleta.",
    disponibleTxt: "Disponible: {pts} pts",
    falta: "Te faltan {pts} pts para esta tarjeta",
    sinMonto: "Elegí un monto para continuar.",
    err: {
      no_auth: "Tu sesión venció. Volvé a iniciar sesión.",
      sin_perfil: "No encontramos tu perfil. Recargá la página.",
      metodo_invalido: "Ese método de cobro no está disponible.",
      monto_invalido: "Ese monto no es válido para este método.",
      datos_requeridos: "Completá los datos de la cuenta donde querés cobrar.",
      titular_requerido: "Escribí el nombre del titular de la cuenta PayPal.",
      cuenta_bloqueada: "Tu cuenta está bloqueada. Escribinos por soporte para revisarla.",
      retener_pagos: "Tenés los pagos retenidos. Desactivá la opción de abajo para poder canjear.",
      minimo_tier: "El mínimo para tu país es {min} pts.",
      pais_no_coincide: "Bloqueamos el retiro: el país detectado no coincide con el país de tu perfil. Revisá el aviso y escribinos por soporte.",
      saldo_insuficiente: "No tenés saldo disponible suficiente para esa tarjeta.",
      bono_protegido: "El bono de bienvenida no se puede retirar solo: necesitás ganar al menos {falta} pts más en encuestas o en la ruleta.",
      default: "No se pudo completar el canje. Probá de nuevo.",
    },
    historial: { paypal: "PayPal", binance: "Binance USDT" },
  },
  en: {
    title: "Cash out your points",
    sub: "Pick a fixed card and request your withdrawal. Requests made before Thursday 16:00 are paid on Friday.",
    metodo: "Payout method",
    monto: "Choose the amount",
    paypal: "PayPal",
    binance: "Binance USDT",
    paypalCampo: "Your PayPal account email",
    paypalPh: "you@email.com",
    binanceCampo: "Binance ID (UID) or linked email",
    binancePh: "123456789 or you@email.com",
    titular: "PayPal account holder name",
    titularPh: "First Last",
    canjear: "Redeem {usd} USD",
    procesando: "Processing…",
    ok: "Done! You requested {usd} USD via {metodo}. It stays pending until Friday's payout.",
    minTier: "Your minimum is {min} pts ({usd} USD).",
    saldoEncuestas: "Survey balance",
    bonoNota: "You can use up to 500 pts of the welcome bonus. The rest must come from surveys or the wheel.",
    disponibleTxt: "Available: {pts} pts",
    falta: "You need {pts} more pts for this card",
    sinMonto: "Choose an amount to continue.",
    err: {
      no_auth: "Your session expired. Please sign in again.",
      sin_perfil: "We couldn't find your profile. Reload the page.",
      metodo_invalido: "That payout method isn't available.",
      monto_invalido: "That amount isn't valid for this method.",
      datos_requeridos: "Fill in the account details you want to be paid to.",
      titular_requerido: "Enter the PayPal account holder name.",
      cuenta_bloqueada: "Your account is blocked. Contact support to review it.",
      retener_pagos: "Your payments are on hold. Turn off the option below to redeem.",
      minimo_tier: "The minimum for your country is {min} pts.",
      pais_no_coincide: "We blocked the withdrawal: the detected country doesn't match your profile country. Check the notice and contact support.",
      saldo_insuficiente: "You don't have enough available balance for that card.",
      bono_protegido: "The welcome bonus can't be withdrawn on its own: you need at least {falta} more pts from surveys or the wheel.",
      default: "The redemption couldn't be completed. Try again.",
    },
    historial: { paypal: "PayPal", binance: "Binance USDT" },
  },
  pt: {
    title: "Troque seus pontos",
    sub: "Escolha um cartão fixo e solicite seu saque. Pedidos feitos antes de quinta às 16:00 são pagos na sexta.",
    metodo: "Método de recebimento",
    monto: "Escolha o valor",
    paypal: "PayPal",
    binance: "Binance USDT",
    paypalCampo: "E-mail da sua conta PayPal",
    paypalPh: "seuemail@email.com",
    binanceCampo: "Binance ID (UID) ou e-mail vinculado",
    binancePh: "123456789 ou seuemail@email.com",
    titular: "Nome do titular da conta PayPal",
    titularPh: "Nome Sobrenome",
    canjear: "Trocar {usd} USD",
    procesando: "Processando…",
    ok: "Pronto! Você pediu {usd} USD via {metodo}. Fica pendente até o pagamento de sexta.",
    minTier: "Seu mínimo é {min} pts ({usd} USD).",
    saldoEncuestas: "Saldo de pesquisas",
    bonoNota: "Você pode usar até 500 pts do bônus de boas-vindas. O resto precisa vir de pesquisas ou da roleta.",
    disponibleTxt: "Disponível: {pts} pts",
    falta: "Faltam {pts} pts para este cartão",
    sinMonto: "Escolha um valor para continuar.",
    err: {
      no_auth: "Sua sessão expirou. Entre novamente.",
      sin_perfil: "Não encontramos seu perfil. Recarregue a página.",
      metodo_invalido: "Esse método de recebimento não está disponível.",
      monto_invalido: "Esse valor não é válido para este método.",
      datos_requeridos: "Preencha os dados da conta onde quer receber.",
      titular_requerido: "Informe o nome do titular da conta PayPal.",
      cuenta_bloqueada: "Sua conta está bloqueada. Fale com o suporte para revisá-la.",
      retener_pagos: "Seus pagamentos estão retidos. Desative a opção abaixo para trocar.",
      minimo_tier: "O mínimo para o seu país é {min} pts.",
      pais_no_coincide: "Bloqueamos o saque: o país detectado não corresponde ao país do seu perfil. Veja o aviso e fale com o suporte.",
      saldo_insuficiente: "Você não tem saldo disponível suficiente para esse cartão.",
      bono_protegido: "O bônus de boas-vindas não pode ser sacado sozinho: você precisa ganhar pelo menos {falta} pts em pesquisas ou na roleta.",
      default: "Não foi possível concluir a troca. Tente novamente.",
    },
    historial: { paypal: "PayPal", binance: "Binance USDT" },
  },
};

export function fillRetiros(text, vars) {
  if (!text || !vars) return text || "";
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(String(value)),
    text
  );
}

export const RETIRO_TIER1 = ["US", "CA", "GB", "DE", "AU", "FR", "IT", "NL", "SE", "CH", "NO", "DK"];
export const RETIRO_MONTOS_PAYPAL = [5000, 10000, 20000, 25000, 50000, 100000];
export const RETIRO_MONTOS_BINANCE = [3000, 5000, 10000, 20000, 50000, 100000];

// Mínimo en puntos según el país detectado (ISO) y el método elegido.
export function minRetiro(iso, metodo) {
  const code = String(iso || "").toUpperCase();
  if (RETIRO_TIER1.includes(code)) return 5000;
  return metodo === "binance" ? 3000 : 5000;
}
