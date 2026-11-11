import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, House, KeyRound, UsersRound } from "lucide-react";

const services = [
  { title: "Trova la tua prossima casa.", text: "Scopri stanze e appartamenti in affitto attraverso annunci trasparenti, verificati e corredati di tutte le informazioni necessarie.", action: "Esplora gli annunci", to: "/trova-casa", icon: KeyRound },
  { title: "Trova le persone giuste con cui vivere.", text: "Compila un questionario sulle tue abitudini, preferenze e stile di vita. Match House ti aiuta a individuare persone con cui potresti condividere serenamente una casa.", action: "Trova il tuo coinquilino", to: "/coinquilini", icon: UsersRound },
  { title: "Il prossimo passo potrebbe essere comprare casa.", text: "Valuta la possibilità di acquistare un immobile, scopri i costi da considerare e orientati tra le possibili soluzioni di finanziamento.", action: "Scopri come acquistare casa", to: "/acquista", icon: House },
] as const;

export function Home() {
  return <>
    <section className="mh-wrap mh-hero">
      <div className="mh-hero-copy">
        <h1>Il tuo prossimo capitolo inizia <em>da casa.</em></h1>
        <p>Trova una stanza verificata, incontra coinquilini compatibili e scopri come trasformare il tuo prossimo affitto in un futuro investimento.</p>
        <Link className="mh-button" to="/trova-casa">Inizia ora <ArrowRight size={18} /></Link>
      </div>
      <div className="mh-hero-photo"><img src="/seed/room-1.jpg" alt="Interno luminoso di una casa" fetchPriority="high" /></div>
    </section>
    <section className="mh-wrap mh-services" aria-label="I servizi Match House">
      {services.map(({ title, text, action, to, icon: Icon }) => <article className="mh-service" key={to}>
        <span className="mh-service-icon"><Icon size={22} /></span>
        <h2>{title}</h2><p>{text}</p>
        <Link className="mh-text-link" to={to}>{action} <ArrowUpRight size={16} /></Link>
      </article>)}
    </section>
  </>;
}
