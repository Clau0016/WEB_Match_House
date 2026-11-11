import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/web/home";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Match House · Trova casa e coinquilini" }, { name: "description", content: "Cerca stanze e appartamenti verificati, trova coinquilini compatibili e orientati nell’acquisto di casa." }] }),
  component: Home,
});
