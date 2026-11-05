# PelisPlus — Plugin para Kino (v8.5.1)

Plugin oficial de PelisPlus para la aplicación [Kino](https://kino.app). Ofrece catálogo completo de películas, series de televisión y anime en alta definición con audio en Español Latino, Castellano y Subtitulado, búsqueda nativa, integración con `kino.meta` (TMDB) y una interfaz nativa declarativa optimizada para Android TV (D-pad y control remoto) y dispositivos móviles.

> **Autor**: JuanDEVYT  
> **Versión**: 8.5.1  
> **Créditos**: Creado por JuandreXter

---

## Características

- **Identificación en logs**: Muestra al inicio y en cada acción el banner oficial `[PelisPlus v8.5.1] Creado por JuandreXter` con trazabilidad completa de peticiones.
- **Búsqueda robusta**: Consulta directa sobre el motor de búsqueda en tiempo real de PelisPlus (`/?s=...`), admitiendo títulos de películas, series y anime.
- **Hero Slider con Backdrops 1080p y Logos**: Portada con carrusel destacado interactivo, sinopsis, año y controles directos de reproducción y detalles.
- **Rieles temáticos dinámicos**:
  - Destacados PelisPlus
  - Películas Recientes
  - Series Recientes
  - Películas de Estreno
  - Terror · Top Semanal
  - Acción · Top Semanal
  - Animación en HD
- **Integración con `kino.meta`**: Enriquecimiento automático de sinopsis oficial, reparto, directores, trailers y posters/backdrops en alta resolución desde TMDB.
- **Resolvers de video directos HLS**: Decodificación automática de reproductores Nupload / Ibra (`sv*.ibra.lat`) con streams `.m3u8` adaptativos hasta 1080p.
- **Multi-audio con selector**: Configuración nativa del idioma preferido (Español Latino, Castellano o Subtitulado).
- **Interfaz nativa declarativa (`screen`)**:
  - Compatible con Android TV (D-pad, flechas del control remoto).
  - Pestañas superiores: Inicio, Películas, Series y Animación.
  - Buscador integrado con historial de búsqueda.
  - Pantalla de ajustes nativa con selector de idioma e información del autor.

---

## Verificación

```bash
npm run build
npm test
```

Todas las pruebas se ejecutan contra datos reales de `pelisplus.autos`.

## Instalación en Kino

Ingresa en Kino > Extensiones / Plugins e introduce el identificador del repositorio:

```
JuanDEVYT/PelisPlusAutos_plugin
```
