// Árbol declarativo compatible con Kino API v14.
import { WORDS } from "./words.js";

export function view(ctx = {}) {
  const state = ctx.state || {};
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      title: "PelisPlus",
      actions: [
        { type: "IconButton", key: "search", icon: "search", labelText: WORDS.search?.title || "Buscar", onPressed: { event: "search" } },
        { type: "IconButton", key: "settings", icon: "settings", labelText: WORDS.settings?.title || "Ajustes", onPressed: { event: "settings" } }
      ]
    },
    body: {
      type: "Column",
      gap: 12,
      children: [
        { type: "Text", text: "Películas y series en HD", style: "h3" },
        { type: "Text", text: state.status || "Explora el catálogo de PelisPlus", style: "body" }
      ]
    }
  };
}

export function event(ev = {}) {
  if (ev.name === "search") return { state: { sq: "" }, route: { push: "search" } };
  if (ev.name === "settings") return { state: { fromBrowse: true }, route: { push: "settings" } };
  return { state: {}, route: {} };
}
