import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { errorText } from "./data";

export function PageTitle({ title, description }: { title: string; description?: string | undefined }) {
  return <div className="mh-page-title"><h1>{title}</h1>{description && <p>{description}</p>}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="mh-field"><span>{label}</span>{children}</label>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="mh-empty">{children}</div>;
}

export function RequireAccount({ loading, signedIn }: { loading: boolean; signedIn: boolean }) {
  return <Empty>{loading ? "Caricamento…" : signedIn ? "Conferma il tuo indirizzo email per continuare." : <><p>Accedi per continuare.</p><Link className="mh-button" to="/accesso" search={{ mode: "login" }}>Accedi</Link></>}</Empty>;
}

export function useLoad<T>(loader: () => Promise<T>, key: string): { data?: T; error?: string } {
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>();
  useEffect(() => {
    let current = true;
    Promise.resolve().then(loader).then(
      (data) => { if (current) setState({ key, data }); },
      (error) => { if (current) setState({ key, error: errorText(error) }); },
    );
    return () => { current = false; };
    // The key identifies every input to the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state?.key === key ? state : {};
}
