// Scraper y resolutor para PelisPlus (pelisplus.autos)
export const BASE_URL = "https://pelisplus.autos";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://pelisplus.autos/",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
};

// El CDN de PelisPlus bloquea imágenes sin Referer. Kino renderiza la UI sin
// ese encabezado, así que se usa un proxy de imágenes para posters y backdrops.
export function imageUrl(url) {
  const source = String(url || "").trim();
  if (!source || !/^https?:\/\//i.test(source)) return source;
  if (!/pelisplus\.autos\/cdn\//i.test(source)) return source;
  return `https://external-content.duckduckgo.com/iu/?u=${encodeURIComponent(source)}`;
}

export async function fetchHtml(url, options = {}) {
  const client =
    typeof kino !== "undefined" && kino.fetch
      ? kino.fetch.bind(kino)
      : globalThis.fetch;
  const res = await client(url, {
    headers: {
      ...HEADERS,
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al solicitar ${url}`);
  }
  return res.text();
}

function cleanId(slug) {
  return String(slug || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseCards(html, defaultKind = "movie") {
  const cardRegex =
    /<a[^>]+href="(https:\/\/pelisplus\.autos\/(pelicula|serie)\/([^"\/]+)\/?)"[^>]*>([\s\S]*?)<\/a>/gi;
  const items = [];
  const seen = new Set();
  let m;

  while ((m = cardRegex.exec(html)) !== null) {
    const href = m[1];
    const rawKind = m[2];
    const slug = cleanId(m[3]);
    const inner = m[4];

    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const kind = rawKind === "serie" ? "series" : defaultKind;

    // Título limpio
    const detailMatch = inner.match(
      /<div class="item-detail"[^>]*><p>([\s\S]*?)<\/p>/i
    );
    const altMatch = inner.match(/alt="([^"]+)"/i);
    let title = detailMatch
      ? detailMatch[1].replace(/<[^>]+>/g, "").trim()
      : altMatch
      ? altMatch[1].replace(/^Poster\s+/i, "").trim()
      : slug;

    // Póster
    const imgMatch = inner.match(/<img[^>]+(?:src|data-src)="([^"]+)"/i);
    let poster = imgMatch ? imgMatch[1].trim() : "";
    if (poster.startsWith("//")) poster = "https:" + poster;

    // Backdrop panorámico
    const backdropMatch = inner.match(/data-backdrop="([^"]+)"/i);
    let backdrop = backdropMatch ? backdropMatch[1].trim() : "";
    if (backdrop.startsWith("//")) backdrop = "https:" + backdrop;

    // Año
    const yearMatch = inner.match(/<span class="year[^"]*"[^>]*>(\d{4})<\/span>/i);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

    // Sinopsis
    const overMatch = inner.match(
      /<div class="card-hover-info-overview"><p>([\s\S]*?)<\/p>/i
    );
    const overview = overMatch
      ? overMatch[1].replace(/<[^>]+>/g, "").trim()
      : undefined;

    // Géneros / Badges
    const genreMatches = [...inner.matchAll(/<li>([^<]+)<\/li>/gi)].map((g) =>
      g[1].trim()
    );

    items.push({
      id: slug,
      ref: href,
      title,
      kind,
      type: kind,
      poster: imageUrl(poster),
      art: imageUrl(poster),
      backdrop: imageUrl(backdrop) || undefined,
      year,
      overview,
      description: overview,
      badges: genreMatches.length > 0 ? genreMatches.slice(0, 3) : undefined,
    });
  }

  return items;
}

export function parseHeroSlides(html) {
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
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    out += String.fromCharCode(chr1);
    if (enc3 !== 64 && enc3 !== -1) out += String.fromCharCode(chr2);
    if (enc4 !== 64 && enc4 !== -1) out += String.fromCharCode(chr3);
  }
  return out;
}

export async function resolveNupload(nuploadUrl, referer = BASE_URL) {
  const nuHtml = await fetchHtml(nuploadUrl, {
    headers: { Referer: referer },
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
      "Referer": "https://nupload.my/",
      "Origin": "https://nupload.my",
    },
  };
}

export async function resolvePelisPlus(ref, preferredLang = "latino") {
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
    } catch (_) {}
  }

  if (servers.length === 0) {
    throw typeof kino !== "undefined" && kino.error
      ? kino.error("unavailable", "No se encontraron servidores de reproducción en PelisPlus")
      : new Error("No se encontraron servidores de reproducción");
  }

  // Priorizamos nupload
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
          mime: resolved.mime,
          headers: resolved.headers,
        });
      }
    } catch (_) {}
  }

  if (directStream) {
    return {
      ...directStream,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    };
  }

  throw typeof kino !== "undefined" && kino.error
    ? kino.error("unavailable", "No hay servidores de video disponibles actualmente")
    : new Error("No hay servidores de video reproducibles disponibles");
}
