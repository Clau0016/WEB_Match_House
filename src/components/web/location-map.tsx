import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { MapPoint } from "./map-locations";

export type MapPinData = {
  id: string; point: MapPoint; label: string; count?: number;
  listings?: { id: string; title: string; summary: string; price: string }[];
};

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
        html: pin.listings?.length ? "⌂" : pin.count && pin.count > 1 ? String(pin.count) : "●",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const marker = library.marker(pin.point, { icon, title: pin.label, alt: pin.label })
        .on("click", () => callbacks.current.onSelect?.(pin.id)).addTo(markers);
      if (pin.listings?.length) {
        const popup = document.createElement("div");
        popup.className = "mh-map-popup";
        for (const listing of pin.listings) {
          const item = document.createElement("article");
          const title = document.createElement("a");
          title.href = "/annuncio/" + encodeURIComponent(listing.id);
          title.textContent = listing.title;
          const details = document.createElement("p");
          details.textContent = listing.summary;
          const price = document.createElement("strong");
          price.textContent = listing.price;
          const open = document.createElement("a");
          open.href = title.href;
          open.textContent = "Apri annuncio →";
          item.append(title, details, price, open);
          popup.append(item);
        }
        marker.bindPopup(popup, { maxHeight: 280, minWidth: 195 });
      }
    }
    if (pins.length === 1 && pins[0]) map.setView(pins[0].point, 14);
    else if (pins.length > 1) map.fitBounds(library.latLngBounds(pins.map((pin) => pin.point)), { padding: [30, 30], maxZoom: 14 });
    return () => { markers.remove(); };
  }, [engine, pins]);

  useEffect(() => {
    const pin = pins.find((item) => item.id === selected);
    if (engine && pin) engine.map.setView(pin.point, Math.max(engine.map.getZoom(), 14));
  }, [engine, pins, selected]);

  return <div className="mh-map-canvas">
    <div ref={container} aria-label="Mappa interattiva" className="mh-map-surface" />
    {error && <p role="status">Mappa momentaneamente non disponibile.</p>}
  </div>;
}
