import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthFlowLayout from "../../components/AuthFlowLayout";
import { supabase } from "../../lib/supabase";

type RecoveryStatus = "checking" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<RecoveryStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function prepareRecovery() {
      if (!supabase) { if (active) setStatus("invalid"); return; }
      const url = new URL(window.location.href);
      if (url.searchParams.get("error")) { if (active) setStatus("invalid"); return; }
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (exchangeError) { setStatus("invalid"); return; }
        window.history.replaceState({}, document.title, url.pathname);
        setStatus("ready");
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (active) setStatus(data.session ? "ready" : "invalid");
    }
    void prepareRecovery();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) { setError("Incluye al menos una letra y un número."); return; }
    if (password !== confirmation) { setError("Las contraseñas no coinciden."); return; }
    if (!supabase) { setStatus("invalid"); return; }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("No pudimos actualizar la contraseña. Solicita un enlace nuevo.");
      setSaving(false);
      return;
    }
    await supabase.auth.signOut({ scope: "global" });
    setSaving(false);
    setStatus("success");
  }

  if (status === "checking") {
    return <AuthFlowLayout title="Validando enlace" subtitle="Estamos comprobando tu solicitud." showBack={false}><div className="auth-checking"><span className="loading-spinner" /> Validando…</div></AuthFlowLayout>;
  }
  if (status === "invalid") {
    return <AuthFlowLayout title="Enlace no válido" subtitle="El enlace expiró, ya fue utilizado o no corresponde a una recuperación." showBack={false}><div className="auth-flow-actions"><Link className="primary-button" to="/recuperar-contrasena">Solicitar otro enlace</Link><Link className="back-to-login" to="/login">Volver al inicio de sesión</Link></div></AuthFlowLayout>;
  }
  if (status === "success") {
    return <AuthFlowLayout title="Contraseña actualizada" subtitle="Tu acceso se restableció correctamente." showBack={false}><div className="auth-success" role="status"><span aria-hidden="true">✓</span><div><strong>Cambio completado</strong><p>Por seguridad, inicia sesión nuevamente con tu nueva contraseña.</p></div></div><Link className="primary-button auth-login-link" to="/login">Iniciar sesión</Link></AuthFlowLayout>;
  }

  return (
    <AuthFlowLayout title="Crear nueva contraseña" subtitle="Usa una combinación que no hayas utilizado anteriormente.">
      <form className="auth-flow-form" onSubmit={submit}>
        <label htmlFor="new-password">Nueva contraseña</label>
        <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
        <small>Mínimo 8 caracteres, con al menos una letra y un número.</small>
        <label htmlFor="confirm-password">Confirmar contraseña</label>
        <input id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required />
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="primary-button" type="submit" disabled={saving}>{saving ? "Actualizando…" : "Actualizar contraseña"}</button>
      </form>
    </AuthFlowLayout>
  );
}
