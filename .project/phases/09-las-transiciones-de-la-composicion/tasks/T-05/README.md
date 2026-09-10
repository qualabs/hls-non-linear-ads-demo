# Evidencia de la T-05 — la corrida mirada y las suites

Registro de lo que se midió el 2026-09-10. No es instrucción vigente.

Lo que la T-02 y la T-03 ya midieron y fotografiaron está en sus carpetas y no se
repite acá. Esta task cierra lo que faltaba y los tres riesgos.

## Los seis casos, y de dónde sale cada uno

| caso | dónde está |
| --- | --- |
| la L, geometría de entrada y salida | T-02, en las **dos** demos, con las rampas y cuatro capturas |
| el banner de imagen difuminando | T-03, la rampa y la captura congelada en 0.295 |
| el overlay difuminando | T-03, la rampa 0.095 → 0.513 → 0.802 |
| el aviso a cuadro entero seco en sus dos puntas | T-02 (geometría) y T-03 (opacidad, 382 muestras y la de 53.999) |
| el redimensionado **durante** un break | T-02, con su captura |
| el redimensionado **después** de un break, el seek hacia atrás, y los tres riesgos | acá |

## Lo que se agregó acá

**La L de imagen de la demo técnica** (`l-de-imagen-entrando.png`), cazada en
vuelo y congelada: es **el cuadro más completo de la fase entera**, porque tiene
las dos animaciones corriendo a la vez. El aviso —dos tiras, y son `<IMG>`— en
opacidad 0.295, y el contenido primario en escala 0.886, todavía más grande que su
caja final. Mirado: el primario se ve **a través** de las tiras fantasma, y el
panel de al lado muestra al player de mercado reproduciendo su aviso lineal, o sea
que el par de compatibilidad sigue haciendo lo que hacía.

Es además la otra forma de autorar una L —las tiras **encima** del primario, que
es como la autoró la fase 05— así que entre esta captura y la de la T-02 sobre el
break de hidratación quedan miradas las dos formas, distintas y las dos correctas
bajo el mismo mecanismo.

**R4, en sus dos mitades.** Una corrida limpia de 0 a 84.18 a través de tres
breaks, sin tocar nada, dejó **cero mensajes** de consola: ningún creativo se sacó
antes de terminar y ninguna ventana se movió. Y con el player pausado entre dos
breaks, encoger el contenedor 180 px llevó el video de 715 a 535 siguiendo al
contenedor, sin atributo `style` y sin píxeles viejos.

**El seek hacia atrás**: desde los últimos 120 ms de un aviso, la opacidad vuelve
de 0.000 a 1.000 sola.

**R5, medido en lugar de mirado.** Los deltas de cuadro dentro de las ventanas de
transición (medias de 20.75 y 19.84 ms) son indistinguibles del régimen de al lado
(19.94, 20.00, 20.14), y el máximo dentro de una transición es más bajo que el del
régimen. Con el límite dicho: la línea de base de este entorno es de ~20 ms por
cuadro, así que lo que se prueba es que animar **no agrega** costo, no que la
página corra a 60 fps.

**R3** quedó cerrado por aritmética en la T-03 —cuando el backplate empieza a
irse, el primario ya cubre el 99,9 % del cuadro— y en la corrida limpia no apareció
nada que la aritmética no hubiera predicho. **No hizo falta la línea del `zDepth`**
que el ADR 0052 dejaba preparada.

## Las suites

`npm test`: **72 tests, 72 pass, 0 fail**. `npm run check`: las dos costuras en
verde.

## Un caso que no se puede mirar, y se dice

El **repliegue** del ADR 0019 no está en el recorrido de la demo técnica: sus
asset-list existen en la carpeta pero el recorrido señaliza otros cinco. Así que no
se miró en pantalla, y queda cubierto por el test de la T-01 sobre el fixture real,
que comprueba que cae del lado del aviso a cuadro entero y por lo tanto sin
difuminado.
