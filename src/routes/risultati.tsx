import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Empty, Field, PageTitle, RequireAccount, useLoad } from "@/components/web/common";
import { checked, db, euro, useSession, verified } from "@/components/web/data";
import { MediaImage } from "@/components/web/media";
import { normalized, type Roommate } from "@/components/web/questionnaire";

export const Route = createFileRoute("/risultati")({ component: Results });
export type Ranked = Roommate & { score: number };

function Results() {
  const { session, loading } = useSession();
  const canRead = verified(session);
  const state = useLoad(async () => canRead ? await checked(db.rpc("mh_rank_roommates")) as Ranked[] : [], canRead ? session!.user.id : "");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const update = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const has = (key: string) => Boolean(filters[key]);
  const results = (state.data ?? []).filter(({ answers: a, score }) =>
    (!has("city") || normalized(a["city"]).includes(normalized(filters["city"]))) &&
    (!has("job") || a["job"] === filters["job"]) &&
    (!has("minAge") || Number(a["age"]) >= Number(filters["minAge"])) &&
    (!has("maxAge") || Number(a["age"]) <= Number(filters["maxAge"])) &&
    (!has("budget") || Number(a["minimum"]) <= Number(filters["budget"])) &&
    (!has("move") || String(a["move"]) <= (filters["move"] ?? "")) &&
    (!has("score") || score >= Number(filters["score"])));
  return <div className="mh-wrap mh-page">
    <PageTitle title="I tuoi potenziali coinquilini" description="La percentuale confronta le risposte al questionario e offre un’indicazione orientativa sulla compatibilità." />
    {!canRead ? <RequireAccount loading={loading} signedIn={Boolean(session)} /> : state.error ? <Empty><p>{state.error}</p><Link to="/questionario">Vai al questionario</Link></Empty> : state.data === undefined ? <Empty>Caricamento…</Empty> : <>
      <form className="mh-panel mh-filters" onSubmit={(e) => e.preventDefault()}>
        <Field label="Città"><input value={filters["city"] ?? ""} onChange={(e) => update("city", e.target.value)} /></Field>
        <Field label="Occupazione"><select value={filters["job"] ?? ""} onChange={(e) => update("job", e.target.value)}><option value="">Tutte</option><option>Studente</option><option>Lavoratore</option><option>Altro</option></select></Field>
        {([
          ["minAge", "Età minima", "number"], ["maxAge", "Età massima", "number"],
          ["budget", "Budget massimo (€)", "number"], ["move", "Ingresso entro il", "date"],
          ["score", "Compatibilità minima (%)", "number"],
        ] as const).map(([key, label, type]) => <Field key={key} label={label}><input type={type} min={0} max={key === "score" ? 100 : undefined} value={filters[key] ?? ""} onChange={(e) => update(key, e.target.value)} /></Field>)}
      </form>
      <p className="mh-count">{results.length} {results.length === 1 ? "profilo" : "profili"}</p>
      {results.length === 0 && <Empty>Nessun profilo attivo corrisponde ai filtri.</Empty>}
      <div className="mh-list">{results.map((person) => <article className="mh-panel mh-person" key={person.user_id}>
        <MediaImage className="mh-avatar" path={person.photo} alt={`Foto di ${person.name}`} />
        <div><h2>{person.name}, {person.answers["age"]} anni</h2><p className="mh-muted">{person.answers["job"]} · {person.answers["city"]} · {euro(Number(person.answers["minimum"]))}–{euro(Number(person.answers["maximum"]))}/mese</p><p>{person.answers["bio"]}</p></div>
        <div className="mh-person-action"><span className="mh-badge">{person.score}% compatibilità</span><Link className="mh-button mh-outline" to="/profilo/$id" params={{ id: person.user_id }}>Visualizza profilo</Link></div>
      </article>)}</div>
    </>}
  </div>;
}
