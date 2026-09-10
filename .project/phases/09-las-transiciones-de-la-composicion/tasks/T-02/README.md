# Evidencia de la T-02 — la geometría del primario, entrada y salida

Registro de lo que se midió el 2026-09-10. No es instrucción vigente.

## Lo que quedó en `lib/renderer.js`

`tick()` pasa de dos disparadores de `place()` a tres —componer, re-colocar,
y que un elemento cruce el umbral de su salida—, y sólo el segundo no anima.
`place()` recibe cuál de los tres es y escribe la `transition-property` en la
misma pasada que la geometría. La caja del primario en su salida es
`WHOLE_FRAME`, así que la salida es la misma función con otra caja y no un
segundo mecanismo. `movePrimary` escribe la transición y sigue moviendo por
`transform` y nada más. La entrada de `drawn` del primario ahora lleva su
experiencia, que es contra lo que se agenda la salida.

**`clear()` no cambió en una línea**, como el diseño decía.

## R1 quedó medido y salió a favor

Era el riesgo que decidía el tamaño de la fase: que la declaración de la
transición no sobreviva a que `clear()` le borre el atributo `style` entero en la
misma pasada. **Sobrevive**, porque lo que decide es el estilo posterior al
cambio. Los números están en `mediciones.txt`: en la entrada de la L la escala va
1.0000 → 0.9421 → 0.7912 → 0.6965 → 0.6442 → 0.6067 → 0.6004, llegando en 45.38
sobre una ventana que abre en 45.00. **28 muestras cayeron estrictamente entre los
dos extremos**, así que interpola y no salta.

No hace falta la hoja de estilos inyectada que el diseño tenía como alternativa.

## La exclusión del aviso a cuadro entero, verificada sin una rama escrita

Dentro de la ventana del aviso lineal del break mezclado, de 144.05 a 155.95,
**el conjunto de escalas distintas del primario es `{ 1 }`**. Una sola. Y en los
dos bordes de esa ventana no hay movimiento.

Lo que sí se mueve es la salida del aviso anterior: el `squeezebackDoubleBox`
devuelve el primario de 0.5 a 1.0 entre 143.62 y 144.00, o sea **dentro de su
propia ventana y antes de que el lineal abra la suya**. Es la forma que el ADR
0052 predijo, medida sobre el caso que más se parece al de la L seguida del
lineal en la demo del break de hidratación.

## El salto que `clear()` deja, con su número

0.9933 → 1.0000 en el último cuadro, o sea **0,67 % de escala**. Es el residuo de
que la transición se corte cuando se borra el atributo, si el cuadro anterior no
llegó al final. Era la única consecuencia de que `clear()` no cambie, y a esta
escala es invisible.

## El redimensionado

Encogiendo el contenedor 140 px en medio de la L, el rectángulo base pasó de
715 px a 575 px **en un cuadro**, con la propiedad de transición en `none` en esa
pasada. Sin animación (ADR 0053).

## Las capturas, miradas

- `a-antes-de-la-l-44.90.png` — el primario a cuadro entero, sin aviso.
- `b-mitad-del-achique-190ms-de-380.png` — **la transición real, congelada en su
  mitad**. Se pausó la animación en su `currentTime` 190 de 380 en lugar de
  hacerla más lenta, así que es el cuadro que de verdad se ve. El primario está
  en escala 0.650843: todavía más grande que su caja final, tapando parte de
  donde van las bandas, que ya están puestas debajo. Es el efecto que se pidió —
  la imagen retrocediendo y destapando lo que ya estaba.
- `c-regimen-de-la-l-48.00.png` — la L armada, el primario en su 60 %.
- `d-redimensionado-durante-la-l.png` — mirada: las tres cajas siguen al área
  nueva sin desalinearse, sin hueco y sin desborde.

## Lo que esta task no hizo

Los nodos de aviso todavía **no difuminan**: aparecen y desaparecen de golpe. Es
la T-03. Lo que ya se ve es la geometría del primario, que es el efecto de la L.
