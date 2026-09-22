# Preparación de la reunión con David Hassoun y Emil Santurio

**Fecha del documento:** 2026-09-21
**Fechas que ordenan todo:** grabación del 28 al 30 de septiembre (7 días), test run
de Apple el 5 de octubre, dress rehearsal el 6, presentación el 7 (16 días).

El criterio que ordena la lista de abajo lo fija el `PROJECT.md` del proyecto: David
muestra grabaciones en escenario, pero descartó el compositing y pidió que el
software funcione de verdad. Entonces **la fecha real del proyecto es la grabación y
no la presentación**, y lo imprescindible es lo que hace falta para poder grabar.

---

## 1. Dónde está la demo hoy

El trabajo vive en dos proyectos, no en uno. El de web con hls.js
(`hls-non-linear-ads-demo`) y el de iOS nativo con AVFoundation
(`hls-app-non-linear-ads-demo`), que arrancó el 11 de septiembre y reusa el contrato
entre señalización y renderizado del primero sin reabrirlo.

**Veintiún fases entre los dos proyectos. Diecinueve cerradas, dos terminadas sin
cerrar formalmente, ninguna sin arrancar.**

### Web con hls.js: 13 fases

| Fase | Estado | Qué dejó |
| --- | --- | --- |
| 01 POC web con hls.js | cerrada 09-04 | Los cinco layouts del documento de requerimientos corriendo de punta a punta sobre hls.js sin modificar, con una instancia de fábrica al lado sobre la misma playlist. |
| 02 El SDK y sus controles | cerrada 09-05 | La librería cortada de la aplicación, con los controles de la composición: barra con los breaks en dos carriles, pausa, audio y fullscreen. |
| 03 Breaks múltiples y repliegue | cerrada 09-07 | Un break con varios avisos mezclando concurrente y lineal, el asset sin bloque, y el `decoderCount` viajando de la configuración al pedido del asset-list. |
| 04 Refinamiento | cerrada 09-07 | Los dos players idénticos en todo salvo en qué muestran durante el break. Se ejecutó antes que la 03. |
| 05 La sdk y sus demos | cerrada 09-09 | La raíz del repositorio es la librería y cada demo es una carpeta que se levanta con `./run.sh <demo>`. |
| 06 Foco de audio | cerrada 09-09 | Un toque sobre una caja del aviso y esa caja es la que suena; la mezcla declarada vuelve sola. |
| 07 La pelotita de la barra | cerrada 09-09 | La barra de progreso se arrastra con mouse y con dedo, con el seek al soltar. |
| 08 La demo del break de hidratación | cerrada 09-09 | La segunda demo: un minuto de juego detenido con cuatro avisos sobre la imagen en vivo, con el lineal tercero para que la comparación entre en un solo minuto y un solo player. |
| 09 Las transiciones de la composición | cerrada 09-10 | La entrada y la salida de un aviso se leen como movimiento y no como corte, y eso vive en la librería. |
| 10 La demo medida contra sí misma | cerrada 09-10 | El registro de once commits sin fase, más la apertura en negro de la página, la plantilla de la L y los dos scripts de verificación nuevos. |
| 11 El multi view que elige quien mira | cerrada 09-11 | Un segundo tag donde el que publica ofrece un catálogo y quien mira arma la composición, más la demo `multiview-offer`. |
| 12 El scroll que explica el minuto | cerrada 09-11 | La página del break de hidratación explica el mecanismo en cuatro secciones, y nada de lo que afirma está escrito a mano. |
| 13 La carrera donde cada uno mira su auto | **terminada, sin cerrar** | La demo `race-multiview`: 112 segundos de carrera, seis cámaras, el catálogo abierto durante 64 segundos, publicada y respondiendo. |

### iOS nativo con AVFoundation: 8 fases

| Fase | Estado | Qué dejó |
| --- | --- | --- |
| 01 La premisa en iOS | cerrada 09-11 | Un `AVPlayer` sin modificar entrega los `EXT-X-DATERANGE` de clase propia con sus atributos, y dos capas de video reproducen a la vez sin componer. |
| 02 La señalización | cerrada 09-12 | El proveedor que contesta `activeAt(time)` y `programRanges()`, con el reloj del programa midiendo cero contra tres referencias independientes. |
| 03 El renderizado | cerrada 09-12 | Las cajas dibujadas sobre un programa que no se detiene, medidas dos veces contra los píxeles de la versión web. |
| 04 La oferta de varias vistas | cerrada 09-12 | La clase del multi view, con la grilla a cero píxeles de los rectángulos que el browser midió. |
| 05 Las tres demos | cerrada 09-12 | La app nativa con las tres demos sobre las mismas URL públicas que sirve la web, más los tags adentro de la app. |
| 06 La librería hace lo que el sistema no hace | cerrada 09-12 | iOS 15.2 programa los interstitials de la clase de Apple pero no resuelve su `X-ASSET-LIST`; la librería hace ese paso y se lo devuelve a la maquinaria de la plataforma. |
| 07 La app parece una demo | cerrada 09-12 | El aspecto de la web llevado a la app, sin que la librería dependa de la aplicación. |
| 08 La carrera en el teléfono | **terminada, sin cerrar** | La cuarta demo enchufada en la app, y el selector de seis cámaras entrando en el cuadro del teléfono. |

### Lo que hay para mostrar

Cuatro demos en web, las mismas cuatro en la app de iOS. Las dos de la carrera y la
del multi view están publicadas y responden hoy sin credenciales
(`qualabs-hls-demo-race-multiview.storage.googleapis.com` y
`qualabs-hls-demo-multiview-offer.storage.googleapis.com` devuelven 200; una URL
inventada del mismo bucket devuelve 404).

### Discrepancias entre lo que un documento dice de sí mismo y su estado real

Ninguna de las cuatro cambia lo que el software hace. Las cuatro hacen que alguien
que audite el proyecto lea un estado que no es el que hay.

1. **La fase 13 de web declara `status: planning` con sus diez tasks en `done`.** El
   commit que las cerró se llama "La fase 13 cerrada" y es del 14 de septiembre. No
   tiene `REPORT.md`.
2. **La fase 08 de iOS declara `status: planning` con sus cuatro tasks en `done`.**
   Mismo caso, commit del 15 de septiembre, tampoco tiene informe.
3. **El `PROJECT.md` de web no lista la fase 13** en su índice de fases, y su
   `last_update` quedó en 2026-09-11 aunque el trabajo siguió hasta el 14. El
   `LOG.md` termina en la fase 12.
4. **El README de la raíz del repositorio web indexa tres demos y hay cuatro.**
   `demo/race-multiview/` existe en disco, está publicada, y no aparece en la tabla.

---

## 2. Lo que falta para el 7 de octubre

La lista va ordenada por lo que bloquea a lo demás, no por número de fase.

### Imprescindible para que la demo se pueda grabar

**1. No existe un plan de grabación, y la ventana abre en siete días.**
Ninguno de los dos proyectos tiene una fase, una task ni un documento que decida qué
se graba, en qué orden, con qué herramienta, ni quién lo hace. Buscado en los trece
`PHASE.md` de web y los ocho de iOS: la palabra "grabación" aparece sólo como fecha
límite contra la que cada fase se planificó, nunca como trabajo asignado.
*Por qué bloquea:* decide cuáles de los puntos que siguen hay que resolver antes del
28 y cuáles se pueden dejar. Mientras no exista, todo lo demás se prioriza a ciegas.
*Quién:* Nicolás lo arma, David confirma el guion porque es él quien narra.
*Dependencia externa:* ninguna.

**2. David no vio el estado de la demo desde el 4 de septiembre.**
Entre esa fecha y hoy cerraron diez fases en web y ocho en iOS. Lo que vio fue el
POC de los cinco layouts; lo que hay hoy incluye el corte de la librería, los breaks
con varios avisos, el `decoderCount`, el foco de audio, las transiciones, el multi
view, y dos demos nuevas que no existían.
*Por qué bloquea:* David está armando el deck y el script por slide contra un estado
que ya no es el que hay. Cuanto más tarde se sincroniza, más deck hay que rehacer.
*Quién:* Nicolás, en esta reunión.

**3. Hay un argumento de la demo que se retiró a propósito y David todavía lo tiene.**
La fase 01 midió que el cliente de mercado quedaba 49,47 segundos de programa atrás,
y ése era el segundo argumento de la demo. La fase 04 hizo que ese pane reemplace el
contenido en lugar de insertarlo, y la medición pasó a 0,72 segundos: el argumento
del atraso dejó de existir. El que queda es mejor, porque se ve en un cuadro solo —al
mismo segundo, un player muestra el aviso encima del programa y el otro en lugar del
programa—, pero **es un cambio de lo que David cuenta en escenario**.
El `PROJECT.md` deja escrito que esto va contado antes del sync del 21 y no después.
*Quién:* Nicolás lo cuenta, David decide cómo lo narra.

**4. Los ADR 0011 y 0012 siguen en `proposed` y son los dos que dependen de David.**
El 0011 reparte los cinco layouts entre el primer draft y la grabación. El 0012 mapea
los cinco nombres del documento de requerimientos al campo `type` del payload, y tiene
dos puntos concretos sin resolver: los dos LBox son hoy el mismo layout hasta el MIME
del asset —mismo `type`, mismos `viewport`, mismos `zDepth`, y nada en el payload que
los distinga—, y `squeezebackFrame` es el único identificador de la herramienta de
SVTA que no tiene correlato en los cinco nombres.
*Por qué bloquea:* no bloquea código, que ya está escrito y corriendo con los cinco.
Bloquea dos cosas posteriores: qué muestra la grabación y qué nombres entran en la
especificación de SVTA.
*Quién:* David.

**5. Faltan dos creativos, y sólo importan si el recorrido de los cinco layouts entra
en la grabación.**
El Quad se queda sin material porque consume los tres assets de aviso de una sola vez,
y el LBox con video —el que David marcó como el más difícil de conseguir— hoy está
cubierto recortando el 60 % de un clip de 16:9. El pedido está medido en
`phases/01-poc-web-hlsjs/tasks/T-12/t12-los-assets-que-faltan.md`.
*Por qué puede esperar, o morir:* afecta sólo a la demo `compatibility-pair`. Las
otras tres corren con contenido generado con Veo 3, que es la decisión del 15 de
septiembre para que no aparezcan marcas reales en el evento. Si lo que se graba son
el break de hidratación y la carrera, este pedido se cae solo.
*Quién:* depende del punto 1. Si sigue vivo, el material lo trae David.

### Importante, pero no bloquea la grabación

**6. La app de iOS en el iPhone de David, vía TestFlight.**
Se acordó el 17 de septiembre y es lo que convierte la demo en algo que él tiene en
la mano en lugar de algo que le muestran.
*Por qué no bloquea la grabación:* la app corre entera sobre el simulador y desde ahí
se puede grabar. Lo que TestFlight habilita es el uso en vivo, no la captura.
*Dependencia externa que sí existe:* firmar para un dispositivo físico requiere una
cuenta de desarrollador de Apple. La guía de la Mac de desarrollo la lista entre las
cosas que no se pueden hacer sin que alguien la provea, y el ADR 0033 del proyecto de
iOS sacó el hardware real del alcance justamente porque no había teléfono. Buscada la
cuenta en todo el repositorio, no aparece mencionada en ningún lado salvo como
requisito que falta. **Es el único bloqueo verdaderamente externo del proyecto.**
*Quién:* Emil ofreció hacer el empaquetado; la cuenta la tiene que conseguir Nicolás.

**7. La especificación de SVTA vence el mismo día que la presentación y no tiene
dueño.**
Es el tercer frente del trabajo y el de menor prioridad según David, que igual la
quiere actualizada para el 7 de octubre. Las dos salidas que él mismo nombró son que
Nicolás haga un primer pase o que Olivier ayude, y no se eligió ninguna.
*Por qué importa ahora:* hay material nuevo que tiene que entrar, y es una posición
técnica y no una redacción. El 17 de septiembre se decidió sostener que Multi-View y
publicidad no lineal son dos clases de señalización separadas y no una anidada en la
otra: la publicidad la impone quien publica, con layouts fijos y control de audio; el
multi view lo gobierna quien mira. El caso de accesibilidad que trajo Emil —el avatar
de lengua de señas de Ceaniel y SilentApps, donde el stream principal y el intérprete
son dos piezas HLS independientes— muestra que una señal concurrente secundaria se
parece más a una rendición alternativa de video que a una tanda comercial.
*Quién:* hay que decidirlo en esta reunión, porque si no lo decide la fecha.

### Higiene del proyecto, sin efecto sobre lo que se muestra

Cerrar formalmente la fase 13 de web y la 08 de iOS con sus informes, agregar la 13 al
índice del `PROJECT.md`, y agregar `race-multiview` al README de la raíz. Son las
cuatro discrepancias de la sección 1.

---

## 3. Lo que necesita a David o a Emil

Para llevar a la reunión.

**De David:**

1. **Qué se graba y en qué orden**, de las cuatro demos que hay. Es lo que destraba
   todo lo demás.
2. **Si el scroll de las páginas entra en la grabación o se graba sólo el player.**
   Quedó anotado como abierto al cerrar la fase 12 y decide cuánto de ese trabajo se
   ve.
3. **La confirmación del ADR 0011**: si los cinco layouts que hay son los cinco que
   quiere mostrar.
4. **La confirmación del ADR 0012**: el mapeo de los cinco nombres al campo `type`,
   con los dos LBox indistinguibles y `squeezebackFrame` sin correlato.
5. **La mezcla del Quad.** Propuso "the bottom left be 100, and then the other ones
   are all 10" sobre el layout de cuatro elementos. En un multi view el programa es
   uno de los cuatro, así que la mezcla lo baja a 10 mientras un cuadrante del aviso
   va a 100. Está implementado así; falta que confirme que contó al programa entre
   "the other ones". Es una línea de asset list y se escucha en cámara.
6. **De qué es la barra de progreso** cuando hay varios videos en pantalla: del pane
   de la demo o de la página.
7. **Cómo se entrega la librería a quien la integra**: un `<script src>` o módulos ES.
   Hoy el repositorio no tiene bundler, y eso es deliberado. Romperlo es una decisión
   y no un detalle de empaquetado.
8. **Qué significa `version: 2`** en el bloque `X-AD-CREATIVE-SIGNALING`.
9. **Quién hace el primer pase de la especificación de SVTA**, y para cuándo.
10. **Si el listado de assets abiertos de SVTA sigue haciendo falta.** Depende del
    punto 1 de esta lista.
11. **Quién es August**, la persona con la que trabaja el deck, por si hay que
    coordinar algo del material.
12. **Cuál es la fecha válida del primer draft.** El documento de requerimientos dice
    1 de septiembre y la minuta del 2 de septiembre fija el 21. Es una contradicción
    vieja que nunca se cerró y conviene enterrarla.

**De Emil:**

1. **El empaquetado para TestFlight**, una vez que exista la cuenta de desarrollador.
2. **La revisión del tramo invertido del par de compatibilidad.** El break mezclado
   dura 48 segundos del lado nuestro y 12 del lado del tag de clase Apple, así que
   durante 12 de esos 48 el pane de fábrica muestra el programa y el nuestro la
   pantalla tapada: la comparación queda al revés. Está aceptado y explicado, y el
   argumento vive en los otros 36 segundos, pero hay que mirarlo corriendo antes de
   grabarlo.

**Lo que no es nuestro y conviene nombrar:** la cuenta de desarrollador de Apple.
Sin ella la app de iOS se muestra en el simulador y no en un teléfono.

---

## 4. Riesgos con fecha

**La ventana de grabación abre en siete días y no hay plan de grabación.**
Lo que lo haría llegar: salir de esta reunión con la lista de qué se graba y en qué
orden. Es una decisión, no trabajo de ingeniería, y cuesta una conversación.

**La especificación de SVTA vence el 7 de octubre sin dueño asignado.**
Es el frente que se cae solo, porque es el de menor prioridad y el que no tiene a
nadie mirándolo. Lo que lo haría llegar: elegir hoy entre las dos salidas que David ya
nombró, y ponerle una fecha intermedia anterior al 5 de octubre para que el test run
no la encuentre sin empezar.

**TestFlight depende de una cuenta de desarrollador que no está en el registro del
proyecto.**
Lo que lo haría llegar: confirmar hoy si la cuenta existe. Si existe, Emil arma el
paquete. Si no existe, se decide en el momento que la demo de iOS se muestra desde el
simulador y se deja de contar con el teléfono de David, en lugar de descubrirlo la
semana de la grabación.

**La cadena del 5, 6 y 7 de octubre no tiene margen.**
Apple pide un test run el 5 y hay dress rehearsal el 6. Si las grabaciones no están
terminadas el 3 de octubre, cualquier cosa que aparezca en el test run no tiene dónde
arreglarse. Lo que lo haría llegar: tratar el 3 de octubre como la fecha de entrega
real de las grabaciones, y no el 6.

**Lo que David cuenta en escenario todavía incluye un argumento que se retiró.**
Cuanto más tarde se sincronice, más deck hay que rehacer. Lo que lo haría llegar: los
puntos 2 y 3 de la sección 2, en esta misma reunión.
