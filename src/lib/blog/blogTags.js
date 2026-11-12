// ============================================================
//  Etiquetas del blog — clave estable por idioma.
//  La etiqueta visible cambia con el idioma (Estadísticas / Statistics /
//  Estatísticas), pero la clave interna es siempre la misma, así el filtro
//  del blog y la URL (/blog?tag=stats) funcionan en los tres idiomas.
// ============================================================

const TAG_KEYS = {
  // Español
  "Estadísticas": "stats",
  "Comunidad": "community",
  "Estrategia": "strategy",
  "Ingresos": "earnings",
  "Encuestas": "surveys",
  "Principiantes": "beginners",
  "Rutina": "routine",
  "Productividad": "productivity",
  "Retiros": "withdrawals",
  "Pagos": "payments",
  "Seguridad": "security",
  // English
  "Statistics": "stats",
  "Community": "community",
  "Strategy": "strategy",
  "Earnings": "earnings",
  "Surveys": "surveys",
  "Beginners": "beginners",
  "Routine": "routine",
  "Productivity": "productivity",
  "Withdrawals": "withdrawals",
  "Payments": "payments",
  "Security": "security",
  // Português
  "Estatísticas": "stats",
  "Comunidade": "community",
  "Estratégia": "strategy",
  "Ganhos": "earnings",
  "Enquetes": "surveys",
  "Iniciantes": "beginners",
  "Rotina": "routine",
  "Produtividade": "productivity",
  "Saques": "withdrawals",
  "Pagamentos": "payments",
  "Segurança": "security",
};

// Devuelve la clave estable de una etiqueta visible.
export function tagKey(label) {
  const texto = String(label || "").trim();
  if (!texto) return "";
  return TAG_KEYS[texto] || texto.toLowerCase();
}
