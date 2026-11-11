import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Calculator } from "lucide-react";
import { Field, PageTitle } from "@/components/web/common";
import { checked, db, errorText, euro, useSession, verified } from "@/components/web/data";

export const Route = createFileRoute("/acquista")({ component: Purchase });
const phases = [
  ["Individua l’immobile", "Scegli zona, dimensioni e caratteristiche in base alle tue esigenze."],
  ["Valuta il prezzo", "Confronta immobili simili e considera eventuali lavori."],
  ["Analizza le tue risorse", "Valuta reddito, spese ricorrenti, debiti e risparmi."],
  ["Calcola anticipo e mutuo", "Confronta durata, rata, interessi e condizioni delle diverse proposte."],
  ["Considera i costi accessori", "Chiedi preventivi per notaio, imposte, perizia e mediazione."],
  ["Verifica la documentazione", "Con un professionista, controlla provenienza, dati catastali e stato dell’immobile."],
  ["Prepara il rogito", "Concorda con il notaio i documenti e le modalità di pagamento."],
];

function Purchase() {
  const { session } = useSession();
  const [result, setResult] = useState<{ principal: number; payment: number; remaining: number; target: number }>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = (key: string) => Number(form.get(key));
    const principal = Math.max(0, number("price") - number("deposit"));
    const rate = number("rate") / 1200;
    const months = number("years") * 12;
    const payment = rate ? principal * rate / -Math.expm1(-months * Math.log1p(rate)) : principal / months;
    setResult({ principal, payment, remaining: number("income") - number("debts") - payment, target: number("target") });
  }
  async function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      await checked(db.from("mh_finance_requests").insert({ user_id: session!.user.id, city: data.get("city"), message: data.get("message") }));
      form.reset();
      setMessage("Richiesta inviata a Match House.");
    } catch (error) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }
  return <div className="mh-wrap mh-page">
    <PageTitle title="Non pensare solo all’affitto. Scopri se comprare casa può essere il tuo prossimo passo." description="Valuta i costi di un acquisto immobiliare, scopri quanto potresti permetterti e orientati tra le possibili soluzioni di finanziamento." />
    <a className="mh-button" href="#calcolatore">Calcola il tuo budget <Calculator size={17} /></a>
    <section id="calcolatore" className="mh-panel mh-section"><h2>Simulazione del mutuo</h2>
      <form className="mh-form" onSubmit={calculate}><div className="mh-grid">
        <Field label="Città di interesse"><input name="city" required /></Field>
        <Field label="Tipologia di contratto lavorativo"><select name="job" required defaultValue=""><option value="" disabled>Seleziona</option><option>Tempo indeterminato</option><option>Tempo determinato</option><option>Autonomo</option><option>Altro</option></select></Field>
        {[
          ["price", "Prezzo indicativo dell’immobile (€)", 1, 1, ""],
          ["deposit", "Risparmi disponibili per l’anticipo (€)", 0, 1, ""],
          ["income", "Reddito netto mensile (€)", 0, 1, ""],
          ["debts", "Rate di finanziamenti in corso (€ al mese)", 0, 1, 0],
          ["target", "Rata mensile desiderata (€)", 0, 1, ""],
          ["years", "Durata ipotetica (anni)", 1, 1, 25],
          ["rate", "Tasso annuo ipotetico (%)", 0, 0.01, 3],
        ].map(([name, label, min, step, value]) => <Field key={name} label={String(label)}><input name={String(name)} type="number" min={min} max={name === "years" ? 50 : name === "rate" ? 100 : 100000000} step={step} defaultValue={value} required /></Field>)}
      </div><button className="mh-button">Simula la rata</button></form>
      {result && <div className="mh-result" role="status"><h3>Rata indicativa · {euro(result.payment)}/mese</h3><p>Importo da finanziare {euro(result.principal)}. Reddito residuo dopo le rate {euro(result.remaining)} al mese.</p><p>{result.payment > result.target ? "La rata stimata supera l’importo mensile desiderato." : "La rata stimata rientra nell’importo mensile desiderato."}</p></div>}
      <p className="mh-muted">Stima orientativa. Imposte, notaio, perizia, assicurazioni e mediazione possono incidere sul costo totale. La simulazione non costituisce un’offerta bancaria o una valutazione del merito creditizio.</p>
    </section>
    <section className="mh-panel mh-section"><h2>Guida all’acquisto</h2><ol className="mh-steps">{phases.map(([title, description]) => <li key={title}><strong>{title}</strong><p>{description}</p></li>)}</ol></section>
    <section className="mh-panel mh-section"><h2>Informazioni sul finanziamento</h2><p>Invia una richiesta a Match House per ricevere informazioni.</p>
      {verified(session) ? <form className="mh-form" onSubmit={request}><Field label="Città"><input name="city" required maxLength={100} /></Field><Field label="Cosa vorresti sapere?"><textarea name="message" required maxLength={1500} /></Field><button className="mh-button" disabled={busy}>Invia richiesta</button>{message && <p role="status">{message}</p>}</form> : <p className="mh-muted">Accedi con un indirizzo email verificato per inviare una richiesta.</p>}
    </section>
  </div>;
}
