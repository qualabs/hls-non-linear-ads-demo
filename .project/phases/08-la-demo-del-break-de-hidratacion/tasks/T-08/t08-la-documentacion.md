# T-08 — La documentación: el README de la demo, la fila de la raíz

Tres archivos, y el reparto es el del **ADR 0025**: el README de la raíz **enruta** y cada
demo **cuenta su corrida**.

- `demo/hydration-break/README.md` — qué argumenta la demo, cómo se corre, qué se ve, y
  cuáles son los dos archivos que se editan.
- Una **fila nueva** en la tabla de `demo/` del README de la raíz, que dice qué argumenta
  esta demo y no qué contiene. El README de `compatibility-pair` no se tocó y su fila
  quedó como estaba.
- `CREDITS.md` con la procedencia archivo por archivo, escrito en la T-03 y completado en
  la T-05.

## Cómo se aplicó la política de documentación del repo padre

**Regla A — el documento es dueño del qué, la herramienta del cómo.** El punto de entrada
va exacto y **una sola vez**: `./run.sh hydration-break`. Lo demás apunta en lugar de
transcribir. En particular **el README no reproduce el recorrido del minuto con sus
segundos**, porque el script de señalización lo imprime en cada arranque: una tabla acá
sería una copia que se despega. La frase que quedó es *"read it there rather than here:
this file would be a copy that goes stale"*.

**Regla C — un dato del que otro artefacto es dueño no se copia.** Por eso el README no
lleva los tamaños de las cajas —viven en el asset list y en
`graphics/creativos/README.md`—, no lleva la cuenta de tests, y no lleva los segundos de la
parada, que viven en `plate.json`. Y no escribí un número que haya que mantener: el único
conteo del README es "cuatro avisos", que es la forma del minuto y está asertada por el
suite.

**Regla B — vigente o registro.** El README de la demo es instrucción viva y se corrige; la
evidencia de estas tasks es registro y no se reescribe. Ese es el motivo por el que la
captura de la T-03 muestra el pie de página viejo: se corrigió el pie en el mismo commit,
y la captura quedó como prueba de qué se miró en ese momento.

## Lo que el README dice y no estaba en ningún otro lado

Dos cosas que no se pueden averiguar corriendo nada:

- **Encender el audio una vez antes de grabar**, con la razón: la página arranca muteada
  por la política de autoplay, los avisos concurrentes entran callados sobre un partido que
  se sigue escuchando, y el lineal es el único que se queda con el sonido.
- **Cuáles son los dos archivos que se editan y que no son código**: `story/story.json`
  para el texto del guion, y `plate.json` para el segundo de la parada. Es lo que hace que
  reescribir el guion diez veces no sea tocar JavaScript, que era la razón por la que el
  guion es un archivo declarado.

## Verificación

La demo se levantó **desde el punto de entrada documentado y con `content/` borrado**, para
que el README se pruebe y no se declare: bajó los clips, armó el plate, quemó el paquete de
canal, compuso los cuatro creativos, escribió la playlist señalizada, construyó la librería
y sirvió la carpeta. `npm test` en 55 verdes, `npm run check` en `both seams hold.` y
`npm run mutaciones` con las siete roturas en rojo.
