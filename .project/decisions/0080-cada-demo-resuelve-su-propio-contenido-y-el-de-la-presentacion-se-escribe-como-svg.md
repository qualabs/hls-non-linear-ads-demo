---
id: "0080"
title: Cada demo resuelve su propio contenido, y el de la que va a la presentación se escribe como SVG animado
status: accepted
scope: project
date: 2026-09-21
supersedes: "0045"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Apple comunicó que **en la presentación que se hace en sus oficinas no se puede mostrar
contenido de video ni de imagen generado por modelos de IA**. La restricción es sobre **esa
presentación**, y no sobre todo lo que este proyecto produce ni sobre lo que la marca publica:
las cuatro demos que ya existen siguen publicadas y siguen sirviendo para lo suyo.

Eso cierra, **para la demo que va a esa presentación**, el camino que el ADR 0045 había
elegido después de medir las tres herramientas disponibles —*"lo pictórico se genera"*— y con
él la producción entera de la fase 13, que son US$74,40 en 93 generaciones con Veo, y los
creativos de imagen del break de hidratación.

Y devuelve el problema que aquel ADR resolvía: **no existe una fuente de publicidad con marcas
de fantasía**, así que cada creativo hay que producirlo, y para esa demo hay que producirlo sin
modelos generativos de imagen ni de video, y sin marcas reales.

**El material de terceros no lo resuelve**, y está medido: de seis clips de metraje "libre de
uso" que la fase 08 evaluó, **cinco no pasaron el chequeo de cuadro** —escudo de federación,
marca real, menores—, y el que se usó se salvó con un recorte. Un banco de imágenes trae el
mismo problema con otra cara, más una licencia que hay que leer por pieza.

Lo que queda del ADR 0045 es justamente su otra mitad, y es la que nunca falló: *"la geometría
y la tipografía se escriben a mano como SVG y se rasterizan con Chrome headless, que da alfa
real y dimensiones exactas"*. El apunte que ese ADR dejó al pasar es el que hoy decide: *"la
versión SVG rasterizada con Chrome headless compuso perfecto en el primer intento"*.

Y el ADR 0045 fallaba además en algo anterior a la restricción: **era una receta única para
todo el proyecto**. Eso sólo funciona mientras todas las demos tengan las mismas ataduras, y
dejaron de tenerlas el día que una de ellas se muestra en un lugar con reglas propias.

## Decisión

**Cada contenido se resuelve en su propia demo.** No hay una receta de producción única para el
proyecto: **cada demo decide cómo se produce su contenido**, según para qué existe, dónde se
muestra y qué restricciones pesan sobre ese lugar. Lo que una demo resuelve no obliga a la de
al lado, y una restricción que llega de afuera alcanza a las demos que se muestran donde esa
restricción rige.

**Y para `demo/stage-pair/`, que es la que va a la presentación en Apple, eso significa que
todo creativo publicitario se escribe como SVG animado.** Primitivas vectoriales —paths,
elipses, gradientes, texto— y animación **declarativa**, SMIL y CSS, escritas a mano o por un
programa y dibujadas por el navegador. Ni un pixel rasterizado de origen, ni una referencia a
un archivo de afuera, ni una sola llamada a un modelo de imagen o de video.

**Por qué esto cumple la restricción, dicho en sus términos:** lo que no se admite es la
**salida de un modelo generativo** de imagen o de video. Un SVG es un documento de marcado que
describe figuras: es código, del mismo orden que el CSS que dibuja la barra de progreso de este
proyecto o que el HTML de sus páginas. Que un humano o una herramienta lo escriba no lo
convierte en la salida de un modelo de imagen, igual que no lo convierte en eso una animación
hecha en un editor vectorial.

**Y hay una segunda propiedad que no es la razón pero decide cómo se autora:** un vector no
tiene relación de aspecto que respetar. El creativo se autora **con el `viewBox` de la caja que
va a ocupar** y se escala sin resamplear, con lo que desaparece todo el recorte que arrastraban
las cajas que no son 16:9 —la tira vertical de 0,71:1, la horizontal de 4,44:1, el banner de
8,89:1— y el `object-fit: cover` del ADR 0013 deja de tener nada que recortar.

**Dos cosas que el SVG no tiene, y su salida:**

- **No tiene audio.** Donde hace falta sonido, se agrega en el paso de captura a video.
- **No es un medio reproducible por un player.** El aviso lineal lo reproduce también un
  cliente de mercado, que recibe una `URI` a un `.m3u8`, así que **el lineal se captura a
  video**: navegador headless, cuadros, `ffmpeg`, empaquetado a HLS. Es el mismo Chrome
  headless que el ADR 0045 ya usaba para rasterizar, con un cuadro por tick en lugar de uno
  solo.

**Lo que se conserva del ADR 0045**, porque nunca dejó de ser cierto y ahora vale para toda la
pieza y no para una parte: la geometría y la tipografía se escriben a mano como SVG y se
rasterizan con Chrome headless, que da alfa real y dimensiones exactas.

## Consecuencias

**Las cuatro demos publicadas no se rehacen y no se bajan.** `race-multiview` sigue publicada
con su contenido generado, y eso no contradice nada: la restricción es de la presentación y esa
demo no va a la presentación. Lo que esta decisión gobierna es cómo cada demo resuelve su
contenido, y la única que queda atada al SVG es la que se muestra ahí.

**La procedencia pasa a ser el instrumento, en la demo que la necesita.** La afirmación "acá no
hay nada generado por un modelo" no se sostiene mirando píxeles: se sostiene con la lista
completa. Todo asset de `demo/stage-pair/` declara su procedencia en el `CREDITS.md` de la
demo, y **un archivo sin procedencia declarada bloquea la demo**.

**El ADR 0062 no se toca y queda sin instancias en esta demo.** Dice dónde puede ir el
movimiento generado —en una pieza cuya tipografía viva en su propia capa— y eso sigue siendo
cierto; lo que pasa es que en `stage-pair` no hay movimiento generado. En una demo que no vaya
a la presentación, la regla del 0062 sigue gobernando igual que antes.

**El presupuesto de generación de esta demo es cero**, y con él las compuertas de gasto que la
fase 13 tuvo que construir. Lo que costaba dólares por clip ahora cuesta tiempo de autoría.

**Y aparece un modo de falla nuevo que los modelos no tenían**: un SVG mal formado no se dibuja
y **no avisa**. Chrome devuelve un cuadro vacío sin un error en consola, así que una captura
sale negra y el pipeline sigue. Por eso todo paso que consuma un SVG lo parsea como XML antes
de usarlo. El caso medido: una tabla markdown adentro de un comentario XML —el separador
`| --- |` contiene `--`, que es ilegal dentro de `<!-- -->`— rompió un creativo entero en
silencio, y este proyecto escribe cabeceras largas como documentación, que es exactamente donde
uno escribe una tabla.
