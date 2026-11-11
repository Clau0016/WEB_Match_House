import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Empty, Field, PageTitle, useLoad } from "@/components/web/common";
import { checked, db, errorText, euro, useSession, verified } from "@/components/web/data";
import { ListingFacts, type Listing } from "@/components/web/listings";

export const Route = createFileRoute("/annuncio/$id")({ component: Detail });
function Detail() {
  const { id } = Route.useParams();
  const { session } = useSession();
  const userId = session?.user.id;
  const state = useLoad(async () => await checked(db.from("mh_public_listings").select("*").eq("id", id).maybeSingle()) as Listing | null, id);
  const saved = useLoad(async () => userId ? Boolean(await checked(db.from("mh_saved").select("listing_id").eq("user_id", userId).eq("listing_id", id).maybeSingle())) : false, id + userId);
  const [version, setVersion] = useState<{ id: string; value: boolean }>();
  const isSaved = version?.id === id + userId ? version.value : saved.data ?? false;
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    setStatus("");
    try {
      await checked(isSaved ? db.from("mh_saved").delete().eq("listing_id", id).eq("user_id", userId!) : db.from("mh_saved").insert({ listing_id: id, user_id: userId }));
      setVersion({ id: id + userId, value: !isSaved });
    } catch (error) { setStatus(errorText(error)); }
    finally { setBusy(false); }
  }

  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setStatus("");
    try {
      await checked(db.from("mh_reports").insert({ reporter_id: userId, listing_id: id, reason: new FormData(form).get("reason") }));
      form.reset();
      setStatus("Segnalazione inviata.");
    } catch (error) { setStatus(errorText(error)); }
    finally { setBusy(false); }
  }
  const listing = state.data;
  return <div className="mh-wrap mh-page"><Link className="mh-text-link" to="/trova-casa">← Torna agli annunci</Link>
    {!listing ? <Empty>{state.error ?? (listing === null ? "Annuncio non disponibile." : "Caricamento…")}</Empty> : <>
      <PageTitle title={listing.title} description={`${listing.city} · ${listing.area} · ${euro(listing.rent)}/mese`} />
      <section className="mh-panel"><ListingFacts listing={listing} /></section>
      {verified(session) && <section className="mh-panel mh-section"><button className="mh-button" disabled={busy} onClick={toggle}>{isSaved ? "Rimuovi dai salvati" : "Salva annuncio"}</button>
        <details className="mh-section"><summary>Segnala annuncio</summary><form className="mh-form" onSubmit={report}><Field label="Motivo"><textarea name="reason" required maxLength={1000} /></Field><button className="mh-button mh-outline" disabled={busy}>Invia segnalazione</button></form></details>
        {status && <p role="status">{status}</p>}
      </section>}
    </>}
  </div>;
}
