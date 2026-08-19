import { createContext, useContext, useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);

function getEmailRedirectUrl() {
  const configuredUrl = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim();
  if (configuredUrl) return configuredUrl;

  return window.location.protocol.startsWith("http") ? window.location.origin : undefined;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("No se pudo recuperar la sesión", error);
      setSession(data.session || null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password) {
    const redirectTo = getEmailRedirectUrl();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined
    });

    if (error) throw error;
    return { needsConfirmation: !data.session, hasAppRedirect: Boolean(redirectTo) };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{ hasSupabaseConfig, session, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
