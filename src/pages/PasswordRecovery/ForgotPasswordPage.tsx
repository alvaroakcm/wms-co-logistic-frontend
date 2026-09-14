import { useState, type FormEvent } from "react";
import AuthFlowLayout from "../../components/AuthFlowLayout";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if (!supabase) {
      setError("Supabase Auth no está configurado.");
      return;
    }

    setSending(true);
    const redirectTo = new URL(
      "/restablecer-contrasena",
      window.location.origin,
    ).toString();
    const { error: requestError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo },
    );
    setSending(false);
    if (requestError) {
      setError("No pudimos enviar el correo. Espera un momento e inténtalo nuevamente.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthFlowLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace seguro para restablecer tu acceso."
    >
      {sent ? (
        <div className="auth-success" role="status">
          <span aria-hidden="true">✓</span>
          <div><strong>Revisa tu correo</strong><p>Si la dirección está registrada, recibirás un enlace para crear una nueva contraseña.</p></div>
        </div>
      ) : (
        <form className="auth-flow-form" onSubmit={submit} noValidate>
          <label htmlFor="recovery-email">Correo electrónico</label>
          <input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="usuario@empresa.com" autoComplete="email" disabled={sending} required />
          {error && <div className="login-error" role="alert">{error}</div>}
          {!isSupabaseConfigured && <div className="login-error" role="status">Falta configurar Supabase Auth.</div>}
          <button className="primary-button" type="submit" disabled={sending || !isSupabaseConfigured}>{sending ? "Enviando…" : "Enviar enlace de recuperación"}</button>
        </form>
      )}
    </AuthFlowLayout>
  );
}
