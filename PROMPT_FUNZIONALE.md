# Match House — Prompt FUNZIONALE (da modificare e dare in pasto all'AI)

## Come si usa questo documento

Questo file descrive **come deve essere l'app dal punto di vista dell'utente**: schermate, testi, pulsanti, regole, comportamenti. Non contiene dettagli tecnici (quelli sono in `PROMPT_TECNICO.md`).

**Procedura:**
1. Modifica questo file: cambia, aggiungi o cancella ciò che vuoi (testi, campi, schermate, regole).
2. Dallo all'AI insieme a `PROMPT_TECNICO.md` con questa istruzione:
   > *"Questo documento descrive lo stato DESIDERATO dell'app. Confrontalo con il progetto attuale (cartella `apps/`), elenca le differenze e applica tutte le modifiche necessarie a backend, database e app mobile, in modo che l'app si comporti esattamente come descritto. Mantieni ciò che è già coerente. Se qualcosa è ambiguo, scegli la soluzione più semplice e segnalala alla fine."*
3. Convenzioni usate qui: **[ATTUALE]** = già presente nell'app oggi; **[NUOVO]** = non ancora presente (da costruire); **[MODIFICA]** = presente ma da cambiare rispetto a oggi. Quando modifichi il documento puoi aggiornare o rimuovere questi tag: l'AI deve comunque confrontare con il codice reale.

---

## 1. Idea e scopo

**Nome**: Match House
**Slogan**: *"Trova la stanza giusta. Trova le persone giuste."*
**Cos'è**: un'app mobile per trovare **stanze in affitto e coinquilini** con la meccanica dello swipe (stile Tinder).
**Per chi**:
- **Proprietario** (chi affitta una stanza/appartamento o cerca un coinquilino): pubblica l'annuncio e scopre chi cerca casa.
- **Cercatore** (chi cerca una stanza): crea il proprio profilo e scopre gli annunci.
**Come funziona in una frase**: ognuno vede profili/annunci uno alla volta, scorre a destra (**SMASH** = mi interessa) o a sinistra (**PASS** = no); se l'interesse è **reciproco** scatta il **MATCH** e si apre una **chat**.
**Mercato e lingua**: Italia, interfaccia **tutta in italiano**.
**Stile generale**: minimal, professionale, pulito; bianco e nero con solo verde (Smash) e rosso (Pass) come colori.

---

## 2. Tipi di utente

| | Proprietario | Cercatore |
|---|---|---|
| Etichetta in app | "Sono un proprietario" / "Proprietario" | "Cerco una stanza" / "Cerca stanza" |
| Cosa pubblica | Annuncio con foto, prezzo, regole | Profilo personale con foto, bio, preferenze |
| Cosa vede in Esplora | Profili dei cercatori | Annunci dei proprietari |
| Sottotitolo Esplora | "Trova il coinquilino ideale" | "Trova la stanza giusta" |
| Foto massime | **[ATTUALE]** 8 nell'onboarding (10 massimo di sistema) | **[ATTUALE]** 6 |

Il ruolo si sceglie **una sola volta** alla registrazione e non si cambia. **[MODIFICA opzionale: permettere di cambiare ruolo? → NO per ora]**

---

## 3. Mappa dell'app (struttura)

```
Avvio
 ├─ Non loggato → Benvenuto → (Accedi | Registrati → [Verifica email] → Onboarding)
 └─ Loggato      → App principale con 4 tab in basso:
       1. Esplora   (swipe)            → Dettaglio profilo
       2. Mappa     (annunci su mappa) → Dettaglio annuncio
       3. Match/Chat (conversazioni)   → Chat singola
       4. Profilo                      → Modifica profilo | Impostazioni
```

Barra delle tab: sfondo **nero**, solo icone (nessun testo), icona attiva bianca piena con alone circolare tenue, icone inattive bianche semitrasparenti. Icone: Esplora = griglia, Mappa = mappa, Match/Chat = cuore, Profilo = persona.

Regola d'accesso: chi non è loggato (o non ha verificato l'email) viene sempre riportato alla schermata Benvenuto.

---

## 4. Schermate di accesso

### 4.1 Benvenuto
- Logo (quadrato nero arrotondato con icona casa bianca), titolo "Match House", slogan su due righe.
- Due card selezionabili:
  - **"Sono un proprietario"** — "Metto in affitto una stanza o appartamento" (icona casa, sfondo nero)
  - **"Cerco una stanza"** — "Sto cercando dove vivere" (icona lente, sfondo verde)
- In fondo: "Hai già un account? **Accedi**".
- Toccando una card si va alla Registrazione con quel ruolo già scelto.

### 4.2 Registrazione
- Titolo "Crea il tuo account", badge col ruolo scelto ("Proprietario" / "Cerca stanza").
- Sottotitolo: proprietario → "Pubblica la tua stanza e trova il coinquilino ideale"; cercatore → "Trova la stanza perfetta per te".
- Campi: **Email**, **Password** (min. 8 caratteri), **Conferma password**.
- Errori in rosso sotto il campo: "Inserisci la tua email", "Email non valida", "Inserisci una password", "Minimo 8 caratteri", "Le password non coincidono".
- Pulsante **"Crea account"**; link "Hai già un account? Accedi"; nota legale: "Continuando accetti i Termini di servizio e l'Informativa sulla privacy di Match House."
- Dopo la registrazione: se l'email deve essere verificata → schermata Verifica email, altrimenti si prosegue all'onboarding.
- Se l'email è già registrata: avviso "Email già registrata".

### 4.3 Verifica email
- Titolo "Verifica l'email", testo "Abbiamo inviato un codice a 6 cifre a **{email}**".
- 6 caselle singole numeriche: avanzamento automatico alla casella successiva, backspace torna indietro.
- Pulsante **"Verifica"**; "Non hai ricevuto il codice? **Reinvia**".
- Messaggi: "Codice incompleto – Inserisci il codice a 6 cifre"; "Codice errato – Verifica il codice e riprova"; successo "Email verificata! Accedi per continuare." (porta al Login); "Email inviata – Controlla la tua casella di posta".
- Il codice vale 15 minuti.

### 4.4 Accesso (Login)
- Titolo "Bentornato", sottotitolo "Accedi al tuo account Match House", link "← Indietro".
- Campi **Email** e **Password** (con mostra/nascondi), pulsante **"Accedi"**.
- Errori: "Inserisci la tua email", "Email non valida", "Inserisci la password"; accesso fallito → avviso "Errore di accesso" con "Credenziali non valide".
- In fondo: "Non hai un account? **Registrati**" (porta a Benvenuto).
- **[NUOVO]** Link "Password dimenticata?" → schermata per inserire l'email e ricevere il link/codice di reset, poi schermata per scegliere la nuova password.
- La sessione resta attiva alla riapertura dell'app (non si rifà il login ogni volta).

---

## 5. Onboarding (creazione del profilo dopo la registrazione)

Ogni passo ha in alto una **barra di progresso** a segmenti sottili (neri = completati) e un pulsante **"Avanti"**. Le informazioni vengono salvate solo alla fine, nell'ultimo passo.

### 5.1 Onboarding PROPRIETARIO (4 passi)

**Passo 1 — "Informazioni base"** ("Inizia con le informazioni principali della tua proprietà")
- Titolo annuncio* (es. "Stanza singola luminosa in centro")
- Indirizzo* ("Via Roma, 10")
- Città* ("Milano")
- Affitto mensile (€)* (es. 650) — suggerimento: "Escludi o includi le spese nel passo successivo"
- **[MODIFICA]** Oggi la posizione sulla mappa non viene scelta (coordinate = 0,0, quindi l'annuncio non compare correttamente sulla mappa). Voluto: a partire da indirizzo+città l'app trova da sola la posizione (geocodifica) e mostra un'anteprima della mappa con un pin spostabile per correggerla.

**Passo 2 — "Dettagli appartamento"** ("Descrivi le caratteristiche della tua proprietà")
- Stanze totali (default 3), Disponibili (default 1), Coinquilini attuali (default 2), Piano (vuoto = terra "T"), Superficie m² (opzionale).
- Caratteristiche a pulsanti on/off: **Arredato, Spese incluse, Wi-Fi incluso (acceso di default), Animali ok, Fumatori ok, Parcheggio**.

**Passo 3 — "Descrizione e regole"** ("Racconta la tua casa e definisci le regole per i coinquilini")
- Disponibile dal* (formato AAAA-MM-GG) — **[MODIFICA]** sostituire con selettore data (calendario).
- Descrizione* (almeno 20 caratteri; "Racconta tutto sull'appartamento, la zona, l'atmosfera...")
- Regole di casa (opzionale; "No feste, pulizie a rotazione...")
- Info zona (opzionale; "Metro a 5 minuti, supermercato sotto casa...")

**Passo 4 — "Foto dell'appartamento"** ("Aggiungi almeno una foto. La prima sarà la principale.")
- Griglia a due colonne con le foto scelte dalla galleria, fino a 8; la prima ha l'etichetta **"Principale"**; ogni foto ha una × per rimuoverla; riquadro tratteggiato "+ Aggiungi".
- Pulsante: **"Salta per ora"** (nessuna foto) oppure **"Completa il profilo"**. Poi si entra in Esplora.
- Errore di salvataggio: "Errore – Non è stato possibile creare il profilo".
- **[NUOVO]** Possibilità di trascinare le foto per riordinarle.

### 5.2 Onboarding CERCATORE (5 passi)

**Passo 1 — "Chi sei?"** ("Inizia con le tue informazioni personali"): Nome*, Cognome*, Età* (18–99, errore "Età non valida (18-99)").

**Passo 2 — "Il tuo stile di vita"** ("Aiuta i proprietari a conoscerti meglio")
- Abitudini on/off: **Fumatore**, **Ho animali**.
- **Pulizia (1–5)** e **Rumore (1–5)**: 5 pulsanti numerici (default 3 e 2).
- **Hobby** (scelta multipla): Musica, Cinema, Cucina, Lettura, Viaggi, Gaming, Arte, Fotografia, Serie TV, Yoga.
- **Sport** (scelta multipla): Calcio, Basket, Tennis, Ciclismo, Corsa, Palestra, Nuoto, Arrampicata, Padel, Yoga.

**Passo 3 — "Lavoro e bio"** ("Raccontaci di più su di te")
- Occupazione* (es. Studente, Sviluppatore, Designer), Università (se studente), Azienda (se lavoratore).
- Bio* (almeno 20 caratteri; "Presentati: cosa ami fare, come sei come coinquilino...").
- Orari (opzionale, scelta singola): Mattiniero, Notturno, Flessibile, 9-18, Smart working.
- Lingue (scelta multipla, "Italiano" preselezionata): Italiano, Inglese, Spagnolo, Francese, Tedesco, Arabo, Cinese, Portoghese.

**Passo 4 — "Le tue preferenze"** ("Dove stai cercando e qual è il tuo budget?")
- Budget min (€), Budget max (€) — errore se il massimo è inferiore al minimo: "Il budget massimo deve essere maggiore del minimo".
- Città preferita; Data di ingresso desiderata (vuoto = flessibile) — **[MODIFICA]** selettore data.

**Passo 5 — "Le tue foto"** ("Aggiungi delle foto per presentarti ai proprietari. La prima sarà la principale."): come il passo 4 del proprietario, fino a 6 foto.

---

## 6. Tab 1 — Esplora (swipe)

**Intestazione**: "Match House" + sottotitolo in base al ruolo (vedi §2).

**Card**: occupa quasi tutto lo schermo; sotto, le card successive appaiono leggermente più piccole e sfalsate (si vedono fino a 3 card). Si può trascinare **solo** la card in cima.
- **Trascina a destra → SMASH** (etichetta verde "SMASH" in alto a sinistra, la card si tinge di verde).
- **Trascina a sinistra → PASS** (etichetta rossa "PASS" in alto a destra, la card si tinge di rosso).
- L'etichetta compare gradualmente mentre si trascina; la card si inclina leggermente (max 15°).
- Si conferma se si trascina oltre circa un terzo dello schermo o con un gesto veloce; altrimenti la card **torna al centro**.
- Quando lo swipe è confermato la card vola fuori e subito appare la successiva.

**Pulsanti sotto la card**: ✕ rosso (Pass) — ⓘ grigio piccolo (apre il dettaglio completo) — ♥ verde (Smash). Fanno lo stesso dello swipe.

**Contenuto card — annuncio (visto dal cercatore)**:
- Foto grande con puntini per scorrere le foto (tocco sui puntini). Senza foto: "Nessuna foto".
- Titolo, **prezzo "€650/mo"** in verde, indirizzo e città, "80 m² · Piano 2".
- Etichette: Arredato, Spese incluse (verde), Wi-Fi, Animali ok, Fumatori ok, Parcheggio — solo quelle attive.
- Sezioni: Descrizione, Regole di casa, Zona.
- Riepilogo numerico: Stanze libere · Coinquilini · Disponibile dal.

**Contenuto card — profilo (visto dal proprietario)**:
- Foto, **Nome Cognome** + "N anni", occupazione, università o azienda, "Budget: €300 – €800/mo".
- Etichette: Fumatore, Ha animali, lingue parlate.
- Sezioni: Bio, Hobby, Sport; riepilogo: Pulizia x/5 · Rumore x/5 · Orari.

**Regole del feed**:
- Cercatore vede solo annunci con almeno una stanza libera; proprietario vede i cercatori.
- Mai mostrare chi è già stato swipato (né se stessi).
- Prima i profili **con foto**, poi i più vicini (se la posizione è nota), poi i più vecchi.
- Se restano poche card (≤3) se ne caricano altre automaticamente.
- **[NUOVO]** Filtri: pulsante in alto per filtrare per **città**, **budget massimo** (cercatore) e **distanza in km**. I filtri attivi sono visibili e azzerabili.
- **[NUOVO]** Annulla ultimo swipe ("↩") per tornare indietro di una card.

**Stati**: caricamento = scheletro pulsante della card; errore = "Errore di connessione — Controlla la connessione e riprova" + pulsante **Riprova**; vuoto = "Hai visto tutto! — Torna più tardi per nuovi profili".

**Dettaglio profilo** (da ⓘ o dalla mappa): schermata con "← Indietro", scheda completa scorrevole, in basso due pulsanti **Pass** (rosso) e **Smash** (verde). Dopo la scelta si torna indietro.

**Match**: se lo Smash è reciproco compare subito la finestra **"IT'S A MATCH!"**:
- sfondo scuro, due foto circolari (la mia e dell'altro) che arrivano dai lati e si avvicinano;
- testo "Avete scelto di conoscervi";
- pulsante **"Scrivi subito"** (apre la chat) e link **"Continua a esplorare"**.
- Il match arriva anche all'altra persona in tempo reale (se ha l'app aperta).

---

## 7. Tab 2 — Mappa

- Mappa dell'Italia con **un'etichetta prezzo** (es. "€650") su ogni annuncio con stanze libere.
- Barra di ricerca in alto "Cerca città (es. Milano, Roma…)" + pulsante **Cerca**; icona × per azzerare.
- Etichetta sotto la barra: "N annunci a {città}" o "N annunci in Italia" (spinner durante il caricamento).
- Toccando un'etichetta: diventa nera e si apre un fumetto con titolo, indirizzo e città, "N stanze disponibili", "€650/mese" e pulsante **"Vedi profilo completo"** → apre il dettaglio con Pass/Smash.
- Comandi zoom in basso a destra. Mappa funzionante senza chiavi esterne (OpenStreetMap).
- **[NUOVO]** Pulsante "Centra sulla mia posizione"; mappa che si sposta/zooma sulla città cercata; filtri per prezzo.
- Solo i cercatori hanno senso a vedere questa mappa: **[DECISIONE DA PRENDERE]** per i proprietari la tab Mappa può restare (mostra gli annunci concorrenti) oppure essere nascosta.

---

## 8. Tab 3 — Match e Chat

### 8.1 Lista
- Titolo "Match" con contatore dei match.
- **"NUOVI MATCH"**: fila orizzontale di cerchi con foto e nome, con pallino verde, per i match senza messaggi.
- Sotto, la lista delle **conversazioni** (foto tonda, nome, anteprima ultimo messaggio, orario). Se l'ultimo messaggio non è stato letto: pallino verde, nome e anteprima più marcati.
- Nome mostrato: proprietario → "Nome Cognome" del cercatore; cercatore → titolo dell'annuncio.
- Orari: "adesso" (<1h), ora "14:32" (oggi), "ieri", altrimenti "12 mar".
- Ordinata dalla più recente; si aggiorna tirando verso il basso.
- Vuoto: "Nessun match ancora — Continua a esplorare per trovare un match" + pulsante **"Vai a Esplora"**.
- **[NUOVO]** Tenendo premuto su un match: "Elimina match" (con conferma) e "Segnala profilo".
- Esiste anche una griglia dei match a due colonne (foto, nome, prezzo/occupazione): **[DECISIONE]** tenere solo la lista oppure aggiungere un interruttore Lista/Griglia.

### 8.2 Chat singola
- Intestazione con "←" e il nome dell'altra persona.
- Messaggi in bolle: **miei a destra, neri con testo bianco**; **dell'altro a sinistra, grigio chiaro con bordo**. Sotto ogni bolla l'orario relativo ("adesso", "5 min fa", "2h fa", "ieri", "12 mar") e, sui miei, lo stato di lettura.
- Campo "Scrivi un messaggio..." (fino a 1000 caratteri, più righe), pulsante tondo nero con freccia ↑ (disabilitato se vuoto).
- Indicatore "sta scrivendo..." in corsivo quando l'altro digita.
- Chat vuota: "Inizia la conversazione!".
- I messaggi arrivano **in tempo reale**; all'apertura quelli ricevuti vengono segnati come letti.
- Il messaggio inviato compare subito (anche prima della conferma del server); se l'invio fallisce sparisce. **[NUOVO]** In caso di errore mostrare "Non inviato — Riprova" e coda di invio offline.
- **[NUOVO]** Dalla chat: toccando il nome si apre il profilo/annuncio dell'altro; menu "⋯" con Elimina match / Blocca / Segnala.

---

## 9. Tab 4 — Profilo

### 9.1 Il mio profilo
- Titolo "Profilo" + icona ingranaggio (→ Impostazioni).
- Foto grande in alto (principale, oppure iniziale del nome su sfondo grigio).
- Nome (cercatore: "Nome Cognome"; proprietario: titolo annuncio) e sottotitolo (cercatore: occupazione; proprietario: "Città · €prezzo/mo").
- Riquadro con 3 numeri: proprietario = Stanze libere · Coinquilini · Dal (data); cercatore = Anni · Pulizia x/5 · Budget max.
- Pulsante **"Modifica profilo"**; poi Bio / Descrizione, Hobby, Lingue; in fondo scorciatoia **"Impostazioni e account"**.

### 9.2 Modifica profilo
- Intestazione "← Annulla" / "Modifica".
- **Foto**: miniature con "Principale" sulla prima, riquadro "+" per aggiungerne. **[NUOVO]** eliminare e riordinare foto, scegliere la principale.
- Proprietario — oggi modificabili: Affitto mensile, Descrizione, Regole di casa. **[MODIFICA]** rendere modificabili **tutti** i campi dell'onboarding (titolo, indirizzo, città, posizione, stanze, piano, mq, caratteristiche on/off, data disponibilità, info zona).
- Cercatore — oggi modificabili: Occupazione, Bio. **[MODIFICA]** rendere modificabili **tutti** i campi (nome, età, stile di vita, hobby, sport, università/azienda, orari, lingue, budget, città, data ingresso).
- Pulsante **"Salva modifiche"** (spinner mentre salva); in caso di errore avviso con il messaggio reale; a salvataggio riuscito si torna al profilo aggiornato.
- **[NUOVO]** Interruttore "Annuncio attivo / in pausa" per il proprietario (in pausa = non compare nel feed né in mappa) e "Stanze disponibili" modificabile rapidamente, con annuncio che si disattiva automaticamente a 0 stanze.

### 9.3 Impostazioni
Sezioni (card bianche con righe e icone):
- **ACCOUNT**: Email (sola lettura), Tipo account ("Proprietario" / "Cerca stanza").
- **PROFILO**: Modifica profilo.
- **NOTIFICHE**: interruttori "Notifiche push — Nuovi match e messaggi" (acceso) ed "Email — Riepilogo settimanale" (spento). **[NUOVO]** oggi sono solo grafici: devono davvero attivare/disattivare le notifiche.
- **PRIVACY E LEGALE**: Termini di servizio, Informativa sulla privacy. **[MODIFICA]** oggi mostrano un avviso finto; devono aprire le pagine reali.
- **ACCOUNT** (zona pericolosa, in rosso): **Esci dall'account**; **Elimina account** — **[MODIFICA]** oggi risponde "Non disponibile — Contatta support@matchhouse.app"; voluto: conferma con avviso irreversibile e cancellazione reale di account, profilo, foto, swipe, match e messaggi.
- In fondo: "Match House v1.0.0".
- **[NUOVO]** Cambia password; Utenti bloccati; Centro assistenza / contatti.

---

## 10. Regole di business (cosa deve succedere)

1. **Swipe**: ogni persona può swipare un altro utente una sola volta; rivotare aggiorna la scelta (nessun doppione). Non si può fare swipe su se stessi. Massimo 60 swipe al minuto.
2. **Match**: nasce solo se **entrambi** hanno messo SMASH. Esiste un solo match per coppia. Entrambi lo vedono e possono scriversi.
3. **Chat**: possibile solo tra due persone con match. Messaggi max 2000 caratteri, testo semplice (niente HTML). Eliminando il match si cancella anche la chat, per entrambi.
4. **Foto**: solo immagini (JPEG, PNG, WebP, GIF, AVIF), massimo 10 MB ciascuna; la prima caricata è la principale; si può avere al massimo 10 foto (proprietario) / 6 (cercatore).
5. **Annunci**: visibili solo se hanno almeno 1 stanza libera. **[NUOVO]** scadenza/rinnovo dell'annuncio dopo 60 giorni con promemoria.
6. **Età**: minimo 18 anni.
7. **Verifica email**: obbligatoria in produzione per usare l'app; in sviluppo è automatica.
8. **Sicurezza account**: password minimo 8 caratteri; troppi tentativi di accesso → blocco temporaneo con messaggio "Troppi tentativi, riprova tra 15 minuti."
9. **Privacy**: l'email non è mai mostrata agli altri utenti; ognuno può eliminare i propri dati.
10. **Compatibilità** **[NUOVO]**: calcolare una percentuale di compatibilità (budget vs prezzo, città, fumo/animali, pulizia/rumore, orari, interessi in comune) da mostrare come etichetta sulla card (es. "86% compatibile") e usare per ordinare il feed.

---

## 11. Notifiche e comunicazioni

- **[NUOVO]** Notifica push per: nuovo match, nuovo messaggio, annuncio in scadenza.
- **Email** (esistenti): codice di verifica ("Verifica il tuo account Match House"), reset password (link valido 1 ora), nuovo match ("Hai un nuovo match!"). Riepilogo settimanale **[NUOVO]**.
- Badge numerico non letti sull'icona della tab Match/Chat **[NUOVO]**.

---

## 12. Sicurezza, segnalazioni e moderazione **[NUOVO]**

- **Segnala profilo** (motivi: contenuto inappropriato, truffa, falso profilo, altro + testo libero).
- **Blocca utente**: chi blocca sparisce dal feed e dalla chat dell'altro.
- Avviso anti-truffa nella prima chat: "Non anticipare denaro prima di aver visto la stanza."
- Profili segnalati più volte vengono nascosti in attesa di verifica.

---

## 13. Design e comportamento visivo

- **Colori**: sfondo bianco, superfici grigio chiarissimo, testo nero/grigio; **verde** = Smash/prezzo/positivo, **rosso** = Pass/errori/azioni distruttive. Nessun altro colore, nessun gradiente.
- **Forme**: card con angoli molto arrotondati, pulsanti e etichette a pillola, bordi sottilissimi, nessuna ombra decorativa (solo su finestre sovrapposte).
- **Testi**: sans-serif di sistema, titoli in grassetto leggero, etichette di sezione in MAIUSCOLO piccolo grigio.
- **Pulsante principale**: nero con testo bianco, a tutta larghezza, con spinner durante il caricamento. Pulsanti Smash/Pass: tenui verde/rosso con bordo.
- **Campi di testo**: sfondo grigio chiaro, bordo sottile, etichetta sopra, errore rosso sotto; password con mostra/nascondi.
- **Ogni schermata con dati** deve avere sempre: stato di **caricamento**, stato di **errore con "Riprova"**, stato **vuoto** con messaggio e azione.
- **App sempre in modalità chiara**, solo verticale. Animazioni fluide e leggere (swipe, match, comparsa messaggi).
- Tastiera: le schermate con campi non devono mai coprire il campo in uso.

---

## 14. Elenco riepilogativo delle funzionalità

**Già presenti [ATTUALE]**: registrazione con ruolo · verifica email con codice · login persistente · onboarding proprietario (4 passi) e cercatore (5 passi) · caricamento foto · feed swipe con animazioni · match reciproco con finestra celebrativa · mappa annunci con ricerca città · lista nuovi match e conversazioni · chat in tempo reale con "sta scrivendo" e letto · profilo, modifica parziale, impostazioni, logout.

**Da completare / correggere [MODIFICA]**: posizione annuncio sulla mappa (oggi 0,0) · selettori data · modifica profilo completa · eliminazione account reale · pagine legali reali · interruttori notifiche funzionanti · foto: elimina/riordina in modifica.

**Da aggiungere [NUOVO]**: password dimenticata · filtri feed (città, budget, distanza) · annulla ultimo swipe · compatibilità % · notifiche push e badge non letti · blocca/segnala · elimina match dalla chat · stato annuncio attivo/in pausa e scadenza · coda messaggi offline · anteprima profilo dell'altro dalla chat · riepilogo email settimanale.

---

## 15. Le MIE modifiche (scrivi qui sotto cosa vuoi cambiare)

> Scrivi in linguaggio naturale, per schermata. Esempi: *"Nel passo 2 dell'onboarding cercatore aggiungi il campo 'Segno zodiacale'"*, *"Rinomina 'SMASH' in 'LIKE'"*, *"Nella card mostra anche i coinquilini attuali con le loro età"*, *"Aggiungi la tab Preferiti"*.
> L'AI deve applicare queste modifiche **dopo** aver allineato l'app al resto del documento, aggiornando anche backend e database dove serve.

-
-
-
