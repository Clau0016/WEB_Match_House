import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Empty, Field, PageTitle, useLoad } from "@/components/web/common";
import { checked, db } from "@/components/web/data";
import { amenities, ListingCard, types, type Listing } from "@/components/web/listings";
import { normalized } from "@/components/web/questionnaire";

export const Route = createFileRoute("/trova-casa")({ component: Finder });
function Finder() {
  const state = useLoad(async () => await checked(db.from("mh_public_listings").select("*").order("created_at", { ascending: false })) as Listing[], "public");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const set = (key: string, value: string) => setFilters((old) => ({ ...old, [key]: value }));
  const results = (state.data ?? []).filter((item) =>
    (!filters["city"] || normalized(item.city).includes(normalized(filters["city"]))) &&
    (!filters["minimum"] || item.rent >= Number(filters["minimum"])) &&
    (!filters["maximum"] || item.rent <= Number(filters["maximum"])) &&
    (!filters["type"] || item.type === filters["type"]) &&
    (!filters["roommates"] || item.roommates === Number(filters["roommates"])) &&
    (!filters["available"] || item.available <= (filters["available"] ?? "")) &&
    (!filters["amenity"] || item.amenities.includes(filters["amenity"])));
  return <div className="mh-wrap mh-page">
    <div className="mh-page-heading"><PageTitle title="Trova la tua prossima casa." description="Cerca stanze e appartamenti con informazioni chiare su prezzo, disponibilità e contratto." /><Link className="mh-button mh-outline" to="/account" hash="annunci">Pubblica un annuncio</Link></div>
    <form className="mh-panel mh-filters" onSubmit={(e) => e.preventDefault()}>
      <Field label="Città"><div className="mh-search"><Search size={16} /><input placeholder="Cerca per città" value={filters["city"] ?? ""} onChange={(e) => set("city", e.target.value)} /></div></Field>
      {([["minimum","Prezzo minimo (€)","number"],["maximum","Prezzo massimo (€)","number"],["roommates","Numero di coinquilini","number"],["available","Disponibile entro il","date"]] as const).map(([key, label, type]) => <Field key={key} label={label}><input type={type} min={0} value={filters[key] ?? ""} onChange={(e) => set(key, e.target.value)} /></Field>)}
      <Field label="Tipologia"><select value={filters["type"] ?? ""} onChange={(e) => set("type", e.target.value)}><option value="">Tutte</option>{types.map((type) => <option key={type}>{type}</option>)}</select></Field>
      <Field label="Dotazione"><select value={filters["amenity"] ?? ""} onChange={(e) => set("amenity", e.target.value)}><option value="">Qualsiasi</option>{amenities.map((amenity) => <option key={amenity}>{amenity}</option>)}</select></Field>
    </form>
    {state.error ? <Empty>Impossibile caricare gli annunci. {state.error}</Empty> : state.data === undefined ? <Empty>Caricamento…</Empty> : <>
      <p className="mh-count">{results.length} {results.length === 1 ? "annuncio" : "annunci"}</p>
      {results.length ? <div className="mh-listings">{results.map((listing) => <ListingCard listing={listing} key={listing.id} />)}</div> : <Empty>Nessun annuncio verificato corrisponde ai filtri.</Empty>}
    </>}
  </div>;
}
