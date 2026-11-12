import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Empty, Field, PageTitle, RequireAccount, useLoad } from "@/components/web/common";
import { checked, db, errorText, useSession, verified } from "@/components/web/data";
import { labels, ListingForm, type Listing } from "@/components/web/listings";
import { MediaImage } from "@/components/web/media";

export const Route = createFileRoute("/account")({ component: Account });
function Account() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const user = session?.user;
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const state = useLoad(async () => {
    if (!user || !verified(session)) return null;
    const [listings, saved, admin, questionnaire, member, finance] = await Promise.all([
      checked(db.from("mh_listings").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })),
      checked(db.from("mh_saved").select("listing_id").eq("user_id", user.id)),
      checked(db.rpc("mh_is_admin")),
      checked(db.from("mh_questionnaires").select("photo,visible,completed,answers").eq("user_id", user.id).maybeSingle()),
      checked(db.from("mh_members").select("active").eq("user_id", user.id).maybeSingle()),
      checked(db.from("mh_finance_requests").select("id,city,message").eq("user_id", user.id)),
    ]);
    const ids = (saved ?? []).map(({ listing_id }) => listing_id);
    const savedListings = ids.length ? await checked(db.from("mh_public_listings").select("id,title,city").in("id", ids)) : [];
    return { listings: listings as Listing[], savedListings, admin, questionnaire, member, finance };
  }, `${user?.id}:${verified(session)}:${revision}`);

  function reload() { setEditing(null); setRevision((value) => value + 1); }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    try { await action(); }
    catch (error) { setStatus(errorText(error)); }
    finally { setBusy(false); }
  }
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(async () => {
      await checked(db.auth.updateUser({ data: { first_name: data.get("first"), last_name: data.get("last"), goal: data.get("goal") } }));
      setStatus("Profilo aggiornato.");
    });
  }
  async function logout() {
    await checked(db.auth.signOut());
    await navigate({ to: "/" });
  }
  async function remove() {
    if (!window.confirm("Eliminare definitivamente l’account e i dati associati?")) return;
    await run(async () => {
      for (const bucket of ["mh-photos", "mh-documents"]) {
        while (true) {
          const files = await checked(db.storage.from(bucket).list(user!.id, { limit: 100 }));
          if (!files?.length) break;
          const removed = await checked(db.storage.from(bucket).remove(files.map(({ name }) => `${user!.id}/${name}`)));
          if (removed?.length !== files.length) throw new Error("Impossibile rimuovere tutti i file dell’account.");
        }
      }
      await checked(db.rpc("mh_delete_account"));
      await db.auth.signOut({ scope: "local" });
      await navigate({ to: "/" });
    });
  }

  return <div className="mh-wrap mh-page"><PageTitle title="Area personale" description={user?.email} />
    {status && <p role="status" className="mh-result">{status}</p>}
    {!user ? <RequireAccount loading={loading} signedIn={false} /> : <>
      <div className="mh-actions"><button className="mh-button mh-outline" disabled={busy} onClick={() => run(logout)}>Esci</button><button className="mh-button mh-outline" disabled={busy} onClick={remove}>Elimina account</button>{state.data?.admin && <Link className="mh-button" to="/amministrazione">Amministrazione</Link>}</div>
      {!verified(session) ? <RequireAccount loading={loading} signedIn /> : state.error ? <Empty>{state.error}</Empty> : !state.data ? <Empty>Caricamento…</Empty> : state.data.member?.active === false ? <Empty>Il tuo account è sospeso.</Empty> : <>
        <section className="mh-panel mh-section"><h2>Il mio profilo</h2>
          {state.data.questionnaire?.photo && <MediaImage path={state.data.questionnaire.photo} alt="Foto del profilo" className="mh-avatar" />}
          <form className="mh-form" onSubmit={update}><div className="mh-grid">
            <Field label="Nome"><input name="first" defaultValue={user.user_metadata["first_name"]} maxLength={80} required /></Field>
            <Field label="Cognome"><input name="last" defaultValue={user.user_metadata["last_name"]} maxLength={80} required /></Field>
            <Field label="Obiettivo"><select name="goal" defaultValue={user.user_metadata["goal"] ?? ""}><option value="">Seleziona</option><option>Cerco una stanza</option><option>Voglio pubblicare un annuncio</option><option>Voglio informarmi sull’acquisto di una casa</option></select></Field>
          </div><button className="mh-button" disabled={busy}>Salva profilo</button></form>
        </section>
        <section className="mh-panel mh-section"><h2>Preferenze abitative</h2>
          {state.data.questionnaire?.completed && <p>{state.data.questionnaire.answers["city"]} · Profilo {state.data.questionnaire.visible ? "visibile" : "privato"}</p>}
          <div className="mh-actions"><Link className="mh-button mh-outline" to="/questionario">Questionario e visibilità</Link><Link className="mh-button mh-outline" to="/risultati">Risultati di compatibilità</Link>{state.data.questionnaire?.visible && <button className="mh-button mh-outline" disabled={busy} onClick={() => run(async () => { await checked(db.from("mh_questionnaires").update({ visible: false }).eq("user_id", user.id)); reload(); })}>Nascondi il profilo</button>}</div>
        </section>
        <section id="annunci" className="mh-panel mh-section"><div className="mh-page-heading"><h2>I miei annunci</h2><button className="mh-button" onClick={() => setEditing(editing === "new" ? null : "new")}>{editing === "new" ? "Chiudi modulo" : "Crea annuncio"}</button></div>
          {editing === "new" && <ListingForm key="new" userId={user.id} defaults={{
            city: String(user.user_metadata["property_city"] ?? ""),
            area: String(user.user_metadata["property_area"] ?? ""),
            address: String(user.user_metadata["property_address"] ?? ""),
          }} onSaved={reload} />}
          {!state.data.listings.length && <p className="mh-muted">Non hai ancora creato annunci.</p>}
          {state.data.listings.map((listing) => <article className="mh-account-item" key={listing.id}>
            <h3>{listing.title}</h3><p>{labels[listing.status]}{listing.review_note ? ` · ${listing.review_note}` : ""}</p>
            <div className="mh-actions"><button className="mh-button mh-outline" onClick={() => setEditing(editing === listing.id ? null : listing.id)}>{editing === listing.id ? "Chiudi modifica" : "Modifica"}</button>
            {listing.status !== "inactive" && <button className="mh-button mh-outline" disabled={busy} onClick={() => run(async () => { await checked(db.from("mh_listings").update({ status: "inactive" }).eq("id", listing.id).select("id").single()); reload(); })}>Disattiva</button>}</div>
            {editing === listing.id && <ListingForm key={listing.id} userId={user.id} listing={listing} onSaved={reload} />}
          </article>)}
        </section>
        <section className="mh-panel mh-section"><h2>Annunci salvati</h2>{state.data.savedListings?.length ? <ul>{state.data.savedListings.map(({ id, title, city }) => <li key={id}><Link to="/annuncio/$id" params={{ id }}>{title} · {city}</Link></li>)}</ul> : <p className="mh-muted">Non hai annunci salvati disponibili.</p>}</section>
        <section className="mh-panel mh-section"><h2>Conversazioni</h2><Link className="mh-text-link" to="/coinquilini" hash="conversazioni">Vai alle tue chat</Link></section>
        {!!state.data.finance?.length && <section className="mh-panel mh-section"><h2>Richieste di finanziamento</h2>{state.data.finance.map(({ id, city, message }) => <article className="mh-account-item" key={id}><strong>{city}</strong><p>{message}</p></article>)}</section>}
      </>}
    </>}
  </div>;
}
