---
id: "0084"
title: La capacidad del dispositivo degrada el formato del aviso y no el aviso
status: superseded
scope: project
date: 2026-09-21
supersedes: null
superseded_by: "0088"
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0083 fija **cómo** viaja la capacidad declarada y cómo se sirve la respuesta: el
parámetro `qa-decoder-count` sale en la petición del asset-list y hay un juego de asset-lists
estático por valor. Lo que no fija es **qué contiene** cada respuesta.

El primer reparto que se escribió degradaba de forma desigual: un break bajaba al aviso lineal,
otro cambiaba el `mediaType` del mismo layout, y el del banner **devolvía lo mismo en los dos
escalones**, porque un banner ya era una imagen y no pedía un segundo decodificador. O sea que
en un tercio del recorrido el control no cambiaba nada, y en otro tercio el dispositivo de un
decodificador terminaba viendo el aviso que tapa la pantalla, que es exactamente lo que esta
tecnología existe para evitar.

Eso no es un detalle de la demo: es lo que la demo afirma sobre la tecnología. Un recorrido
donde el dispositivo pobre pierde la experiencia dice que la publicidad no lineal es para los
dispositivos buenos, y **la cola larga de dispositivos es donde está el inventario**.

## Decisión

**Cada forma de aviso existe en dos medios, video e imagen, y el resolution document elige la
variante según los decodificadores declarados.** Con dos o más, las variantes de video; con
uno, las de imagen. **El layout, la campaña y la duración del break no cambian: cambia el
medio.**

| forma | layout | con 2 decodificadores | con 1 |
| --- | --- | --- | --- |
| 16:9 en media pantalla | `squeezebackDoubleBox` | el creativo en video | el mismo creativo como `image/svg+xml` |
| L | `squeezebackLShape` | el backplate en video | el mismo backplate como `image/svg+xml` |
| banner | `lowerThirdOverlay` | el banner en video | el mismo banner como `image/svg+xml` |

**El argumento que esto sostiene, y es el que sube de nivel toda la demo:** la capacidad del
dispositivo **degrada el formato del aviso, no el aviso**. El publisher sigue monetizando, el
espectador sigue viendo publicidad no lineal sobre el programa, y lo único que cambia es el
medio con el que se dibuja.

**No inventa mecanismo.** El renderizador distingue por `mediaType` y nada más
(`lib/renderer.js:209`), y el ADR 0012 ya dice que "LBox video" y "LBox image" son el mismo
layout con distinto tipo de asset. Lo que esta decisión hace es convertir esa propiedad, que
estaba escrita como una nota sobre dos nombres, en la regla que gobierna la escalera entera.

**Y se apoya en una premisa que hay que verificar y no asumir:** que **un elemento de imagen no
consume un decodificador de video**. Es casi seguro —para un `image/*` el renderizador crea un
`<img>` y `attachAsset` le pone un `src` sin instanciar ningún player, así que no hay pipeline
de decodificación— pero es la pata sobre la que se apoya todo esto, así que se verifica con su
control: la variante rica tiene que dar más elementos de video que la magra, y la magra tiene
que dar exactamente uno, que es el contenido primario. Si la magra da dos, la premisa es falsa
y esta decisión no se sostiene.

## Consecuencias

**Los tres breaks responden distinto al control, y ninguno finge.** Se va el caso en que el
control no cambiaba nada, que era un defecto reportado y no un descubrimiento posterior.

**El aviso lineal deja de ser el escalón de abajo del cliente concurrente.** Sigue estando, en
el tag de clase Apple de cada break, que es lo que reproduce el pane de fábrica; lo que ya no
pasa es que **nuestro** cliente baje a él por falta de decodificadores. Con eso, en el par la
experiencia del cliente de mercado está a la vista permanentemente, en los dos escalones, en
lugar de aparecer sólo en uno.

**Cada pieza se produce dos veces, y la segunda es mecánica.** Cada uno de los nueve SVG viaja
además capturado a video por el puente que ya existe. No son dieciocho piezas de autoría: son
nueve, y nueve corridas de un script.

**Si la animación declarativa no corre adentro de un `<img>`, la variante de imagen es una
pieza fija y el argumento no se cae**, porque un aviso fijo sigue siendo publicidad no lineal
sobre el programa. Lo que **no** es una salida es capturar esa variante a video: eso es
exactamente lo que el escalón de un decodificador no puede hacer.

**No hay un escalón de tres o más.** Ningún layout de esta demo pide más de dos decodificadores
de video, y un escalón que nada usa sería una afirmación falsa con forma de control.

**El ADR 0083 no cambia.** Él dice cómo viaja el dato y cómo se sirve la respuesta sin
servidor; éste dice qué hay adentro de cada respuesta. Se separan a propósito: el día que haya
un ad presentation server de verdad, el 0083 queda superseded y esta decisión sigue en pie tal
cual, porque la política de degradar el formato y no el aviso es del ad stack y no del
transporte.

---

**2026-09-28 — nota.** Desde el ADR 0085 quien elige el medio es la librería y no la respuesta: el asset-list trae las dos variantes y el Player se queda con la primera que su capacidad satisface (ADR 0086). Esta decisión sigue en pie con un decodificador e imágenes: el aviso sale en imagen. Lo que se agrega es el escalón de abajo, cuando el dispositivo declara que tampoco dibuja imágenes: sin opción satisfacible el break cae al lineal si tiene default, y si no, se saltea (ADR 0087). Y en el mismo día, el ADR 0088 lo supersede en "mismo layout, misma caja": la opción de imagen es quieta y va en otra forma de la misma campaña, para que se vea distinta de la de video. Lo que sigue en pie es el título de este ADR.
