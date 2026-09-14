import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function AuthFlowLayout({
  title,
  subtitle,
  children,
  showBack = true,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  showBack?: boolean;
}) {
  return (
    <main className="auth-flow-page">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <section className="auth-flow-card">
        <header>
          <span className="auth-flow-mark" aria-hidden="true">⌂</span>
          <strong>WMS Pro</strong>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        {children}
        {showBack && <Link className="back-to-login" to="/login">← Volver al inicio de sesión</Link>}
      </section>
    </main>
  );
}
