// Metadatos y caché de TMDB/Kino para enriquecer tarjetas y héroe en la UI declarativa.
const KEY = "pelisplus_meta1";
const MAX = 260;
const CONCURRENCY = 3;
const HTTPS = /^https?:\/\//;

export function makeMetaCache({ kino, clock = { now: () => Date.now() } }) {
  const usable = () => {
    try {
      return typeof kino.meta === "function" && kino.meta.byTitle === true;
    } catch (_) {
      return false;
    }
  };

  let book = null;

  function read() {
    if (book) return book;
    try {
      const o = JSON.parse(kino.storage.get(KEY) || "null");
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
      kino.storage.set(KEY, JSON.stringify(book));
    } catch (_) {
      // storage lleno
    }
  }

  function known(id) {
    const e = read()[id];
    if (!e) return {};
    return {
      ...(e.t > 0 ? { tmdb: e.t } : {}),
      ...(e.l && HTTPS.test(e.l) ? { logo: e.l } : {}),
      ...(e.b && HTTPS.test(e.b) ? { backdrop: e.b } : {}),
      ...(e.o ? { overview: e.o } : {}),
    };
  }

  const asked = (id) => Object.hasOwn(read(), id);

  function dress(cards) {
    return cards.map((c) => {
      const k = known(c.id);
      const withId = k.tmdb && !(c.ids && c.ids.tmdb) ? { ...c, ids: { ...(c.ids || {}), tmdb: k.tmdb } } : c;
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
            const yearNum = c.year ? parseInt(c.year, 10) : undefined;
            const res = await kino.meta({
              type,
              title: c.title,
              ...(yearNum && yearNum > 1900 ? { year: yearNum } : {}),
            });
            count++;
            if (!res) {
              read()[c.id] = { t: 0, l: "" };
            } else {
              const tmdbId = (res.ids && res.ids.tmdb) || res.id || 0;
              read()[c.id] = {
                t: tmdbId,
                l: res.logo || "",
                b: res.backdrop || "",
                o: res.overview || "",
              };
            }
          } catch (_) {
            // no almacenar fallo temporal
          }
        })
      );
    }

    if (count > 0) write();
    return count;
  }

  return { usable, known, asked, dress, fill };
}
