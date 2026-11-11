import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList } from "lucide-react";
import { PageTitle } from "@/components/web/common";

export const Route = createFileRoute("/coinquilini")({ component: Intro });
function Intro() {
  return <div className="mh-wrap mh-page"><div className="mh-panel mh-intro"><div>
    <PageTitle title="Con chi vorresti condividere casa?" description="Condividere un appartamento significa condividere spazi, abitudini e quotidianità. Rispondi ad alcune domande per trovare persone con uno stile di vita compatibile con il tuo." />
    <div className="mh-actions"><Link className="mh-button" to="/questionario">Inizia il questionario <ArrowRight size={17} /></Link><Link className="mh-button mh-outline" to="/risultati">I miei risultati</Link></div>
  </div><span className="mh-intro-icon"><ClipboardList size={64} strokeWidth={1.25} /></span></div></div>;
}
