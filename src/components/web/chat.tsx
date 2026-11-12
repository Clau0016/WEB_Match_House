import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { checked, db, errorText } from "./data";
import { Empty } from "./common";

export function useChatFeed<T>(userId: string, load: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    let active = true;
    let request = 0;
    const update = () => {
      const current = ++request;
      void load().then(
        (data) => { if (active && current === request) setState({ data }); },
        (error) => { if (active && current === request) setState((previous) => ({ ...previous, error: errorText(error) })); },
      );
    };
    refresh.current = update;
    update();
    const channel = db.channel("roommate-chat:" + crypto.randomUUID())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mh_contacts", filter: "recipient_id=eq." + userId }, update)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mh_contacts", filter: "sender_id=eq." + userId }, update)
      .subscribe((status) => { if (status === "SUBSCRIBED") update(); });
    const interval = window.setInterval(() => { if (!document.hidden) update(); }, 15000);
    window.addEventListener("focus", update);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
      void db.removeChannel(channel);
    };
  }, [userId, load]);
  return { ...state, reload: () => refresh.current() };
}

type InboxItem = { person: string; name: string; updated_at: string; preview: string | null };

export function ChatInbox({ userId }: { userId: string }) {
  const load = useCallback(async () => await checked(db.rpc("mh_chat_inbox")) as InboxItem[], []);
  const { data, error } = useChatFeed(userId, load);
  if (error && !data) return <Empty>{error}</Empty>;
  if (!data) return <p>Caricamento conversazioni…</p>;
  if (!data.length) return <p>Apri il profilo di un coinquilino compatibile per avviare una conversazione.</p>;
  return <ul className="mh-chat-list">{data.map((chat) => <li key={chat.person}>
    <Link to="/coinquilini/chat/$id" params={{ id: chat.person }}>
      <strong>{chat.name}</strong>
      <span>{chat.preview ?? "Conversazione avviata"}</span>
    </Link>
  </li>)}</ul>;
}
