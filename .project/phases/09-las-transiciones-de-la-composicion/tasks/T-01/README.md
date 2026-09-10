# Evidencia de la T-01 — las dos funciones puras, las constantes y sus tests

Registro de lo que se midió el 2026-09-10. No es instrucción vigente.

## Qué quedó en `lib/renderer.js`

Tres duraciones y dos curvas como constantes exportadas —`PRIMARY_MOVE_MS` 380,
`AD_FADE_IN_MS` 200, `AD_FADE_OUT_MS` 120, `MOVE_EASING`, `FADE_EASING`—, la
etiqueta `FULL_FRAME_TYPE`, y tres funciones puras: `fadesInAndOut(experience)`,
`remainingIn(experience, time)` e `isLeaving(experience, time, leadMs)`.

Ninguna función existente cambió y ninguna firma se movió: la task sólo agregó.

## La suite

`test/transition-schedule.test.js`, catorce tests. El proyecto pasó de 56 a **70,
con 0 fallos** (`suite.txt`).

Los fixtures son los que ya estaban y no se agregó ninguno. El que carga el peso
es `asset-list-mezclado.json`: un break de cuatro avisos cuyo **tercero** es a
cuadro entero, así que las dos respuestas tienen que diferir adentro de un mismo
break. Una regla escrita sobre el break —o sobre el identificador de la
señalización, que todos los avisos de un break comparten— pasa todos los demás
fixtures y falla ése.

## La campaña de mutación

Seis roturas, una por regla, y en cada una corrieron **sólo los tests que cubren
esa regla** (`campana-de-mutacion.sh`, salida en `campana-de-mutacion.txt`). **Las
seis quedaron rojas** y el archivo quedó verificado idéntico al original.

| # | la regla que se rompió | resultado |
| --- | --- | --- |
| M1 | el aviso a cuadro entero no difumina — **es el control de R7**, el predicado invertido | rojo, 3 de 3 |
| M2 | la etiqueta es la que escribe la capa de señalización | rojo, 1 de 1 |
| M3 | la ventana se lee desde el arranque del aviso y no del break | rojo, 1 de 2 |
| M4 | el lead viene en milisegundos y la ventana en segundos | rojo, 2 de 2 |
| M5 | la salida es el final de la ventana y no el principio | rojo, 2 de 2 |
| M6 | una experiencia ausente no revienta y cae del lado del efecto | rojo, 1 de 1 |

**M3 cayó en uno de sus dos tests y eso es información, no ruido.** El test que
no la detecta usa un fixture cuya ventana arranca en 0, donde sacar `startTime` no
cambia el resultado. Es exactamente la razón por la que existe el segundo test,
el del aviso que arranca en 24.

**El control de R7 está en M1** y es la razón por la que la campaña empieza ahí:
antes de dar por bueno el test del discriminante, se corrió contra el predicado
invertido a propósito. Los tres tests que lo cubren cayeron, así que pueden
fallar.

## El chequeo contra fuente independiente

`agenda-contra-la-senalizacion-real.txt`, calculado a mano sobre el asset list
real de `demo/hydration-break` y contrastado con las funciones.

Las `DURATION` declaradas son 16 + 16 + 8 + 24, así que las ventanas son 0..16,
16..32, 32..40 y 40..64. La L termina en **32.00** y el primario empieza a crecer
en **31.62**, mientras el aviso a cuadro entero arranca en **32.00**.

**Eso confirma con números la afirmación sobre la que se apoya la fase:** la
salida de la L entra completa adentro de la ventana de la L, con 0,38 s de esa
ventana todavía abiertos, así que el aviso que viene después no la tapa. Falta
verlo en pantalla, que es la T-05: este número dice que el tiempo alcanza, no que
se vea bien.

## Dos cosas que aparecieron al medir

**El umbral exacto no es asertable, y el test que lo intentaba se cambió.** Con la
ventana en segundos y el lead en milisegundos, `12 - 0.38` deja un resto de
0,3800000000000008, así que la comparación contra 0,38 da falso. No es un defecto
de la lógica: es que el instante exacto del borde no es representable, y ningún
cuadro de un bucle a 60 Hz cae ahí. El test afirma los dos lados —un cuadro
adentro del lead sale, uno afuera no— y deja de afirmar el borde, porque fijarlo
sería fijar un artefacto de la aritmética. El comentario de `isLeaving` dice lo
mismo, con el número.

**`npm run check` se puso rojo dos veces, por dos comentarios míos.** Las dos
costuras que el script verifica atraparon prosa: la palabra "demo" en un
comentario (ADR 0015, la librería no nombra la aplicación que la usa) y
"asset-list" en otro (ADR 0003, el lado del renderizado no sabe una palabra del
transporte). Las dos veces el arreglo fue **la palabra y no una excepción en el
script**, porque las dos palabras genuinamente no van de este lado de la costura:
lo que los comentarios querían decir era "quien integra la librería" y "un dato
que la capa de abajo recibe de afuera". Gastar una excepción en prosa habría
dejado el chequeo un poco más flojo para siempre. Las dos costuras quedaron en
verde.
