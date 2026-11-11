import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Field, PageTitle } from "@/components/web/common";
import { checked, db, errorText } from "@/components/web/data";

const modes = ["login", "register", "reset", "update"] as const;
type Mode = (typeof modes)[number];
export const Route = createFileRoute("/accesso")({
  validateSearch: (search): { mode: Mode } => ({ mode: modes.includes(search["mode"] as Mode) ? search["mode"] as Mode : "login" }),
  component: Auth,
});

function Auth() {
  const { mode } = Route.useSearch();
  return <AuthForm key={mode} mode={mode} />;
}

function AuthForm({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const registration = mode === "register";
  const title = { login: "Accedi a Match House", register: "Crea il tuo account", reset: "Recupera la password", update: "Imposta una nuova password" }[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setMessage("");
    try {
      if ((registration || mode === "update") && password !== form.get("confirm")) throw new Error("Le password devono coincidere.");
      if (registration) {
        const data = await checked(db.auth.signUp({
          email: value("email"), password,
          options: { emailRedirectTo: location.origin + "/account", data: { first_name: value("first"), last_name: value("last"), goal: value("goal"), accepted_terms_at: new Date().toISOString() } },
        }));
        if (data.session) await navigate({ to: "/account" });
        else setMessage("Controlla la tua email per confermare la registrazione.");
      } else if (mode === "reset") {
        await checked(db.auth.resetPasswordForEmail(value("email"), { redirectTo: location.origin + "/accesso?mode=update" }));
        setMessage("Se l’indirizzo è registrato, riceverai un link per recuperare la password.");
      } else if (mode === "update") {
        await checked(db.auth.updateUser({ password }));
        await navigate({ to: "/account" });
      } else {
        await checked(db.auth.signInWithPassword({ email: value("email"), password }));
        await navigate({ to: "/account" });
      }
    } catch (error) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }

  return <div className="mh-wrap mh-page mh-narrow"><PageTitle title={title} />
    <form onSubmit={submit} className="mh-form mh-panel">
      {registration && <div className="mh-grid"><Field label="Nome"><input name="first" autoComplete="given-name" maxLength={80} required /></Field><Field label="Cognome"><input name="last" autoComplete="family-name" maxLength={80} required /></Field></div>}
      {mode !== "update" && <Field label="Email"><input name="email" type="email" autoComplete="email" required /></Field>}
      {mode !== "reset" && <><Field label="Password"><input name="password" type={visible ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 8} required /></Field>
        <button type="button" className="mh-text-link" onClick={() => setVisible(!visible)}>{visible ? "Nascondi password" : "Mostra password"}</button>
        {(registration || mode === "update") && <Field label="Conferma password"><input name="confirm" type={visible ? "text" : "password"} autoComplete="new-password" required /></Field>}</>}
      {registration && <>
        <Field label="Il tuo obiettivo"><select name="goal" required defaultValue=""><option value="" disabled>Seleziona</option><option>Cerco una stanza</option><option>Voglio pubblicare un annuncio</option><option>Voglio informarmi sull’acquisto di una casa</option></select></Field>
        <label className="mh-check"><input type="checkbox" required /><span>Accetto i <Link to="/informazioni" hash="termini">Termini</Link> e l’<Link to="/informazioni" hash="privacy">Informativa sulla privacy</Link>.</span></label>
      </>}
      <button className="mh-button" disabled={busy}>{busy ? "Attendi…" : { login: "Accedi", register: "Registrati", reset: "Invia il link", update: "Salva password" }[mode]}</button>
      {message && <p role="status">{message}</p>}
      {mode === "login" && <Link to="/accesso" search={{ mode: "reset" }}>Password dimenticata?</Link>}
      <Link to="/accesso" search={{ mode: mode === "login" ? "register" : "login" }}>{mode === "login" ? "Crea un account" : "Vai all’accesso"}</Link>
    </form>
  </div>;
}
