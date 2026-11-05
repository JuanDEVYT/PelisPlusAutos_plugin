// PelisPlus Autos plugin for Kino.
import { makeBrowse } from "./browse/index.js";
import { BASE_URL, pageHtml, parseCards, parseHeroSlides, parseEpisodes, resolvePelisPlus } from "./pelisplus.js";

let browseApp;
function getBrowseApp() {
  if (!browseApp) {
    browseApp = makeBrowse();
    browseApp.loadTab = async (tab) => {
      if (tab === "inicio") return { rows: await home() };
      const data = await browse(tab, "1");
      return { rows: [{ id: tab, title: tab === "peliculas" ? "Películas" : tab === "series" ? "Series" : "Anime", ref: tab, items: data.items }] };
    };
  }
  return browseApp;
}

export async function search(arg) {
  const q = typeof arg === "string" ? arg : arg?.q || "";
  if (!q.trim()) return { items: [] };
  return { items: parseCards(await pageHtml(`/busqueda?q=${encodeURIComponent(q.trim())}`)) };
}

export async function home() {
  const [movies, series, home] = await Promise.all([
    pageHtml("/peliculas"), pageHtml("/series"), pageHtml("/")
  ]);
  return [
    { id: "featured", title: "Destacados", ref: "peliculas", items: parseHeroSlides(home) },
    { id: "movies", title: "Películas recientes", ref: "peliculas", items: parseCards(movies, "movie") },
    { id: "series", title: "Series recientes", ref: "series", items: parseCards(series, "series") }
  ].filter((row) => row.items.length);
}

export async function browse(ref, cursor) {
  const page = Math.max(1, Number(cursor) || 1);
  const route = ref === "peliculas" ? "/peliculas" : ref === "series" ? "/series" : ref === "anime" ? "/anime" : `/${ref}`;
  const join = route.includes("?") ? "&" : "?";
  const html = await pageHtml(`${route}${join}page=${page}`);
  const items = parseCards(html, ref === "series" || ref === "anime" ? "series" : "movie");
  return { items, next: items.length >= 18 ? String(page + 1) : null };
}

export async function episodes(ref) {
  const html = await pageHtml(ref);
  const seasons = [...html.matchAll(/href="(https:\/\/pelisplus\.autos\/temporada\/[^"?#]+)"/gi)].map((m) => m[1]);
  const page = seasons[0] ? await pageHtml(seasons[0]) : html;
  const title = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "Serie").replace(/<[^>]+>/g, "").trim();
  return { series: { title }, episodes: parseEpisodes(page) };
}

export async function resolve(ref) { return resolvePelisPlus(ref); }

export async function categories() {
  return [
    ["peliculas", "Películas", "movie"], ["series", "Series", "tv"], ["anime", "Anime", "animation"],
    ["genero/accion", "Acción", "flash_on"], ["genero/aventura", "Aventura", "explore"], ["genero/comedia", "Comedia", "sentiment_very_satisfied"],
    ["genero/drama", "Drama", "theater_comedy"], ["genero/terror", "Terror", "psychology"], ["genero/ciencia-ficcion", "Ciencia ficción", "rocket"]
  ].map(([ref, title, icon]) => ({ id: ref.replace(/[^A-Za-z0-9._~-]/g, "-"), ref, title, icon }));
}

export async function section(ctx = {}) {
  const tabs = ["inicio", "peliculas", "series", "anime"].map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1) }));
  const tab = tabs.some((x) => x.id === ctx.tab) ? ctx.tab : "inicio";
  return { tabs, tab, rows: (await getBrowseApp().loadTab(tab)).rows };
}

export async function screen(ctx) { return getBrowseApp().view(ctx); }
export async function screenEvent(ev) { return getBrowseApp().event(ev); }
