import React from "react";
import AuthScreen from "@/components/latambucks/AuthScreen";

// Envío del correo de recuperación vía Supabase Auth (POST /auth/v1/recover),
// con redirección al alta de nueva contraseña.
export default function ForgotPassword() {
  return <AuthScreen initialMode="recuperar" />;
}