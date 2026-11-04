import React from "react";
import AuthScreen from "@/components/latambucks/AuthScreen";

// Registro propio contra Supabase Auth (POST /auth/v1/signup) + creación del
// perfil y del código de referido. Usa la misma pantalla del sitio.
export default function Register() {
  return <AuthScreen initialMode="registro" />;
}