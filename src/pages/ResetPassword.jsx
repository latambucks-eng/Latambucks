import React from "react";
import ActualizarClave from "@/pages/ActualizarClave";

// La recuperación de Supabase llega con el token en la URL
// (#access_token=...&type=recovery o ?token_hash=...). ActualizarClave ya
// resuelve ese flujo completo contra Supabase Auth, así que esta ruta lo
// reutiliza en lugar de duplicar la lógica.
export default function ResetPassword() {
  return <ActualizarClave />;
}