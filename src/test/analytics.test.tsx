import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  useLocation: ({ select }: { select: (location: { pathname: string }) => string }) =>
    select({ pathname: "/trova-casa" }),
}));

const tag = () => document.querySelector("script[src*='googletagmanager.com']");

afterEach(() => {
  tag()?.remove();
  localStorage.clear();
  vi.unstubAllEnvs();
  Reflect.deleteProperty(window, "gtag");
  Reflect.deleteProperty(window, "dataLayer");
  Reflect.deleteProperty(window, "ga-disable-G-MATCHHOUSE");
});

it("loads GA4 only after consent and disables it when consent is withdrawn", async () => {
  vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-MATCHHOUSE");
  const { Analytics } = await import("@/components/web/analytics");
  render(<Analytics />);

  expect(tag()).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Rifiuta" }));
  expect(tag()).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Preferenze statistiche" }));
  fireEvent.click(screen.getByRole("button", { name: "Accetta" }));
  expect(tag()).not.toBeNull();
  const events = Reflect.get(window, "dataLayer") as IArguments[];
  expect(events.map((event) => Array.from(event))).toContainEqual([
    "event", "page_view", expect.objectContaining({ page_location: location.origin + "/trova-casa" }),
  ]);

  fireEvent.click(screen.getByRole("button", { name: "Preferenze statistiche" }));
  fireEvent.click(screen.getByRole("button", { name: "Rifiuta" }));
  expect(Reflect.get(window, "ga-disable-G-MATCHHOUSE")).toBe(true);
  expect(localStorage.getItem("mh-analytics-consent")).toBe("denied");
});
