# T-02 — el servidor sirve la carpeta que se le nombra

`server.mjs` recibe la raíz de documentos como primer argumento y monta `/dist/`
y `/vendor/` contra la raíz del repositorio. Sin argumento sirve la raíz del
repositorio, así que este commit no cambia nada de cómo levanta la demo hoy:
`run.sh` sigue diciendo `node server.mjs` y la página sigue cargando los mismos
archivos por las mismas URLs.

Son 59 líneas nuevas y 8 que se fueron, y la mitad de las nuevas son el comentario
que explica las dos rutas que no están abajo de la carpeta servida.

## Lo que cambió, en tres piezas

- **`DOCS`**, la raíz de documentos: `resolve(SDK, process.argv[2] ?? '.')`. Un
  argumento relativo se resuelve contra la raíz del repositorio y uno absoluto se
  respeta, que es lo que `resolve` ya hace.
- **`MOUNTS`**, las dos rutas de la sdk: `/dist/` y `/vendor/`, cada una contra
  `join(SDK, …)`. El costo —que un pedido a la demo devuelve archivos que no están
  abajo del directorio que se le pasó— está escrito arriba de la constante, que es
  donde lo va a leer quien edite el archivo, con lo que compra: las trece URIs, el
  script de señalización y las rutas relativas de la página sin tocar (ADR 0022).
- **`resolveFile(path)`**, que reemplaza las dos líneas del `join` y la guarda.
  Devuelve el archivo o `null`, y `null` es el 403. El prefijo se compara con
  `root + sep` en lugar de a secas, así que una carpeta hermana con el mismo
  prefijo de nombre no pasa.

## La guarda de traversal, y el hallazgo

**La guarda hace acá un trabajo que antes no hacía, y el `..` que la dispara no es
el que uno escribiría.** El handler parsea la URL con `new URL(...)`, y ese parser
colapsa los `../` del path antes de que el servidor vea algo: un pedido a
`/dist/../../etc/passwd` llega como `/etc/passwd` y termina en un 404 abajo de la
raíz de documentos, no en un 403. Lo mismo pasaba antes de esta task, y es la razón
por la que la guarda vieja no se disparaba nunca.

El `..` que sí sobrevive es el que llega **percent-encodeado con la barra
adentro**, `%2e%2e%2f`, porque el parser de URL no decodifica `%2f` como separador
y el `decodeURIComponent` del handler corre después. Y ahí la guarda importa de
verdad: abajo de un montaje lo que se junta es el **resto** del path, que es
relativo, así que su `../` sobrevive a `normalize()` y lo único que lo para es la
comparación de prefijo.

    /dist/%2e%2e%2f%2e%2e%2fetc/passwd                  -> 403
    /vendor/%2e%2e%2fdist/qualabs-concurrent-hls.js     -> 403
    /dist/../../etc/passwd                              -> 404 (el parser lo colapsó)

El segundo es el que muestra que cada montaje sirve su propio subárbol y nada más:
salirse de `/vendor/` para caer en `dist/`, que es una carpeta legítima de la sdk,
también es un 403.

Los tres pedidos están en `t02-los-cuatro-pedidos.txt` con su salida verbatim, y el
comentario de `resolveFile` dice las tres cosas en el código.

## Los pedidos, y qué contestó cada uno

Con `node server.mjs signalling`, o sea con una raíz de documentos que **no** es la
del repositorio:

| pedido | respuesta |
| --- | --- |
| `/asset-list-linear.json` | 200, `application/json` — la carpeta que se le nombró |
| `/dist/qualabs-concurrent-hls.js` | 200, `text/javascript` — el montaje de la sdk |
| `/vendor/hls.min.js` | 200, `text/javascript` — el otro montaje |
| `/dist/%2e%2e%2f%2e%2e%2fetc/passwd` | 403 `forbidden` |
| `/index.html` | 404 — la raíz de la sdk no se sirve cuando se nombró otra carpeta |

Y sin argumento, que es lo que corre hoy: `/` da la página, `/signalling/…` da el
asset-list donde las URIs dicen, y `/dist/…` da el mismo archivo por el montaje que
antes daba por la carpeta.

## Lo que se verificó

- **`npm test`: 43 de 43 en verde**, la misma cuenta que dejó la T-01. `server.mjs`
  no tiene tests nuevos, y la razón es del ADR 0023 y está en el bloque de la task:
  un test que importara el servidor dejaría a `test/` leyendo fuera de `test/` y
  `lib/`. El instrumento son los pedidos de arriba.
- **`node scripts/verificar-cortes.mjs`: `both seams hold.`** `server.mjs` no está
  en la lista de archivos de ninguna de las dos costuras, así que la palabra `demo`
  del comentario no las mueve.
- **`./run.sh` levanta la demo como antes**, y los once archivos que la página
  carga —el HTML, el CSS, los dos scripts de la página, la librería construida,
  hls.js, los tres de marca, el asset-list y la playlist del contenido— dan 200 con
  su `Content-Type` (`t02-run-sh.txt`).

## Dos decisiones que el bloque no cubría

- **La línea de arranque dice qué carpeta está sirviendo**
  (`… -- serving compatibility-pair`). Cuesta un `relative()` y es lo primero que
  uno quiere saber cuando la página no carga, sobre todo después de la T-03, donde
  la raíz de la sdk sin argumento es un 404 en `/`. Nadie parsea esa salida: los
  únicos que arrancan el servidor son `run.sh` y el verbo del manifiesto.
- **El encabezado ya no dice "40 lines"**, porque el archivo dejó de tener
  cuarenta. Dice "a few dozen", que es la afirmación que la próxima edición no
  vuelve a falsear. El resto del encabezado —el porqué del `Content-Type` del
  `.m3u8`— queda igual, que es lo que explica por qué este archivo existe.
