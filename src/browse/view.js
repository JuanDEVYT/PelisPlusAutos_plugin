// Árboles declarativos para la pantalla de navegación nativa de GnulaHD.
import { both } from "./words.js";
import { TAB_IDS } from "./model.js";
import { LOGO_DATA, LOGO_ASPECT } from "./logo.js";

const TAB_KEYS = {
  inicio: "tabHome",
  peliculas: "tabMovies",
  series: "tabSeries",
  animacion: "tabAnime",
  anime: "tabAnime",
};

const POLL_MS = 1_500;
const SEARCH_CAP = 60;

export const twin = (key, field = "text", vars) => {
  const w = both(key, vars);
  return { [field]: w.es, [field + "En"]: w.en };
};

const logo = () => ({
  type: "Image",
  key: "logo",
  url: LOGO_DATA,
  aspect: LOGO_ASPECT,
  fit: "contain",
  h: 40,
  alt: "PelisPlus",
  altEn: "PelisPlus",
  fallback: { type: "Text", text: "PelisPlus", textEn: "PelisPlus", style: "h4" },
});

const tabBar = (active) => ({
  type: "TabBar",
  key: "tabs",
  divider: false,
  value: active,
  onChanged: "tab",
  tabs: TAB_IDS.map((id) => ({ value: id, ...twin(TAB_KEYS[id], "label") })),
});

const railSkeleton = (n) => ({
  type: "Column",
  key: "skel" + n,
  gap: 8,
  children: [
    { type: "Skeleton", shape: "line" },
    { type: "Row", gap: 12, sizes: ["compact"], children: [1, 2, 3].map((i) => ({ type: "Skeleton", shape: "card", key: `sk${n}c${i}`, flex: 1 })) },
    { type: "Row", gap: 12, sizes: ["medium", "expanded"], children: [1, 2, 3, 4, 5, 6].map((i) => ({ type: "Skeleton", shape: "card", key: `sk${n}w${i}`, flex: 1 })) },
  ],
});

const gridSkeleton = () => ({
  type: "Column",
  key: "gridSkeleton",
  gap: 12,
  children: [
    ...[1, 2].map((r) => ({ type: "Row", gap: 12, sizes: ["compact"], key: `gc${r}`, children: [1, 2, 3].map((i) => ({ type: "Skeleton", shape: "card", key: `gc${r}-${i}`, flex: 1 })) })),
    ...[1, 2].map((r) => ({ type: "Row", gap: 12, sizes: ["medium", "expanded"], key: `gw${r}`, children: [1, 2, 3, 4, 5, 6].map((i) => ({ type: "Skeleton", shape: "card", key: `gw${r}-${i}`, flex: 1 })) })),
  ],
});

const heroSkeleton = () => ({
  type: "Skeleton",
  key: "heroSkeleton",
  shape: "block",
  height: { compact: 200, expanded: 320 },
});

const slideNode = (s) => ({
  type: "heroCard",
  key: "slide-" + s.id,
  h: { compact: 200, expanded: 240 },
  title: s.title,
  text: s.text,
  image: s.image,
  ...(s.logo ? { logo: s.logo } : {}),
  buttons: [
    {
      type: "ElevatedButton",
      key: "watch-" + s.id,
      ...twin("brWatch", "labelText"),
      icon: "play",
      onPressed: { go: { play: { ref: s.ref, kind: s.kind, id: s.id, title: s.title } } },
    },
    {
      type: "TextButton",
      key: "info-" + s.id,
      ...twin("brInfo", "labelText"),
      onPressed: { go: { title: { ref: s.ref, kind: s.kind, id: s.id, title: s.title } } },
    },
  ],
});

const hero = (slides) =>
  slides.length === 1
    ? slideNode(slides[0])
    : {
        type: "PageView",
        key: "hero" + slides.length,
        autoPlayMs: 6_000,
        children: slides.map(slideNode),
      };

const rail = (r, key, titleOverride, size = "medium") => ({
  type: "titleRail",
  key,
  ...(titleOverride || { title: r.title }),
  ...(r.ref ? { ref: r.ref } : {}),
  items: r.items,
  size,
});

export function browseView({ tab, data, recent, pending, failed, device = "phone" }) {
  const tv = device === "tv";
  const gear = {
    type: "IconButton",
    key: "settingsButton",
    icon: "settings",
    ...twin("brSettings", "labelText"),
    ...twin("brSettings", "tooltip"),
    onPressed: { event: "go", arg: "settings" },
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
      action: { ...twin("brRetry", "label"), onTap: "retry" },
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
        onPressed: { go: { close: true } },
      },
      actions: tv
        ? [
            {
              type: "IconButton",
              key: "searchButton",
              icon: "search",
              ...twin("brSearch", "labelText"),
              ...twin("brSearch", "tooltip"),
              onPressed: "openSearch",
            },
            gear,
          ]
        : [gear],
      title: tv
        ? {
            type: "Row",
            key: "titleRow",
            gap: 24,
            crossAxisAlignment: "center",
            children: [logo(), tabBar(active)],
          }
        : logo(),
    },
    ...(tv
      ? {}
      : {
          floatingActionButton: {
            type: "FloatingActionButton",
            key: "searchFab",
            icon: "search",
            ...twin("brSearch", "tooltip"),
            onPressed: "openSearch",
          },
        }),
    body: {
      type: "Column",
      key: "page",
      children: [
        ...(tv
          ? []
          : [
              {
                type: "Column",
                key: "tabsRow",
                padding: { compact: 0, expanded: 24 },
                children: [tabBar(active)],
              },
            ]),
        {
          type: "SingleChildScrollView",
          key: "browse-" + active,
          flex: 1,
          children: [
            {
              type: "Column",
              padding: { compact: 12, expanded: 24 },
              gap: 16,
              children: body,
            },
          ],
        },
      ],
    },
    ...(pending ? { every: { ms: POLL_MS, event: "tick" } } : {}),
  };
}

export function settingsView() {
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
        onPressed: "back",
      },
      title: logo(),
    },
    body: {
      type: "SingleChildScrollView",
      key: "settings-page",
      children: [
        {
          type: "Column",
          padding: { compact: 12, expanded: 24 },
          gap: 16,
          children: [{ type: "settings", key: "form" }],
        },
      ],
    },
  };
}

export function searchView({ query, status, items, history = [], device = "phone" }) {
  const tv = device === "tv";
  const searchForm = () => ({
    type: "Form",
    key: "searchForm",
    onSubmitted: "search",
    gap: 8,
    children: tv
      ? [
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
                weight: 1,
              },
              {
                type: "ElevatedButton",
                key: "searchGo",
                ...twin("brSearch", "labelText"),
                icon: "search",
                submit: true,
              },
            ],
          },
        ]
      : [
          {
            type: "TextField",
            key: "q",
            kind: "text",
            value: query,
            ...twin("brSearchHint", "labelText"),
            maxLength: 100,
            autofocus: true,
          },
          {
            type: "ElevatedButton",
            key: "searchGo",
            ...twin("brSearch", "labelText"),
            icon: "search",
            submit: true,
          },
        ],
  });

  const body = tv ? [] : [searchForm()];
  if (status === "fail") {
    body.push({
      type: "MaterialBanner",
      key: "searchFailed",
      role: "error",
      ...twin("brSearchFailed"),
      action: { ...twin("brRetry", "label"), onTap: "sretry" },
    });
  } else if (status === "done" && items) {
    if (items.length === 0) {
      body.push({ type: "Text", ...twin("brNoResults", "text"), color: "muted" });
    } else {
      body.push({
        type: "titleGrid",
        key: "results",
        columns: { compact: 3, expanded: 6 },
        items: items.slice(0, SEARCH_CAP),
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
      items: history.slice(0, SEARCH_CAP),
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
        onPressed: "back",
      },
      ...(tv ? { title: searchForm() } : twin("brSearchTitle", "title")),
    },
    body: {
      type: "SingleChildScrollView",
      key: "search-page",
      children: [
        {
          type: "Column",
          padding: { compact: 12, expanded: 24 },
          gap: 16,
          children: body,
        },
      ],
    },
    ...(status === "loading" ? { every: { ms: 1_000, event: "stick" } } : {}),
  };
}
