# T-01 — el corte, el empaquetado y la página del integrador

El repositorio pasó a ser dos cosas con una línea en el medio (ADR 0015). La
librería es `lib/`: la capa de señalización, la de renderizado, el pedazo que
convierte un `uri` en píxeles, y el punto de entrada que los junta. La demo es
`index.html`, `css/` y `js/`: el par de compatibilidad, la traza del contrato y
el cableado de la librería.

La demo hace exactamente lo mismo que hacía. Los cinco breaks llegan a los
mismos instantes que midió la T-12 de la fase 01 —28.02, 55.11, 76.03, 103.02 y
122.51 segundos contra 28.02, 55.12, 76.01, 103.01 y 122.52—, en una sola carga,
sin un solo seek y sin un error de consola.

## El empaquetado: un paso que arma la librería, y no un archivo escrito a mano

El ADR 0015 deja las dos salidas abiertas y esta task elige **el paso de
construcción**: `scripts/construir-libreria.sh` concatena los cuatro archivos de
`lib/` en `dist/qualabs-concurrent-hls.js`, un script clásico que define
`window.QualabsConcurrentHls`, y `run.sh` lo corre en cada arranque. Sin bundler,
sin dependencias y sin que el browser resuelva módulos, que es lo que el ADR
pide conservar.

El argumento tiene tres patas, y las tres son cosas que ya existen en el
repositorio y no preferencias:

1. **El corte del ADR 0003 se verifica con un grep por archivo.** La regla es
   que el lado del renderizado no contenga una palabra del transporte, y lo que
   la hace verificable es que renderizado y señalización sean dos archivos.
   Escrita como un solo archivo a mano, la librería comparte un scope y el grep
   se queda sin a qué apuntar: el invariante de la fase 01 dejaría de ser
   verificable el mismo día en que la librería se separa. Es la verificación que
   seis tasks de la fase 01 corrieron.
2. **Los tests importan las funciones puras de las dos capas como módulos ES.**
   Un archivo clásico escrito a mano obligaría a reescribir los quince tests o a
   mantener un segundo camino de exports al lado. El movimiento correcto era
   arreglar dos rutas de import, y eso fue todo lo que hizo falta.
3. **El precedente ya está y el ADR lo nombra.** `run.sh` escribe la playlist
   señalizada en cada arranque. Un artefacto generado ya es la forma en que este
   repositorio corre, así que esto agrega un paso a un script que existe en
   lugar de un concepto nuevo.

El costo, dicho: un archivo que puede quedar viejo. Se contesta igual que la
playlist —se construye en cada arranque, está gitignorado para que no pueda
haber una copia vieja commiteada, y lleva en la cabecera de qué fuentes salió.

La transformación son dos sustituciones: se borran las líneas de `import` y se
saca la palabra `export`. Lo que la protege no es la expresión regular sino el
chequeo de sintaxis del final: el archivo se copia a `.cjs` —porque
`package.json` declara `"type": "module"` y como `.js` node lo leería como
módulo y aceptaría justo lo que hay que atrapar— y se pasa por `node --check`.
Como script clásico, un `import` o un `export` sobreviviente es un error de
sintaxis, y un nombre declarado dos veces entre dos archivos también.

## El `interstitialsController`: la librería verifica y avisa

La pregunta que el bloque pedía contestar acá: si el integrador crea su propia
instancia de hls.js, ¿la librería **exige** el `interstitialsController:
undefined` del ADR 0002, lo **documenta**, o lo **verifica y avisa**?

**Verifica y avisa**, y además entrega la configuración para que el camino
correcto sea una línea: `QualabsConcurrentHls.hlsConfig` se pasa a `new Hls()`.

- **Exigir no se puede, en el sentido de arreglarlo.** El controlador se
  instancia en el constructor de hls.js, con la única condición de que
  `config.interstitialsController` sea truthy. Para cuando la instancia llega a
  `attach`, la maquinaria ya existe o no existe, y ninguna llamada desde acá lo
  cambia. La otra forma de exigir —que la instancia se construya a través de la
  librería— contradice la superficie que el ADR 0015 fija, donde el player es
  del integrador.
- **Documentarlo no alcanza, y es el argumento de fondo.** Con la maquinaria
  encendida el player agenda el Date Range de clase Apple que la misma playlist
  lleva y reemplaza el contenido con él. Lo que el integrador ve es un player
  perfectamente normal haciendo lo que un player hace. No hay excepción, no hay
  error, no hay nada en pantalla que se note: su player se convirtió en un
  cliente de fábrica y dejó de mostrar lo concurrente sin ningún síntoma. Se
  equivoca una sola vez y no se entera.
- **Tirar una excepción es una promesa más grande de la que un plugin puede
  hacer.** Bajarle la página a alguien por una configuración que arregla en una
  línea es peor que decírselo fuerte.

Verificado en vivo, en una segunda carga de la misma página: una instancia de
fábrica y una construida con la configuración, las dos pasadas por `attach`.

```
"deFabrica":   { "interstitialsControllerOn": true,  "message": "the player instance was
                 built with its interstitials machinery ON. ..." }
"conLaConfig": { "interstitialsControllerOn": false, "message": null }
```

El mensaje sale por `console.error` y además queda en `diagnostics` del handle
que `attach` devuelve, para que un integrador pueda leerlo desde su código y no
solamente mirarlo pasar.

## La capa donde se dibuja, que pasó a ser de la librería

Hasta ayer la página escribía `<div class="ads" id="ads">` y lo estilaba en su
propia hoja. La regla que ese div necesita lleva un invariante: **sin `z-index`**,
para que la capa no sea un contexto de apilado y el `zDepth` del layout decida
quién queda arriba. Cerrarla pone todos los avisos por encima de la imagen, y
hay layouts donde el aviso es el fondo. Ese invariante es del renderizador y no
del que escribe la página, así que la capa la crea ahora la librería adentro del
contenedor, con las tres propiedades puestas como estilos en línea sobre el nodo
que ella misma crea.

Leído de la página viva, no del código:

```
"laCreoLaLibreria": true,  "elDivDeLaPaginaYaNoEsta": true,
"dentroDelContenedor": true,  "hermanaDelPrimario": true,
"position": "absolute", "inset": "0px", "pointerEvents": "none", "zIndex": "auto"
```

## La página del integrador, medida en líneas

**Trece líneas.** Son todo lo que la página tiene porque la librería existe.

Ocho de JavaScript, entre las dos vallas de `js/app.js`:

```js
const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
const concurrent = QualabsConcurrentHls.attach(hls, {
  container: document.getElementById('player'),
  audioControl: document.getElementById('ad-audio'),
  onResolved: logResolved
});
hls.loadSource(SRC);
hls.attachMedia(video);
```

Y cinco de marcado, en `index.html`:

```html
<script src="./dist/qualabs-concurrent-hls.js"></script>   <!-- 116 -->

<div class="player" id="player">                           <!-- 93 -->
  <video class="video" id="video" playsinline controls></video>
</div>
<button class="ad-audio" id="ad-audio" type="button" disabled>no ad on screen</button>  <!-- 99 -->
```

**El mínimo son diez.** Tres de las trece no hacen falta: `audioControl` y el
botón que apunta son provisorios y la T-03 los borra cuando los controles pasen
a ser de la librería, y `onResolved` es la traza de consola de esta página, que
un integrador que no la quiere no pasa.

Dos líneas que el bloque referencia quedaron deliberadamente afuera de la valla,
porque existen tenga o no tenga esta librería: `const video =
document.getElementById('video')`, que es su propio elemento de media, y `const
SRC`, que es su propio contenido.

Para dimensionar el otro lado de la línea: la librería son 622 líneas de fuente
en cuatro archivos, y la página son 120 de `index.html` más 128 de `js/app.js`,
de las cuales la mayor parte es el par de compatibilidad y la traza del
contrato.

## Lo que esta task encontró y no arregló

- **El `<video controls>` del primario sigue ahí** (`index.html:94`). Es de la
  T-03 sacarlo, y el ADR 0015 ya dice por qué: el renderizador escala el
  primario con un `transform` y los controles nativos escalan con él. Se dejó
  intacto porque esta task es una mudanza y la demo no cambia lo que hace.
- **El botón `#ad-audio` sigue siendo de la página** y se le pasa a la librería
  como elemento. Es el cruce de la línea que queda vivo después de esta task, y
  es el que la T-03 cierra construyendo el control de la composición.
- **`hlsConfig` es un objeto con una clave en `undefined`**, o sea la ausencia
  de algo, entregada como si fuera una cosa. Es raro de mirar y es lo correcto
  de usar: `{ ...hlsConfig }` sobre la configuración del integrador apaga la
  maquinaria sin que él tenga que saber el nombre de la clave.
- **La superficie pública no está congelada**, y el ADR 0015 dice que no debe
  estarlo hasta que los controles existan. `attach` toma hoy `container`,
  `video`, `audioControl` y `onResolved`; los dos últimos son los que se van a
  mover.
