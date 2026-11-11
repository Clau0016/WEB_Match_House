import { useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const id = String(import.meta.env["VITE_GA_MEASUREMENT_ID"] ?? "").trim();
const configured = /^G-[A-Z0-9]+$/.test(id);
const storageKey = "mh-analytics-consent";
const publicPages = new Map([
  ["/", "Home"],
  ["/trova-casa", "Trova casa"],
  ["/coinquilini", "Trova coinquilini"],
  ["/acquista", "Acquista casa"],
  ["/informazioni", "Informazioni"],
]);
type Choice = "granted" | "denied";
type GoogleWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [flag: `ga-disable-${string}`]: boolean | undefined;
};

function googleTag(browser: GoogleWindow, pageLocation: string) {
  if (browser.gtag) return browser.gtag;
  const queue = browser.dataLayer ??= [];
  function gtag(..._args: unknown[]) { queue.push(arguments); }
  browser.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, {
    send_page_view: false,
    page_location: pageLocation,
    page_referrer: "",
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.append(script);
  return gtag;
}

export function Analytics() {
  const path = useLocation({ select: (location) => location.pathname });
  const [choice, setChoice] = useState<Choice | null>(null);
  const [show, setShow] = useState(false);
  const lastPage = useRef<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === "granted" || stored === "denied") {
        setChoice(stored);
        return;
      }
    } catch { /* The choice can still apply to the current page session. */ }
    setShow(true);
  }, []);

  useEffect(() => {
    if (!configured) return;
    const browser: GoogleWindow = window;
    const title = publicPages.get(path);
    const enabled = choice === "granted" && Boolean(title);
    browser[`ga-disable-${id}`] = !enabled;
    if (!enabled || !title) {
      lastPage.current = null;
      return;
    }
    if (lastPage.current === path) return;
    const pageLocation = location.origin + path;
    const gtag = googleTag(browser, pageLocation);
    gtag("event", "page_view", {
      send_to: id,
      page_title: title,
      page_location: pageLocation,
      page_referrer: lastPage.current ? location.origin + lastPage.current : "",
    });
    lastPage.current = path;
  }, [choice, path]);

  function choose(next: Choice) {
    if (next === "denied") (window as GoogleWindow)[`ga-disable-${id}`] = true;
    try { localStorage.setItem(storageKey, next); }
    catch { /* The current choice remains in memory. */ }
    setChoice(next);
    setShow(false);
  }

  if (!configured) return null;
  return <>
    <button type="button" className="mh-text-link" onClick={() => setShow(!show)} aria-expanded={show} aria-controls="mh-analytics-preferences">Preferenze statistiche</button>
    {show && <section id="mh-analytics-preferences" className="mh-panel mh-analytics" aria-label="Preferenze statistiche">
      <h2>Statistiche di navigazione</h2>
      <p>Con il tuo consenso usiamo Google Analytics per misurare le visite alle pagine pubbliche. Puoi cambiare scelta in qualsiasi momento dal footer.</p>
      <div className="mh-actions">
        <button type="button" className="mh-button mh-outline" onClick={() => choose("denied")}>Rifiuta</button>
        <button type="button" className="mh-button mh-outline" onClick={() => choose("granted")}>Accetta</button>
      </div>
    </section>}
  </>;
}
