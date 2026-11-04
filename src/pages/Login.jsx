import React from "react";
import AuthScreen from "@/components/latambucks/AuthScreen";

// Inicio de sesión propio contra Supabase Auth (POST /auth/v1/token).
// Reutiliza la pantalla de acceso del sitio para no duplicar la lógica de
// sesión, el refresco de token ni el estado de carga.
export default function Login() {
  return <AuthScreen initialMode="login" />;
}