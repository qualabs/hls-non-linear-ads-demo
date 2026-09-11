# Evidencia de la T-06 — la afirmación falsa afuera, y lo que puede ir en una caja adentro

Registro de lo que se corrió y se miró el 2026-09-11. No es instrucción vigente: lo
que se vuelve a correr son los tres comandos de siempre.

## Los dos pedidos, y por qué son una sola task

Nicolás pidió dos cosas sobre la sección 1: **sacar `0 seconds of programme
replaced`, porque no es verdad**, y **decir qué tipo de asset se puede poner adentro
de un layout**. Son un solo cambio: la misma sección, los mismos archivos, la misma
caminata sobre los cuatro avisos, y la misma regla —lo que se puede leer del
contrato no se escribe a mano— con su guarda.

## El número que salió, y el que entró

El texto viejo decía que se reemplazaban **cero segundos de programa**, y este minuto
lo contradice en pantalla: el tercer aviso es lineal y a cuadro entero, así que
mientras corre el partido no se ve. La frase era cierta sobre la línea de tiempo —el
primario nunca se detiene y el largo no cambia, ADR 0016— y al revés sobre la
pantalla, que es el único lugar donde alguien está mirando. El propio repositorio ya
lo tenía escrito: `js/tipos.js` y `js/app.js` dicen, cada uno en su comentario, que
*"nothing was replaced" reads backwards* justo ahí.

Lo que entró es la misma pregunta contestada sobre las cajas: **cuánto del break
tiene un elemento del aviso tapando la imagen**, contra el largo del break entero.
Sale de `coversThePicture`, que ya existía y es la misma función que decide la línea
`At full frame, over a programme that never stopped` de la ficha del lineal, así que
la ficha y el número no se pueden contradecir. En esta corrida:
**`8 seconds of the 64 without the match on screen`**.

Un número sin su referencia no es una medición, y por eso el 64 está en la línea: es
la suma de los rangos de `kind` `'concurrent'`, leída del contrato.

El `<li>` no está en el markup. Los otros dos números —`4` avisos y `3` formas— son
formas del asset-list que el CHEQUEO 3 ya verifica; éste es una suma sobre las cajas
resueltas, que sólo el contrato conoce, y por eso lo agrega `js/tipos.js`.

## Lo que puede ir en una caja, y de dónde sale

**No se recordó: se leyó.** `attachAsset` en `lib/media.js` hace tres preguntas en
orden, y cada respuesta es una forma distinta de meter píxeles en la caja:

| rama de `lib/media.js` | qué hace | qué lo dispara |
| --- | --- | --- |
| imagen | `node.src = uri` sobre un `<img>`; ni player ni línea de tiempo | `mediaType` que matchea `/^image\//i` |
| HLS | instancia propia de la librería de player (`new Hls`), con su `startPosition` | `mediaType` con `mpegurl`, **o** un `uri` terminado en `.m3u8` |
| cualquier otra | `node.src = uri` sobre el `<video>`, con `currentTime` si entra tarde | todo lo demás |

Y dos cosas que no están en `media.js` y completan el cuadro:

- **`lib/renderer.js` crea `<img>` o `<video>` con el mismo discriminante**
  (`isImage`), y **no le pone cama negra a la imagen**: es el ADR 0056, medido sobre
  el banner de este minuto —1120×126, color type 6, **47 % de sus píxeles con alfa
  parcial**—. Ahí está el "PNG con transparencia" que Nicolás nombró: está soportado,
  y está soportado *a propósito*.
- **El `mediaType` no se valida antes de dibujar**, y el contrato lo dice de frente en
  *"qué cuenta como no lo puedo dibujar"*: el `type` de un asset de media playlist es
  el mismo string para cualquier códec, así que el chequeo miraría el contenedor.

**Los tres nombres que Nicolás nombró están soportados, y uno con un matiz:**

| lo que pidió nombrar | soportado | cómo |
| --- | --- | --- |
| JPG | sí | rama imagen. La capa no lee el contenedor: cualquier cosa que el browser decodifique en un `<img>` entra por ahí |
| PNG con transparencia | sí, y es una capacidad declarada | rama imagen + ADR 0056: la imagen no lleva cama negra, así que el alfa sobrevive |
| otro video HLS | sí | rama HLS, con **instancia propia** del player: la caja es un stream entero y no un clip |

**Y hay una cuarta cosa soportada que él no nombró**: cualquier archivo que el browser
reproduzca solo —un MP4, un WebM—, que es la rama `else`. Está en el código y **no la
ejercita ningún asset-list de este repositorio** (`grep` de `video/mp4` y `.mp4` sobre
los tres `demo/*/signalling/`: cero). La ficha de la página lo dice con el mismo
criterio que el resto: `nothing in this minute`, leído y no supuesto.

Las tres fichas están rotuladas con los MIME que **esta corrida** declara, leídos del
contrato: `image/png` y `application/vnd.apple.mpegurl`. El aviso lineal no declara
`type` y cae igual en la rama HLS por su `uri`, así que suma a esa ficha sin sumarle
un nombre, que es lo mismo que hace el resto del archivo: no adivina.

## La guarda nueva, y el control que la vio ponerse roja

Es el CHEQUEO 4 aplicado a la otra mitad derivada de la misma sección. **CHEQUEO 7 —
`losMediosSalenDelContrato`**: ninguno de los tipos de medio que el asset-list declara
aparece como literal en `index.html`, `js/tipos.js` ni `js/senalizacion.js`. La forma
natural de escribir este bloque es tipear `image/png` al lado del dibujo, y ahí queda
viejo el día que el creativo cambie de formato sin que nada falle.

Los discriminantes de la librería que la página repite —`/^image\//` y `/mpegurl/`—
no son ninguno de esos strings, así que la página puede clasificar sin nombrar.

Su control está en `mutaciones.txt`:

```
  ROJO   losMediosSalenDelContrato
         regla:  ningún tipo de medio está escrito a mano en la página (ADR 0073)
         rotura: a una copia de index.html se le planta `image/png` escrito al lado del
                 dibujo, que es lo que puede ir en una caja degradado a una lista de formatos
         dijo:   `index.html` tiene escrito el tipo de medio `image/png`: lo que la sección
                 dice que se puede poner en una caja dejó de leerse del asset list y pasó a
                 ser una afirmación, que es lo que envejece sin que nadie se entere (ADR 0073)
```

Y se protege de sí misma igual que la del ADR 0073: si el asset-list no declarara
ningún MIME, el chequeo no tendría qué buscar y **se reporta roto él**.

**La lista de archivos de la guarda se amplió**, que era el pedido explícito: el test
la arma una vez en `FUENTES()` y las dos guardas leen la misma lista, con
`js/senalizacion.js` adentro, porque un identificador o un MIME escrito a mano es el
mismo defecto en cualquiera de los tres.

## Las tres corridas, que son de las tres tasks

Se corrieron una vez sobre el árbol terminado, y por eso viven acá y las T-07 y T-08
apuntan a este directorio: es una sola medición de un solo árbol.

| archivo | qué dice |
| --- | --- |
| `suite.txt` | `npm test` — **170 pruebas, 170 en verde** |
| `costuras.txt` | `npm run check` — las dos costuras en pie |
| `mutaciones.txt` | `npm run mutaciones` — **20 roturas en rojo y 9 chequeos en verde** |

**La diferencia contra la línea de base está explicada y no es toda mía.** La base
medida antes de tocar nada, en este mismo árbol, era **165 pruebas / 17 roturas / 7
chequeos**. De las cinco pruebas nuevas, **dos son de estas tasks** —la guarda de los
medios y la glosa del bloque— y **tres vienen de la fase 11**, que corre en paralelo
sobre `lib/` y sobre `test/`: mientras esto se ejecutaba apareció
`test/focus-after-a-composition-change.test.js`, escrito a las 17:21, con tres pruebas
(`node --test` sobre ese archivo solo: 3). Medido y no supuesto: el archivo de la demo
pasó de 8 a 10 bloques `test(`. Las tres roturas y los dos chequeos nuevos de la
campaña son todos de estas tasks.

## Las capturas

| archivo | qué es |
| --- | --- |
| `seccion-1-1907.png` | la sección entera a 1907: las cuatro fichas, las tres cosas que van en una caja, y los tres números |
| `seccion-1-400x780.png` | la misma a 400, todo en una columna |
| `lo-que-va-en-una-caja-1907.png` | las tres fichas de cerca |
| `los-numeros-1907.png` | los tres números, con el nuevo en su lugar |

**El documento no scrollea de costado en ninguno de los dos anchos**: `scrollWidth`
400 sobre un viewport de 400, y 1907 sobre 1907. Cero errores y cero advertencias de
consola.

## Una cosa que se decidió mirando

**Las tres muestras de textura dicen la diferencia y no son adorno**, que es lo único
que le da lugar a un dibujo en esta página: un damero es un canal alfa —lo que se ve a
través de una imagen es la imagen de abajo—, una fila de tildes es una media playlist
—segmentos, y un player propio para traerlos— y un bloque lleno es un archivo entero.
Las dos últimas llevan la misma tinta a propósito: lo que las separa son los cortes y
no el tono. La primera versión tenía el bloque lleno en el gris del fondo y a 400 px
no se veía; está subido a `#3a4250`, que es la tinta que la galería de arriba ya usa.

## Cómo se sirvió la demo

`PORT=8091 node server.mjs demo/hydration-break`, y **no** `./run.sh hydration-break`,
por la misma razón que la T-02: `run.sh` reconstruye `dist/` desde `lib/` en cada
arranque y `lib/` lo están editando las tasks de la fase 11. El server se apagó por el
PID guardado al lanzarlo.
