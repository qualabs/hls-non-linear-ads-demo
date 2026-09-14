# Las cuatro casillas donde los autos cruzaban la cámara

Seis generaciones lanzadas, **US$4,80**, de las cuales dos volvieron vacías por un error de
Vertex. Las cuatro casillas están regeneradas y las catorce siguen midiendo 8,000000 s con
192 cuadros a 24 fps, así que los 112,000 s del programa cierran sin recortar nada.

El veredicto en una línea: **las cuatro fallaban por lo mismo —el clip pedía que los autos
pasaran al lado de la cámara— y las cuatro se arreglaron sacando el cruce, con la cámara
viajando al lado de los autos.** Tres de las cuatro volvieron bien. **La casilla 10 no se
puede usar: le dibujó "Apple" en la carrocería**, y eso es lo único que esta corrida deja
sin resolver.

Los clips nuevos están en `demo/race-multiview/content/.fuentes/programa/` con su
`.prompt.txt` al lado. **Los cuatro viejos no se borraron**: están en
`content/.fuentes/programa/rechazados-el-paso-por-camara/`, con su prompt, porque son la
referencia contra la que se mira si el arreglo mejoró algo.

---

## 1. El diagnóstico anterior explicaba menos de lo que parecía

La corrida anterior concluyó que el defecto era **el cambio de sentido del auto**, y sacó
la chicana, las eses y la entrada a la curva. Esas cuatro casillas volvieron sin curva
adentro y volvieron mal igual, así que la causa estaba en otro lado.

Se miraron los doce cuadros de cada una de las catorce y la separación es limpia: **las
cuatro rechazadas terminan con la cámara mirando la pista vacía o un auto que se aleja de
espaldas; las diez aprobadas tienen los autos en el mismo lugar del cuadro los ocho
segundos.** Las rechazadas piden un **cruce**: el auto viene de frente, pasa al lado de la
cámara, y la cámara sigue girando para verlo irse. Las aprobadas piden un **seguimiento**:
la cámara va con el auto y el que se mueve es el fondo.

| casilla | lo que dijo Nicolás | qué se ve en los doce cuadros |
| --- | --- | --- |
| 1 | *"los autos en un momento aparecen yendo hacia el otro lado"* | llegan de frente, cruzan, y los últimos cuadros son autos de espaldas: el sentido en pantalla se da vuelta en el medio del clip |
| 5 | *"el auto da vuelta y la pista se genera raro"* | la cámara barre detrás del auto al pasar, y del otro lado la pista es otra; el auto además pasa de monoplaza a prototipo de ruedas cubiertas |
| 10 | *"tiene un problema de continuidad"* | los dos autos cruzan, la cámara los sigue de espaldas, y **el auto verde desaparece**: queda uno solo |
| 12 | *"el auto se regenera, hace cosas raras"* | el auto magenta cruza y en los últimos cuatro cuadros el que se aleja **es casi blanco**, con apenas un resto de magenta en el cubremotor: no es el mismo auto |

**Por qué rompe.** Cuando el auto pasa al lado de la cámara, la cámara tiene que barrer
medio círculo en menos de un segundo. Del otro lado el modelo ya no tiene de dónde copiar
el mundo y lo inventa: ahí aparecen la calzada nueva, el auto repintado, el segundo auto
que se va, y el sentido de marcha dado vuelta, porque un auto que venía de frente pasa a
irse de espaldas adentro del mismo clip.

### Y el teleobjetivo no era la receta

La corrida anterior dejó escrito que *seis de los nueve buenos dicen "with a long lens" y
ninguno de los cinco rechazados lo decía*. Medido sobre los catorce prompts de hoy, esa
frase quedó en las dos listas y no separa nada:

| frase en el prompt | rechazadas (4) | aprobadas (10) |
| --- | ---: | ---: |
| `past the camera` / `go past` | **4** | 2 |
| `towards the camera` | 2 | **0** |
| `with a long lens` | 3 | 6 |

Las dos aprobadas que piden el cruce son la 2 y la 6, y en las dos el modelo lo ignoró y
entregó un seguimiento igual. O sea que pedir el cruce **no garantiza** que rompa, pero es
lo único que las cuatro que rompieron tienen en común. Es el factor de riesgo que se puede
sacar sin pagar nada.

## 2. Qué cambió en cada prompt

La forma no se tocó —bloques rotulados, la cámara primero y última, el párrafo del mundo en
el medio—, porque esa forma es la que hizo que doce de catorce salieran a la primera. El
bloque de geometría se partió en dos y se agregó uno nuevo.

- **`CALZADA`** es lo que antes se llamaba `PISTA` menos su última oración: una sola
  calzada con sus dos bordes corridos de punta a punta, y todos los autos yendo para el
  mismo lado. Lo llevan las cuatro.
- **`SEGUIMIENTO`** es el bloque nuevo y pide la toma de las aprobadas en positivo: la
  cámara viaja al lado de los autos a su velocidad, la distancia no cambia, los autos se
  quedan en el mismo lugar y del mismo tamaño en el cuadro, y lo que pasa es el fondo. La
  única negación es *"never turns round to look back down the road"*, que queda por la misma
  razón que *"no car ever turns back on itself"*: **un movimiento de cámara no es un objeto
  que se pueda pintar**, a diferencia de `boards` o de `lettering`.
- **`PISTA`** —la calzada más una cámara clavada en el piso— queda para la casilla 6, que es
  la única aprobada que la llevaba, y sigue siendo byte por byte el texto que viajó.

| casilla | antes | ahora |
| --- | --- | --- |
| **1** | cámara fija al costado de la recta; los seis vienen *"towards the camera and go past"* | la cámara baja la recta costera **con** los seis y los seis quedan en cuadro los ocho segundos |
| **5** | la salida de la chicana, el auto *"accelerates towards the camera and past it"* | NOCTEV solo a fondo por un tramo abierto, la cámara a su lado. **La chicana no se nombra** |
| **10** | el tramo costero, los dos autos *"go past the camera"* | los dos juntos por el tramo costero, la cámara a su lado, el mar pedido en las dos posiciones que ganan |
| **12** | cámara en el piso a la altura de la rueda, el auto *"goes past the camera"* | la cámara sube a la altura del auto y se aleja hasta que entra entero, con la rueda sobre el piano |

La receta completa vive donde el ADR 0061 manda, en
`demo/race-multiview/scripts/generar-programa.py`, con el porqué en su cabecera. **Y el
generador reproduce letra por letra los catorce `.prompt.txt`**, verbatim en
[`salidas/el-generador-y-los-prompts.txt`](salidas/el-generador-y-los-prompts.txt). Eso es
además la prueba de que partir `PISTA` en dos no movió una coma de la casilla 6, que es la
única aprobada que lo lleva: corrido **antes** de generar, el mismo comparador daba las
cuatro regeneradas en DISTINTO y las otras diez en IDENTICO, la 6 incluida.

**El control se vio dar distinto**: sacándole el bloque de seguimiento a la casilla 5, el
prompt pasa de 3.083 a 2.051 caracteres y el comparador lo marca. Sin eso, una comparación
que da todo IDENTICO no distingue entre reproducir el texto y comparar algo contra sí
mismo.

## 3. Cómo volvieron

Las cuatro láminas de [`lamina/`](lamina/) tienen doce cuadros del rechazado arriba y doce
del nuevo abajo. **Doce y no uno porque el defecto no está en un cuadro: está en que el
mundo cambia adentro del clip.**

| casilla | qué muestra el clip nuevo | |
| --- | --- | --- |
| **1** | los seis juntos, cada uno de su color, sostenidos en el cuadro los ocho segundos; dunas y tribuna pasando por detrás. Una sola calzada, un solo sentido | **sirve** |
| **5** | NOCTEV solo, sin una letra en la carrocería, clavado en el cuadro. Es el clip más limpio de los catorce | **sirve** |
| **10** | la geometría quedó perfecta —los dos autos juntos, una calzada, nadie desaparece— y **la carrocería dice `Apple`** | **no sirve** |
| **12** | el auto magenta a lo largo del piano con la rueda trasera encima, entero en cuadro. A los 5,3 s hay un corte a un plano frontal y el clip termina ahí | **sirve** |

### La casilla 10 y la marca

Es el R2 de `PHASE.md` —*"Veo dibuja una librea que se parece a una de verdad"*— ocurrido
sobre la peor marca posible: **la demo la presenta David en el evento de Apple**. En el clip
se lee `Apple` con su tipografía y una media manzana roja en el pontón del auto verde,
`Appll` en el morro, y `Apple` repetido en los carteles de la valla. Está en dos momentos
distintos del clip, así que no es un artefacto de un cuadro:
[`lamina/10-la-marca-en-la-carroceria.png`](lamina/10-la-marca-en-la-carroceria.png) y
[`lamina/10-la-marca-en-las-vallas.png`](lamina/10-la-marca-en-las-vallas.png).

**No se regeneró y es una decisión, no un olvido.** Contra el techo de US$26,00 de la etapa
quedan US$0,40 y una generación cuesta US$0,80. El techo es el corte escrito y la
instrucción es explícita: pasado el techo, se cierra con lo que haya y se reporta.

Lo que queda por decidir es de Nicolás y son US$0,80: regenerar la 10 sobre el mismo prompt
—la geometría ya está resuelta, lo que hay que cambiar es la palabra que invita la marca—,
o dejarla como está, que no es una opción porque el clip no se puede mostrar.

### El corte de la casilla 12

El clip trae **dos tomas**: un seguimiento lateral con la rueda sobre el piano hasta los
5,3 s, y después un corte a un plano frontal que sigue hasta el final. No es una falla de
geometría —el auto no cambia de color ni de forma, la calzada es una sola y el sentido no se
da vuelta— pero sí es una toma de más adentro de un clip que pedía una. **Para el montaje
importa por una razón concreta: la línea 15 del guion nombra la rueda sobre el piano, y eso
está en cuadro sólo los primeros 5,3 s.**

## 4. Lo que no se arregló, y no se intentó arreglar

- **La tipografía sigue apareciendo en la carrocería**, con la excepción notable de la
  casilla 5, que volvió sin una sola letra. En la 12 se lee `DEEP CNM`. Es lo que la T-03
  midió y dejó sin resolver, con su cuenta: sacarla rechazando clips cuesta unas cinco
  generaciones por clip limpio.
- **El mar sigue sin aparecer en la casilla 10.** Se pidió en las dos posiciones que el
  hallazgo del encuadre midió como las que ganan y volvieron dunas y matorral. Es el segundo
  intento fallido sobre lo mismo, así que la conclusión ya no es "hay que pedirlo mejor": el
  mar de este circuito no está saliendo por prompt.
- **Los dos planos aéreos siguen sin ser aéreos.** No son de esta corrida y no se tocaron.
- **Los nombres de archivo de la 5 y la 10 dicen `chicana` y `eses`, y ninguna de las dos
  tiene ya ni chicana ni eses.** No se renombraron: el orden del montaje sale del prefijo
  numérico, y renombrar deja colgadas las referencias de la corrida anterior y de
  `rechazados-*`. Queda anotado como lo que es, un nombre que miente.

## 5. El portón de audio, corrido entero

Se corrió el instrumento que ya tiene la task —`salidas/oir-el-programa.sh` de la T-03—
sobre los catorce, para que los cuatro nuevos se lean contra los diez viejos y no contra
nada. Verbatim en [`salidas/el-porton-de-audio.txt`](salidas/el-porton-de-audio.txt).

| oyente | los catorce clips | control positivo: el ambiente con una línea de relator a −20 LUFS | control de otro origen: los clips de la parada del partido |
| --- | --- | --- | --- |
| whisper.cpp medium | `(engine revving)`, `(tires squealing)`, `(airplane engine roaring)` | *"Norvik are still in front here, 1-0…"* | *"Yeah, we needed this break, I'm shattered…"* |
| gemini-2.5-flash | `SPEECH: NO` en las catorce | `SPEECH: YES` + transcripción | `SPEECH: YES` + transcripción |

**Los dos controles se vieron rechazar**, y el segundo vale más porque no lo preparó nadie
para esto: son archivos de otra demo con diálogo de verdad.

**Una discrepancia entre los dos oyentes, y se resuelve a favor del segundo.** whisper
devuelve `[Music] [Music]` para la casilla 12, que sería una violación del prompt
(*"no music"*). El segundo oyente, que escucha el archivo en vez de transcribirlo, reporta
`Racing car engine, engine whine, acceleration, deceleration` y ninguna música. Es la falla
conocida de whisper con motores sostenidos, y el portón decide sobre habla, que es `NO` en
los dos.

**El nivel, que es insumo del montaje.** Los catorce van de **−15,3 a −24,8 LUFS** —los
mismos 9,5 LU de dispersión que midió la T-03— y el pico más alto es **−3,6 dBFS**, así que
ningún clip está al borde del recorte.

## 6. Los colores no hay que volver a medirlos

Los seis hexadecimales de `race.json` se midieron sobre los catorce clips, y tres de esos
catorce cambiaron. **Ninguno de los seis autos se quedó sin material propio**, que es la
condición que la corrida anterior fijó para tener que volver a medir:

| auto | casillas propias que sobreviven |
| --- | --- |
| CALDRIX | 2, 3, 8, 13 |
| MARVOK | 3, 9, 13 |
| NOCTEV | 9 |
| RUNTAK | 6 |
| PENTAV | 6, 7 |
| QUENTRA | 7 |

## 7. Lo que toca al relato

El guion de la T-04 nombra lo que está en pantalla en tres de las cuatro casillas. **Una
línea hay que reescribirla, una segunda ya venía marcada de la corrida anterior, y una
tercera no cambia de texto pero sí de dónde puede caer.**

| línea | casilla | texto | qué pasa |
| --- | ---: | --- | --- |
| 01 | 1 | *"Eleven laps gone here on the coast, and this is still one race."* | **queda**: las dunas están en cuadro y los seis autos también |
| 06 | 5 | *"Noctev third, and he is using every inch of the kerbs through the chicane."* | **se reescribe**: la chicana ya no está en el clip |
| 13 | 10 | *"Down to the sea section, Pentav and Quentra still together."* | **se reescribe**: el mar no aparece, y ya no se lo va a pedir de nuevo |
| 15 | 12 | *"Look at Runtak over the kerb, the rear wheels taking all of it."* | **queda**, pero tiene que caer antes de los 5,3 s del clip |
| 16 | 12 | *"And the car keeps taking it."* | **queda**: después del corte el auto sigue, aunque el piano deje de ser el tema |

Los dos reemplazos propuestos, con el mismo largo hablado que los originales para no mover
la mezcla:

- **Línea 06** → *"Noctev third, and he has been quicker than the leader for two laps now."*
- **Línea 13** → *"Pentav and Quentra, still together, and still nothing between them."*

**No se tocó `scripts/relato/guion.json`**: es de la T-04 y el re-sintetizado se despacha
aparte.

## 8. Lo que no se rompió

`npm test` da **184 pruebas, 184 pasan, 0 fallan**, salida 0; `npm run check` da **verde**
—3 ocurrencias, las tres en la lista aceptada, y cero hits en la segunda—, salida 0. Son los
mismos números con los que la T-01 abrió la fase. Verbatim en
[`salidas/no-se-rompio-nada.txt`](salidas/no-se-rompio-nada.txt).

**Y `lib/` no se tocó, lo cual acá es más fácil de probar que de prometer**: `git status` no
muestra un solo archivo trackeado modificado. Todo lo que esta corrida escribió vive adentro
de `demo/race-multiview/` y de `.project/phases/13-…/`, que son las dos carpetas que todavía
no están commiteadas.

## 9. Lo que esta corrida NO hizo

- **El montaje y el audio.** `programa.mp4` no se rehízo: los catorce clips están sueltos,
  cuatro de ellos nuevos y uno —la 10— inutilizable. El concat, el emparejado de niveles y
  el relato son de la task del montaje.
- **Nada fuera de `demo/race-multiview/`**, salvo esta carpeta de evidencia y el registro de
  gasto de la T-03, que es una línea por generación lanzada.
