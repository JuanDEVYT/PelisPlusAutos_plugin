# PelisPlus — Plugin para Kino (v8.0.0)

Plugin oficial de PelisPlus para la aplicación [Kino](https://kino.app). Ofrece catálogo completo de películas, series y anime en alta definición con opciones de audio en Español Latino, Castellano y Subtitulado, filtros por géneros, integración con `kino.meta` (TMDB) y una interfaz declarativa optimizada tanto para móviles como para TV (D-pad y mando).

## Características

- **Catálogo Completo**: Películas, series de televisión y anime actualizados directamente desde PelisPlus.
- **Integración con `kino.meta`**: Enriquecimiento automático de sinopsis oficial, reparto, directores y trailers en español.
- **Filtros por Géneros**: Acceso directo a categorías de Terror, Acción, Comedia, Ciencia Ficción, Suspenso y Animación.
- **Icono Oficial e Identidad Visual**: Icono y banner originales de PelisPlus.
- **Múltiples Audios**: Soporte para audio Latino, Castellano y Subtitulado, con selector de preferencia de idioma predeterminado en Ajustes.
- **Reproducción Directa en HD**: Resolución automática de streams HLS (m3u8) a través de Nupload → ibra.lat.
- **Interfaz Nativa Declarativa (`screen`)**: Compatible con Android TV y pantallas táctiles.
- **Paginación**: Navegación continua por páginas en todas las secciones del catálogo.

## Instalación en Kino

1. Abre Kino.
2. Ve a **Ajustes** → **Plugins** → **Añadir plugin**.
3. Escribe:
   ```
   JuanDEVYT/PelisPlusAutos_plugin
   ```
4. Acepta la instalación.

## Desarrollo

```bash
npm install
npm run build      # Compila plugin.js
npm test           # Ejecuta pruebas automatizadas
npm run validate   # Valida con el SDK de Kino
```

## Estructura

```
kino-plugin.json   → Manifiesto del plugin
src/plugin.js      → Punto de entrada (search, home, browse, episodes, resolve, screen)
src/pelisplus.js   → Scraper y resolver de servidores Nupload/ibra.lat
src/utils.js       → Utilidades HTTP compartidas
src/browse/        → Interfaz declarativa nativa (screen)
icon.png           → Icono oficial de PelisPlus
logo.png           → Banner oficial de PelisPlus
```

## Licencia

Uso personal. Este plugin no aloja ni distribuye contenido; solo indexa enlaces públicos de pelisplus.autos.
