import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, House, KeyRound, MapPin, Search, UsersRound } from "lucide-react";
import type { FormEvent } from "react";
import { useLoad } from "./common";
import { checked, db } from "./data";
import { ListingCard, type Listing } from "./listings";

const services = [
  { title: "Trova la tua prossima casa.", text: "Scopri stanze e appartamenti in affitto attraverso annunci trasparenti, verificati e corredati di tutte le informazioni necessarie.", action: "Esplora gli annunci", to: "/trova-casa", icon: KeyRound },
  { title: "Trova le persone giuste con cui vivere.", text: "Compila un questionario sulle tue abitudini, preferenze e stile di vita. Match House ti aiuta a individuare persone con cui potresti condividere serenamente una casa.", action: "Trova il tuo coinquilino", to: "/coinquilini", icon: UsersRound },
  { title: "Il prossimo passo potrebbe essere comprare casa.", text: "Valuta la possibilità di acquistare un immobile, scopri i costi da considerare e orientati tra le possibili soluzioni di finanziamento.", action: "Scopri come acquistare casa", to: "/acquista", icon: House },
] as const;

export function Home() {
  const navigate = useNavigate();
  const { data: listings } = useLoad(async () => await checked(
    db.from("mh_public_listings").select("*").order("created_at", { ascending: false }).limit(4),
  ) as Listing[], "homepage-listings");
  const cities = [...new Set(listings?.map((listing) => listing.city))];
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const city = String(new FormData(event.currentTarget).get("city") ?? "").trim();
    void navigate({ to: "/trova-casa", search: city ? { city } : {} });
  }

  return <>
    <section className="mh-wrap mh-hero mh-landing-hero">
      <div className="mh-hero-copy">
        <h1>Il tuo prossimo capitolo inizia <em>da casa.</em></h1>
        <p>Esplora gli affitti, trova coinquilini compatibili e valuta il tuo prossimo acquisto.</p>
        <form className="mh-hero-search" onSubmit={search}>
          <label><MapPin size={19} aria-hidden="true" /><input name="city" type="search" placeholder="In quale città cerchi?" aria-label="Città" maxLength={80} /></label>
          <button className="mh-button" type="submit"><Search size={17} aria-hidden="true" />Cerca</button>
        </form>
        {!!cities.length && <div className="mh-city-links" aria-label="Città negli annunci">{cities.map((city) => <Link key={city} to="/trova-casa" search={{ city }}>{city}</Link>)}</div>}
      </div>
      <div className="mh-hero-photo"><img src="/seed/room-1.jpg" alt="Interno luminoso di una casa" fetchPriority="high" /></div>
    </section>
    <section className="mh-wrap mh-services" aria-label="I servizi Match House">
      {services.map(({ title, text, action, to, icon: Icon }) => <Link to={to} className="mh-service" key={to}>
        <span className="mh-service-icon"><Icon size={22} /></span>
        <h2>{title}</h2><p>{text}</p>
        <span className="mh-text-link">{action} <ArrowUpRight size={16} /></span>
      </Link>)}
    </section>
    {!!listings?.length && <section className="mh-wrap mh-home-listings" aria-labelledby="mh-home-listings-title">
      <div className="mh-page-heading"><h2 id="mh-home-listings-title">Esplora gli annunci</h2><Link to="/trova-casa" className="mh-text-link">Vedi tutti <ArrowRight size={17} /></Link></div>
      <div className="mh-listings">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
    </section>}
  </>;
}
