import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Empty, Field, PageTitle, RequireAccount, useLoad } from "@/components/web/common";
import { checked, db, errorText, euro, useSession, verified } from "@/components/web/data";
import { MediaImage } from "@/components/web/media";
import { questions } from "@/components/web/questionnaire";
import type { Ranked } from "./risultati";

export const Route = createFileRoute("/profilo/$id")({ component: Profile });
function Profile() {
  const { id } = Route.useParams();
  const { session, loading } = useSession();
  const canRead = verified(session);
  const state = useLoad(async () => canRead ? (await checked(db.rpc("mh_rank_roommates", { target: id })) as Ranked[])[0] ?? null : null, canRead ? session!.user.id + id : "");
  const [status, setStatus] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      await checked(db.from("mh_contacts").insert({ sender_id: session!.user.id, recipient_id: id, message: new FormData(event.currentTarget).get("message") }));
      setStatus("Richiesta di contatto inviata.");
    } catch (error) { setStatus(errorText(error)); }
    finally { setBusy(false); }
  }
  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      await checked(db.from("mh_reports").insert({ reporter_id: session!.user.id, profile_id: id, reason: new FormData(form).get("reason") }));
      form.reset();
      setReportStatus("Segnalazione inviata.");
    } catch (error) { setReportStatus(errorText(error)); }
    finally { setBusy(false); }
  }
  const person = state.data;
  return <div className="mh-wrap mh-page mh-narrow"><Link className="mh-text-link" to="/risultati">← Torna ai risultati</Link>
    {!canRead ? <RequireAccount loading={loading} signedIn={Boolean(session)} /> : !person ? <Empty>{state.error ?? (person === null ? "Profilo non disponibile." : "Caricamento…")}</Empty> : <>
      <div className="mh-panel mh-section"><MediaImage className="mh-avatar" path={person.photo} alt={`Foto di ${person.name}`} /><PageTitle title={`${person.name}, ${person.answers["age"]} anni`} description={`${person.answers["job"]} · ${person.answers["city"]}`} /><span className="mh-badge">{person.score}% compatibilità indicativa</span><p>{person.answers["bio"]}</p>
        <p>Budget {euro(Number(person.answers["minimum"]))}–{euro(Number(person.answers["maximum"]))}/mese. Ingresso dal {person.answers["move"]}.</p>
        {person.show_details && <dl className="mh-facts">{questions.filter(({ id: key }) => ["schedule","clean","noise","social","interests","area","stay","languages","home","remote","chores","guests","smoke","pets","sports"].includes(key)).map(({ id: key, label }) => <div key={key}><dt>{label}</dt><dd>{Array.isArray(person.answers[key]) ? person.answers[key].join(", ") : person.answers[key] || "—"}</dd></div>)}</dl>}
      </div>
      <form className="mh-panel mh-section mh-form" onSubmit={send}><h2>Contatta questa persona</h2><Field label="Messaggio"><textarea name="message" maxLength={1000} required /></Field><button className="mh-button" disabled={busy || status === "Richiesta di contatto inviata."}>Invia richiesta</button>{status && <p role="status">{status}</p>}</form>
      <details className="mh-panel mh-section"><summary>Segnala profilo</summary><form className="mh-form" onSubmit={report}><Field label="Motivo"><textarea name="reason" required maxLength={1000} /></Field><button className="mh-button mh-outline" disabled={busy}>Invia segnalazione</button>{reportStatus && <p role="status">{reportStatus}</p>}</form></details>
    </>}
  </div>;
}
