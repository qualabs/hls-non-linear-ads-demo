---
id: "0018"
title: Cada barra marca sólo lo que ese player reproduce, y lo marca sobre su propio riel
status: accepted
scope: project
date: 2026-09-07
supersedes: null
superseded_by: null
---

## Contexto

La T-04 de la fase 02 marcó las dos clases de rango en la barra de nuestro
player, en dos carriles y dos colores: violeta sobre el riel para lo que este
player reproduce, amarillo debajo del riel y en un carril propio para lo que hace
un cliente de mercado con el mismo break.

**La razón estaba medida.** Los dos rangos de cada break comparten `START-DATE` y
duración —que es exactamente lo que hace que el par de compatibilidad sea un
par—, así que dibujados uno encima del otro agregan un color y no información. Lo
que los separa no es dónde están sino de quién es cada uno, y lo que los separaba
en la pantalla era el carril: sobre el riel lo que este player reproduce, debajo
lo que hace el otro cliente, que ningún playhead toca porque no es esta línea de
tiempo.

Esa decisión vivió en el documento de la task y no en un ADR, y el informe de
cierre de la fase 02 recomendó promoverla, porque era la decisión de producto más
discutible que esa fase tomó y la que un tercero iba a querer discutir.

Nicolás la probó desde el celular: **el amarillo colgando debajo del riel se lee
como otro elemento y no como parte de la barra.** Y la fase 04 le da al otro pane
su propio cromo, así que la distinción tiene dónde vivir mejor.

## Decisión

**Una barra marca lo que ese player reproduce, y lo marca sobre su propio riel.**
Nada cuelga debajo del riel.

Nuestro pane marca los rangos que nuestro player reproduce. El pane del cliente
de mercado marca los que reproduce el suyo.

## Consecuencias

**La razón que tenía el diseño de dos carriles sigue siendo cierta, y no es lo que
cambió.** Los dos rangos siguen estando en el mismo lugar y sigue siendo cierto
que lo que los separa es de quién son. Lo que cambia es que ahora cada player
tiene su propia barra, así que **la distinción la hace el pane y no el carril**.

**La regla es sobre el player y no sobre la clase de rango, y esa redacción es lo
que la salva de la fase siguiente.** Desde la fase 03 nuestro player reproduce un
aviso lineal tradicional adentro del break, así que va a haber un rango de clase
`interstitial` que es nuestro y que va sobre nuestro riel. Escrita como "nuestra
barra marca los concurrentes", la regla habría que reabrirla en la fase que viene;
escrita así, no.

**El `kind` del contrato se queda y sigue siendo necesario.** Es lo que le permite
a cada barra pintar el rango que marca con el color que esa clase ya tiene, y los
dos colores siguen siendo funcionales y no de marca: el amarillo es el que los
players de Apple usan para marcar un break, así que llega leído, y el violeta es
el que no tiene ninguna convención que respetar porque es lo que se muestra por
primera vez. Sacar el `kind` del contrato habría sido la forma equivocada de
implementar esto, y la fase 03 lo habría tenido que reponer.

**El amarillo no desaparece de la demo: se muda.** Deja de estar en nuestra barra
y aparece en la del otro pane, marcando lo que ese player efectivamente hace. Con
eso el segundo color pasa a decir lo mismo que decía y a decirlo en el lugar donde
ocurre.

**La geometría del riel cambia.** La altura de `.qa-track` es la aritmética de dos
carriles, con la cuenta escrita en el comentario del CSS, así que con un carril el
número cambia y la posición vertical de la barra adentro del cuadro se mueve con
él. Es mobiliario, y es lo que muestra una captura.

**La lista de ocurrencias aceptadas de `scripts/verificar-cortes.mjs` tiene que
quedar consistente.** Está indexada por el contenido de la línea, y las líneas del
lado del renderizado que nombran la segunda clase están ahí con su razón escrita;
sacar el carril borra algunas. Un chequeo cuyas excepciones ya no existen es un
chequeo que dejó de probar lo que dice probar.

**Una barra por player es una promesa más grande que la que la demo necesita**, y
es la que un integrador nos va a hacer valer: si el cromo se puede poner sobre un
player que no es el nuestro, lo que esa barra marque tiene que salir de ese player.
De dónde sale es la decisión de la task que lo construye, y la alternativa
—alimentarlo con un proveedor nuestro— mete nuestra capa de señalización en un pane
que existe para no tenerla.
