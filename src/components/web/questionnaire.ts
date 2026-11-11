export type Answer = string | string[];
export type Answers = Record<string, Answer>;
type Question = { id: string; label: string; options?: readonly string[]; type?: string; optional?: boolean; min?: number; max?: number; multiple?: boolean };
const scale = ["1", "2", "3", "4", "5"];
export const questions: Question[] = [
  { id: "age", label: "Quanti anni hai?", type: "number", min: 18, max: 120 },
  { id: "city", label: "In quale città cerchi casa?" },
  { id: "job", label: "Qual è la tua occupazione?", options: ["Studente", "Lavoratore", "Altro"] },
  { id: "organization", label: "Quale università frequenti o per quale azienda lavori?", optional: true },
  { id: "languages", label: "Quali lingue parli?" },
  { id: "schedule", label: "Come descriveresti i tuoi orari?", options: ["Mattiniero", "Notturno", "Regolare", "Flessibile"] },
  { id: "home", label: "Quanto tempo trascorri normalmente a casa?", options: ["Quasi sempre", "Principalmente la sera", "Principalmente nei weekend", "Poco, sono spesso fuori"] },
  { id: "remote", label: "Lavori o studi da casa?", options: ["Sempre", "Alcuni giorni", "Raramente", "Mai"] },
  { id: "clean", label: "Quanto è importante per te la pulizia degli spazi comuni?", options: scale },
  { id: "noise", label: "Quanto rumore sei disposto ad accettare in casa?", options: scale },
  { id: "chores", label: "Come preferisci gestire le pulizie?", options: ["Turni organizzati", "Ognuno pulisce ciò che utilizza", "Pulizie condivise", "Non ho preferenze"] },
  { id: "social", label: "Che tipo di convivenza preferisci?", options: ["Tranquilla e riservata", "Socievole e dinamica", "Un equilibrio tra le due"] },
  { id: "guests", label: "Quanto spesso ti piace invitare amici a casa?", options: ["Spesso", "Qualche volta", "Raramente", "Quasi mai"] },
  { id: "smoke", label: "Fumi?", options: ["Sì", "No", "Solo occasionalmente"] },
  { id: "pets", label: "Hai animali o vorresti averne?", options: ["Ho animali", "Vorrei averne", "No"] },
  { id: "sports", label: "Quanto sei sportivo?", options: ["Molto", "Abbastanza", "Poco", "Per niente"] },
  { id: "interests", label: "Quali sono i tuoi interessi?", options: ["Sport", "Cinema e serie TV", "Cucina", "Viaggi", "Musica", "Gaming", "Lettura", "Arte", "Fotografia", "Socialità", "Altro"], multiple: true },
  { id: "minimum", label: "Qual è il tuo budget mensile minimo in euro?", type: "number", min: 0, max: 100000 },
  { id: "maximum", label: "Qual è il tuo budget mensile massimo in euro?", type: "number", min: 0, max: 100000 },
  { id: "area", label: "Quale zona preferisci?", optional: true },
  { id: "move", label: "Quando vorresti entrare?", type: "date" },
  { id: "stay", label: "Per quanto tempo prevedi di restare?", options: ["Fino a 3 mesi", "Da 3 a 6 mesi", "Da 6 a 12 mesi", "Più di un anno", "Da definire"] },
  { id: "bio", label: "Racconta brevemente chi sei e che tipo di coinquilino cerchi.", type: "textarea" },
];

export type Roommate = { user_id: string; name: string; answers: Answers; photo: string | null; show_details: boolean };
export const normalized = (value: Answer | undefined) => String(value ?? "").trim().toLocaleLowerCase("it");
