import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Field, PageTitle } from "@/components/web/common";
import { checked, db, errorText } from "@/components/web/data";
import { neighborhoodsFor } from "@/components/web/map-locations";

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
  const [goal, setGoal] = useState("");
  const [housingCity, setHousingCity] = useState("");
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [neighborhood, setNeighborhood] = useState("");
  const [neighborhoodError, setNeighborhoodError] = useState("");
  const seeker = goal === "Cerco una stanza";
  const landlord = goal === "Voglio pubblicare un annuncio";
  const registration = mode === "register";
  const title = { login: "Accedi a Match House", register: "Crea il tuo account", reset: "Recupera la password", update: "Imposta una nuova password" }[mode];

  function addNeighborhood() {
    const name = neighborhood.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (neighborhoods.some((item) => item.localeCompare(name, "it", { sensitivity: "base" }) === 0)) {
      setNeighborhoodError("Hai già selezionato questo quartiere.");
      return;
    }
    if (neighborhoods.length >= 5) return;
    setNeighborhoods([...neighborhoods, name]);
    setNeighborhood("");
    setNeighborhoodError("");
  }

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
        if (seeker && (!value("housing_city") || !neighborhoods.length || neighborhoods.length > 5 || neighborhood.trim())) {
          throw new Error("Indica una città e aggiungi da uno a cinque quartieri.");
        }
        if (landlord && (!value("housing_city") || !value("housing_area") || !value("housing_address"))) {
          throw new Error("Indica città, quartiere e indirizzo dell’immobile.");
        }
        const housing = seeker ? { housing_city: value("housing_city"), housing_neighborhoods: neighborhoods } :
          landlord ? { property_city: value("housing_city"), property_area: value("housing_area"), property_address: value("housing_address") } : {};
        const data = await checked(db.auth.signUp({
          email: value("email"), password,
          options: { emailRedirectTo: location.origin + "/account", data: { first_name: value("first"), last_name: value("last"), goal, ...housing, accepted_terms_at: new Date().toISOString() } },
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
        <Field label="Il tuo obiettivo"><select name="goal" required value={goal} onChange={(event) => {
          setGoal(event.target.value); setHousingCity(""); setNeighborhoods([]); setNeighborhood(""); setNeighborhoodError("");
        }}><option value="" disabled>Seleziona</option><option>Cerco una stanza</option><option>Voglio pubblicare un annuncio</option><option>Voglio informarmi sull’acquisto di una casa</option></select></Field>
        {(seeker || landlord) && <Field label={seeker ? "Città in cui cerchi casa" : "Città dell’immobile"}><input name="housing_city" maxLength={100} value={housingCity} required onChange={(event) => {
          setHousingCity(event.target.value);
          if (seeker) { setNeighborhoods([]); setNeighborhood(""); setNeighborhoodError(""); }
        }} /></Field>}
        {(seeker || landlord) && <datalist id="mh-registration-neighborhoods">{neighborhoodsFor(housingCity).map((name) => <option key={name} value={name} />)}</datalist>}
        {seeker && <fieldset className="mh-form">
          <legend>Quartieri in cui ti trasferiresti ({neighborhoods.length}/5)</legend>
          <div className="mh-actions">
            <Field label="Nome del quartiere"><input list="mh-registration-neighborhoods" maxLength={80} value={neighborhood} disabled={neighborhoods.length === 5} onChange={(event) => setNeighborhood(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter") { event.preventDefault(); addNeighborhood(); }
            }} /></Field>
            <button type="button" className="mh-button mh-outline" onClick={addNeighborhood} disabled={!neighborhood.trim() || neighborhoods.length === 5}>Aggiungi quartiere</button>
          </div>
          {neighborhoodError && <p role="alert">{neighborhoodError}</p>}
          <div className="mh-options">{neighborhoods.map((item) => <button type="button" key={item} aria-label={`Rimuovi ${item}`} onClick={() => {
            setNeighborhoods(neighborhoods.filter((name) => name !== item)); setNeighborhoodError("");
          }}>{item} ×</button>)}</div>
        </fieldset>}
        {landlord && <div className="mh-grid">
          <Field label="Quartiere dell’immobile"><input name="housing_area" list="mh-registration-neighborhoods" maxLength={80} required /></Field>
          <Field label="Indirizzo e numero civico"><input name="housing_address" maxLength={200} required /></Field>
        </div>}
        <label className="mh-check"><input type="checkbox" required /><span>Accetto i <Link to="/informazioni" hash="termini">Termini</Link> e l’<Link to="/informazioni" hash="privacy">Informativa sulla privacy</Link>.</span></label>
      </>}
      <button className="mh-button" disabled={busy}>{busy ? "Attendi…" : { login: "Accedi", register: "Registrati", reset: "Invia il link", update: "Salva password" }[mode]}</button>
      {message && <p role="status">{message}</p>}
      {mode === "login" && <Link to="/accesso" search={{ mode: "reset" }}>Password dimenticata?</Link>}
      <Link to="/accesso" search={{ mode: mode === "login" ? "register" : "login" }}>{mode === "login" ? "Crea un account" : "Vai all’accesso"}</Link>
    </form>
  </div>;
}
