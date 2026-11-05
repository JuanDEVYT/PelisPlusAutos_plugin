// src/browse/model.js
var TAB_IDS = ["inicio", "peliculas", "series", "animacion"];
var MAX_SLIDES = 6;
var MAX_RAILS = 8;
var MAX_RAIL_ITEMS = 24;
var MAX_SLIDE_TEXT = 160;
var HTTPS = /^https?:\/\//;
function cardOf(item) {
  if (!item) return null;
  const out = {
    id: `${item.kind || "movie"}-${item.id}`,
    ref: item.ref,
    title: item.title,
    kind: item.kind || "movie"
  };
  const poster = item.poster || item.art || item.logo;
  if (poster && HTTPS.test(poster)) out.poster = poster;
  if (item.backdrop && HTTPS.test(item.backdrop)) out.backdrop = item.backdrop;
  if (item.rating !== void 0) out.rating = item.rating;
  if (item.year !== void 0) out.year = item.year;
  if (item.badges && Array.isArray(item.badges)) out.badges = item.badges.slice(0, 3);
  return out;
}
function slidesOf(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const img = it.backdrop || it.image || it.poster || it.art;
    if (!img || !HTTPS.test(img)) continue;
    if (!it.ref || typeof it.ref !== "string") continue;
    const title = typeof it.title === "string" ? it.title : "";
    const rawTxt = typeof it.text === "string" ? it.text : typeof it.overview === "string" ? it.overview : "";
    const text = rawTxt.length > MAX_SLIDE_TEXT ? rawTxt.slice(0, MAX_SLIDE_TEXT - 1).trim() + "\u2026" : rawTxt;
    const s = {
      id: `${it.kind || "movie"}-${it.id || title}`,
      ref: it.ref,
      kind: it.kind || "movie",
      title,
      image: img,
      text
    };
    if (it.logo && HTTPS.test(it.logo)) s.logo = it.logo;
    out.push(s);
    if (out.length >= MAX_SLIDES) break;
  }
  return out;
}
function railsOf(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const itemsRaw = Array.isArray(row.items) ? row.items : [];
    const items = itemsRaw.map(cardOf).filter(Boolean).slice(0, MAX_RAIL_ITEMS);
    if (items.length === 0) continue;
    out.push({
      id: String(row.id || row.ref || out.length),
      title: String(row.title || ""),
      ref: typeof row.ref === "string" ? row.ref : void 0,
      items
    });
    if (out.length >= MAX_RAILS) break;
  }
  return out;
}
function tabOf(page) {
  if (!page || typeof page !== "object") return null;
  const rows = Array.isArray(page.rows) ? page.rows : [];
  const explicitSlides = Array.isArray(page.slides) ? page.slides : [];
  let slides = slidesOf(explicitSlides);
  let rails = railsOf(rows);
  if (slides.length === 0 && rails.length > 0) {
    const first = rails[0];
    const rest = rails.slice(1);
    const promoted = first.items.filter((i) => i.backdrop || i.poster).slice(0, MAX_SLIDES);
    if (promoted.length > 0) {
      slides = slidesOf(promoted.map((c) => ({ ...c, image: c.backdrop || c.poster })));
      rails = rest;
    }
  }
  return { slides, rails };
}
function playedKey(ref) {
  const r = String(ref || "");
  const m = /\/(?:pelicula|serie|episodio)\/([^\/\?#]+)/.exec(r) || /pelisplus\.autos\/[^\/]+\/([^\/\?#]+)/.exec(r);
  return m ? m[1] : "";
}
function recentOf(keys, loadedTabs) {
  if (!Array.isArray(keys) || keys.length === 0) return [];
  const pool = /* @__PURE__ */ new Map();
  for (const tab of loadedTabs) {
    if (!tab) continue;
    for (const r of tab.rails) {
      for (const c of r.items) {
        const k = playedKey(c.ref);
        if (k && !pool.has(k)) pool.set(k, c);
      }
    }
    for (const s of tab.slides) {
      const k = playedKey(s.ref);
      if (k && !pool.has(k)) {
        pool.set(k, {
          id: s.id,
          ref: s.ref,
          kind: s.kind,
          title: s.title,
          poster: s.image,
          backdrop: s.image
        });
      }
    }
  }
  const out = [];
  for (const k of keys) {
    const hit = pool.get(k);
    if (hit) out.push(hit);
  }
  return out;
}

// src/browse/words.js
var WORDS_RAW = {
  appName: ["PelisPlus", "PelisPlus"],
  tabHome: ["Inicio", "Home"],
  tabMovies: ["Pel\xEDculas", "Movies"],
  tabSeries: ["Series", "Series"],
  tabAnime: ["Animaci\xF3n", "Animation"],
  recentRail: ["Continuar viendo", "Continue Watching"],
  emptyTitle: ["Sin contenido todav\xEDa", "No content yet"],
  emptySub: ["Vuelve a intentarlo en unos instantes.", "Try again in a few moments."],
  failedTitle: ["No se pudo cargar", "Could not load"],
  failedSub: ["Comprueba la conexi\xF3n e int\xE9ntalo de nuevo.", "Check your connection and try again."],
  btnRetry: ["Reintentar", "Retry"],
  btnSearch: ["Buscar", "Search"],
  btnSettings: ["Ajustes", "Settings"],
  brSearchTitle: ["Buscar en PelisPlus", "Search PelisPlus"],
  brSearchHint: ["Pel\xEDcula, serie o t\xEDtulo...", "Movie, series or title..."],
  brRecentSearches: ["B\xFAsquedas recientes", "Recent searches"],
  brNoResults: ["Sin resultados para esta b\xFAsqueda.", "No results for this search."],
  brSearching: ["Buscando en PelisPlus...", "Searching PelisPlus..."],
  brTypeToSearch: ["Escribe un t\xEDtulo para empezar a buscar.", "Type a title to start searching."],
  setLangTitle: ["Idioma de audio preferido", "Preferred Audio Language"],
  setLangDesc: ["Prioridad al seleccionar servidores de reproducci\xF3n autom\xE1tica.", "Priority when selecting auto-play servers."],
  setLangLatino: ["Espa\xF1ol Latino", "Latin Spanish"],
  setLangCastellano: ["Castellano (Espa\xF1a)", "Castilian (Spain)"],
  setLangSub: ["Subtitulado", "Subtitled"],
  aboutTitle: ["Acerca de PelisPlus", "About PelisPlus"],
  aboutDesc: ["Plugin oficial de cat\xE1logo y reproducci\xF3n en alta definici\xF3n para Kino.", "Official HD catalog and playback plugin for Kino."],
  aboutAuthor: ["Creado por JuandreXter", "Created by JuandreXter"],
  aboutVersion: ["Versi\xF3n 8.0.0", "Version 8.0.0"],
  watchNow: ["Reproducir", "Play"],
  moreInfo: ["Ver detalles", "More details"]
};
var WORDS = Object.fromEntries(
  Object.entries(WORDS_RAW).map(([k, [es, en]]) => [
    k,
    { id: k, es, en, text: es, textEn: en }
  ])
);
function both(key, vars = {}) {
  const w = WORDS[key] || { id: key, es: key, en: key };
  let es = w.es;
  let en = w.en;
  for (const [k, v] of Object.entries(vars)) {
    es = es.replaceAll(`{${k}}`, v);
    en = en.replaceAll(`{${k}}`, v);
  }
  return { id: w.id, es, en, text: es, textEn: en };
}

// src/browse/logo.js
var LOGO_ASPECT = "banner";
var LOGO_DATA = "data:image/png;base64,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";

// src/browse/view.js
var TAB_KEYS = {
  inicio: "tabHome",
  peliculas: "tabMovies",
  series: "tabSeries",
  animacion: "tabAnime",
  anime: "tabAnime"
};
var POLL_MS = 1500;
var SEARCH_CAP = 60;
var twin = (key, field = "text", vars) => {
  const w = both(key, vars);
  return { [field]: w.es, [field + "En"]: w.en };
};
var logo = () => ({
  type: "Image",
  key: "logo",
  url: LOGO_DATA,
  aspect: LOGO_ASPECT,
  fit: "contain",
  h: 40,
  alt: "PelisPlus",
  altEn: "PelisPlus",
  fallback: { type: "Text", text: "PelisPlus", textEn: "PelisPlus", style: "h4" }
});
var tabBar = (active) => ({
  type: "TabBar",
  key: "tabs",
  divider: false,
  value: active,
  onChanged: "tab",
  tabs: TAB_IDS.map((id) => ({ value: id, ...twin(TAB_KEYS[id], "label") }))
});
var railSkeleton = (n) => ({
  type: "Column",
  key: "skel" + n,
  gap: 8,
  children: [
    { type: "Skeleton", shape: "line" },
    { type: "Row", gap: 12, sizes: ["compact"], children: [1, 2, 3].map((i) => ({ type: "Skeleton", shape: "card", key: `sk${n}c${i}`, flex: 1 })) },
    { type: "Row", gap: 12, sizes: ["medium", "expanded"], children: [1, 2, 3, 4, 5, 6].map((i) => ({ type: "Skeleton", shape: "card", key: `sk${n}w${i}`, flex: 1 })) }
  ]
});
var gridSkeleton = () => ({
  type: "Column",
  key: "gridSkeleton",
  gap: 12,
  children: [
    ...[1, 2].map((r) => ({ type: "Row", gap: 12, sizes: ["compact"], key: `gc${r}`, children: [1, 2, 3].map((i) => ({ type: "Skeleton", shape: "card", key: `gc${r}-${i}`, flex: 1 })) })),
    ...[1, 2].map((r) => ({ type: "Row", gap: 12, sizes: ["medium", "expanded"], key: `gw${r}`, children: [1, 2, 3, 4, 5, 6].map((i) => ({ type: "Skeleton", shape: "card", key: `gw${r}-${i}`, flex: 1 })) }))
  ]
});
var heroSkeleton = () => ({
  type: "Skeleton",
  key: "heroSkeleton",
  shape: "block",
  height: { compact: 200, expanded: 320 }
});
var slideNode = (s) => ({
  type: "heroCard",
  key: "slide-" + s.id,
  h: { compact: 200, expanded: 240 },
  title: s.title,
  text: s.text,
  image: s.image,
  buttons: [
    {
      type: "ElevatedButton",
      key: "watch-" + s.id,
      ...twin("brWatch", "labelText"),
      icon: "play",
      onPressed: { go: { play: { ref: s.ref, kind: s.kind, id: s.id, title: s.title } } }
    },
    {
      type: "TextButton",
      key: "info-" + s.id,
      ...twin("brInfo", "labelText"),
      onPressed: { go: { title: { ref: s.ref, kind: s.kind, id: s.id, title: s.title } } }
    }
  ]
});
var hero = (slides) => slides.length === 1 ? slideNode(slides[0]) : {
  type: "PageView",
  key: "hero" + slides.length,
  autoPlayMs: 6e3,
  children: slides.map(slideNode)
};
var rail = (r, key, titleOverride, size = "medium") => ({
  type: "titleRail",
  key,
  ...titleOverride || { title: r.title },
  ...r.ref ? { ref: r.ref } : {},
  items: r.items,
  size
});
function browseView({ tab, data, recent, pending, failed, device = "phone" }) {
  const tv = device === "tv";
  const gear = {
    type: "IconButton",
    key: "settingsButton",
    icon: "settings",
    ...twin("brSettings", "labelText"),
    ...twin("brSettings", "tooltip"),
    onPressed: { event: "go", arg: "settings" }
  };
  const active = TAB_IDS.includes(tab) ? tab : TAB_IDS[0];
  const body = [];
  if (data) {
    if (data.slides.length > 0) body.push(hero(data.slides));
    else if (pending) body.push(heroSkeleton());
    if (recent && recent.length > 0) body.push(rail({ items: recent }, "recent", twin("brRecent", "title"), tv ? "small" : "medium"));
    for (const r of data.rails) {
      body.push(rail(r, "rail-" + String(r.id).replace(/[^A-Za-z0-9_-]/g, "_"), null, tv ? "small" : "medium"));
    }
    if (data.rails.length === 0) {
      body.push({ type: "Text", ...twin("brEmpty", "text"), color: "muted" });
    }
  } else if (failed) {
    body.push({
      type: "MaterialBanner",
      key: "loadFailed",
      role: "error",
      ...twin("brFailed"),
      action: { ...twin("brRetry", "label"), onTap: "retry" }
    });
  } else {
    body.push(heroSkeleton(), railSkeleton(1), railSkeleton(2), railSkeleton(3));
  }
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      divider: false,
      leading: {
        type: "IconButton",
        key: "close",
        icon: "close",
        ...twin("brClose", "labelText"),
        ...twin("brClose", "tooltip"),
        onPressed: { go: { close: true } }
      },
      actions: tv ? [
        {
          type: "IconButton",
          key: "searchButton",
          icon: "search",
          ...twin("brSearch", "labelText"),
          ...twin("brSearch", "tooltip"),
          onPressed: "openSearch"
        },
        gear
      ] : [gear],
      title: tv ? {
        type: "Row",
        key: "titleRow",
        gap: 24,
        crossAxisAlignment: "center",
        children: [logo(), tabBar(active)]
      } : logo()
    },
    ...tv ? {} : {
      floatingActionButton: {
        type: "FloatingActionButton",
        key: "searchFab",
        icon: "search",
        ...twin("brSearch", "tooltip"),
        onPressed: "openSearch"
      }
    },
    body: {
      type: "Column",
      key: "page",
      children: [
        ...tv ? [] : [
          {
            type: "Column",
            key: "tabsRow",
            padding: { compact: 0, expanded: 24 },
            children: [tabBar(active)]
          }
        ],
        {
          type: "SingleChildScrollView",
          key: "browse-" + active,
          flex: 1,
          children: [
            {
              type: "Column",
              padding: { compact: 12, expanded: 24 },
              gap: 16,
              children: body
            }
          ]
        }
      ]
    },
    ...pending ? { every: { ms: POLL_MS, event: "tick" } } : {}
  };
}
function settingsView() {
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      divider: false,
      leading: {
        type: "IconButton",
        key: "back",
        icon: "arrow_back",
        ...twin("brBack", "labelText"),
        ...twin("brBack", "tooltip"),
        onPressed: "back"
      },
      title: logo()
    },
    body: {
      type: "SingleChildScrollView",
      key: "settings-page",
      children: [
        {
          type: "Column",
          padding: { compact: 12, expanded: 24 },
          gap: 16,
          children: [{ type: "settings", key: "form" }]
        }
      ]
    }
  };
}
function searchView({ query, status, items, history = [], device = "phone" }) {
  const tv = device === "tv";
  const searchForm = () => ({
    type: "Form",
    key: "searchForm",
    onSubmitted: "search",
    gap: 8,
    children: tv ? [
      {
        type: "Row",
        key: "searchRow",
        gap: 16,
        crossAxisAlignment: "center",
        children: [
          {
            type: "TextField",
            key: "q",
            kind: "text",
            value: query,
            ...twin("brSearchHint", "labelText"),
            maxLength: 100,
            autofocus: true,
            weight: 1
          },
          {
            type: "ElevatedButton",
            key: "searchGo",
            ...twin("brSearch", "labelText"),
            icon: "search",
            submit: true
          }
        ]
      }
    ] : [
      {
        type: "TextField",
        key: "q",
        kind: "text",
        value: query,
        ...twin("brSearchHint", "labelText"),
        maxLength: 100,
        autofocus: true
      },
      {
        type: "ElevatedButton",
        key: "searchGo",
        ...twin("brSearch", "labelText"),
        icon: "search",
        submit: true
      }
    ]
  });
  const body = tv ? [] : [searchForm()];
  if (status === "fail") {
    body.push({
      type: "MaterialBanner",
      key: "searchFailed",
      role: "error",
      ...twin("brSearchFailed"),
      action: { ...twin("brRetry", "label"), onTap: "sretry" }
    });
  } else if (status === "done" && items) {
    if (items.length === 0) {
      body.push({ type: "Text", ...twin("brNoResults", "text"), color: "muted" });
    } else {
      body.push({
        type: "titleGrid",
        key: "results",
        columns: { compact: 3, expanded: 6 },
        items: items.slice(0, SEARCH_CAP)
      });
    }
  } else if (status !== "idle") {
    body.push(gridSkeleton());
  } else if (history && history.length > 0) {
    body.push({ type: "Text", ...twin("brSearchedBefore", "text"), style: "h4" });
    body.push({
      type: "titleGrid",
      key: "history",
      columns: { compact: 3, expanded: 6 },
      items: history.slice(0, SEARCH_CAP)
    });
  }
  return {
    type: "Scaffold",
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      divider: false,
      leading: {
        type: "IconButton",
        key: "back",
        icon: "arrow_back",
        ...twin("brBack", "labelText"),
        ...twin("brBack", "tooltip"),
        onPressed: "back"
      },
      ...tv ? { title: searchForm() } : twin("brSearchTitle", "title")
    },
    body: {
      type: "SingleChildScrollView",
      key: "search-page",
      children: [
        {
          type: "Column",
          padding: { compact: 12, expanded: 24 },
          gap: 16,
          children: body
        }
      ]
    },
    ...status === "loading" ? { every: { ms: 1e3, event: "stick" } } : {}
  };
}

// src/browse/metaCache.js
var KEY = "pelisplus_meta1";
var MAX = 260;
var CONCURRENCY = 3;
var HTTPS2 = /^https?:\/\//;
function makeMetaCache({ kino: kino2, clock = { now: () => Date.now() } }) {
  const usable = () => {
    try {
      return typeof kino2.meta === "function" && kino2.meta.byTitle === true;
    } catch (_) {
      return false;
    }
  };
  let book = null;
  function read() {
    if (book) return book;
    try {
      const o = JSON.parse(kino2.storage.get(KEY) || "null");
      book = o && typeof o === "object" && !Array.isArray(o) ? o : {};
    } catch (_) {
      book = {};
    }
    return book;
  }
  function write() {
    try {
      const ids = Object.keys(book);
      if (ids.length > MAX) {
        for (const id of ids.slice(0, ids.length - MAX)) delete book[id];
      }
      kino2.storage.set(KEY, JSON.stringify(book));
    } catch (_) {
    }
  }
  function known(id) {
    const e = read()[id];
    if (!e) return {};
    return {
      ...e.t > 0 ? { tmdb: e.t } : {},
      ...e.l && HTTPS2.test(e.l) ? { logo: e.l } : {},
      ...e.b && HTTPS2.test(e.b) ? { backdrop: e.b } : {},
      ...e.o ? { overview: e.o } : {}
    };
  }
  const asked = (id) => Object.hasOwn(read(), id);
  function dress(cards) {
    return cards.map((c) => {
      const k = known(c.id);
      const withId = k.tmdb && !(c.ids && c.ids.tmdb) ? { ...c, ids: { ...c.ids || {}, tmdb: k.tmdb } } : c;
      const withBackdrop = k.backdrop && !withId.backdrop ? { ...withId, backdrop: k.backdrop } : withId;
      return k.logo && !withBackdrop.logo ? { ...withBackdrop, logo: k.logo } : withBackdrop;
    });
  }
  async function fill(cards, budgetMs) {
    if (!usable()) return 0;
    const start = clock.now();
    let count = 0;
    const pending = cards.filter((c) => !asked(c.id));
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      if (clock.now() - start >= budgetMs) break;
      const slice = pending.slice(i, i + CONCURRENCY);
      await Promise.all(
        slice.map(async (c) => {
          try {
            const type = c.kind === "series" ? "series" : "movie";
            const yearNum = c.year ? parseInt(c.year, 10) : void 0;
            const res = await kino2.meta({
              type,
              title: c.title,
              ...yearNum && yearNum > 1900 ? { year: yearNum } : {}
            });
            count++;
            if (!res) {
              read()[c.id] = { t: 0, l: "" };
            } else {
              const tmdbId = res.ids && res.ids.tmdb || res.id || 0;
              read()[c.id] = {
                t: tmdbId,
                l: res.logo || "",
                b: res.backdrop || "",
                o: res.overview || ""
              };
            }
          } catch (_) {
          }
        })
      );
    }
    if (count > 0) write();
    return count;
  }
  return { usable, known, asked, dress, fill };
}

// src/browse/index.js
var TAB_KEY = "pelisplus_browseTab";
var SNAP_PREFIX = "pelisplus_browse1:";
var SNAP_TTL_MS = 12 * 3600 * 1e3;
var SNAP_MAX = 24 * 1024;
var RECENT_KEY = "pelisplus_recent1";
var RECENT_MAX = 16;
var HIST_KEY = "pelisplus_searchHist1";
var HIST_MAX = 24;
var MAX_META_TICKS = 30;
var MAX_LOAD_TRIES = 3;
function metaAsk(c) {
  const title = String(c.title).replace(/\s*[([][^)\]]*[)\]]/g, "").replace(/\s+/g, " ").trim() || String(c.title);
  const y = /\((19|20)\d{2}\)/.exec(String(c.title));
  return { id: c.id, title, kind: c.kind, ...y ? { year: parseInt(y[0].slice(1, 5), 10) } : {} };
}
function makeBrowse({ kino: kino2, loadTab, searchTitles }) {
  const meta = makeMetaCache({ kino: kino2 });
  const slidesFrom = (rails) => {
    const out = [];
    for (const r of rails) {
      for (const c of r.items) {
        if (out.length >= 6) return out;
        const k = meta.known(c.id);
        const img = k.backdrop || c.poster;
        if (!img || out.some((s) => s.id === c.id)) continue;
        out.push({
          id: c.id,
          ref: c.ref,
          kind: c.kind,
          title: c.title,
          image: img,
          text: k.overview || (c.badges ? c.badges.join(" \xB7 ") : ""),
          ...k.logo ? { logo: k.logo } : {}
        });
      }
    }
    return out;
  };
  const uniform = (items) => items.every((i) => i.backdrop) ? items : items.map(({ backdrop, ...rest }) => rest);
  const enrich = (data) => data ? {
    slides: data.slides.length > 0 ? data.slides.map((s) => {
      const k = meta.known(s.id);
      return k.logo ? { ...s, logo: k.logo } : s;
    }) : slidesFrom(data.rails),
    rails: data.rails.map((r) => ({ ...r, items: uniform(meta.dress(r.items)) }))
  } : data;
  const metaTries = /* @__PURE__ */ new Map();
  const memo = /* @__PURE__ */ new Map();
  const log2 = (...a) => {
    try {
      kino2.log("[gnulahd]", ...a);
    } catch (_) {
    }
  };
  const get = (k) => {
    try {
      return kino2.storage.get(k);
    } catch (_) {
      return null;
    }
  };
  const set = (k, v, opts) => {
    try {
      kino2.storage.set(k, v, opts);
    } catch (_) {
    }
  };
  function readSnap(tab) {
    try {
      const o = JSON.parse(get(SNAP_PREFIX + tab) || "null");
      return o && Date.now() - o.at < SNAP_TTL_MS && o.data && Array.isArray(o.data.rails) ? o.data : null;
    } catch (_) {
      return null;
    }
  }
  function writeSnap(tab, data) {
    for (let max = 20; max >= 6; max -= 2) {
      try {
        const slim = {
          slides: data.slides.slice(0, 5),
          rails: data.rails.map((r) => ({ ...r, items: r.items.slice(0, max) }))
        };
        const s = JSON.stringify({ at: Date.now(), data: slim });
        if (s.length <= SNAP_MAX) {
          set(SNAP_PREFIX + tab, s);
          return;
        }
      } catch (_) {
      }
    }
  }
  function dataOf(tab) {
    const m = memo.get(tab);
    if (m) return m.data;
    const s = readSnap(tab);
    if (s) {
      memo.set(tab, { data: s, whole: false });
      return s;
    }
    return null;
  }
  const stored = () => {
    const t = get(TAB_KEY);
    return TAB_IDS.includes(t) ? t : null;
  };
  const remember = (tab) => {
    set(TAB_KEY, tab);
  };
  function readKeys() {
    try {
      const a = JSON.parse(get(RECENT_KEY) || "[]");
      return Array.isArray(a) ? a.filter((k) => typeof k === "string") : [];
    } catch (_) {
      return [];
    }
  }
  function notePlayed(ref) {
    const k = playedKey(ref);
    if (!k) return;
    const prior = readKeys().filter((x) => x !== k);
    try {
      set(RECENT_KEY, JSON.stringify([k, ...prior].slice(0, RECENT_MAX)));
    } catch (_) {
    }
  }
  function readHistory() {
    try {
      const a = JSON.parse(get(HIST_KEY) || "[]");
      return Array.isArray(a) ? a.filter((c) => c && typeof c.id === "string" && typeof c.ref === "string" && typeof c.title === "string").slice(0, HIST_MAX) : [];
    } catch (_) {
      return [];
    }
  }
  function rememberFound(cards) {
    try {
      const fresh = cards.slice(0, 12).map((c) => ({
        id: c.id,
        ref: c.ref,
        title: c.title,
        kind: c.kind,
        poster: c.poster,
        year: c.year,
        rating: c.rating
      }));
      const ids = new Set(fresh.map((c) => c.id));
      set(HIST_KEY, JSON.stringify([...fresh, ...readHistory().filter((c) => !ids.has(c.id))].slice(0, HIST_MAX)));
    } catch (_) {
    }
  }
  let found = null;
  const tabFromArgs = (route) => {
    const a = route && route.args && typeof route.args === "object" ? route.args : {};
    return TAB_IDS.includes(a.tab) ? a.tab : null;
  };
  function needed(tab, device) {
    const order = [tab, ...TAB_IDS.filter((t) => t !== tab)];
    return order.filter((t, i) => (i === 0 || device !== "tv") && !(memo.get(t) && memo.get(t).whole));
  }
  function view(ctx) {
    const st = ctx.state && typeof ctx.state === "object" ? ctx.state : {};
    if (ctx.route && ctx.route.name === "settings") return settingsView();
    if (ctx.route && ctx.route.name === "search") {
      const query = typeof st.sq === "string" ? st.sq : "";
      const items = found && found.q === query ? found.items : null;
      const status = query === "" ? "idle" : st.sstate === "fail" ? "fail" : items ? "done" : "loading";
      return searchView({ query, status, items, history: query === "" ? readHistory() : [], device: ctx.device });
    }
    const tab = TAB_IDS.includes(st.tab) ? st.tab : tabFromArgs(ctx.route) ?? stored() ?? TAB_IDS[0];
    const data = enrich(dataOf(tab));
    const loaded = TAB_IDS.map((t) => memo.get(t)).filter(Boolean).map((m) => m.data);
    const pending = Array.isArray(st.pending) && st.pending.length > 0;
    return browseView({
      tab,
      data,
      recent: uniform(meta.dress(recentOf(readKeys(), loaded))),
      pending,
      failed: !!(st.failed && st.failed[tab]),
      device: ctx.device
    });
  }
  async function load(tab) {
    const page = await loadTab(tab);
    const data = tabOf(page);
    if (data) {
      memo.set(tab, { data, whole: true });
      writeSnap(tab, data);
    }
    return data !== null;
  }
  const loadTries = /* @__PURE__ */ new Map();
  function failLoad(tab, rest, failed) {
    const n = (loadTries.get(tab) || 0) + 1;
    loadTries.set(tab, n);
    if (n < MAX_LOAD_TRIES) rest.push(tab);
    else {
      failed[tab] = true;
      loadTries.delete(tab);
    }
  }
  const events = {
    open({ route, state, device }) {
      const tab = tabFromArgs(route) ?? (TAB_IDS.includes(state.tab) ? state.tab : stored() ?? TAB_IDS[0]);
      for (const t of TAB_IDS) dataOf(t);
      return { state: { tab, pending: needed(tab, device), failed: null } };
    },
    tab({ value, arg, state }) {
      const tab = TAB_IDS.includes(value) ? value : TAB_IDS.includes(arg) ? arg : null;
      if (!tab) return null;
      remember(tab);
      dataOf(tab);
      const failed = { ...state.failed || {} };
      delete failed[tab];
      const pending = [tab, ...Array.isArray(state.pending) ? state.pending.filter((t) => t !== tab) : []];
      return { state: { tab, pending: memo.get(tab) && memo.get(tab).whole ? pending.slice(1) : pending, failed } };
    },
    retry({ state, device }) {
      const tab = TAB_IDS.includes(state.tab) ? state.tab : TAB_IDS[0];
      return { state: { failed: null, pending: [tab, ...needed(tab, device).filter((t) => t !== tab)] } };
    },
    async tick({ state }) {
      const pending = Array.isArray(state.pending) ? state.pending : [];
      if (pending.length === 0) return null;
      const [next, ...rest] = pending;
      const failed = { ...state.failed || {} };
      if (next.startsWith("meta:")) {
        const tabId = next.slice(5);
        const m = memo.get(tabId);
        if (!m) return { state: { pending: rest } };
        const cards = [
          ...m.data.slides,
          ...m.data.rails.flatMap((r) => r.items.slice(0, 6)),
          ...m.data.rails.flatMap((r) => r.items.slice(6))
        ];
        const asked = await meta.fill(cards.map(metaAsk), 12e3);
        const made = slidesFrom(m.data.rails);
        if (made.length > m.data.slides.length) {
          m.data = { ...m.data, slides: made.map(({ logo: logo2, ...rest2 }) => rest2) };
          writeSnap(tabId, m.data);
        }
        const tries = (metaTries.get(tabId) || 0) + 1;
        metaTries.set(tabId, tries);
        if (asked > 0 && tries < MAX_META_TICKS && cards.some((c) => !meta.asked(c.id))) {
          return { state: { pending: [next, ...rest] } };
        }
        return { state: { pending: rest } };
      }
      try {
        const ok = await load(next);
        if (!ok) failLoad(next, rest, failed);
        else delete failed[next];
        if (ok && meta.usable()) rest.unshift("meta:" + next);
      } catch (e) {
        log2("browse tab error", e && e.message || "error");
        failLoad(next, rest, failed);
      }
      return { state: { pending: rest, failed } };
    },
    openSearch() {
      return { route: { push: "search" }, state: { sq: "", sstate: null } };
    },
    search({ value, route }) {
      const q = value && typeof value.q === "string" ? value.q.trim().slice(0, 100) : "";
      if (q === "") return null;
      const state = { sq: q, sstate: "loading" };
      return route && route.name === "search" ? { state } : { route: { push: "search" }, state };
    },
    async stick({ state }) {
      const q = typeof state.sq === "string" ? state.sq : "";
      if (q === "" || state.sstate !== "loading") return null;
      try {
        const out = await searchTitles(q);
        found = { q, items: (Array.isArray(out) ? out : []).slice(0, 60).map(cardOf) };
        rememberFound(found.items);
        return { state: { sstate: "done" } };
      } catch (e) {
        log2("browse search error", e && e.message || "error");
        return { state: { sstate: "fail" } };
      }
    },
    sretry({ state }) {
      return typeof state.sq === "string" && state.sq !== "" ? { state: { sstate: "loading" } } : null;
    },
    go({ arg }) {
      return arg === "settings" ? { route: { push: "settings" }, state: { fromBrowse: true } } : null;
    },
    back({ state, route }) {
      if (route && route.name === "settings" && !state.fromBrowse) return { close: true };
      return { route: { pop: true }, state: { sq: null, sstate: null } };
    }
  };
  async function event(ev) {
    const handler = Object.hasOwn(events, ev.name) ? events[ev.name] : null;
    return handler ? await handler({ ...ev, state: ev.state || {} }) ?? null : null;
  }
  return { view, event, notePlayed };
}

// src/pelisplus.js
var BASE_URL = "https://pelisplus.autos";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://pelisplus.autos/",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
};
async function fetchHtml(url, options = {}) {
  const client = typeof kino !== "undefined" && kino.fetch ? kino.fetch.bind(kino) : globalThis.fetch;
  const res = await client(url, {
    headers: {
      ...HEADERS,
      ...options.headers || {}
    },
    ...options
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al solicitar ${url}`);
  }
  return res.text();
}
function cleanId(slug) {
  return String(slug || "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}
function parseCards(html, defaultKind = "movie") {
  const cardRegex = /<a[^>]+href="(https:\/\/pelisplus\.autos\/(pelicula|serie)\/([^"\/]+)\/?)"[^>]*>([\s\S]*?)<\/a>/gi;
  const items = [];
  const seen = /* @__PURE__ */ new Set();
  let m;
  while ((m = cardRegex.exec(html)) !== null) {
    const href = m[1];
    const rawKind = m[2];
    const slug = cleanId(m[3]);
    const inner = m[4];
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const kind = rawKind === "serie" ? "series" : defaultKind;
    const detailMatch = inner.match(
      /<div class="item-detail"[^>]*><p>([\s\S]*?)<\/p>/i
    );
    const altMatch = inner.match(/alt="([^"]+)"/i);
    let title = detailMatch ? detailMatch[1].replace(/<[^>]+>/g, "").trim() : altMatch ? altMatch[1].replace(/^Poster\s+/i, "").trim() : slug;
    const imgMatch = inner.match(/<img[^>]+(?:src|data-src)="([^"]+)"/i);
    let poster = imgMatch ? imgMatch[1].trim() : "";
    if (poster.startsWith("//")) poster = "https:" + poster;
    const backdropMatch = inner.match(/data-backdrop="([^"]+)"/i);
    let backdrop = backdropMatch ? backdropMatch[1].trim() : "";
    if (backdrop.startsWith("//")) backdrop = "https:" + backdrop;
    const yearMatch = inner.match(/<span class="year[^"]*"[^>]*>(\d{4})<\/span>/i);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : void 0;
    const overMatch = inner.match(
      /<div class="card-hover-info-overview"><p>([\s\S]*?)<\/p>/i
    );
    const overview = overMatch ? overMatch[1].replace(/<[^>]+>/g, "").trim() : void 0;
    const genreMatches = [...inner.matchAll(/<li>([^<]+)<\/li>/gi)].map(
      (g) => g[1].trim()
    );
    items.push({
      id: slug,
      ref: href,
      title,
      kind,
      type: kind,
      poster,
      art: poster,
      backdrop: backdrop || void 0,
      year,
      overview,
      description: overview,
      badges: genreMatches.length > 0 ? genreMatches.slice(0, 3) : void 0
    });
  }
  return items;
}
function parseHeroSlides(html) {
  const cards = parseCards(html);
  return cards.filter((c) => c.backdrop || c.poster).slice(0, 6);
}
function b64Decode(str) {
  if (typeof atob === "function") return atob(str);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let out = "";
  let i = 0;
  const clean = String(str).replace(/[^A-Za-z0-9+/=]/g, "");
  while (i < clean.length) {
    const enc1 = chars.indexOf(clean.charAt(i++));
    const enc2 = chars.indexOf(clean.charAt(i++));
    const enc3 = chars.indexOf(clean.charAt(i++));
    const enc4 = chars.indexOf(clean.charAt(i++));
    const chr1 = enc1 << 2 | enc2 >> 4;
    const chr2 = (enc2 & 15) << 4 | enc3 >> 2;
    const chr3 = (enc3 & 3) << 6 | enc4;
    out += String.fromCharCode(chr1);
    if (enc3 !== 64 && enc3 !== -1) out += String.fromCharCode(chr2);
    if (enc4 !== 64 && enc4 !== -1) out += String.fromCharCode(chr3);
  }
  return out;
}
async function resolveNupload(nuploadUrl, referer = BASE_URL) {
  const nuHtml = await fetchHtml(nuploadUrl, {
    headers: { Referer: referer }
  });
  const offsetMatch = nuHtml.match(
    /parseInt\(atob\(value\)\.replace\([^)]*\)\)\s*-\s*(\d+)/
  );
  const arrayMatch = nuHtml.match(
    /var\s+([A-Za-z0-9_]+)\s*=\s*(\[\"[^\"]+\"(?:,\"[^\"]+\")*\])/
  );
  if (!offsetMatch || !arrayMatch) {
    throw new Error("No se pudo descifrar el reproductor Nupload");
  }
  const offset = parseInt(offsetMatch[1], 10);
  const arr = JSON.parse(arrayMatch[2]);
  let baseUrl = "";
  for (const val of arr) {
    const dec = b64Decode(val);
    const digits = dec.replace(/\D/g, "");
    baseUrl += String.fromCharCode(parseInt(digits, 10) - offset);
  }
  const seszMatch = nuHtml.match(/var\s+sesz\s*=\s*["']([^"']+)["']/);
  const streamUrl = seszMatch ? `${baseUrl}?s=${seszMatch[1]}` : baseUrl;
  return {
    url: streamUrl,
    mime: "application/x-mpegURL",
    headers: {
      "User-Agent": HEADERS["User-Agent"],
      "Referer": "https://nupload.my/"
    }
  };
}
async function resolvePelisPlus(ref, preferredLang = "latino") {
  const html = await fetchHtml(ref);
  const serverRegex = /data-server="([^"]+)"/gi;
  const servers = [];
  let sm;
  while ((sm = serverRegex.exec(html)) !== null) {
    try {
      const b64 = sm[1];
      const decoded = b64Decode(b64);
      if (decoded.startsWith("http")) {
        servers.push(decoded);
      }
    } catch (_) {
    }
  }
  if (servers.length === 0) {
    throw typeof kino !== "undefined" && kino.error ? kino.error("unavailable", "No se encontraron servidores de reproducci\xF3n en PelisPlus") : new Error("No se encontraron servidores de reproducci\xF3n");
  }
  const nuploadServers = servers.filter((s) => s.includes("nupload"));
  const chosenNupload = nuploadServers[0] || servers[0];
  const alternatives = [];
  let directStream = null;
  for (const sUrl of nuploadServers) {
    try {
      const resolved = await resolveNupload(sUrl, ref);
      if (!directStream) {
        directStream = resolved;
      } else {
        alternatives.push({
          name: "Nupload HLS (Alternativo)",
          url: resolved.url,
          mime: resolved.mime
        });
      }
    } catch (_) {
    }
  }
  if (directStream) {
    return {
      ...directStream,
      alternatives: alternatives.length > 0 ? alternatives : void 0
    };
  }
  throw typeof kino !== "undefined" && kino.error ? kino.error("unavailable", "No hay servidores de video disponibles actualmente") : new Error("No hay servidores de video reproducibles disponibles");
}

// src/plugin.js
var PLUGIN_VERSION = "8.0.0";
var AUTHOR_TAG = "Creado por JuandreXter";
var LOG_PREFIX = `[PelisPlus v${PLUGIN_VERSION}]`;
function printBanner() {
  console.log(`${LOG_PREFIX} ${AUTHOR_TAG}`);
}
printBanner();
function log(...args) {
  console.log(LOG_PREFIX, ...args);
}
function logError(...args) {
  console.error(LOG_PREFIX, ...args);
}
var browseApp = null;
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
                title: "Pel\xEDculas en HD",
                ref: "peliculas",
                items: res.items
              }
            ]
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
                items: res.items
              }
            ]
          };
        }
        if (tab === "animacion" || tab === "anime") {
          const res = await browse("animacion", "1");
          return {
            rows: [
              {
                id: "animacion",
                title: "Animaci\xF3n en HD",
                ref: "genero/animacion",
                items: res.items
              }
            ]
          };
        }
        return { rows: [] };
      },
      searchTitles: async (q) => {
        log(`searchTitles("${q}")`);
        const res = await search({ q });
        return Array.isArray(res) ? res : res.items || [];
      }
    });
  }
  return browseApp;
}
async function search(query) {
  printBanner();
  const q = typeof query === "string" ? query : query && query.q || "";
  log(`search(q="${q}"): iniciando b\xFAsqueda...`);
  if (!q.trim()) {
    log("search(): consulta vac\xEDa");
    return { items: [] };
  }
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(q.trim())}`;
    const html = await fetchHtml(searchUrl);
    const items = parseCards(html);
    log(`search(q="${q}"): encontrados ${items.length} resultados`);
    return { items };
  } catch (err) {
    logError(`search(q="${q}") fall\xF3:`, err.message);
    throw err;
  }
}
async function home() {
  printBanner();
  log("home(): cargando carrusel y rieles tem\xE1ticos...");
  try {
    const [estrenosHtml, moviesHtml, seriesHtml, terrorHtml, accionHtml, animacionHtml] = await Promise.all([
      fetchHtml(`${BASE_URL}/peliculas/estrenos`),
      fetchHtml(`${BASE_URL}/peliculas`),
      fetchHtml(`${BASE_URL}/series`),
      fetchHtml(`${BASE_URL}/genero/terror`),
      fetchHtml(`${BASE_URL}/genero/accion`),
      fetchHtml(`${BASE_URL}/genero/animacion`)
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
        items: heroSlides
      });
    }
    rows.push({
      id: "movies",
      title: "Pel\xEDculas Recientes",
      ref: "peliculas",
      items: movieItems
    });
    rows.push({
      id: "series",
      title: "Series Recientes",
      ref: "series",
      items: seriesItems
    });
    if (estrenosItems.length > 0) {
      rows.push({
        id: "estrenos",
        title: "Pel\xEDculas de Estreno",
        ref: "peliculas/estrenos",
        items: estrenosItems
      });
    }
    if (terrorItems.length > 0) {
      rows.push({
        id: "terror",
        title: "Terror \xB7 Top Semanal",
        ref: "genero/terror",
        items: terrorItems
      });
    }
    if (accionItems.length > 0) {
      rows.push({
        id: "accion",
        title: "Acci\xF3n \xB7 Top Semanal",
        ref: "genero/accion",
        items: accionItems
      });
    }
    if (animacionItems.length > 0) {
      rows.push({
        id: "animacion",
        title: "Animaci\xF3n \xB7 Top Semanal",
        ref: "genero/animacion",
        items: animacionItems
      });
    }
    log(`home(): ${rows.length} rieles cargados con \xE9xito`);
    return rows;
  } catch (err) {
    logError("home() fall\xF3:", err.message);
    throw err;
  }
}
async function browse(ref, cursor) {
  printBanner();
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
    log(`browse("${ref}"): p\xE1gina ${page} carg\xF3 ${items.length} items (hasNext: ${hasNext})`);
    return {
      items,
      next: hasNext ? String(page + 1) : null
    };
  } catch (err) {
    logError(`browse("${ref}") fall\xF3:`, err.message);
    throw err;
  }
}
async function episodes(ref) {
  printBanner();
  log(`episodes(ref="${ref}"): extrayendo cat\xE1logo de cap\xEDtulos...`);
  try {
    const html = await fetchHtml(ref);
    const seriesTitle = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim() || "PelisPlus Serie";
    const epRegex = /<a[^>]+href="(https:\/\/pelisplus\.autos\/episodio\/([^"\/]+)\/?)"[^>]*>([\s\S]*?)<\/a>/gi;
    const episodes2 = [];
    const seen = /* @__PURE__ */ new Set();
    let m;
    while ((m = epRegex.exec(html)) !== null) {
      const epHref = m[1];
      const epSlug = m[2];
      const inner = m[3];
      if (seen.has(epSlug)) continue;
      seen.add(epSlug);
      const seasonMatch = epSlug.match(/-(\d+)x(\d+)$/i) || inner.match(/(\d+)x(\d+)/i);
      const sNum = seasonMatch ? parseInt(seasonMatch[1], 10) : 1;
      const eNum = seasonMatch ? parseInt(seasonMatch[2], 10) : 1;
      const titleMatch = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : `Episodio ${eNum}`;
      episodes2.push({
        season: sNum,
        number: eNum,
        ref: epHref,
        title: `${title} ${sNum}x${eNum}`,
        still: "",
        overview: "",
        airDate: "",
        runtimeMinutes: 0
      });
    }
    if (episodes2.length === 0) {
      const seasonRegex = /<a[^>]+href="(https:\/\/pelisplus\.autos\/temporada\/[^"\/]+\/?)"/gi;
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
            const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : `Episodio ${eNum}`;
            episodes2.push({
              season: sNum,
              number: eNum,
              ref: epHref,
              title: `${title} ${sNum}x${eNum}`,
              still: "",
              overview: "",
              airDate: "",
              runtimeMinutes: 0
            });
          }
        } catch (_) {
        }
      }
    }
    episodes2.sort((a, b) => a.season - b.season || a.number - b.number);
    log(`episodes(): encontrados ${episodes2.length} episodios para "${seriesTitle}"`);
    return {
      series: { title: seriesTitle },
      episodes: episodes2,
      seasons: []
    };
  } catch (err) {
    logError(`episodes("${ref}") fall\xF3:`, err.message);
    throw err;
  }
}
async function resolve(ref) {
  printBanner();
  log(`resolve(ref="${ref}"): buscando streams HLS...`);
  const preferred = typeof kino !== "undefined" && kino.config && kino.config.get("preferredLang") || "latino";
  try {
    const res = await resolvePelisPlus(ref, preferred);
    log(`resolve(): stream obtenido: ${res.url}`);
    return res;
  } catch (err) {
    logError(`resolve("${ref}") fall\xF3:`, err.message);
    throw err;
  }
}
async function categories() {
  printBanner();
  log("categories(): listando g\xE9neros de PelisPlus");
  return [
    { id: "peliculas", ref: "peliculas", title: "Pel\xEDculas", titleEn: "Movies", icon: "movie" },
    { id: "series", ref: "series", title: "Series", titleEn: "Series", icon: "tv" },
    { id: "animacion", ref: "genero/animacion", title: "Animaci\xF3n", titleEn: "Animation", icon: "animation" },
    { id: "estrenos", ref: "estrenos", title: "Estrenos", titleEn: "Premieres", icon: "whatshot" },
    { id: "terror", ref: "genero/terror", title: "Terror", titleEn: "Horror", icon: "psychology" },
    { id: "accion", ref: "genero/accion", title: "Acci\xF3n", titleEn: "Action", icon: "flash_on" },
    { id: "comedia", ref: "genero/comedia", title: "Comedia", titleEn: "Comedy", icon: "sentiment_very_satisfied" },
    { id: "ciencia-ficcion", ref: "genero/ciencia-ficcion", title: "Ciencia Ficci\xF3n", titleEn: "Sci-Fi", icon: "rocket" },
    { id: "suspenso", ref: "genero/suspenso", title: "Suspenso", titleEn: "Thriller", icon: "visibility" }
  ];
}
async function section(ctx) {
  printBanner();
  const tab = ctx && typeof ctx === "object" ? ctx.tab : void 0;
  log(`section(tab="${tab}")`);
  const tabs = [
    { id: "inicio", label: "Inicio", labelEn: "Home" },
    { id: "peliculas", label: "Pel\xEDculas", labelEn: "Movies" },
    { id: "series", label: "Series", labelEn: "Series" },
    { id: "animacion", label: "Animaci\xF3n", labelEn: "Animation" }
  ];
  const chosen = tabs.some((x) => x.id === tab) ? tab : tabs[0].id;
  const page = await getBrowseApp().loadTab(chosen);
  return {
    tabs,
    tab: chosen,
    rows: page ? page.rows : []
  };
}
async function screen(ctx) {
  printBanner();
  log("screen(): generando scaffold nativo declarativo");
  const app = getBrowseApp();
  return app.view(ctx);
}
async function screenEvent(ev) {
  printBanner();
  log(`screenEvent(ev="${ev && ev.name}"): despachando evento`);
  const app = getBrowseApp();
  return app.event(ev);
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
