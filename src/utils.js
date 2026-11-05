// Utilidades compartidas
export async function fetchHtml(url, options = {}) {
  // Kino expone kino.fetch; el fallback de Node solo sirve para pruebas locales.
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