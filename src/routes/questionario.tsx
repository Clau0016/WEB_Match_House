import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Empty, Field, PageTitle, RequireAccount, useLoad } from "@/components/web/common";
import { checked, db, errorText, uploadFiles, useSession, verified } from "@/components/web/data";
import { MediaImage } from "@/components/web/media";
import { questions, type Answer, type Answers } from "@/components/web/questionnaire";

export const Route = createFileRoute("/questionario")({ component: Questionnaire });
type Draft = { answers: Answers; step: number; completed: boolean; visible: boolean; show_details: boolean; photo: string | null };

function Questionnaire() {
  const { session, loading } = useSession();
  const user = session?.user;
  const registrationCity = String(user?.user_metadata["housing_city"] ?? "");
  const rawNeighborhoods: unknown = user?.user_metadata["housing_neighborhoods"];
  const registrationAreas = Array.isArray(rawNeighborhoods)
    ? rawNeighborhoods.filter((item): item is string => typeof item === "string").slice(0, 5) : [];
  const state = useLoad(async () => user && verified(session)
    ? await checked(db.from("mh_questionnaires").select("*").eq("user_id", user.id).maybeSingle()) as Draft | null
    : null, verified(session) ? user!.id : "");
  return <div className="mh-wrap mh-page mh-narrow"><PageTitle title="Questionario di compatibilità" />
    {!verified(session) ? <RequireAccount loading={loading} signedIn={Boolean(session)} /> : state.error ? <Empty>{state.error}</Empty> : state.data === undefined ? <Empty>Caricamento…</Empty> : <Wizard key={user!.id} userId={user!.id} initial={state.data} registrationCity={registrationCity} registrationAreas={registrationAreas} />}
  </div>;
}

function Wizard({ initial, userId, registrationCity, registrationAreas }: {
  initial: Draft | null; userId: string; registrationCity: string; registrationAreas: string[];
}) {
  const [answers, setAnswers] = useState<Answers>(initial?.answers ?? { city: registrationCity, area: registrationAreas[0] ?? "" });
  const [step, setStep] = useState(Math.min(initial?.step ?? 0, questions.length));
  const [photo, setPhoto] = useState(initial?.photo ?? null);
  const [visible, setVisible] = useState(initial?.visible ?? false);
  const [mapVisible, setMapVisible] = useState(initial?.answers["show_on_map"] === "true");
  const [details, setDetails] = useState(initial?.show_details ?? false);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const question = questions[step];
  const answer = question ? answers[question.id] ?? "" : "";
  const setAnswer = (value: Answer) => { if (question) setAnswers({ ...answers, [question.id]: value }); };

  async function save(next: number, publish = false, file?: File) {
    setBusy(true);
    setError("");
    let uploaded: string | undefined;
    try {
      if (next >= questions.length && Number(answers["maximum"]) < Number(answers["minimum"])) {
        setStep(questions.findIndex(({ id }) => id === "maximum"));
        throw new Error("Il budget massimo deve essere almeno pari al minimo.");
      }
      if (file?.size) [uploaded] = await uploadFiles("mh-photos", userId, [file]);
      const sameCity = String(answers["city"] ?? "").trim().localeCompare(registrationCity, "it", { sensitivity: "base" }) === 0;
      const primary = String(answers["area"] ?? "").trim();
      const preferredAreas = [...new Set([primary, ...(sameCity ? registrationAreas : [])].filter(Boolean))].slice(0, 5);
      await checked(db.from("mh_questionnaires").upsert({
        user_id: userId, answers: { ...answers, preferred_areas: preferredAreas, show_on_map: String(visible && mapVisible) }, step: next,
        completed: publish, visible: publish && visible, show_details: details, photo: uploaded ?? photo,
      }));
      if (uploaded) {
        if (photo) await db.storage.from("mh-photos").remove([photo]);
        setPhoto(uploaded);
      }
      setStep(next);
      setFinished(publish);
    } catch (cause) {
      if (uploaded) await db.storage.from("mh-photos").remove([uploaded]);
      setError(errorText(cause));
    } finally { setBusy(false); }
  }

  if (finished) return <div className="mh-panel"><h2>Questionario completato</h2><p>Le risposte sono state salvate.</p><Link className="mh-button" to="/risultati">Scopri i tuoi coinquilini compatibili</Link></div>;
  return <section className="mh-panel"><div className="mh-progress-label">{question ? `Domanda ${step + 1} di ${questions.length}` : "Conferma finale"}</div><progress value={step} max={questions.length} aria-label="Avanzamento" />
    {question ? <form key={question.id} className="mh-form" onSubmit={(event) => { event.preventDefault(); void save(step + 1); }}>
      <h2>{question.label}</h2>
      {question.options ? <div className="mh-options">{question.options.map((option) => {
        const selected = Array.isArray(answer) ? answer.includes(option) : answer === option;
        return <button type="button" key={option} aria-pressed={selected} onClick={() => setAnswer(question.multiple ? (selected ? (answer as string[]).filter((item) => item !== option) : [...(Array.isArray(answer) ? answer : []), option]) : option)}>{option}</button>;
      })}</div> : question.type === "textarea" ? <textarea aria-label={question.label} required maxLength={1200} value={String(answer)} onChange={(e) => setAnswer(e.target.value)} /> : <input aria-label={question.label} required={!question.optional} maxLength={120} type={question.type ?? "text"} min={question.min} max={question.max} value={String(answer)} onChange={(e) => setAnswer(e.target.value)} />}
      <div className="mh-actions">{step > 0 && <button className="mh-button mh-outline" type="button" disabled={busy} onClick={() => setStep(step - 1)}>Indietro</button>}<button className="mh-button" disabled={busy || (!question.optional && !String(answer).trim())}>Salva e continua</button></div>
    </form> : <form className="mh-form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void save(step, true, new FormData(event.currentTarget).get("photo") as File); }}>
      <h2>Scegli cosa condividere</h2>
      {photo && <MediaImage className="mh-avatar" path={photo} alt="La tua foto profilo" />}
      <Field label="Foto profilo (facoltativa)"><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" /></Field>
      <label className="mh-check"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Mostra il profilo nei risultati dei coinquilini</label>
      {visible && <label className="mh-check"><input type="checkbox" checked={mapVisible} onChange={(e) => setMapVisible(e.target.checked)} /> Includi la zona in cui cerco casa nei conteggi della mappa</label>}
      <label className="mh-check"><input type="checkbox" checked={details} onChange={(e) => setDetails(e.target.checked)} /> Mostra abitudini e preferenze nella scheda del profilo</label>
      <div className="mh-actions"><button className="mh-button mh-outline" type="button" disabled={busy} onClick={() => setStep(step - 1)}>Indietro</button><button className="mh-button" disabled={busy}>Conferma questionario</button></div>
    </form>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
