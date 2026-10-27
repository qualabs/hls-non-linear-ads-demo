# T-03 — evidencia

Registro de la corrida del 2026-10-26, sobre `5231ffa` de la rama `fase-18`.

- `T03-check.log`: `npm run check` verde. La costura 0003 corre sobre `lib/*.js` (más los cuatro
  consumidores de demo) con las tres líneas aceptadas de `controls.js`; la 0015 sobre `lib/*.js`,
  `hls/*.js` y `construir-libreria.sh`, cero coincidencias.
- `T03-plants.log`: rojo con un término de HLS en `lib/experience.js`, con un `import` de `../hls/`
  en `lib/capabilities.js` y con `demo` en `hls/media.js`; cada uno revertido, y verde otra vez.
- `T03-demos-cambiadas.log`, con commits sueltos que no mueven ninguna rama: un cambio sólo en
  `hls/` publica las cinco; sólo en `dash/`, ninguna; sólo en `lib/`, las cinco (referencia). El
  script de antes de la task, con el mismo cambio en `hls/`, no publicaba ninguna: es el rojo que
  esta task arregla.
- `publicar.sh` ya archivaba `hls` desde T-02; acá sólo se reacomodó su cabecera.
  `.github/workflows/publicar.yml` no nombra `lib/` y no cambió.
