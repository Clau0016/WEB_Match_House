import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/web/common";

export const Route = createFileRoute("/informazioni")({ component: Information });
function Information() {
  return <div className="mh-wrap mh-page mh-narrow"><PageTitle title="Informazioni su Match House" />
    <section id="chi-siamo" className="mh-panel mh-section"><h2>Chi siamo</h2><p>Match House riunisce la ricerca di un affitto, la compatibilità tra coinquilini e una guida all’acquisto di casa.</p></section>
    <section id="contatti" className="mh-panel mh-section"><h2>Contatti</h2><p>Le richieste sui finanziamenti si inviano dalla sezione Acquista casa. Per gli annunci, usa la funzione di segnalazione nella scheda.</p></section>
    <section id="termini" className="mh-panel mh-section"><h2>Termini e condizioni</h2><p>Pubblica informazioni accurate e documenti che sei autorizzato a condividere. Usa i profili e le richieste di contatto per la ricerca di una convivenza.</p></section>
    <section id="privacy" className="mh-panel mh-section"><h2>Privacy Policy</h2><p>L’account usa il tuo indirizzo email per autenticazione e verifica. Puoi scegliere se rendere visibile il profilo coinquilino e gestire i tuoi dati dall’area personale. I documenti di verifica sono accessibili al proprietario e agli amministratori.</p></section>
    <section id="cookie" className="mh-panel mh-section"><h2>Cookie Policy</h2><p>Il browser conserva le informazioni necessarie a mantenere la sessione di accesso.</p><p>Se attivo per questa versione del sito, Google Analytics viene caricato dopo il consenso per misurare le visite alle sezioni pubbliche. Puoi rifiutare o cambiare scelta in ogni momento da «Preferenze statistiche» nel footer.</p></section>
    <section id="faq" className="mh-panel mh-section"><h2>Domande frequenti</h2><details><summary>Quando compare il mio annuncio?</summary><p>Dopo la verifica manuale da parte dell’amministrazione.</p></details><details><summary>Come viene calcolata la compatibilità?</summary><p>Il calcolo confronta le risposte al questionario, con particolare attenzione a città, budget e data di ingresso.</p></details></section>
  </div>;
}
