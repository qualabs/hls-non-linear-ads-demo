# Acciones después del sync con David y Emil

**Fecha:** 2026-09-21. Faltan 16 días para la presentación del 7 de octubre y 7 para
que abra la ventana de grabación del 28 al 30 de septiembre que el `PROJECT.md` fija
como la fecha real del proyecto.

Este documento cruza lo que salió de la reunión contra el estado que dejó
`preparacion-reunion-hassoun-2026-09-21.md`. Lo que ese documento ya dice no se repite.

---

## 1. Lo que la reunión cerró

Siete cosas dejaron de estar abiertas.

**El recorte del alcance de la especificación.** La interacción del que mira —elegir
cámara, elegir el audio de un feed— no va en la especificación de SVTA. Es una
extensión encima, y David pidió que la separación se vea en el código y en las
librerías, entre el interstitial concurrente de SVTA y el de Qualabs. Es exactamente
la posición que el proyecto venía sosteniendo desde el 17 de septiembre, ahora
acordada con él: deja de ser una decisión nuestra y pasa a ser una decisión conjunta.

**El skip es del break entero, no del aviso.** Y sin compresión del timeline: el
tiempo se espera. Cierra la pregunta que el trabajo de requerimientos tenía abierta.

**El interstitial concurrente extiende al interstitial.** David lo preguntó para no
escribir algo técnicamente falso en el deck. Confirmado.

**Qué se muestra y qué no**, de las cuatro demos. Es el punto 1 de la lista "De David"
del documento de preparación, y es el que destrababa el resto:

| Demo | Qué le toca |
| --- | --- |
| Par de compatibilidad (side by side) | La principal. "Así es hoy / así podría ser" en un cuadro. Le cambiamos los assets por los generados. |
| La demo simple de un solo player | La que se muestra con el network tab abierto, para ver el manifest y los tags. |
| `race-multiview` | El cierre: "y esto se puede llevar más lejos". Le entra un ad break. |
| La que mezcla ad y multi view en una página | **Se cae.** David dijo que la de la carrera la supera. |

**El tiempo de demo son unos dos minutos.** Es el dato que más cambia la
planificación: el problema dejó de ser cuánto hay construido y pasó a ser qué se
elige.

**El ad break dentro de `race-multiview`.** Overlay, interstitial regular y un
double-box concurrente, antes del período de multi view. Una sola demo muestra
entonces lo viejo, lo nuevo y la extensión.

**La especificación de SVTA tiene dueño y fecha.** La escribe Nicolás, primer draft
esta semana, David revisa después de terminar el deck. Era el frente que el documento
de preparación marcaba como el que se cae solo por no tener a nadie. Ya no.

---

## 2. Lo que hay que hacer

Ordenado por lo que bloquea a lo demás.

### Bloqueante

**1. El guion de la demo. Sin dueño, y es lo único que David nombró sin tomar.**
David dijo textual *"we need to start fig[ur]ing out like what do we actually show and
script this out"*, y ahí murió. Con dos minutos de demo, esto ya no es un detalle de
producción: es el recorte. La reunión eligió qué demos, no qué se dice ni en qué orden
ni durante cuántos segundos cada una.
*Quién:* sin dueño. **Proponer que lo arme Nicolás y que David lo confirme**, que es
el mismo reparto que el documento de preparación proponía para el plan de grabación.
*Contra qué fecha:* antes del 28 de septiembre, porque es lo que decide qué se graba.

**2. El acceso al documento de la especificación.** Nicolás y Emil lo pidieron durante
la llamada y nadie dijo que lo iba a otorgar. Sin acceso, el primer draft de esta
semana no arranca.
*Quién:* David.
*Contra qué fecha:* hoy o mañana. Es el único bloqueo duro del compromiso que Nicolás
tomó.

### Comprometido, con fecha

**3. El primer draft de la especificación de SVTA.** Nicolás, esta semana. David
revisa después, con redline o diff. El encargo es fusionar los documentos sueltos en
uno solo y meter lo nuevo.
*Qué entra que antes no estaba:* el skip a nivel break sin compresión, y el corte
entre señalización de publicidad y señalización de multi view.

**4. Las actualizaciones a las demos.** Nicolás, sin fecha dicha en la reunión; la
fecha real la pone la grabación del 28.
- Cambiar los assets del par de compatibilidad por los generados con Veo.
- Meter el ad break en `race-multiview`.
- Exponer el control de cantidad de decoders en la demo web, preferentemente en el par
  de compatibilidad. La capacidad ya está implementada en la librería; falta el
  control en la demo.
- Reemplazar el contenido de terceros que hoy hace de aviso por creativos que parezcan
  publicidad. Nicolás propuso un aviso de Qualabs.

**5. El deck.** David, esta semana: convertir la sección de pasos en un flujo, más
foco en la detección, y después la versión Keynote para el formato ancho del evento.
La hace August si puede, y si no la hace él.

### Off critical path, por decisión de David

**6. TestFlight.** David lo bajó de prioridad explícitamente: *"that's not on critical
path […] As long as we can have that done before the actual event, should be fine."*
Lo pide para mostrarlo él después de la presentación, no durante.
*Quién:* Emil, pedido por David. **Emil no lo aceptó verbalmente**: sus únicas
intervenciones en ese tramo fueron "Mhm." y un "Yes." a otra pregunta. Conviene
cerrarlo con él por escrito antes de darlo por asignado.
*Contra qué fecha:* antes del 7 de octubre.

---

## 3. Lo que quedó sin resolver

**La cuenta de desarrollador de Apple sigue sin aparecer, y ahora importa menos.**
Ver la sección 4. Si TestFlight está fuera del camino crítico, el bloqueo externo del
proyecto bajó de categoría, pero no desapareció: sin cuenta no hay build para el iPad
tampoco.

**Los creativos que faltan (Quad y LBox con video).** David pidió reemplazar los
avisos por creativos que parezcan publicidad, que es un pedido más amplio, pero nadie
habló de los dos assets concretos del pedido `T-12`. Y como el par de compatibilidad
sí entra en la demo, el pedido no se cae solo como el documento de preparación
suponía: sigue vivo, sin dueño y sin fecha.

**Quién otorga el acceso al documento de la especificación.** Es el punto 2 de arriba
y no tiene confirmación de nadie.

**Si el guion lo arma Nicolás.** Nadie lo tomó.

**El ajuste dinámico del layout según la cantidad de decoders.** David describió la
versión ideal —que el ad presentation server adapte la respuesta— y dijo que para la
demo alcanza con cambiar a qué superficie se llama. No se decidió cuál se implementa;
es una decisión de ejecución nuestra.

---

## 4. Lo que la reunión NO tocó

Los tres bloqueantes que el documento de preparación traía. Cada afirmación de ausencia
está buscada en el transcript.

**1. El plan de grabación: no se mencionó, ni una vez.** Busqué `record`, `recording`,
`grabac`, `shoot`, `film`, `captur`, `on stage`, `stage`, `live`, `pre-record`,
`screen record`, `screencast`, `obs`, `canned`: **cero ocurrencias de todas**. La
búsqueda funciona: sobre el mismo archivo `interstitial` da 6, `multi` da 13, `dress`
da 1.

Esto es más grave que "no se habló": **la premisa entera del proyecto no se verificó**.
El `PROJECT.md` dice *"En el escenario se muestran grabaciones y no una corrida en
vivo"* y por eso la fecha real es el 28 al 30 de septiembre. En la reunión David habló
todo el tiempo como si mostrara él: *"I can just easily show, you know, network traces,
show the manifest, show the tags"*, *"this one I'll probably show like with the network
tab"*, *"We're only going to have I think like two minutes for demo"*, y un dress
rehearsal propio el 5 y el 6. Nada de eso confirma ni desmiente la grabación, pero
tampoco la nombra.

**Esto hay que preguntárselo a David de forma directa y hoy**, porque de la respuesta
depende si la fecha del proyecto es el 28 de septiembre o el 5 de octubre, y eso son
siete días de diferencia sobre un plan de 16.

**2. El argumento que se retiró: no se contó.** Busqué `49`, `0.72`, `behind`, `sync`:
la única ocurrencia de `49` es un timestamp (`00:05:49`) y la única de `behind` es
Nicolás hablando de fútbol latinoamericano. El cambio de los 49,47 s a los 0,72 s nunca
se nombró.

Pero el bloqueante de fondo —que David estuviera desactualizado— sí se resolvió, y por
otro camino: David revisó las demos por su cuenta antes de la llamada (*"I went through
all your slacks"*, *"I just went through all of them"*) y eligió sobre el estado actual,
no sobre el del 4 de septiembre. Más aún, al elegir el par de compatibilidad lo describió
con el argumento nuevo: *"it shows a side by side. This is how it is today. Hey, this is
how it could be right with this."* Eso es el argumento del reemplazo, no el del atraso.

*Riesgo residual:* David está parado sobre el argumento correcto pero nadie le dijo que
el anterior se cayó. Si en el deck o en el guion quedó una línea sobre el cliente de
mercado quedándose atrás, sigue ahí. **Cuesta una línea de Slack cerrarlo.**

**3. La cuenta de desarrollador de Apple: no se nombró.** Busqué `developer account`,
`account`, `certificate`, `provision`: **cero ocurrencias de todas**. `test flight` da
2, las dos sin tocar la dependencia. Sigue siendo el único bloqueo externo real, y
sigue sin figurar en ningún lado del repositorio fuera del documento de preparación
(verificado con un grep sobre los `.project/` de los dos proyectos: el término sólo
aparece en ese archivo).

**Además, cambió el dispositivo.** El documento de preparación dice "el iPhone de
David". David dijo en la reunión que **no tiene iPhone, tiene iPad**. No cambia la
dependencia de la cuenta, pero sí cambia el target del build y hay que corregirlo donde
esté escrito.

**Lo demás que no se tocó**, de la lista de 12 preguntas para David del documento de
preparación. Contestadas: la 1 (qué se muestra), la 9 (quién hace la especificación) y
parcialmente la 11 (August es la persona que ayuda con el deck y el Keynote). **Las
otras nueve no se preguntaron**: el scroll de las páginas en la grabación (`scroll`,
`web page`, `landing`: cero ocurrencias), los ADR 0011 y 0012 (`ADR`: cero; `squeeze`
aparece una sola vez y es David describiendo un squeezeback genérico, no confirmando el
mapeo), la mezcla del Quad (`100`: cero; `volume` una vez y es Nicolás hablando de otra
cosa), de qué es la barra de progreso, cómo se entrega la librería (`bundler`, `es
module`: cero), qué significa `version: 2`, el listado de assets abiertos de SVTA, y la
fecha válida del primer draft.

Ninguna bloquea la semana que viene. Las dos que conviene recuperar antes de grabar son
**el scroll** —porque decide si el trabajo de la fase 12 se ve o no— y **el ADR 0012**,
porque los nombres que se elijan ahí entran en la especificación que Nicolás empieza a
escribir esta semana.

---

## 5. Contradicciones entre el transcript y lo que el proyecto tiene escrito

1. **iPhone contra iPad.** El documento de preparación asume un iPhone; David tiene un
   iPad y no tiene iPhone.
2. **La premisa de la grabación.** El `PROJECT.md` la fija como el eje del cronograma y
   la reunión no la mencionó. Ver el punto 1 de la sección 4.
3. **"Tenemos tiempo de sobra."** Nicolás lo dijo dos veces en la reunión —*"We have
   plenty of time"*— contando contra el 7 de octubre. El `PROJECT.md` dice explícitamente
   que el 7 de octubre no se usa como fecha de trabajo y que la fecha es el 28 de
   septiembre. Contra el 28 quedan 7 días, no 16. **Es la misma confusión de fecha que
   el proyecto ya identificó como riesgo, dicha en voz alta.**
4. **La demo `compatibility-pair` no se cae, y el pedido de assets tampoco.** El
   documento de preparación decía que si lo que se graba son el break de hidratación y
   la carrera, el pedido `T-12` muere solo. David eligió el par de compatibilidad como
   la demo principal, así que el pedido sigue vivo.

   Sobre el break de hidratación: la palabra `hydration` aparece una sola vez en el
   transcript y es Nicolás hablando de fútbol latinoamericano, no de la demo. Las demos
   se señalaron en pantalla compartida ("this one", "the other one"), así que **no se
   puede afirmar desde el transcript cuál es la demo que David muestra con el network
   tab**: por las referencias a la forma de L y a que "no tiene cosas mezcladas" podría
   ser esa o la del break de hidratación. Conviene confirmárselo por Slack antes de
   armar el guion.
5. **La revisión del tramo invertido del par de compatibilidad** (los 12 segundos donde
   la comparación queda al revés) ahora pesa más, porque esa demo pasó a ser la
   principal y la que David muestra con el network tab. Sigue pendiente de que alguien
   la mire corriendo.

---

## 6. Para Nicolás, fuera de la minuta

Tres cosas del transcript que no van en un documento que lee David.

**El chiste sobre Apple.** David dijo *"f\*\*\* Apple"* al explicar que usa Pixel, y
los dos hicieron un ida y vuelta imitando a Apple diciendo *"we know better than you"*.
Es distendido y entre ellos, pero la demo es en un evento de Apple y una minuta circula
más de lo que uno planea. Fuera.

**El deck heredado.** David dijo que la sección de pasos *"got disjointed"*, hablando
del material que armó con August. En la minuta quedó como "convertir la sección de
pasos en un flujo", sin el juicio. Si hay que coordinar algo con August, conviene saber
que David no está conforme con esa parte.

**La ambición de LinkedIn.** Nicolás dijo que quiere publicar que Qualabs es la primera
empresa que escribió una especificación buena con AI y sin inconsistencias. David
contestó *"You're just asking for people to fight it, aren't you?"*. Es una advertencia
real sobre un post que invita a que la comunidad de SVTA busque el error. Si el post se
escribe, el reclamo tiene que ser sobre el método y no sobre el resultado.
