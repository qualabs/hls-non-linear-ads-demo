---
phase: 01-plataforma-y-primer-draft
title: Plataforma confirmada y primer draft andando al 21 de septiembre
status: in-progress
started: 2026-09-02
closed: null
---

# Fase 01: plataforma confirmada y primer draft andando

La fase existe por el riesgo de plataforma. El camino crítico se eligió
sobre información que nadie tiene todavía, y el 21 de septiembre es el
día en que se sabe si la elección aguanta. La fase cierra en ese hito:
primer draft de las demos andando, más el sync de una hora con David.
La fecha del primer draft está pendiente de confirmar con David, porque
la minuta dice el 21 de septiembre y el documento de requerimientos dice
el 1. La fase corre contra el 21 mientras tanto.

## Alcance

- **Cerrar el hueco de información sobre AVFoundation contra hls.js** y
  confirmar o cambiar la plataforma. Es el entregable que más vale de
  la fase, porque condiciona todo lo que se construye después.
- **Vertical slice funcionando en hls.js**: el player usando la clase
  custom para cargar el asset list, y el renderizado del layout del
  interstitial resuelto por un layout controller. Es el mínimo que
  David nombró.
- **Probar que el layout controller generaliza**, con al menos dos
  layouts de naturaleza distinta: un overlay, que compone encima del
  video sin tocar su geometría, y un L-box, que sí la cambia. El
  reparto completo de los cinco layouts entre el primer draft y la
  grabación se cierra en el sync del 21.
- **Tests del slice**, escritos y corridos, sobre la lógica no visual.
- **El set base de assets relevado**, sin Big Buck Bunny, y con el
  L-box con video atacado temprano porque es el más difícil de
  conseguir.
- **Emil enganchado** para la parte de iOS.
- **Los requerimientos de la demo volcados en el documento de David.**
- **El canal `#wg-hls-presentation` operativo.**

## Fuera de alcance de esta fase

- La grabación final, que es del 28 al 30 de septiembre.
- Los stretch goals: la segunda plataforma completa en iOS, los
  controles e indicador del ad no lineal, y la detección de capability
  de múltiples decoders.
- La especificación de detección de capacidades que trae el documento de
  requerimientos. Queda fuera por la posición de Nicolás, que está en el
  `PROJECT.md`.
- El deck y la presentación, que son de David.
- La actualización de la especificación de SVTA, que se retoma cuando
  la demo esté encaminada.
- El scheduling de DATERANGE.

## Riesgos y mitigaciones

**R1. Dos semanas de trabajo en la plataforma equivocada, descubiertas
el 21 de septiembre.** Es el riesgo principal del proyecto. A David le
dijeron que en AVFoundation esto sería bastante más fácil, porque hay
implementaciones públicas en Swift que no existen en hls.js, y que el
trabajo en hls.js que lo mejoraría está planificado pero no hecho.
David perdió la grabación de esa conversación y mandó un email a Rob
con Nicolás en copia para recuperar los detalles. El documento de
requerimientos deja escrito lo mismo sin los detalles, y agrega la
presunción de David de que se trata de definir la clase en el DATERANGE
y de poder inyectar una custom que interopere bien. Nicolás sostiene lo
contrario por experiencia previa y dejó la reserva de cambiar si aparece
algo nuevo.

Mitigación, en tres partes:

1. **T-01 persigue activamente esa respuesta** en lugar de esperarla.
   Nicolás está en copia del email, así que no depende de que David la
   reenvíe.
2. **El vertical slice se construye buscando el punto de no retorno
   temprano.** T-02 ataca primero la parte donde la contra-indicación
   dice que hls.js es peor, que es la carga del asset list por la clase
   custom y su interacción con el DATERANGE. Si eso no cierra, se sabe
   sin haber construido los layouts encima.
3. **La respuesta sirve mientras quede tiempo de reconstruir antes del
   28 de septiembre.** Si llega después del primer draft, cambiar de
   plataforma ya no entra en el calendario, y la decisión pasa a ser si
   se presenta lo que hay. Eso se decide con David en el sync del 21,
   no en solitario.

**R2. Los assets del L-box con video.** Es el layout que David marcó
como el más difícil de conseguir en material. Mitigación: T-05 lo ataca
primero dentro del relevamiento, y si no aparece material, la
alternativa se discute en el sync del 21 con tiempo para buscar afuera.

**R3. La fecha del primer draft no está acordada.** La minuta fija el
lunes 21 de septiembre y el documento de requerimientos dice el 1 de
septiembre, que ya pasó. Toda la fase está planificada contra el 21.
Mitigación: es la primera pregunta que va por chat a David (T-07). Si la
que vale es la del documento, la fase ya está tarde y lo que se decide
con David es qué se le muestra y cuándo, no cómo se replanifica.

**R4. Emil no tiene alcance ni fechas.** La minuta registra que Nicolás
le habla directamente para iOS, y nada más. Riesgo aceptado en esta
fase: iOS es stretch, y lo que T-06 necesita es solamente saber si Emil
está disponible y en qué ventana.

## Timeline de la fase

| Fecha | Qué |
| --- | --- |
| 2026-09-02 | Fase abierta. |
| Lo antes posible | Llega la información de Rob sobre AVFoundation contra hls.js (T-01). |
| 2026-09-21 | Primer draft andando y sync de una hora con David. Cierra la fase. |

## Stakeholders

- **Nicolás Levy**: construye. Owner de la fase.
- **David Hassoun**: contraparte, dueño de la presentación, y quien
  recupera la información de plataforma. Fuera por IBC hasta el 21 de
  septiembre, disponible por chat.
- **Emil**: parte de iOS.
- **Rob**: del lado de Apple, origen de la contra-indicación de
  plataforma.
- Canal del proyecto: `#wg-hls-presentation`.

## Arquitectura del producto

Todavía no hay documento de arquitectura del producto. Las dos piezas
que la minuta nombra son la clase custom que carga el asset list y el
layout controller que resuelve el renderizado. Si la fase estabiliza
cómo se relacionan, ese documento se escribe en `docs/` del repo del
proyecto, fuera de `.project/`, y esta sección pasa a apuntarlo con el
delta que la fase introdujo.
