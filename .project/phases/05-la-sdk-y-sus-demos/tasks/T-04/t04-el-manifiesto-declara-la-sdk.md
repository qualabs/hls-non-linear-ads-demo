# T-04 — el manifiesto declara la sdk

El `package.json` pasó de doce líneas a veinte, y lo que gana es la única
afirmación del repositorio sobre qué es el producto. Los campos los decidió el
ADR 0024 y esta task los escribió tal cual.

## El manifiesto, antes y después

```json
{
  "name": "hls-non-linear-ads-demo",
  "private": true,
  "version": "0.0.0",
  "description": "Non-linear (concurrent) HLS ad experiences on hls.js, unmodified. …",
  "type": "module",
  "scripts": {
    "start": "./run.sh",
    "serve": "node server.mjs",
    "content": "./scripts/preparar-contenido.sh",
    "test": "node --test"
  }
}
```

```json
{
  "name": "qualabs-concurrent-hls",
  "private": true,
  "version": "0.0.0",
  "description": "Non-linear (concurrent) HLS ad experiences on hls.js, unmodified. …",
  "type": "module",
  "main": "./lib/concurrent-hls.js",
  "exports": "./lib/concurrent-hls.js",
  "files": ["lib/", "dist/", "docs/"],
  "scripts": {
    "start": "./run.sh",
    "build": "./scripts/construir-libreria.sh",
    "check": "./scripts/verificar-cortes.mjs",
    "test": "node --test"
  }
}
```

`description` y `type: "module"` no se tocaron. El primero ya describía la
librería y no la demo; el segundo es lo que hace que el chequeo de sintaxis de
`construir-libreria.sh` atrape lo que existe para atrapar, porque un `.js` bajo
`"type": "module"` se parsea como módulo y aceptaría el `import` que sobrevivió.
`private: true` y `version: 0.0.0` se quedan: el manifiesto declara qué **es** la
sdk sin afirmar que está publicada.

`exports` quedó como string y no como objeto. Es el azúcar de `{".": "…"}` y es
la forma más corta de decir el único valor que el ADR le da: un punto de entrada,
sin condiciones ni subrutas. Un objeto de una sola clave sería la misma
afirmación con más superficie para mantener.

## `files`, que es el campo que hace el trabajo

`npm pack --dry-run` lista diez archivos y son estos:

    dist/qualabs-concurrent-hls.js
    docs/contrato-senalizacion-renderizado.md
    docs/integrating-the-library.md
    lib/concurrent-hls.js
    lib/controls.js
    lib/media.js
    lib/renderer.js
    lib/signalling.js
    package.json
    README.md

Los ocho primeros son exactamente `lib/`, `dist/` y `docs/`. **Nada de `demo/`,
`test/`, `scripts/`, `vendor/`, `server.mjs` ni `run.sh`**, que es lo que este
campo dice sobre todo por omisión.

`package.json` y `README.md` están porque npm los incluye siempre, con `files` o
sin él: junto con `LICENSE` y el archivo de `main`, son los que la herramienta no
deja excluir. No son una fuga de `files`, son el piso de un paquete, y en este
caso además son los dos archivos de la raíz que hablan de la sdk.

Dos cosas que sólo se ven corriendo el comando, y las dos confirman al ADR en
lugar de corregirlo:

- **`dist/` entra al paquete aunque esté gitignoreado.** Cuando no hay
  `.npmignore`, npm usa el `.gitignore` para excluir, pero la lista de `files`
  es una lista blanca y gana. Si no fuera así, el campo estaría declarando un
  archivo que el paquete no lleva.
- **`private: true` no frena a `npm pack`.** Lo que frena es `npm publish`, que
  es justamente lo que nadie decidió hacer. Así que `files` es verificable hoy,
  sin publicar nada, que es la consecuencia que el ADR le pedía.

## Los cuatro verbos

La salida verbatim de los cinco comandos está en `t04-los-cinco-comandos.txt`.
En resumen:

| comando | resultado |
| --- | --- |
| `npm run build` | `dist/qualabs-concurrent-hls.js` (2328 lines, global `QualabsConcurrentHls`) |
| `npm run check` | `verificar-cortes: both seams hold.` |
| `npm test` | 46 de 46, `fail 0` |
| `npm pack --dry-run` | 10 archivos, los de arriba |
| `npm start` | la demo arriba en `http://localhost:8080/ -- serving demo/compatibility-pair`, y los cuatro pedidos de la página en 200 |

`check` corre `./scripts/verificar-cortes.mjs` sin `node` adelante, y funciona
porque el archivo tiene `#!/usr/bin/env node` y el bit de ejecución. Los cuatro
verbos son la ruta al archivo y nada más: ninguno repite un argumento que el
script ya sabe.

De `npm start` se verificó lo que el done pide, que es que levante la demo. El
recorrido corrió en la T-03 con su cuadro por break y la T-06 lo vuelve a correr
sobre la fase entera; acá el instrumento son los cuatro pedidos que la página
hace —el HTML, hls.js, la librería construida y un asset-list—, que cubren las
tres raíces que el servidor monta.

## `serve` y `content` se fueron

Los dos nombraban rutas de una demo (`node server.mjs`,
`./scripts/preparar-contenido.sh`, que además ya no está en esa ruta). La T-05 los
escribe en el README de la demo con su ruta completa, que es donde nombrarlos no
es una copia de nada.

El efecto de segundo orden que el ADR anticipa se cumple: **el nombre de la demo
por default quedó en un solo lugar del repositorio**, la línea
`DEMO="${1:-compatibility-pair}"` de `run.sh`. Y el servidor quedó con un solo
arrancador, que es ese mismo `run.sh`.

## Lo que el bloque no cubría

**El nombre viejo sobrevive en dos lugares y esta task no los tocó.** El grep del
árbol tracked, fuera de `.project/`, devuelve dos líneas:

    README.md:1     # hls-non-linear-ads-demo
    server.mjs:107  `hls-non-linear-ads-demo: http://localhost:${PORT}/ -- serving …`

El del README es de la T-05, que está reescribiéndolo como el README de la raíz.
El de `server.mjs` es la etiqueta de la línea de arranque, y se deja por dos
razones: el bloque de esta task es el manifiesto y sus doce líneas, y sobre todo
**cuál tiene que ser la etiqueta nueva no lo decide ningún ADR**. `server.mjs`
sirve una demo, no la sdk, así que copiarle el `name` del manifiesto sería la
respuesta cómoda y no necesariamente la correcta. Es una etiqueta de consola sin
efecto funcional, ninguna de las dos costuras mira ese archivo, y queda reportado
para que se decida donde corresponda.

**Ninguna costura se movió, y estaba previsto que pudiera pasar.** El grep del
ADR 0015 busca el literal `demo` con lista de aceptados vacía, pero su lista de
archivos es `lib/*.js` y `scripts/construir-libreria.sh`: el manifiesto no está
adentro, así que el `./run.sh` de `start` no la mueve. Se corrió igual, y el
resultado es `both seams hold.`
