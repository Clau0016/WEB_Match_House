import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Empty, Field, PageTitle, RequireAccount, useLoad } from "@/components/web/common";
import { checked, db, errorText, useSession, verified } from "@/components/web/data";
import { labels, ListingFacts, type Listing } from "@/components/web/listings";

export const Route = createFileRoute("/amministrazione")({ component: Admin });
function Admin() {
  const { session, loading } = useSession();
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const canRead = verified(session);
  const state = useLoad(async () => {
    if (!canRead || !await checked(db.rpc("mh_is_admin"))) return null;
    const [members, listings, reports, finance] = await Promise.all([
      checked(db.from("mh_members").select("*").order("name")),
      checked(db.from("mh_listings").select("*").order("created_at", { ascending: false })),
      checked(db.from("mh_reports").select("*").order("created_at", { ascending: false })),
      checked(db.from("mh_finance_requests").select("*").order("created_at", { ascending: false })),
    ]);
    return { members, listings: listings as Listing[], reports, finance };
  }, `${session?.user.id}:${canRead}:${revision}`);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    try { await action(); setRevision((value) => value + 1); }
    catch (error) { setStatus(errorText(error)); }
    finally { setBusy(false); }
  }

  async function review(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (!button?.value) return;
    const note = new FormData(event.currentTarget).get("note");
    await act(async () => { await checked(db.from("mh_listings").update({ status: button.value, review_note: note }).eq("id", id).select("id").single()); });
  }

  async function openDocument(path: string) {
    const tab = window.open("", "_blank");
    if (!tab) { setStatus("Consenti l’apertura della scheda per visualizzare il documento."); return; }
    tab.opener = null;
    try {
      const document = await checked(db.storage.from("mh-documents").createSignedUrl(path, 120));
      if (!document) throw new Error("Documento non disponibile.");
      tab.location.href = document.signedUrl;
    }
    catch (error) { tab.close(); setStatus(errorText(error)); }
  }

  return <div className="mh-wrap mh-page"><PageTitle title="Amministrazione" />
    {status && <p role="alert">{status}</p>}
    {!canRead ? <RequireAccount loading={loading} signedIn={Boolean(session)} /> : !state.data ? <Empty>{state.error ?? (state.data === null ? "Accesso riservato agli amministratori." : "Caricamento…")}</Empty> : <>
      <section className="mh-panel mh-section"><h2>Annunci</h2>
        {!state.data.listings.length && <p>Nessun annuncio.</p>}
        {state.data.listings.map((listing) => <details className="mh-account-item" key={listing.id}><summary>{listing.title} · {labels[listing.status]}</summary><ListingFacts listing={listing} />
          <div className="mh-actions">{listing.documents.map((path, i) => <button key={path} className="mh-button mh-outline" onClick={() => openDocument(path)}>Documento {i + 1}</button>)}</div>
          <form className="mh-form" onSubmit={(e) => review(e, listing.id)}><Field label="Nota per il proprietario"><textarea name="note" maxLength={1000} defaultValue={listing.review_note ?? ""} /></Field><div className="mh-actions">
            {listing.status === "pending" && <><button className="mh-button" value="approved" disabled={busy}>Approva</button><button className="mh-button mh-outline" value="rejected" disabled={busy}>Rifiuta</button></>}
            {listing.status !== "inactive" && <button className="mh-button mh-outline" value="inactive" disabled={busy}>Disattiva</button>}
          </div></form>
        </details>)}
      </section>
      <section className="mh-panel mh-section"><h2>Utenti</h2>{state.data.members?.map((member) => <div className="mh-account-item mh-page-heading" key={member.user_id}><div><strong>{member.name}</strong><p>{member.active ? "Attivo" : "Sospeso"}</p><small>{member.user_id}</small></div><button className="mh-button mh-outline" disabled={busy || member.user_id === session?.user.id} onClick={() => act(async () => { await checked(db.from("mh_members").update({ active: !member.active }).eq("user_id", member.user_id)); })}>{member.active ? "Sospendi" : "Riattiva"}</button></div>)}</section>
      <section className="mh-panel mh-section"><h2>Segnalazioni</h2>{state.data.reports?.length ? state.data.reports.map((report) => <article className="mh-account-item" key={report.id}><p>{report.reason}</p><small>{report.listing_id ?? report.profile_id}</small><div>{report.resolved ? "Risolta" : <button className="mh-button mh-outline" disabled={busy} onClick={() => act(async () => { await checked(db.from("mh_reports").update({ resolved: true }).eq("id", report.id)); })}>Segna come risolta</button>}</div></article>) : <p>Nessuna segnalazione.</p>}</section>
      <section className="mh-panel mh-section"><h2>Richieste di finanziamento</h2>{state.data.finance?.length ? state.data.finance.map((request) => <article className="mh-account-item" key={request.id}><strong>{request.city}</strong><p>{request.message}</p><small>Account {request.user_id}</small></article>) : <p>Nessuna richiesta.</p>}</section>
    </>}
  </div>;
}
