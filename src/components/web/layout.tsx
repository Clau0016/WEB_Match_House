import { Link, Outlet } from "@tanstack/react-router";
import { House } from "lucide-react";
import { useSession } from "./data";

export function Brand() {
  return <Link className="mh-brand" to="/"><span><House size={19} /></span>Match<span className="mh-brand-word">House</span></Link>;
}

export function Layout() {
  const { session } = useSession();
  return <div className="mh-web">
    <header className="mh-header"><div className="mh-wrap mh-nav">
      <Brand />
      <nav aria-label="Navigazione principale">
        <Link to="/" activeOptions={{ exact: true }}>Home</Link>
        <Link to="/trova-casa">Trova casa</Link>
        <Link to="/coinquilini">Trova coinquilini</Link>
        <Link to="/acquista">Acquista casa</Link>
      </nav>
      <div className="mh-auth">{session ? <Link className="mh-button" to="/account">Area personale</Link> : <>
        <Link to="/accesso" search={{ mode: "login" }}>Accedi</Link>
        <Link className="mh-button" to="/accesso" search={{ mode: "register" }}>Registrati</Link>
      </>}</div>
    </div></header>
    <main><Outlet /></main>
    <footer className="mh-footer"><div className="mh-wrap mh-footer-inner">
      <div><Brand /><p>Trova la casa giusta. Trova le persone giuste.</p></div>
      <nav aria-label="Informazioni">{Object.entries({ "chi-siamo": "Chi siamo", contatti: "Contatti", termini: "Termini e condizioni", privacy: "Privacy Policy", cookie: "Cookie Policy", faq: "FAQ" }).map(([hash, label]) => <Link key={hash} to="/informazioni" hash={hash}>{label}</Link>)}</nav>
    </div></footer>
  </div>;
}
