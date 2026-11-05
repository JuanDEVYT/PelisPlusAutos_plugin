// Normaliza una respuesta de kino.meta sin usar claves externas.
export function mergeMeta(item, meta) {
  if (!meta) return item;
  return {
    ...item,
    ids: meta.ids || item.ids,
    art: meta.poster || meta.art || item.art,
    backdrop: meta.backdrop || item.backdrop,
    description: meta.overview || meta.description || item.description,
    logo: meta.logo || item.logo
  };
}
