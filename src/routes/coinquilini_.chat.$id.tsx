import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Empty, Field, PageTitle, RequireAccount } from "@/components/web/common";
import { useChatFeed } from "@/components/web/chat";
import { checked, db, errorText, useSession, verified } from "@/components/web/data";

export const Route = createFileRoute("/coinquilini_/chat/$id")({ component: ChatPage });
type Message = { id: string; sender_id: string; message: string; created_at: string };

function ChatPage() {
  const { id } = Route.useParams();
  const { session, loading } = useSession();
  const userId = session?.user.id;
  return <div className="mh-wrap mh-page mh-narrow">
    <Link className="mh-text-link" to="/coinquilini" hash="conversazioni">← Le tue chat</Link>
    {userId && verified(session) ? <Conversation key={userId + id} userId={userId} person={id} /> :
      <RequireAccount loading={loading} signedIn={Boolean(session)} />}
  </div>;
}

function Conversation({ userId, person }: { userId: string; person: string }) {
  const [limit, setLimit] = useState(60);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(person)) return null;
    const [name, canSend, messages] = await Promise.all([
      checked(db.rpc("mh_chat_name", { person })),
      checked(db.rpc("mh_chat_can_send", { person })),
      checked(db.from("mh_contacts").select("id,sender_id,message,created_at")
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${person}),and(sender_id.eq.${person},recipient_id.eq.${userId})`)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit)),
    ]);
    return name ? { name: String(name), canSend: Boolean(canSend), messages: (messages as Message[]).reverse() } : null;
  }, [userId, person, limit]);
  const { data, error, reload } = useChatFeed(userId, load);
  const latestMessage = data?.messages.at(-1)?.id;
  useEffect(() => { if (latestMessage) end.current?.scrollIntoView({ block: "nearest" }); }, [latestMessage]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setBusy(true);
    setSendError("");
    try {
      await checked(db.from("mh_contacts").insert({ sender_id: userId, recipient_id: person, message }));
      setDraft("");
      reload();
    } catch (cause) { setSendError(errorText(cause)); }
    finally { setBusy(false); }
  }

  if (!data) return <Empty>{error ?? (data === null ? "Conversazione non disponibile." : "Caricamento…")}</Empty>;
  return <section className="mh-panel mh-section">
    <PageTitle title={data.name} />
    {error && <p role="status">Aggiornamento della chat in corso. {error}</p>}
    <div className="mh-chat-log" role="log" aria-label="Messaggi">
      {data.messages.length === limit && limit < 1000 && <button type="button" className="mh-text-link" onClick={() => setLimit((current) => Math.min(current + 60, 1000))}>Messaggi precedenti</button>}
      {!data.messages.length && <p>Scrivi il primo messaggio.</p>}
      {data.messages.map((message) => <article key={message.id} className={message.sender_id === userId ? "mh-chat-message mh-chat-mine" : "mh-chat-message"}>
        <p className="mh-preserve">{message.message}</p>
        <small>{message.sender_id === userId ? "Tu" : data.name} · <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}</time></small>
      </article>)}
      <div ref={end} />
    </div>
    {data.canSend ? <form className="mh-form" onSubmit={send}>
      <Field label="Messaggio"><textarea rows={2} maxLength={1000} value={draft} onChange={(event) => setDraft(event.target.value)} disabled={busy} required /></Field>
      <button className="mh-button" disabled={busy || !draft.trim()}>Invia</button>
      {sendError && <p role="alert">{sendError}</p>}
    </form> : <p>Al momento questa conversazione è disponibile in sola lettura.</p>}
  </section>;
}
