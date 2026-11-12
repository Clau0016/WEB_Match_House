import { Link } from "@tanstack/react-router";
import { House, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useLoad } from "./common";
import { checked, db, euro, useSession, verified } from "./data";
import { LocationMap, type MapPinData } from "./location-map";
import { coordinates, locationFor, type MapPoint } from "./map-locations";

type HouseRow = { id: string; title: string; city: string; area: string; rent: number; status: string; details: Record<string, string> };
type ZoneRow = { city: string; area: string; seekers: number };
type Entry = {
  id: string;
  title: string;
  city: string;
  area: string;
  region: string;
  point: MapPoint | undefined;
  precision: string;
  count: number;
  rent?: number;
  demo?: boolean;
};

export function HousingMap() {
  const [mode, setMode] = useState<"houses" | "roommates">("houses");
  const [region, setRegion] = useState("");
  const [selected, setSelected] = useState("");
  const { session, loading } = useSession();
  const userKey = verified(session) ? session!.user.id : "guest";
  const { data, error } = useLoad(async (): Promise<Entry[]> => {
    if (mode === "houses") {
      const rows = await checked(db.from("mh_public_listings").select("id,title,city,area,rent,status,details").order("city").order("id")) as HouseRow[];
      return rows.map((row) => {
        const location = locationFor(row.city, row.area);
        const exact = coordinates(row.details["map_lat"], row.details["map_lng"]);
        return { ...row, count: 1, demo: row.status === "demo", region: row.details["region"] || location.region,
          point: exact ?? location.point, precision: exact ? "Indirizzo" : location.neighborhood ? "Zona indicativa" : "Centro città" };
      });
    }
    const rows = await checked(db.rpc("mh_map_roommate_zones")) as ZoneRow[];
    return rows.map((row) => {
      const location = locationFor(row.city, row.area);
      const title = row.area ? `${row.area}, ${row.city}` : row.city;
      return { id: JSON.stringify([row.city, row.area]), title, city: row.city, area: row.area, count: Number(row.seekers),
        region: location.region, point: location.point, precision: location.neighborhood ? "Zona indicativa" : "Centro città" };
    });
  }, mode === "houses" ? mode : mode + userKey);
  const regions = [...new Set(data?.map((item) => item.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  const entries = useMemo(() => (data ?? []).filter((item) => !region || item.region === region), [data, region]);
  const groups = useMemo(() => {
    const result = new Map<string, { pin: MapPinData; entries: Entry[] }>();
    for (const entry of entries) {
      if (!entry.point) continue;
      const id = entry.point.join(",");
      const group = result.get(id);
      if (group) {
        group.entries.push(entry);
        group.pin.count = (group.pin.count ?? 0) + entry.count;
      } else {
        result.set(id, { pin: { id, point: entry.point, label: [entry.city, entry.area].filter(Boolean).join(" · "), count: entry.count }, entries: [entry] });
      }
    }
    return result;
  }, [entries]);
  const pins = useMemo(() => [...groups.values()].map(({ pin }) => pin), [groups]);
  const visible = groups.get(selected)?.entries ?? entries;

  function switchMode(next: typeof mode) {
    setMode(next);
    setRegion("");
    setSelected("");
  }

  return <section className="mh-wrap mh-housing-map" aria-labelledby="mh-map-title">
    <div className="mh-page-heading"><h2 id="mh-map-title">Esplora sulla mappa</h2></div>
    <div className="mh-map-toolbar">
      <div className="mh-actions" aria-label="Vista della mappa">
        <button type="button" className="mh-button mh-outline" aria-pressed={mode === "houses"} onClick={() => switchMode("houses")}><House size={17} /> Case in affitto</button>
        <button type="button" className="mh-button mh-outline" aria-pressed={mode === "roommates"} onClick={() => switchMode("roommates")}><UsersRound size={17} /> Coinquilini</button>
      </div>
      <label>Regione <select value={region} onChange={(event) => { setRegion(event.target.value); setSelected(""); }}>
        <option value="">Tutte le regioni</option>{regions.map((name) => <option key={name}>{name}</option>)}
      </select></label>
    </div>
    {mode === "roommates" && <p className="mh-map-note">{!loading && userKey === "guest" ? "Zone di esempio. Accedi per vedere anche le ricerche condivise." : "La mappa mostra il numero di persone che cercano casa per zona."}</p>}
    <div className="mh-map-layout">
      <LocationMap pins={pins} selected={selected} onSelect={setSelected} />
      <div className="mh-map-results" aria-label="Risultati della mappa">
        {selected && <button className="mh-text-link" type="button" onClick={() => setSelected("")}>Mostra tutti</button>}
        {error ? <p role="status">Dati della mappa non disponibili.</p> : !data ? <p role="status">Caricamento…</p> : !visible.length && <p>Nessun risultato in questa regione.</p>}
        {visible.map((entry) => <article key={entry.id}>
          <p className="mh-muted">{[entry.city, entry.region].filter(Boolean).join(" · ")}</p>
          {mode === "houses" ? <Link className="mh-text-link" to="/annuncio/$id" params={{ id: entry.id }}>{entry.title}</Link> :
            <strong>{entry.title}</strong>}
          <p>{entry.rent != null ? euro(entry.rent) + "/mese" : `${entry.count} ${entry.count === 1 ? "persona in cerca" : "persone in cerca"}`}</p>
          <small>{entry.demo && "Annuncio di esempio · "}{entry.point ? entry.precision : "Posizione non ancora disponibile"}</small>
          {entry.point && !selected && <button type="button" className="mh-text-link mh-map-focus" onClick={() => setSelected(entry.point!.join(","))}>Mostra sulla mappa</button>}
        </article>)}
        {mode === "roommates" && <Link className="mh-text-link" to="/coinquilini">Vai a Trova coinquilini</Link>}
      </div>
    </div>
  </section>;
}
