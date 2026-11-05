// src/browse/words.js
var WORDS = {
  home: { title: "Inicio", titleEn: "Home" },
  movies: { title: "Pel\xEDculas", titleEn: "Movies" },
  series: { title: "Series", titleEn: "Series" },
  anime: { title: "Anime", titleEn: "Anime" },
  terror: { title: "Terror", titleEn: "Horror" },
  accion: { title: "Acci\xF3n", titleEn: "Action" },
  comedia: { title: "Comedia", titleEn: "Comedy" },
  cienciaFiccion: { title: "Ciencia ficci\xF3n", titleEn: "Sci-Fi" },
  suspenso: { title: "Suspenso", titleEn: "Thriller" },
  animacion: { title: "Animaci\xF3n", titleEn: "Animation" },
  search: { title: "Buscar", titleEn: "Search" },
  settings: { title: "Ajustes", titleEn: "Settings" },
  play: { title: "Reproducir", titleEn: "Play" },
  more: { title: "M\xE1s", titleEn: "More" }
};

// src/browse/view.js
function view(ctx = {}) {
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
        { type: "Text", text: "Pel\xEDculas y series en HD", style: "h3" },
        { type: "Text", text: state.status || "Explora el cat\xE1logo de PelisPlus", style: "body" }
      ]
    }
  };
}
function event(ev = {}) {
  if (ev.name === "search") return { state: { sq: "" }, route: { push: "search" } };
  if (ev.name === "settings") return { state: { fromBrowse: true }, route: { push: "settings" } };
  return { state: {}, route: {} };
}

// src/browse/model.js
function metaAsk(item) {
  if (!item || !item.title) return null;
  return {
    type: item.kind === "series" || item.type === "series" ? "tv" : "movie",
    title: item.title.replace(/\s*\(\d{4}\)\s*$/, ""),
    year: item.year || void 0,
    language: "es"
  };
}

// src/browse/index.js
function makeBrowse() {
  return { view, event, metaAsk };
}

// src/utils.js
async function fetchHtml(url, options = {}) {
  const client = typeof kino !== "undefined" ? kino.fetch.bind(kino) : globalThis.fetch;
  const res = await client(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://pelisplus.autos/",
      ...options.headers
    },
    ...options
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// src/pelisplus.js
var BASE_URL = "https://pelisplus.autos";
async function pageHtml(path) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetchHtml(url);
  return res.text();
}
function strip(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#8217;/g, "'").replace(/\s+/g, " ").trim();
}
function cleanId(value) {
  return String(value || "item").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._~-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 128) || "item";
}
function parseCards(html, fallbackType = "movie") {
  const out = [];
  const rx = /<a\b(?=[^>]*\bhref="(https?:\/\/pelisplus\.autos\/(?:pelicula|serie)\/[^"?#]+)[^"]*")[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const seen = /* @__PURE__ */ new Set();
  while ((m = rx.exec(html)) !== null) {
    const ref = m[1];
    if (seen.has(ref)) continue;
    seen.add(ref);
    const block = m[0];
    const slug = ref.split("/").filter(Boolean).pop();
    const title = strip((block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i) || block.match(/(?:title|alt)="([^"]+)"/i) || [])[1]) || slug.replace(/-/g, " ");
    const art = (block.match(/(?:src|data-src)="([^"]+)"/i) || block.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i) || [])[1] || null;
    const year = (strip(block).match(/\b(19\d{2}|20\d{2})\b/) || [])[1];
    const type = ref.includes("/serie/") ? "series" : fallbackType;
    out.push({ id: cleanId(slug), ref, title, art, kind: type, type, year: year ? Number(year) : void 0 });
  }
  return out;
}
function parseHeroSlides(html) {
  return parseCards(html).slice(0, 8);
}
function decodeBase64(value) {
  try {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let bits = 0, count = 0, result = "";
    for (const char of String(value || "").replace(/=+$/, "")) {
      const n = chars.indexOf(char);
      if (n < 0) continue;
      bits = bits << 6 | n;
      count += 6;
      if (count >= 8) {
        count -= 8;
        result += String.fromCharCode(bits >> count & 255);
      }
    }
    try {
      return decodeURIComponent(Array.from(result).map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
    } catch (_) {
      return result;
    }
  } catch (_) {
    return null;
  }
}
function decodeNupload(html) {
  const offset = html.match(/parseInt\(atob\(value\)\.replace\([^)]*\)\)\s*-\s*(\d+)/);
  const array = html.match(/var\s+[A-Za-z0-9_]+\s*=\s*(\["[^"]+"(?:,"[^"]+")*\])/);
  if (!offset || !array) return null;
  let values;
  try {
    values = JSON.parse(array[1]);
  } catch (_) {
    return null;
  }
  const subtract = Number(offset[1]);
  let base = "";
  for (const encoded of values) {
    const decoded = decodeBase64(encoded);
    const digits = (decoded || "").replace(/\D/g, "");
    if (!digits) return null;
    base += String.fromCharCode(Number(digits) - subtract);
  }
  const suffix = html.match(/var\s+sesz\s*=\s*["']([^"']+)["']/);
  return suffix ? `${base}?s=${suffix[1]}` : base;
}
async function resolvePelisPlus(ref) {
  const html = await pageHtml(ref);
  const encoded = [...html.matchAll(/data-server="([^"]+)"/gi)].map((m) => m[1]);
  for (const value of encoded) {
    const server = decodeBase64(value);
    if (!server || !/nupload\.my\/watch\//i.test(server)) continue;
    const res = await fetchHtml(server, { headers: { Referer: `${BASE_URL}/` } });
    const hostUrl = decodeNupload(await res.text());
    if (!hostUrl) continue;
    return {
      url: hostUrl,
      mime: "application/x-mpegURL",
      headers: { Referer: "https://nupload.my/", "User-Agent": "Mozilla/5.0" }
    };
  }
  throw new Error("PelisPlus no proporcion\xF3 un servidor Nupload reproducible");
}
function parseEpisodes(html) {
  const rx = /<a\b(?=[^>]*\bhref="(https?:\/\/pelisplus\.autos\/episodio\/[^"?#]+)[^"]*")[^>]*>([\s\S]*?)<\/a>/gi;
  const out = [];
  let m;
  const seen = /* @__PURE__ */ new Set();
  while ((m = rx.exec(html)) !== null) {
    const ref = m[1];
    if (seen.has(ref)) continue;
    seen.add(ref);
    const text = strip(m[0]);
    const se = ref.match(/-(\d+)x(\d+)\/?$/i) || text.match(/(\d+)\s*[xX]\s*(\d+)/);
    const art = (m[0].match(/(?:src|data-src)="([^"]+)"/i) || [])[1] || null;
    out.push({ season: se ? Number(se[1]) : 1, number: se ? Number(se[2]) : out.length + 1, ref, title: text || `Episodio ${out.length + 1}`, still: art });
  }
  return out.sort((a, b) => a.season - b.season || a.number - b.number);
}

// src/plugin.js
var browseApp;
function getBrowseApp() {
  if (!browseApp) {
    browseApp = makeBrowse();
    browseApp.loadTab = async (tab) => {
      if (tab === "inicio") return { rows: await home() };
      const data = await browse(tab, "1");
      return { rows: [{ id: tab, title: tab === "peliculas" ? "Pel\xEDculas" : tab === "series" ? "Series" : "Anime", ref: tab, items: data.items }] };
    };
  }
  return browseApp;
}
async function search(arg) {
  const q = typeof arg === "string" ? arg : arg?.q || "";
  if (!q.trim()) return { items: [] };
  return { items: parseCards(await pageHtml(`/busqueda?q=${encodeURIComponent(q.trim())}`)) };
}
async function home() {
  const [movies, series, home2] = await Promise.all([
    pageHtml("/peliculas"),
    pageHtml("/series"),
    pageHtml("/")
  ]);
  return [
    { id: "featured", title: "Destacados", ref: "peliculas", items: parseHeroSlides(home2) },
    { id: "movies", title: "Pel\xEDculas recientes", ref: "peliculas", items: parseCards(movies, "movie") },
    { id: "series", title: "Series recientes", ref: "series", items: parseCards(series, "series") }
  ].filter((row) => row.items.length);
}
async function browse(ref, cursor) {
  const page = Math.max(1, Number(cursor) || 1);
  const route = ref === "peliculas" ? "/peliculas" : ref === "series" ? "/series" : ref === "anime" ? "/anime" : `/${ref}`;
  const join = route.includes("?") ? "&" : "?";
  const html = await pageHtml(`${route}${join}page=${page}`);
  const items = parseCards(html, ref === "series" || ref === "anime" ? "series" : "movie");
  return { items, next: items.length >= 18 ? String(page + 1) : null };
}
async function episodes(ref) {
  const html = await pageHtml(ref);
  const seasons = [...html.matchAll(/href="(https:\/\/pelisplus\.autos\/temporada\/[^"?#]+)"/gi)].map((m) => m[1]);
  const page = seasons[0] ? await pageHtml(seasons[0]) : html;
  const title = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "Serie").replace(/<[^>]+>/g, "").trim();
  return { series: { title }, episodes: parseEpisodes(page) };
}
async function resolve(ref) {
  return resolvePelisPlus(ref);
}
async function categories() {
  return [
    ["peliculas", "Pel\xEDculas", "movie"],
    ["series", "Series", "tv"],
    ["anime", "Anime", "animation"],
    ["genero/accion", "Acci\xF3n", "flash_on"],
    ["genero/aventura", "Aventura", "explore"],
    ["genero/comedia", "Comedia", "sentiment_very_satisfied"],
    ["genero/drama", "Drama", "theater_comedy"],
    ["genero/terror", "Terror", "psychology"],
    ["genero/ciencia-ficcion", "Ciencia ficci\xF3n", "rocket"]
  ].map(([ref, title, icon]) => ({ id: ref.replace(/[^A-Za-z0-9._~-]/g, "-"), ref, title, icon }));
}
async function section(ctx = {}) {
  const tabs = ["inicio", "peliculas", "series", "anime"].map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1) }));
  const tab = tabs.some((x) => x.id === ctx.tab) ? ctx.tab : "inicio";
  return { tabs, tab, rows: (await getBrowseApp().loadTab(tab)).rows };
}
async function screen(ctx) {
  return getBrowseApp().view(ctx);
}
async function screenEvent(ev) {
  return getBrowseApp().event(ev);
}
export {
  browse,
  categories,
  episodes,
  home,
  resolve,
  screen,
  screenEvent,
  search,
  section
};
