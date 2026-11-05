import { fetchHtml, imageUrl } from "./pelisplus.js";

const strip = (v) => String(v || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();

function pick(html, regex) {
  const m = html.match(regex);
  return m ? strip(m[1]) : "";
}

function image(html, attrs) {
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  for (const attr of attrs) {
    const re = new RegExp(`(?:^|\\s)${attr}=["']([^"']+)["']`, "i");
    for (const tag of tags) {
      const m = tag.match(re);
      if (m && /^(?:https?:|\/\/)/i.test(m[1])) {
        return imageUrl(m[1].startsWith("//") ? `https:${m[1]}` : m[1]);
      }
    }
  }
  return "";
}

export function parseDetails(html) {
  const rawTitle = pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = rawTitle.replace(/^Ver\s+(?:Pel[ií]cula|Serie)\s+/i, "").trim();
  const overview = pick(html, /<(?:div|p)[^>]+class=["'][^"']*(?:overview|description|synopsis|sinopsis)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p)>/i);
  const year = pick(html, /<(?:span|li)[^>]+class=["'][^"']*(?:year|release)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|li)>/i).match(/(?:19|20)\d{2}/)?.[0];
  const ratingRaw = pick(html, /<(?:span|div)[^>]+class=["'][^"']*(?:rating|vote|imdb)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i);
  const rating = Number((ratingRaw.match(/\d+(?:[.,]\d+)?/) || [])[0]?.replace(",", "."));
  const genres = [...html.matchAll(/<a[^>]+href=["'][^"']*\/genero\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => strip(m[1])).filter(Boolean).slice(0, 8);
  const poster = image(html, ["data-poster", "poster", "data-src", "src"]);
  const backdrop = image(html, ["data-backdrop", "backdrop"]);
  return { title, overview, ...(year ? { year: Number(year) } : {}), ...(Number.isFinite(rating) && rating > 0 ? { rating } : {}), ...(genres.length ? { genres: [...new Set(genres)] } : {}), ...(poster ? { poster } : {}), ...(backdrop ? { backdrop } : {}) };
}

export async function getDetails(ref, kino) {
  const html = await fetchHtml(ref);
  const site = parseDetails(html);
  let meta = null;
  try {
    if (typeof kino?.meta === "function" && kino.meta.byTitle && site.title) {
      meta = await kino.meta({ type: /\/serie\//.test(ref) ? "series" : "movie", title: site.title, ...(site.year ? { year: site.year } : {}) });
    }
  } catch (_) {}
  return {
    ...site,
    ...(meta?.title ? { title: meta.title } : {}),
    ...(meta?.overview ? { overview: meta.overview } : {}),
    ...(meta?.poster ? { poster: meta.poster } : {}),
    ...(meta?.backdrop ? { backdrop: meta.backdrop } : {}),
    ...(meta?.genres?.length ? { genres: meta.genres } : {}),
    ...(meta?.year ? { year: meta.year } : {}),
    ...(meta?.rating ? { rating: meta.rating } : {}),
    ...(meta?.ids ? { ids: meta.ids } : {}),
  };
}
