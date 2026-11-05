// Plugin oficial de PelisPlus para Kino (v8.5.0)
import { makeBrowse } from "./browse/index.js";
import {
  BASE_URL,
  fetchHtml,
  parseCards,
  parseHeroSlides,
  resolvePelisPlus,
} from "./pelisplus.js";

const PLUGIN_VERSION = "8.5.0";
const AUTHOR_TAG = "Creado por JuandreXter";
const LOG_PREFIX = `[PelisPlus v${PLUGIN_VERSION}]`;

function printBanner() {
  console.log(`${LOG_PREFIX} ${AUTHOR_TAG}`);
}

// Log emitido una vez por cada carga del módulo del plugin.
printBanner();

printBanner();

function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

function logError(...args) {
  console.error(LOG_PREFIX, ...args);
}

let browseApp = null;
function getBrowseApp() {
  if (!browseApp) {
    browseApp = makeBrowse({
      kino: typeof kino !== "undefined" ? kino : null,
      loadTab: async (tab) => {
        log(`loadTab("${tab}"): cargando contenido declarativo...`);
        if (tab === "inicio") {
          const rows = await home();
          return { rows };
        }
        if (tab === "peliculas") {
          const res = await browse("peliculas", "1");
          return {
            rows: [
              {
                id: "peliculas",
                title: "Películas en HD",
                ref: "peliculas",
                items: res.items,
              },
            ],
          };
        }
        if (tab === "series") {
          const res = await browse("series", "1");
          return {
            rows: [
              {
                id: "series",
                title: "Series de TV",
                ref: "series",
                items: res.items,
              },
            ],
          };
        }
        if (tab === "animacion" || tab === "anime") {
          const res = await browse("animacion", "1");
          return {
            rows: [
              {
                id: "animacion",
                title: "Animación en HD",
                ref: "genero/animacion",
                items: res.items,
              },
            ],
          };
        }
        return { rows: [] };
      },
      searchTitles: async (q) => {
        log(`searchTitles("${q}")`);
        const res = await search({ q });
        return Array.isArray(res) ? res : res.items || [];
      },
    });
  }
  return browseApp;
}

export async function search(query) {
  const q = typeof query === "string" ? query : (query && query.q) || "";
  log(`search(q="${q}"): iniciando búsqueda...`);
  if (!q.trim()) {
    log("search(): consulta vacía");
    return { items: [] };
  }
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(q.trim())}`;
    const html = await fetchHtml(searchUrl);
    const items = parseCards(html);
    log(`search(q="${q}"): encontrados ${items.length} resultados`);
    return { items };
  } catch (err) {
    logError(`search(q="${q}") falló:`, err.message);
    throw err;
  }
}

export async function home() {
  log("home(): cargando carrusel y rieles temáticos...");
  try {
    const [estrenosHtml, moviesHtml, seriesHtml, terrorHtml, accionHtml, animacionHtml] =
      await Promise.all([
        fetchHtml(`${BASE_URL}/peliculas/estrenos`),
        fetchHtml(`${BASE_URL}/peliculas`),
        fetchHtml(`${BASE_URL}/series`),
        fetchHtml(`${BASE_URL}/genero/terror`),
        fetchHtml(`${BASE_URL}/genero/accion`),
        fetchHtml(`${BASE_URL}/genero/animacion`),
      ]);

    const heroSlides = parseHeroSlides(estrenosHtml);
    const movieItems = parseCards(moviesHtml, "movie");
    const seriesItems = parseCards(seriesHtml, "series");
    const estrenosItems = parseCards(estrenosHtml, "movie");
    const terrorItems = parseCards(terrorHtml, "movie");
    const accionItems = parseCards(accionHtml, "movie");
    const animacionItems = parseCards(animacionHtml, "movie");

    const rows = [];
    if (heroSlides && heroSlides.length > 0) {
      rows.push({
        id: "featured",
        title: "Destacados PelisPlus",
        ref: "peliculas/estrenos",
        items: heroSlides,
      });
    }
    rows.push({
      id: "movies",
      title: "Películas Recientes",
      ref: "peliculas",
      items: movieItems,
    });
    rows.push({
      id: "series",
      title: "Series Recientes",
      ref: "series",
      items: seriesItems,
    });
    if (estrenosItems.length > 0) {
      rows.push({
        id: "estrenos",
        title: "Películas de Estreno",
        ref: "peliculas/estrenos",
        items: estrenosItems,
      });
    }
    if (terrorItems.length > 0) {
      rows.push({
        id: "terror",
        title: "Terror · Top Semanal",
        ref: "genero/terror",
        items: terrorItems,
      });
    }
    if (accionItems.length > 0) {
      rows.push({
        id: "accion",
        title: "Acción · Top Semanal",
        ref: "genero/accion",
        items: accionItems,
      });
    }
    if (animacionItems.length > 0) {
      rows.push({
        id: "animacion",
        title: "Animación · Top Semanal",
        ref: "genero/animacion",
        items: animacionItems,
      });
    }

    log(`home(): ${rows.length} rieles cargados con éxito`);
    return rows;
  } catch (err) {
    logError("home() falló:", err.message);
    throw err;
  }
}

export async function browse(ref, cursor) {
  const page = parseInt(cursor || "1", 10);
  log(`browse(ref="${ref}", cursor="${cursor}", page=${page})`);

  let baseUrl = "";
  let defaultKind = "movie";

  if (ref === "peliculas") {
    baseUrl = `${BASE_URL}/peliculas`;
    defaultKind = "movie";
  } else if (ref === "series") {
    baseUrl = `${BASE_URL}/series`;
    defaultKind = "series";
  } else if (ref === "animacion" || ref === "anime") {
    baseUrl = `${BASE_URL}/genero/animacion`;
    defaultKind = "movie";
  } else if (ref === "estrenos") {
    baseUrl = `${BASE_URL}/peliculas/estrenos`;
    defaultKind = "movie";
  } else if (ref.startsWith("generos/") || ref.startsWith("genero/")) {
    const slug = ref.replace(/^(generos|genero)\//, "").replace(/\/$/, "");
    baseUrl = `${BASE_URL}/genero/${slug}`;
    defaultKind = "movie";
  } else if (ref.startsWith("http")) {
    baseUrl = ref;
  } else {
    baseUrl = `${BASE_URL}/genero/${ref}`;
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const targetUrl = page > 1 ? `${cleanBase}/page/${page}` : cleanBase;

  try {
    const html = await fetchHtml(targetUrl);
    const items = parseCards(html, defaultKind);
    const hasNext = html.includes(`/page/${page + 1}`) || items.length >= 18;
    log(`browse("${ref}"): página ${page} cargó ${items.length} items (hasNext: ${hasNext})`);
    return {
      items,
      next: hasNext ? String(page + 1) : null,
    };
  } catch (err) {
    logError(`browse("${ref}") falló:`, err.message);
    throw err;
  }
}

export async function episodes(ref) {
  log(`episodes(ref="${ref}"): extrayendo catálogo de capítulos...`);
  try {
    const html = await fetchHtml(ref);
    const seriesTitle =
      (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "")
        .replace(/<[^>]+>/g, "")
        .trim() || "PelisPlus Serie";

    // Enlaces de episodios directos en la página de la serie o temporada
    const epRegex =
      /<a[^>]+href="(https:\/\/pelisplus\.autos\/episodio\/([^"\/]+)\/?)"[^>]*>([\s\S]*?)<\/a>/gi;
    const episodes = [];
    const seen = new Set();
    let m;

    while ((m = epRegex.exec(html)) !== null) {
      const epHref = m[1];
      const epSlug = m[2];
      const inner = m[3];
      if (seen.has(epSlug)) continue;
      seen.add(epSlug);

      // Parsear temporada y número desde el slug o texto (ej: "marshals-...-1x1")
      const seasonMatch = epSlug.match(/-(\d+)x(\d+)$/i) || inner.match(/(\d+)x(\d+)/i);
      const sNum = seasonMatch ? parseInt(seasonMatch[1], 10) : 1;
      const eNum = seasonMatch ? parseInt(seasonMatch[2], 10) : 1;

      const titleMatch = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const title = titleMatch
        ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
        : `Episodio ${eNum}`;

      episodes.push({
        season: sNum,
        number: eNum,
        ref: epHref,
        title: `${title} ${sNum}x${eNum}`,
        still: "",
        overview: "",
        airDate: "",
        runtimeMinutes: 0,
      });
    }

    // Si no había episodios directos, buscar temporadas (ej: /temporada/...)
    if (episodes.length === 0) {
      const seasonRegex =
        /<a[^>]+href="(https:\/\/pelisplus\.autos\/temporada\/[^"\/]+\/?)"/gi;
      const seasonLinks = [];
      let sm;
      while ((sm = seasonRegex.exec(html)) !== null) {
        if (!seasonLinks.includes(sm[1])) seasonLinks.push(sm[1]);
      }

      for (const sLink of seasonLinks) {
        try {
          const sHtml = await fetchHtml(sLink);
          let em;
          while ((em = epRegex.exec(sHtml)) !== null) {
            const epHref = em[1];
            const epSlug = em[2];
            const inner = em[3];
            if (seen.has(epSlug)) continue;
            seen.add(epSlug);

            const seasonMatch = epSlug.match(/-(\d+)x(\d+)$/i) || inner.match(/(\d+)x(\d+)/i);
            const sNum = seasonMatch ? parseInt(seasonMatch[1], 10) : 1;
            const eNum = seasonMatch ? parseInt(seasonMatch[2], 10) : 1;

            const titleMatch = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
            const title = titleMatch
              ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
              : `Episodio ${eNum}`;

            episodes.push({
              season: sNum,
              number: eNum,
              ref: epHref,
              title: `${title} ${sNum}x${eNum}`,
              still: "",
              overview: "",
              airDate: "",
              runtimeMinutes: 0,
            });
          }
        } catch (_) {}
      }
    }

    episodes.sort((a, b) => a.season - b.season || a.number - b.number);
    log(`episodes(): encontrados ${episodes.length} episodios para "${seriesTitle}"`);

    return {
      series: { title: seriesTitle },
      episodes,
      seasons: [],
    };
  } catch (err) {
    logError(`episodes("${ref}") falló:`, err.message);
    throw err;
  }
}

export async function resolve(ref) {
  log(`resolve(ref="${ref}"): buscando streams HLS...`);
  const preferred =
    (typeof kino !== "undefined" &&
      kino.config &&
      kino.config.get("preferredLang")) ||
    "latino";
  try {
    const res = await resolvePelisPlus(ref, preferred);
    log(`resolve(): stream obtenido: ${res.url}`);
    return res;
  } catch (err) {
    logError(`resolve("${ref}") falló:`, err.message);
    throw err;
  }
}

export async function categories() {
  log("categories(): listando géneros de PelisPlus");
  return [
    { id: "peliculas", ref: "peliculas", title: "Películas", titleEn: "Movies", icon: "movie" },
    { id: "series", ref: "series", title: "Series", titleEn: "Series", icon: "tv" },
    { id: "animacion", ref: "genero/animacion", title: "Animación", titleEn: "Animation", icon: "animation" },
    { id: "estrenos", ref: "estrenos", title: "Estrenos", titleEn: "Premieres", icon: "whatshot" },
    { id: "terror", ref: "genero/terror", title: "Terror", titleEn: "Horror", icon: "psychology" },
    { id: "accion", ref: "genero/accion", title: "Acción", titleEn: "Action", icon: "flash_on" },
    { id: "comedia", ref: "genero/comedia", title: "Comedia", titleEn: "Comedy", icon: "sentiment_very_satisfied" },
    { id: "ciencia-ficcion", ref: "genero/ciencia-ficcion", title: "Ciencia Ficción", titleEn: "Sci-Fi", icon: "rocket" },
    { id: "suspenso", ref: "genero/suspenso", title: "Suspenso", titleEn: "Thriller", icon: "visibility" },
  ];
}

export async function section(ctx) {
  const tab = ctx && typeof ctx === "object" ? ctx.tab : undefined;
  log(`section(tab="${tab}")`);
  const tabs = [
    { id: "inicio", label: "Inicio", labelEn: "Home" },
    { id: "peliculas", label: "Películas", labelEn: "Movies" },
    { id: "series", label: "Series", labelEn: "Series" },
    { id: "animacion", label: "Animación", labelEn: "Animation" },
  ];
  const chosen = tabs.some((x) => x.id === tab) ? tab : tabs[0].id;
  const page = await getBrowseApp().loadTab(chosen);
  return {
    tabs,
    tab: chosen,
    rows: page ? page.rows : [],
  };
}

export async function screen(ctx) {
  log("screen(): generando scaffold nativo declarativo");
  const app = getBrowseApp();
  return app.view(ctx);
}

export async function screenEvent(ev) {
  log(`screenEvent(ev="${ev && ev.name}"): despachando evento`);
  const app = getBrowseApp();
  return app.event(ev);
}
