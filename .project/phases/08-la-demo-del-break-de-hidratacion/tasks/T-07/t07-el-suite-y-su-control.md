# T-07 — El suite de la demo, y el control de su chequeo negativo

La demo nueva tiene su propio suite adentro de su carpeta, que es lo que el ADR 0023 deja
como única forma: `test/` lee `test/` y `lib/` y nada más, así que lo que chequea la forma
de una corrida vive en la demo. `node --test` lo descubre sin argumentos: **55 verdes**,
seis más que antes.

## Los cuatro chequeos

**1. Toda ancla del guion cae en un break y en un aviso que existen, y el beat frena antes
de lo que anuncia.** Es el chequeo que hace que el ADR 0037 sea una propiedad y no una
intención. Mira **las dos mitades**, y la segunda no es un extra: un `lead` negativo o un
ancla al aviso equivocado resuelven perfecto y ponen la placa tarde, que es el mismo
defecto con otra cara.

**2. El break arranca en el corrimiento declarado de la parada del juego** (ADR 0044).
Chequea que el script de señalización **lea** `paradaEn` de `plate.json` en lugar de tener
el segundo escrito a mano, y que la parada quepa adentro del plate.

**3. El minuto declara sus tres formas de aviso** (ADR 0043 y 0046): cuatro avisos,
exactamente uno sin bloque de layout **y tercero**, y exactamente uno cuyos elementos son
todos `image/*`.

**4. Cada `uri` del asset list apunta adentro de `/content/`.** No puede chequear que el
archivo exista —`content/` se genera y está gitignoreado— así que chequea lo que sí es
declarado. Un `uri` mal tipeado es un aviso que no se dibuja, y la librería lo dice por
consola y no en pantalla: en cámara se ve como que el break no pasó.

## Lo que hace que el chequeo 1 pruebe algo

**Ejecuta `resolveAnchor` de `js/story.js`, que es el código de la página y no una
reimplementación.** El test arma un proveedor desde los archivos declarados —dónde arranca
el break y dónde arranca cada aviso, que es la suma acumulada de las `DURATION`— y le pasa
ese proveedor a la misma función que corre en el navegador. Si mañana la resolución cambia,
el chequeo cambia con ella.

Y los tres chequeos son **funciones puras en `comprobaciones.js`**, no asserts sueltos
adentro de cada `test()`. La razón es la campaña: si cada chequeo viviera adentro de su
test, la campaña tendría que reimplementarlo, y **un chequeo reimplementado es un chequeo
distinto que puede pasar donde el original falla.** Las dos corridas ejecutan el mismo
código.

## La campaña de mutación: siete roturas, una por regla

`npm run mutaciones`, y su salida completa está en `t07-la-campana-de-mutacion.txt`. **Una
rotura por regla, y cada una corre sólo el chequeo que la cubre** — no la suite entera: una
rotura que pone rojo a otro chequeo no prueba nada sobre el suyo.

| regla | rotura | resultado |
| --- | --- | --- |
| un ancla cae en un aviso que existe | el beat del caso de negocio pasa al aviso 9 | **ROJO** |
| un beat frena antes de lo que anuncia | ese beat pasa a `lead: -3` | **ROJO**, "resuelve en 49s y lo que anuncia arranca en 46s" |
| el segundo del break lo declara `plate.json` | el script pasa a tenerlo escrito a mano | **ROJO** |
| la parada cabe adentro del plate | la parada pasa a durar 200 s sobre 88 | **ROJO** |
| exactamente un aviso de imagen fija | el banner pasa de `image/jpeg` a un `.m3u8` | **ROJO**, "hay 0 avisos de imagen fija" |
| el lineal va tercero | el lineal se mueve al primer lugar | **ROJO**, "está en la posición 1 y va tercero" |
| el break son cuatro avisos | se le saca el overlay de cierre | **ROJO** |

**Y la campaña trae su propio control**: antes de romper nada, corre los tres chequeos
sobre los archivos como están y exige verde. Sin eso, una campaña donde todo da rojo se
vería igual de exitosa que una correcta — que es la misma trampa, un escalón más arriba.

## Por qué esta task es la única `alto` de la fase

Porque es código que corre desatendido y **cuya falla es un verde que no significa nada**,
que es exactamente el modo en que este proyecto ya se equivocó tres veces: el chequeo del
scroll de la fase 07 sobre una página que no scrollea, el cuerpo vacío que devuelve 400
exista el modelo o no, y el 404 que no distingue "no existe" de "no tenés acceso". Las tres
veces el instrumento decidió el resultado.

La rotura del `image/jpeg` es la que más vale de las siete, y conviene decir por qué: **es
una línea que deja la demo andando y le saca el argumento.** Cambiar ese MIME por un
`.m3u8` no rompe nada en pantalla —el aviso se ve, el break pasa— y el minuto deja de
mostrar tres formas de aviso para mostrar dos. Nada excepto este chequeo lo notaría.
