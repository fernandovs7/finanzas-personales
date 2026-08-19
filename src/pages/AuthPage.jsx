import { useState } from "react";
import { useAuth } from "../state/AuthContext.jsx";

function authErrorMessage(error) {
  const message = error?.message || "No pudimos completar el acceso.";
  if (/invalid login credentials/i.test(message)) {
    return "El correo o la contraseña no coinciden.";
  }
  if (/user already registered/i.test(message)) {
    return "Este correo ya tiene una cuenta. Probá iniciar sesión.";
  }
  if (/password/i.test(message) && /characters/i.test(message)) {
    return "La contraseña necesita al menos 8 caracteres.";
  }
  return message;
}

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        const result = await signUp(email, password);
        if (result.needsConfirmation) {
          setMessage(
            result.hasAppRedirect
              ? "Te enviamos un correo. Confirmá la cuenta y volverás aquí para iniciar sesión."
              : "Te enviamos un correo. Confirmá la cuenta y luego volvé aquí para iniciar sesión. Si el enlace termina en localhost, podés cerrar esa pestaña: la confirmación ya se completó."
          );
        }
      }
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="auth-brand">
          <span className="auth-brand-mark">F</span>
          <span>Finanzas Personales</span>
        </div>
        <div className="auth-story-copy">
          <p className="eyebrow">Tu plata, con contexto</p>
          <h1>Una sola vista para saber qué está apartado y qué está realmente libre.</h1>
          <p>
            Tus salarios, conversiones, pagos, cuotas y ahorro quedan respaldados de forma
            privada para que puedas continuar desde la web o una futura app de iPhone.
          </p>
        </div>
        <div className="auth-security-note">
          <span className="auth-security-dot" />
          Cada cuenta solo puede acceder a sus propios registros.
        </div>
      </section>

      <section className="auth-access">
        <div className="auth-card">
          <p className="eyebrow">Acceso seguro</p>
          <h2>{mode === "signin" ? "Volvé a tu resumen" : "Creá tu cuenta"}</h2>
          <p className="auth-card-copy">
            {mode === "signin"
              ? "Ingresá para cargar tu información sincronizada."
              : "La primera vez trasladaremos automáticamente los datos que ya tenés en este navegador."}
          </p>

          <div className="auth-mode" role="tablist" aria-label="Tipo de acceso">
            <button
              type="button"
              className={mode === "signin" ? "active" : ""}
              onClick={() => {
                setMode("signin");
                setError("");
                setMessage("");
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
            >
              Crear cuenta
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Correo electrónico
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                required
              />
            </label>
            <label>
              Contraseña
              <input
                name="password"
                type="password"
                minLength="8"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </label>
            {error ? <p className="auth-feedback error">{error}</p> : null}
            {message ? <p className="auth-feedback success">{message}</p> : null}
            <button className="primary-btn auth-submit" type="submit" disabled={busy}>
              {busy
                ? "Conectando..."
                : mode === "signin"
                  ? "Entrar a mis finanzas"
                  : "Crear mi cuenta"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
