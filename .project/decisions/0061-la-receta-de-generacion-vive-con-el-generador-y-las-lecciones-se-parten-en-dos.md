---
id: "0061"
title: La receta de generación vive con el generador, y las lecciones se parten entre las del contenido y las del prompt
status: accepted
scope: phase-10
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Generar el movimiento de un creativo salió mal de cinco maneras distintas a lo largo
del proyecto, y cada una costó una corrida entera de entender. Ese conocimiento no
tiene dónde vivir por sí solo: no es una decisión de arquitectura, no es el registro
de una fase, y no es código.

## Decisión

**Las lecciones viven en el README de `graphics/creativos/fuentes/`, que es donde
vive la receta de generación**, y no en el registro de una fase. Una fase cerrada es
un registro de qué pasó; la receta es instrucción viva y se lee justo antes de
generar de nuevo, que es el único momento en que estas lecciones sirven.

**Y se parten en dos grupos, porque se arreglan en lugares distintos.**

**Tres son del contenido que vuelve**, o sea de lo que el modelo entrega y hay que
detectar: deriva de escena entre eslabones; una prohibición sin alternativa que el
modelo llena con lo que conoce; y un fundido encadenado con un corte adentro. Las
tres **pasan el chequeo de costura** (ADR 0057) y ninguna se deduce de las otras dos.

**Dos son del prompt que lo pide**, o sea de cómo se escribe el pedido:

- **Describir algo es pedirle que lo dibuje, y la intensidad no la elegís vos.** El
  prompt decía *"a single faint warm amber glow behind the shoe"* —una descripción
  con un adjetivo que la achica— y volvió un resplandor naranja que inundó la banda
  inferior: la esquina donde vive el producto pasó de **57,2 a 79,6** de luz media a
  lo largo del clip. **Pedir un resplandor tenue es pedir un resplandor.** El arreglo
  fue que no haya nada que dibujar ahí.
- **No se le pide que flote y después que no se mueva.** El prompt abría con *"floats
  in the air ... as if suspended"* y tres párrafos más abajo le pedía al zapato que
  se quedara en su cuarto del cuadro. **Flotar es irse.** Insistir con la posición no
  alcanzaba: lo que lo arregló fue **sacar la contradicción**. Ahora gira en el lugar,
  sobre una plataforma giratoria invisible, así el movimiento tiene de dónde salir sin
  que el producto se desplace. Medido sobre los cuatro intentos, la región que el
  contenido primario tapa —donde el producto no tiene que meterse— se redujo del
  **87 % al 68 %, al 16 % y al 8 %**.

**Y el prompt se verifica antes de mandarse.** Un apóstrofo adentro de las comillas
simples cierra la cadena y el resto del texto se vuelve comandos: la generación no se
hizo, el script murió con `width: command not found`, y **lo que se midió después fue
el archivo del intento anterior, que devolvió números idénticos hasta el decimal**.
`bash -n` no lo ve, porque las comillas se vuelven a balancear más abajo y el archivo
queda válido. Ahora el prompt se chequea contra su última frase antes de mandarse y
aborta si se cortó.

## Consecuencias

- **La distinción entre los dos grupos es lo que las vuelve usables.** Una lección
  del contenido se paga con un chequeo que la detecte; una del prompt se paga
  reescribiendo el pedido. Mezcladas, la respuesta a un defecto nuevo es "generar de
  nuevo y ver", que es lo que costó cuatro intentos.
- **El trabajo descartado no va a git y la conclusión sí** (`research/`): cientos de
  megabytes de generaciones descartadas, láminas de contacto y capturas del antes y
  el después son material de trabajo y no del producto. Pero vive en el proyecto y no
  en un sandbox aparte, porque la lámina que prueba por qué la cadena se siembra del
  último cuadro tiene que estar al lado del script que lo hace.
- La trampa del apóstrofo es del mismo hilo que el resto del día: **una medición que
  no midió nada y no lo dijo.** El arreglo no fue tener más cuidado, fue que el
  instrumento se niegue a correr sobre un pedido truncado.
