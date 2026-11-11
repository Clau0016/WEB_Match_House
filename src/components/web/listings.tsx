import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Field } from "./common";
import { checked, db, errorText, euro, uploadFiles } from "./data";
import { MediaImage } from "./media";

export const types = ["Stanza singola", "Stanza doppia", "Appartamento"];
export const amenities = ["Letto", "Armadio", "Scrivania", "Cucina attrezzata", "Frigorifero", "Lavatrice", "Lavastoviglie", "Forno", "Aria condizionata", "Riscaldamento", "Wi-Fi"];
export const labels = { draft: "Bozza", pending: "Da verificare", approved: "Verificato", rejected: "Non approvato", inactive: "Disattivato" };
export type Listing = {
  id: string; owner_id: string; title: string; city: string; area: string; address: string; rent: number; type: string; size: number;
  rooms: number; roommates: number; available: string; amenities: string[]; photos: string[]; documents: string[];
  status: keyof typeof labels; details: Record<string, string>; review_note: string | null;
};
const details = [
  ["floor", "Piano", "text"], ["bathrooms", "Numero di bagni", "number"], ["fees", "Spese condominiali e utenze (€ al mese)", "number"],
  ["deposit", "Deposito (mensilità)", "number"], ["contract", "Tipologia di contratto", "text"], ["duration", "Durata del contratto", "text"],
  ["registered", "Registrazione del contratto", "select"], ["extra", "Costi aggiuntivi", "text"], ["pets", "Animali ammessi", "select"],
  ["smoking", "Fumatori ammessi", "select"], ["guests", "Ospiti ammessi", "select"], ["cleaning", "Regole di pulizia", "text"],
  ["other", "Altri arredi o condizioni", "text"],
] as const;
const base = [
  ["title", "Titolo", "text"], ["city", "Città", "text"], ["area", "Zona", "text"], ["address", "Indirizzo", "text"],
  ["rent", "Canone mensile (€)", "number"], ["size", "Superficie (m²)", "number"], ["rooms", "Stanze disponibili", "number"],
  ["roommates", "Coinquilini presenti", "number"], ["available", "Disponibile dal", "date"],
] as const;
const requiredDetail = new Set(["floor", "bathrooms", "fees", "deposit", "contract", "duration", "registered", "pets", "smoking", "guests"]);

export function ListingCard({ listing }: { listing: Listing }) {
  return <Link to="/annuncio/$id" params={{ id: listing.id }} className="mh-panel mh-listing-card">
    <MediaImage path={listing.photos[0] ?? null} alt={listing.title} className="mh-listing-photo" />
    <div className="mh-listing-body"><span className="mh-badge">✓ {labels.approved}</span><h2>{listing.title}</h2><p className="mh-muted">{listing.city} · {listing.area}</p><strong>{euro(listing.rent)}/mese</strong><p>{listing.type} · {listing.size} m²</p><p>{listing.rooms} stanze disponibili · {listing.roommates} coinquilini</p></div>
  </Link>;
}

export function ListingFacts({ listing }: { listing: Listing }) {
  return <><div className="mh-gallery">{listing.photos.map((path, index) => <MediaImage key={path} path={path} alt={`Foto ${index + 1} di ${listing.title}`} className="mh-listing-photo" />)}</div>
    <p><span className="mh-badge">{labels[listing.status]}</span></p>
    <dl className="mh-facts">
      {base.slice(1).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{String(listing[key as keyof Listing] ?? "—")}</dd></div>)}
      <div><dt>Tipologia</dt><dd>{listing.type}</dd></div>
      {details["map"](([key, label]) => <div key={key}><dt>{label}</dt><dd>{listing.details[key] || "—"}</dd></div>)}
      <div><dt>Deposito (importo)</dt><dd>{euro(Number(listing.details["deposit"]) * listing.rent || 0)}</dd></div>
    </dl>
    {listing.amenities.length > 0 && <p>Dotazioni · {listing.amenities.join(", ")}</p>}
    <p className="mh-preserve">{listing.details["description"]}</p></>;
}

export function ListingForm({ userId, listing, onSaved }: { userId: string; listing?: Listing; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const pending = submitter?.value === "pending";
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const images = form.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);
    const docs = form.getAll("documents").filter((file): file is File => file instanceof File && file.size > 0);
    const oldPhotos = form.has("replacePhotos") ? [] : listing?.photos ?? [];
    const oldDocs = form.has("replaceDocs") ? [] : listing?.documents ?? [];
    let photos: string[] = [];
    let documents: string[] = [];
    setStatus("");
    setBusy(true);
    try {
      if (oldPhotos.length + images.length > 12 || oldDocs.length + docs.length > 8) throw new Error("Puoi allegare fino a 12 foto e 8 documenti.");
      if (pending && (!oldPhotos.length && !images.length || !oldDocs.length && !docs.length)) throw new Error("Per la verifica servono almeno una foto e un documento.");
      if (pending && (base.some(([key]) => !value(key)) || [...requiredDetail].some((key) => !value(key)))) throw new Error("Compila tutti i campi obbligatori prima di richiedere la verifica.");
      photos = await uploadFiles("mh-photos", userId, images);
      documents = await uploadFiles("mh-documents", userId, docs);
      const values = {
        owner_id: userId, title: value("title"), city: value("city"), area: value("area"), address: value("address"),
        type: value("type"), rent: Number(value("rent")), size: Number(value("size")), rooms: Number(value("rooms")),
        roommates: Number(value("roommates")), available: value("available") || null, amenities: form.getAll("amenities"),
        details: Object.fromEntries([...details["map"](([key]) => [key, value(key)]), ["description", value("description")]]),
        photos: [...oldPhotos, ...photos], documents: [...oldDocs, ...documents], status: pending ? "pending" : "draft",
      };
      const table = db.from("mh_listings");
      await checked(listing ? table.update(values).eq("id", listing.id).select("id").single() : table.insert(values));
    } catch (error) {
      if (photos.length) await db.storage.from("mh-photos").remove(photos);
      if (documents.length) await db.storage.from("mh-documents").remove(documents);
      setStatus(errorText(error));
      setBusy(false);
      return;
    }
    setBusy(false);
    onSaved();
  }
  return <form className="mh-panel mh-form mh-section" onSubmit={save}><h2>{listing ? "Modifica annuncio" : "Nuovo annuncio"}</h2>
    <p className="mh-muted">Salva una bozza o allega foto e documenti per richiedere la verifica. Gli annunci compaiono in ricerca dopo l’approvazione.</p>
    <div className="mh-grid">{base.map(([key, label, type]) => <Field key={key} label={label}><input name={key} type={type} min={type === "number" ? 0 : undefined} maxLength={200} defaultValue={String(listing?.[key as keyof Listing] ?? "")} required={key === "title"} /></Field>)}
      <Field label="Tipologia"><select name="type" defaultValue={listing?.type ?? types[0]}>{types.map((type) => <option key={type}>{type}</option>)}</select></Field>
      {details["map"](([key, label, type]) => <Field key={key} label={label}>{type === "select" ? <select name={key} defaultValue={listing?.details[key] ?? ""}><option value="">Seleziona</option><option>Sì</option><option>No</option>{key === "registered" && <option>Non applicabile</option>}</select> : <input name={key} type={type} min={0} maxLength={300} defaultValue={listing?.details[key]} />}</Field>)}
    </div>
    <fieldset><legend>Arredamento e dotazioni</legend><div className="mh-options">{amenities.map((name) => <label className="mh-check" key={name}><input type="checkbox" name="amenities" value={name} defaultChecked={listing?.amenities.includes(name)} />{name}</label>)}</div></fieldset>
    <Field label="Descrizione"><textarea name="description" maxLength={2000} defaultValue={listing?.details["description"]} /></Field>
    <Field label="Fotografie (la prima sarà quella principale)"><input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple /></Field>
    {!!listing?.photos.length && <label className="mh-check"><input name="replacePhotos" type="checkbox" /> Sostituisci le {listing.photos.length} foto già caricate</label>}
    <Field label="Documenti di verifica (PDF o immagine)"><input name="documents" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple /></Field>
    {!!listing?.documents.length && <label className="mh-check"><input name="replaceDocs" type="checkbox" /> Sostituisci i {listing.documents.length} documenti già caricati</label>}
    <div className="mh-actions"><button className="mh-button mh-outline" value="draft" disabled={busy}>Salva bozza</button><button className="mh-button" value="pending" disabled={busy}>Invia per verifica</button></div>
    {status && <p role="alert">{status}</p>}
  </form>;
}
