// Metadatos opcionales mediante la API integrada de Kino.
export function metaAsk(item) {
  if (!item || !item.title) return null;
  return {
    type: item.kind === "series" || item.type === "series" ? "tv" : "movie",
    title: item.title.replace(/\s*\(\d{4}\)\s*$/, ""),
    year: item.year || undefined,
    language: "es"
  };
}
