import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { MapPoint } from "./map-locations";

export type MapPinData = { id: string; point: MapPoint; label: string; count?: number };

export function LocationMap({ pins, selected, onSelect, onPick }: {
  pins: MapPinData[];
  selected?: string;
  onSelect?: (id: string) => void;
  onPick?: (point: MapPoint) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onSelect, onPick });
  const [engine, setEngine] = useState<{ library: typeof import("leaflet"); map: LeafletMap }>();
  const [error, setError] = useState(false);
  useEffect(() => { callbacks.current = { onSelect, onPick }; }, [onSelect, onPick]);

  useEffect(() => {
    let active = true;
    let map: LeafletMap | undefined;
    let resize: ResizeObserver | undefined;
    void import("leaflet").then((library) => {
      if (!active || !container.current) return;
      map = library.map(container.current, { scrollWheelZoom: false }).setView([42.8, 12.4], 5);
      library.tileLayer(import.meta.env["VITE_MAP_TILE_URL"] || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        referrerPolicy: "strict-origin-when-cross-origin",
      }).addTo(map);
      map.on("click", ({ latlng }) => callbacks.current.onPick?.([latlng.lat, latlng.lng]));
      resize = new ResizeObserver(() => map?.invalidateSize());
      resize.observe(container.current);
      setEngine({ library, map });
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; resize?.disconnect(); map?.remove(); };
  }, []);

  useEffect(() => {
    if (!engine) return;
    const { library, map } = engine;
    const markers = library.layerGroup().addTo(map);
    for (const pin of pins) {
      const icon = library.divIcon({
        className: "mh-map-marker",
        html: pin.count && pin.count > 1 ? String(pin.count) : "●",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      library.marker(pin.point, { icon, title: pin.label, alt: pin.label })
        .on("click", () => callbacks.current.onSelect?.(pin.id)).addTo(markers);
    }
    if (pins.length === 1 && pins[0]) map.setView(pins[0].point, 14);
    else if (pins.length > 1) map.fitBounds(library.latLngBounds(pins.map((pin) => pin.point)), { padding: [30, 30], maxZoom: 14 });
    return () => { markers.remove(); };
  }, [engine, pins]);

  useEffect(() => {
    const pin = pins.find((item) => item.id === selected);
    if (engine && pin) engine.map.setView(pin.point, 14);
  }, [engine, pins, selected]);

  return <div className="mh-map-canvas">
    <div ref={container} aria-label="Mappa interattiva" className="mh-map-surface" />
    {error && <p role="status">Mappa momentaneamente non disponibile.</p>}
  </div>;
}
