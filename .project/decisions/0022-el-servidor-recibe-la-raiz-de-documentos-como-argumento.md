---
id: "0022"
title: El servidor recibe su raíz de documentos como argumento y monta dist/ y vendor/ de la sdk
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Hay un dato del código que decide esto y que no es negociable sin romper otra
cosa: **las URIs de los trece asset-lists son absolutas desde la raíz del
servidor** (`/content/adB/index.m3u8`), igual que el `X-ASSET-LIST="/signalling/..."`
que escribe el script de señalización.

Si el servidor sigue sirviendo la raíz del repositorio, la demo pasa a vivir en
`/demo/compatibility-pair/` y hay que reescribir las URIs de los trece
asset-lists y el `X-ASSET-LIST` del script, con el nombre de la carpeta metido
adentro de cada JSON. Renombrar la demo se convertiría entonces en una edición de
trece archivos.

## Decisión

**El servidor recibe su raíz de documentos como argumento**
(`node server.mjs demo/compatibility-pair`) **y monta dos rutas fijas contra la
raíz del repositorio, `/dist/` y `/vendor/`**, que es lo que la página necesita de
la sdk. Sin argumento sirve la raíz del repositorio, que es lo que servía antes,
para que agregar el argumento sea una suma y no un cambio.

La guarda de traversal sigue valiendo, ahora sobre tres prefijos legítimos en
lugar de uno.

Son unas ocho líneas en un archivo de cuarenta que existe para una sola cosa (el
`Content-Type` de un `.m3u8`), y a cambio **los trece asset-lists, el script de
señalización y todas las rutas relativas de la página quedan byte por byte
iguales**. Los tres scripts de contenido hacen `cd "$(dirname "$0")/.."`, así que
mudados a la carpeta de la demo apuntan solos al lugar correcto y tampoco se
tocan. Lo único que cambia en `index.html` son dos `src`, `./dist/` y `./vendor/`,
que pasan a ser absolutos para que los resuelvan los montajes.

**`run.sh` queda en la raíz y toma la demo como argumento**, con la única que
existe como default (`DEMO="${1:-compatibility-pair}"`). Sigue haciendo lo mismo
en el mismo orden: el contenido de la demo si falta, la señalización de la demo,
la construcción de la sdk, el servidor.

Descartados, y cada uno por su propia razón:

| alternativa | por qué no |
| --- | --- |
| reescribir las URIs de los trece asset-lists con el prefijo de la demo | trece archivos, el nombre de la carpeta metido en cada JSON, y va contra el ADR 0004, que manda consumir el asset-list tal como la herramienta lo emite, y la herramienta emite una ruta absoluta desde la raíz del sitio |
| symlinks de `dist/` y `vendor/` adentro de la demo | la guarda de traversal del propio `server.mjs` compara el prefijo de la ruta resuelta y los rechazaría |
| un `run.sh` por demo | repetiría en cada una las dos líneas de la sdk y devolvería "construir la librería antes de servir" a la memoria de alguien, que es exactamente el olvido que el ADR 0015 evitó construyendo en cada arranque |

## Consecuencias

**La URL de la demo sigue siendo `http://localhost:8080/`.** No es un driver de
esta decisión, porque el cambio de URLs estaba aceptado de antemano, pero conviene
anotarlo para que nadie lo busque.

**El nombre de la demo por default queda en un solo lugar del repositorio**, el
`run.sh`. Renombrar la carpeta es renombrar la carpeta y editar esa línea.

**Una demo nueva no necesita un servidor propio ni configuración**: se levanta con
`./run.sh <su-nombre>` y hereda los dos montajes de la sdk.

**El costo: hay dos rutas mágicas.** `/dist/` y `/vendor/` no están adentro de la
carpeta que se sirve, así que un `curl` a la demo devuelve archivos que no están
abajo del directorio que uno le pasó. Está escrito en el propio `server.mjs`,
donde lo va a leer quien lo edite, y es el precio de que los trece asset-lists no
se toquen.
