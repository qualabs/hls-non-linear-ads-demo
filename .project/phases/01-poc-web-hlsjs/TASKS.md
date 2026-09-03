# Tasks — fase 01-poc-web-hlsjs

**Este plan está deliberadamente incompleto, y esa es su forma correcta
hasta que las tres primeras tasks se lean con Nicolás.** El diseño de la
fase pide tres mediciones cortas antes de comprometer un plan de
construcción, porque hasta que corran, un plan completo sería otra vez
planificación sobre datos que no están, que es exactamente el error que
este proyecto ya cometió una vez. Las tres mediciones son la T-01, la
T-02 y la T-03. La T-04 es la que cierra el plan con sus resultados, y
recién ahí aparecen las tasks de construcción.

| id   | brief                                                              | status  | plan | evidence                                              |
| ---- | ------------------------------------------------------------------ | ------- | ---- | ----------------------------------------------------- |
| T-01 | Medir cuántos elementos de video con hls.js reproducen a la vez     | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-01/`         |
| T-02 | Medir la cadena mínima de señalización y el par de compatibilidad   | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-02/`         |
| T-03 | Medir el render de un layout de SVTA contra su vista previa         | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-03/`         |
| T-04 | Cerrar el plan de construcción con los resultados de las mediciones | pending | —    | —                                                      |

---

## T-01 — Medir cuántos elementos de video con hls.js reproducen a la vez

- **Objetivo:** saber si dos o más elementos `<video>`, cada uno con su
  propia instancia de hls.js, reproducen simultáneamente sin pelearse por
  decodificadores. Es la medición que decide si el mecanismo de multiview
  entra en la demo, y en menor medida también toca al overlay cuando el
  asset es video en lugar de imagen. Es la mitigación del riesgo R2 de la
  fase.
- **Qué tiene que cubrir:** contenido HLS real servido por HTTP, no
  archivos sueltos, con una instancia independiente de hls.js por
  elemento. La serie va de uno a cinco elementos, porque el multiview de
  la herramienta de SVTA son cuatro cuadrantes y el peor caso realista es
  el primario más cuatro. **La corrida de un solo elemento no es
  opcional: es el control** contra el que se leen las demás, y sin él un
  número bajo no distingue entre un problema de concurrencia y un
  problema del entorno de medición. Por cada elemento hay que registrar
  cuánto avanzó su `currentTime` contra el reloj de pared, cuántos
  cuadros decodificó y cuántos descartó, y cualquier error de hls.js.
  Punto de partida: la skill `playwright`, que corre el Chrome real del
  sistema; el ADR 0008, que explica por qué el multiview va último; y el
  ADR 0011, cuya propuesta a David depende de este resultado.
  Restricción: la medición no toca el repositorio de la demo, todo el
  banco de pruebas vive en un directorio temporal. Sin dependencias.
- **Definición de done:** existe, guardada como evidencia, una tabla con
  una fila por cantidad de elementos que dice, para cada uno, la tasa de
  avance contra el reloj de pared y los cuadros decodificados y
  descartados, más una captura de pantalla que muestra los elementos
  pintando a la vez. Con eso se puede contestar sí o no a la pregunta de
  si el multiview entra.
- **nivel de verificación:** mínimo. Es una medición cuyo resultado
  entero lo lee una persona antes de que nada dependa de él, y lo único
  que decide es si se sigue por ese camino.

## T-02 — Medir la cadena mínima de señalización y el par de compatibilidad

- **Objetivo:** confirmar en ejecución los hallazgos que hasta ahora son
  lectura del código de hls.js, y validar completo el par de
  compatibilidad del ADR 0007. Son tres cosas: que hls.js no convierte
  nuestra clase en un interstitial, que igual le entrega el tag entero a
  la aplicación, y que el controlador de interstitials se puede apagar
  por configuración.
- **Qué tiene que cubrir:** una media playlist con los dos
  `EXT-X-DATERANGE` en el mismo `START-DATE`, uno de clase
  `com.apple.hls.interstitial` y otro de clase
  `com.qualabs.hls.concurrentInterstitial`, cada uno con su propio `ID` y
  su propio `X-ASSET-LIST`, sobre un VOD que tenga `EXT-X-PROGRAM-DATE-TIME`.
  En la misma página, dos instancias de hls.js sobre esa playlist: una de
  fábrica y otra con el controlador de interstitials apagado. Hay que
  registrar qué ve cada una en `details.dateRanges`, qué agenda de
  interstitials arma cada una, cuál pide cada asset-list, y qué está
  reproduciendo cada una cuando llega el `START-DATE`. Punto de partida:
  los ADR 0002, 0005 y 0007. Restricción: hls.js entra sin modificar, en
  la versión 1.7.2, que es contra la que se leyó el código. Sin
  dependencias.
- **Definición de done:** un registro de eventos guardado como evidencia
  donde se lee que la instancia de fábrica agenda solamente el aviso
  lineal, que las dos instancias reciben los dos Date Ranges con todos
  sus atributos, que la instancia de la demo no tiene manager de
  interstitials, y una captura donde la de fábrica está reproduciendo el
  aviso lineal mientras la de la demo sigue en el contenido primario.
- **nivel de verificación:** mínimo. Es una corrida que confirma o
  desmiente una lectura de código, y su salida entera la lee una persona.

## T-03 — Medir el render de un layout de SVTA contra su vista previa

- **Objetivo:** ver si el modelo de porcentajes de inset alcanza para
  renderizar los layouts, o si falta información que el POC va a tener
  que inventar. Es la medición que le pone piso al trabajo de
  renderizado, que es el grueso de la fase.
- **Qué tiene que cubrir:** los seis tipos que emite la herramienta de
  SVTA, no uno solo, porque cada uno produce cajas de proporciones
  distintas. Para cada uno hay que comparar la caja que el modelo
  describe contra la caja que el navegador dibuja, en píxeles, y contra
  la vista previa de la propia herramienta. Hay que mirar en particular
  qué pasa cuando la relación de aspecto de la caja no coincide con la
  del asset, que es la pregunta que el modelo de datos no contesta.
  Punto de partida: la herramienta en `https://www.svta.org/wp-content/nlag/v4/`
  y los ADR 0001 y 0004. Restricción: el asset-list se consume como la
  herramienta lo emite, así que todo lo que no se pueda renderizar es un
  hueco para reportarle a SVTA y no un formato para cambiar por nuestra
  cuenta. Sin dependencias.
- **Definición de done:** una tabla, guardada como evidencia, con la
  diferencia en píxeles entre la caja esperada y la dibujada para cada
  elemento de cada uno de los seis tipos, más las capturas de nuestro
  render y de la vista previa de la herramienta, y la lista escrita de lo
  que el modelo no dice.
- **nivel de verificación:** mínimo. Es una exploración que decide cómo
  se encara el renderizado, y su resultado lo lee una persona antes de
  que se escriba una línea del renderizador.

## T-04 — Cerrar el plan de construcción con los resultados de las mediciones

- **Objetivo:** convertir los tres resultados en el plan de tareas de
  construcción de la fase, que hasta ese momento no existe a propósito.
- **Qué tiene que cubrir:** los tres resultados ya están medidos y son
  estos.

  De la T-01: hasta cinco elementos de video de 1280x720 a 30 fps, cada
  uno con su instancia de hls.js, reproducen a la vez en el Chrome del
  sistema al 99,6 por ciento del reloj de pared, con unos 29,8 cuadros
  por segundo cada uno y menos del 2 por ciento de cuadros descartados,
  sin errores. El multiview no está bloqueado por concurrencia de
  decodificadores en esta máquina.

  De la T-02: la instancia de fábrica agenda solamente el aviso lineal e
  ignora la clase concurrente, las dos instancias reciben los dos Date
  Ranges completos, y la instancia con el controlador apagado sigue
  reproduciendo el primario mientras la de fábrica reproduce el aviso.
  Los tres hallazgos y el par de compatibilidad quedaron confirmados en
  ejecución.

  De la T-03: la geometría cierra exacta, con cero píxeles de diferencia
  entre la caja del modelo y la que dibuja el navegador en los quince
  elementos de los seis tipos. Lo que el modelo no dice es cómo llena un
  asset una caja cuya relación de aspecto no es la suya, y eso pasa en
  tres de esos quince elementos. Dos detalles más del formato real que
  emite la herramienta: omite el bloque `primaryContent` cuando está en
  sus valores por defecto, y omite `volume` cuando vale 100, así que el
  renderizador tiene que asumir esos defaults en lugar de exigir los
  campos.

  El plan que salga de acá respeta el orden del ADR 0008 y la escalera de
  repliegue del `PHASE.md`, incluye las tasks de tests que corresponden a
  lo que se construya, y decide la política de llenado que la T-03 dejó
  abierta. Punto de partida: el `PHASE.md`, los ADR de `decisions/` y las
  carpetas `tasks/T-01`, `tasks/T-02` y `tasks/T-03`. Restricción: no se
  escriben tasks de construcción antes de que Nicolás lea estos tres
  resultados. Depende de T-01, T-02 y T-03.
- **Definición de done:** este archivo tiene las tasks de construcción de
  la fase, cada una con su bloque y su nivel de verificación, y la
  política de llenado quedó decidida o registrada como pregunta para
  SVTA.
- **nivel de verificación:** mínimo. Es trabajo de planificación que
  Nicolás lee entero antes de que se ejecute nada.
