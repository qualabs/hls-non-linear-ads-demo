# Generación de la parada del juego — siete intentos, y por qué no entró

**Registro de una corrección post-cierre que se intentó y no entró.** El estado final es
que el plate se queda con el corte que tiene hoy, y esta carpeta existe para que nadie
vuelva a recorrer el mismo camino creyendo que no se probó.

## El problema que había que resolver

Nicolás probó la demo: *"veo un video de gente jugando un deporte y luego un video de
cuando se están hidratando, y el problema es que el usuario final percibe como que el
video principal cambió... queda la duda de si es un interstitial de cuando se reemplaza el
video primario."*

Es el peor defecto posible para esta demo: **la propiedad que existe para demostrar es que
el primario nunca se reemplaza**, y un corte de escena en el segundo exacto del break le
da al espectador la lectura opuesta. La demo desmintiendo con la imagen lo que afirma con
el texto — el mismo defecto que tenía la L, en otra capa.

## Lo que sí funcionó, y hay que decirlo primero

**La continuidad generada anda, y bien.** Desde el último cuadro del acto de juego, Veo
devuelve inequívocamente el mismo partido: misma cancha de césped sintético con las mismas
franjas de corte, misma reja verde, mismos banderines, misma pista atrás, misma luz plana,
cámara quieta. Y los jugadores **van y toman agua**, que es la escena que Nicolás quería.

**Y `lastFrame` converge de verdad**: cerrando contra un cuadro dado, el último cuadro
generado queda prácticamente igual a ése. La cadena cerraba.

El mecanismo que Nicolás propuso funciona. Lo que lo frenó es otra cosa.

## Los siete intentos

| # | qué se cambió | continuidad | vestido comercial |
| --- | --- | --- | --- |
| 1 | los dos extremos clavados | ✔ | ✔ pero **nadie toma agua**: con los dos extremos fijos no hay lugar para contar nada |
| 2 | suelto por adelante | ✔ toman agua | ✘ **felino saltando en tres pecheras** |
| 3 | pechera = un número y nada más | ✔ | felino fuera; ✘ **tres tiras y un swoosh en una botineta** |
| 4 | buzo y botín con algo que dibujar | ✔ | ✘ **regresó**: más tiras, y un escudo en la pechera azul |
| 5 | modelo **no-fast** (`veo-3.1-generate-001`) | ✔ | ✘ **swooshes en el pecho**, más grandes y más legibles |
| 6 | la gente lejos y el primer plano vacío | ✘ **reinventó la cancha** | ✔ sin marcas |
| 7 | **el puente**: 8 s con los dos extremos clavados entre el juego y el metraje de hidratación | ✘ **inventó una tercera escena en el medio** | ✔ |

Costo: seis generaciones con Fast a 720p y una con el no-fast, US$ 5,44 en total, a los
precios de la tabla —"Paid Tier, per second in USD", US$ 0,08/s y US$ 0,20/s—.

## El mecanismo, que explica los siete de una sola vez

> **Veo honra los extremos que se le dan e inventa todo lo que queda en el medio.**

Cuando el medio es corto y los dos extremos son la misma escena, lo que inventa es
plausible y la costura desaparece. **Cuando los extremos son escenas distintas, lo que
tiene que poner en el medio es una escena nueva** — y ahí aparecen las marcas comerciales
y las canchas que no existen.

De ahí sale la regla, y es la que hay que recordar:

> **Un puente sólo puede disolver un corte entre cosas que ya son casi la misma.**

El corte de este plate es entre **dos rodajes distintos**: un picado masculino en cancha
de césped sintético con luz plana, y un equipo femenino en otra cancha con luz de tarde.
`los-cuatro-primeros-cuadros-ninguno-puenteable.png` los pone uno al lado del otro:
ninguno de los tres clips de parada es puenteable desde el cuadro de juego. **No es un
problema de prompt ni de modelo.**

## La decisión, y es de postura y no de presupuesto

**No se dibujan marcas de terceros.** Es la misma decisión que Nicolás ya había tomado al
elegir marcas de fantasía en lugar de marcas reales; dibujar un swoosh es esa decisión con
otra ropa, en la dirección que ya había descartado. Y el argumento de la sala es el suyo:
el público del HLS Interest Group es el que sabe cómo se ve un swoosh dibujado.

**Y hay una distinción que decide y que no es técnica.** Comparado el clip real contra el
generado **al tamaño de entrega, píxel a píxel** (`comparacion-real-contra-generado.png`),
en el real las prendas están limpias y en el generado las marcas están dibujadas. **No se
hereda una marca incidental que el metraje ya tenía: se la dibuja.** La investigación de
contenido trata la ropa deportiva con marca como el caso débil, y lo es **cuando la
filmaste**; cuando la generás, la postura es otra.

## Lo que queda en el plate

**El corte, tal como está.** Es la salida que la regla de aceptación declaraba de
antemano: o el puente entra limpio, o se vuelve al corte. No había una tercera opción
donde entra con una marca chica.

Y queda escrito lo que ya se descartó, para que no se vuelva a intentar:

- **La continuidad gráfica no alcanza.** El scorebug, el bug del canal y el reloj **ya**
  persisten a través del corte —el paquete se quema sobre el plate entero y sólo la placa
  `COOLING BREAK` está acotada a la parada— y Nicolás percibió el cambio de video de todas
  formas.
- **Reordenar los clips de la parada no ayuda**: los tres son del mismo rodaje ajeno.
- **Clips hermanos del mismo picado**: se buscó el perfil del autor en Pexels y no
  devolvió otros videos de esa sesión.

**Lo que sí lo resolvería, y es la vía que la investigación de contenido ya había
nombrado**: metraje propio con una parada real, filmado. Medio día más releases. Es la
única donde nada de esto existe.
