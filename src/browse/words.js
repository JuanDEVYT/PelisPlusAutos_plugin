// Textos de la pantalla declarativa para PelisPlus, en español e inglés.
const WORDS_RAW = {
  appName: ["PelisPlus", "PelisPlus"],
  tabHome: ["Inicio", "Home"],
  tabMovies: ["Películas", "Movies"],
  tabSeries: ["Series", "Series"],
  tabAnime: ["Animación", "Animation"],
  recentRail: ["Continuar viendo", "Continue Watching"],
  emptyTitle: ["Sin contenido todavía", "No content yet"],
  emptySub: ["Vuelve a intentarlo en unos instantes.", "Try again in a few moments."],
  failedTitle: ["No se pudo cargar", "Could not load"],
  failedSub: ["Comprueba la conexión e inténtalo de nuevo.", "Check your connection and try again."],
  btnRetry: ["Reintentar", "Retry"],
  btnSearch: ["Buscar", "Search"],
  btnSettings: ["Ajustes", "Settings"],
  brSearchTitle: ["Buscar en PelisPlus", "Search PelisPlus"],
  brSearchHint: ["Película, serie o título...", "Movie, series or title..."],
  brRecentSearches: ["Búsquedas recientes", "Recent searches"],
  brNoResults: ["Sin resultados para esta búsqueda.", "No results for this search."],
  brSearching: ["Buscando en PelisPlus...", "Searching PelisPlus..."],
  brTypeToSearch: ["Escribe un título para empezar a buscar.", "Type a title to start searching."],
  setLangTitle: ["Idioma de audio preferido", "Preferred Audio Language"],
  setLangDesc: ["Prioridad al seleccionar servidores de reproducción automática.", "Priority when selecting auto-play servers."],
  setLangLatino: ["Español Latino", "Latin Spanish"],
  setLangCastellano: ["Castellano (España)", "Castilian (Spain)"],
  setLangSub: ["Subtitulado", "Subtitled"],
  aboutTitle: ["Acerca de PelisPlus", "About PelisPlus"],
  aboutDesc: ["Plugin oficial de catálogo y reproducción en alta definición para Kino.", "Official HD catalog and playback plugin for Kino."],
  aboutAuthor: ["Creado por JuandreXter", "Created by JuandreXter"],
  aboutVersion: ["Versión 8.0.0", "Version 8.0.0"],
  watchNow: ["Reproducir", "Play"],
  moreInfo: ["Ver detalles", "More details"]
};

export const WORDS = Object.fromEntries(
  Object.entries(WORDS_RAW).map(([k, [es, en]]) => [
    k,
    { id: k, es, en, text: es, textEn: en }
  ])
);

export function both(key, vars = {}) {
  const w = WORDS[key] || { id: key, es: key, en: key };
  let es = w.es;
  let en = w.en;
  for (const [k, v] of Object.entries(vars)) {
    es = es.replaceAll(`{${k}}`, v);
    en = en.replaceAll(`{${k}}`, v);
  }
  return { id: w.id, es, en, text: es, textEn: en };
}
