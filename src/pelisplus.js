// PelisPlus Autos scraper and Nupload HLS resolver.
import { fetchHtml } from "./utils.js";

export const BASE_URL = "https://pelisplus.autos";

export async function pageHtml(path) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetchHtml(url);
  return res.text();
}

function strip(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#8217;/g, "'").replace(/\s+/g, " ").trim();
}

function cleanId(value) {
  return String(value || "item").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._~-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 128) || "item";
}

export function parseCards(html, fallbackType = "movie") {
  const out = [];
  const rx = /<a\b(?=[^>]*\bhref="(https?:\/\/pelisplus\.autos\/(?:pelicula|serie)\/[^"?#]+)[^"]*")[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const seen = new Set();
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
    out.push({ id: cleanId(slug), ref, title, art, kind: type, type, year: year ? Number(year) : undefined });
  }
  return out;
}

export function parseHeroSlides(html) {
  return parseCards(html).slice(0, 8);
}

export function decodeBase64(value) {
  try {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let bits = 0, count = 0, result = "";
    for (const char of String(value || "").replace(/=+$/, "")) {
      const n = chars.indexOf(char);
      if (n < 0) continue;
      bits = (bits << 6) | n;
      count += 6;
      if (count >= 8) { count -= 8; result += String.fromCharCode((bits >> count) & 255); }
    }
    try { return decodeURIComponent(Array.from(result).map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")); } catch (_) { return result; }
  } catch (_) { return null; }
}

export function decodeNupload(html) {
  const offset = html.match(/parseInt\(atob\(value\)\.replace\([^)]*\)\)\s*-\s*(\d+)/);
  const array = html.match(/var\s+[A-Za-z0-9_]+\s*=\s*(\["[^"]+"(?:,"[^"]+")*\])/);
  if (!offset || !array) return null;
  let values;
  try { values = JSON.parse(array[1]); } catch (_) { return null; }
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

export async function resolvePelisPlus(ref) {
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
  throw new Error("PelisPlus no proporcionó un servidor Nupload reproducible");
}

export function parseEpisodes(html) {
  const rx = /<a\b(?=[^>]*\bhref="(https?:\/\/pelisplus\.autos\/episodio\/[^"?#]+)[^"]*")[^>]*>([\s\S]*?)<\/a>/gi;
  const out = []; let m; const seen = new Set();
  while ((m = rx.exec(html)) !== null) {
    const ref = m[1]; if (seen.has(ref)) continue; seen.add(ref);
    const text = strip(m[0]);
    const se = ref.match(/-(\d+)x(\d+)\/?$/i) || text.match(/(\d+)\s*[xX]\s*(\d+)/);
    const art = (m[0].match(/(?:src|data-src)="([^"]+)"/i) || [])[1] || null;
    out.push({ season: se ? Number(se[1]) : 1, number: se ? Number(se[2]) : out.length + 1, ref, title: text || `Episodio ${out.length + 1}`, still: art });
  }
  return out.sort((a, b) => a.season - b.season || a.number - b.number);
}
