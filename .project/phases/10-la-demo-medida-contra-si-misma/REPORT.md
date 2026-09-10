# Informe de cierre — fase 10: la demo medida contra sí misma

Abierta y cerrada el 2026-09-10, después del trabajo que documenta.

## 1. Resumen

Once commits de la sesión `hls-demo`, más ocho archivos que la sesión `hls-f08` dejó
sin commitear al quedarse colgada y que Nicolás autorizó adoptar, no pertenecían a
ninguna fase. El trabajo estaba medido y verificado en pantalla; lo que faltaba era
que sus decisiones estuvieran donde alguien las va a leer.

**La lectura del día no es la que traía el pedido, y la diferencia importa.** La
lectura fácil —y verdadera— es que la demo se volvió presentable: la página abre en
negro con una frase que el scroll achica, la L pasó a la plantilla que Nicolás
eligió con el zapato entero y el QR, su fondo se mueve, y los dos avisos flotan con
el mismo aire. Pero eso no explica los dos scripts de verificación nuevos, ni la nota
fechada sobre el README de una fase cerrada, ni por qué quedaron escritas cinco
lecciones de prompt.

**Lo que explica los once es que el día fue sobre la distancia entre lo que una cosa
afirmaba y lo que era.** Once veces seguidas, y siempre con la misma firma: algo
afirmaba lo que no era, y sobrevivía porque nada lo comparaba contra la cosa misma.
El comentario que decía que `-sseof -1 -frames:v 1` daba el último cuadro y daba el
**168 de 192** — y el commit lo nombra sin rodeos: *la premisa que causó el bug*. El
README que decía de dónde arrancaba cada eslabón, falso al medirlo. El chequeo que
dice verificar la cadena y mide continuidad, por donde un fundido pasó con **1,9x**
igual que los buenos. El prompt que pedía un resplandor tenue y trajo un resplandor.
El prompt que pedía flotar y quedarse quieto. El apóstrofo que mató el script y dejó
medir el archivo del intento anterior, **con números idénticos hasta el decimal**. El
SVG que no parsea y devuelve un PNG del tamaño pedido con la pantalla de error de
Chrome adentro. El zapato que no estaba tapado sino **afuera** — 251 px de sus 458
salían por abajo del cuadro y sólo se veía el 41 %. El QR que no lleva a ningún lado.

**Y los arreglos son todos de la misma forma**, que es lo que hace que el hilo no sea
una casualidad de redacción: se reemplazó una afirmación por una medición contra el
fenómeno. La semilla contra el índice de cuadro. La cadena contra el acto 1. El
prompt contra su última frase. El velo contra el salto de alfa en píxeles. El QR
contra la URL guardada al lado. El SVG contra el parser antes de rasterizar. El
banner contra sus dos esquinas y su centro, para que un rectángulo negro no pueda
salir a pantalla diciendo ser una forma.

Lo presentable es consecuencia y no causa: la L se ve bien **porque** se midió que el
zapato estaba afuera y que el velo se sumaba en el codo.

## 2. Decisiones tomadas

Seis ADR nuevos, todos `scope: phase-10`, y una relación.

| id | decisión | qué rompería alguien sin ella |
| --- | --- | --- |
| **0057** | La cadena generada se verifica con **dos** chequeos, porque el de costuras es ciego a un corte suave | Borraría el segundo por redundante |
| **0058** | Los umbrales son **relativos**, cada uno contra su propia referencia | "Simplificaría" a un número fijo, que es de donde se viene |
| **0059** | Los creativos que nacen de video generado se empaquetan a la **cadencia de su fuente** | "Arreglaría" los 24 fps creyendo que es una inconsistencia |
| **0060** | El velo de la L es **uno** con forma de L, y las rampas se combinan por el máximo | Refactorearía a dos rectángulos, que parece más simple |
| **0061** | La receta de generación vive con el generador, y las lecciones se parten entre las del contenido y las del prompt | Movería el README a un registro de fase, donde nadie lo busca |
| **0062** | El movimiento generado va **donde la tipografía vive en su propia capa** | Metería la tipografía o el QR adentro del cuadro que el modelo redibuja |

**El 0062 generaliza al 0045, y es la primera generalización del proyecto.** El 0045
decía que el movimiento se genera sólo donde la tipografía puede irse de cuadro, "que
hoy es un solo lugar: el spot lineal", y que los formatos no lineales seguían siendo
imagen fija. El fondo de la L rompió esa enumeración, **pero no la regla**: partir la
L en dos capas saca la tipografía del cuadro generado, así que la L entró en el
alcance de la regla en lugar de contradecirla. Nada de lo que el 0045 dice dejó de ser
cierto, así que queda `accepted` con su `superseded_by` en `null`, con
`generalized_by: "0062"` y una nota fechada. **El criterio que elige entre supersede
y generalización no es cuánto cambió: es si algo dejó de ser verdad.**

**Una decisión del día no entró como ADR a propósito**: que el cuadro semilla y el de
salida se declaren en `plate.json` es el **ADR 0044 aplicado a un dato nuevo** —un
valor declarado una vez, que los dos scripts leen de ese lugar— así que se referencia
en lugar de duplicarse. Y **cuatro cosas más quedaron afuera porque no son
decisiones**: la apertura de la página (diseño, cuya alternativa se rechazó por
soporte de navegador, así que un ADR envejecería en un obstáculo), el disparador del
recorrido y el botón con dos trabajos (invariantes de código, que viven en el
código), los márgenes del aviso de esquina (el mismo criterio del banner sobre la
misma clase de elemento) y `research/` afuera de git (higiene, con su razón entera en
el commit).

## 3. Tasks

Tres, todas `done`, y ninguna es trabajo sobre el producto.

| id | qué dejó |
| --- | --- |
| T-01 | La lectura del día y la traza de cada cifra a su fuente, con las dos correcciones que encontró |
| T-02 | Los seis ADR y la generalización del 0045 en sus dos lados |
| T-03 | Este informe y la línea del índice de `PROJECT.md` |

## 4. Hilos abiertos

**Dos commits más, por lo menos, hoy mismo.** Nicolás pidió una imagen nueva del
zapato para la L, hecha a la medida del aviso, y detrás viene regenerar su cadena
animada. **La fase cierra con esa línea abierta y de común acuerdo**, porque lo que
está abierto es una pieza gráfica y no una decisión de gobierno: ninguno de los seis
ADR cambia por cómo salga. Si esos commits traen una decisión, es un ADR nuevo y no
una corrección a estos.

**El README de `demo/hydration-break/` quedó incompleto, y es un hallazgo y no un
arreglo.** Dice qué esperar mientras la demo corre, y el día le cambió el principio:
ahora la página abre con una pantalla negra y una frase que hay que scrollear, el
recorrido arranca cuando el player está mayormente en pantalla y no cuando termina
el scroll, y el botón de saltear pasa a reiniciar al final. Su texto dice todavía que
el recorrido *"starts by itself"*, que sigue siendo cierto pero ya no es preciso, y no
menciona la apertura ni el reinicio. Alguien que lo siga se pierde los primeros diez
segundos. **Está fuera del alcance de esta fase**, que no escribe una línea afuera de
`.project/`, así que se reporta a quien es dueño de esa carpeta.

**Un número declarado que no cuadra, aceptado a propósito.** Con el duplicado sacado
en las siete costuras, el primario reempaquetado mide **91,70 s** contra los 92 de
antes: esos **0,29 s son los siete cuadros** que ya no se repiten. No hay de dónde
sacarlos —el clip filmado tiene 341 cuadros y el acto 1 usa 336— así que la parada
queda esos siete cuadros más corta que lo que `paradaDura` declara. Queda anotado
porque es exactamente la clase de cosa que dentro de dos meses se lee como un defecto.

**Y la deriva de escena a lo largo de los 64 s**, que la cadena vieja no tenía y la
nueva sí. Lo dejó abierto el commit que la produjo y no es de esta fase.

## 5. Riesgos que se materializaron

**R1 se materializó, y era el riesgo propio de esta fase: un ADR que afirma un número
que no es.** Se materializó dos veces y las dos se atajaron antes de que el ADR
quedara escrito.

**La primera fue un error ajeno.** El hallazgo de los umbrales me llegó relatado como
*"el rango 3,5-6,0 calibrado sobre pasos internos no es la magnitud correcta para una
costura, y se propuso 7,0"*. Fui a `verificar-plate.sh` y no es lo que quedó: el paso
interno es **3,5 a 7,4**; el ruido de la costura **se mide solo**, comparando el
último cuadro de un eslabón contra el cuadro 0 del siguiente —el mismo instante
dibujado dos veces— y da **3,6 a 6,9**; y la respuesta **no fue un umbral nuevo** sino
la razón contra la mediana de los 24 cuadros vecinos, que es lo que vuelve las dos
calibraciones **una sola regla**. La versión real es mejor que la relatada, y por eso
valía ir a buscarla: un segundo umbral absoluto habría heredado el defecto del
primero.

**La segunda fue mía.** Le mandé esa corrección a `hls-demo` antes de escribir el ADR,
para que la revisara quien la había medido, y me corrigió un cuarto número: el
veredicto tiene **dos escalones y no uno** —de **2x** el script avisa, de **3x** manda
a mirarla con el ojo— y el rango de las siete costuras internas **en el plate final**
es **1,00x a 1,84x**, mientras el 1,07x a 1,90x del commit es de un momento anterior.

**Las dos juntas son el argumento de la fase entera aplicado a la fase misma**: la
traza contra la fuente me sacó un error ajeno y me dejó uno propio, y el que lo
encontró fue quien lo había medido. Por eso la T-01 pregunta en lugar de deducir.

**R2 no se materializó**, y lo que lo evitó fue preguntar: el estado de la L animada
no estaba en ningún commit —el del fps la dejaba prevista y sin verificar— y llegó por
el canal con la cadena de hechos completa, incluida la verificación en pantalla. Sin
eso el ADR 0059 habría dicho "previsto" sobre algo que ya estaba andando.

**R3 no se materializó.** Todos los commits fueron con `git commit -- .project/`.

## 6. Recomendaciones para la fase siguiente

**Hay un patrón con tres casos y merece discutirse como regla, con Nicolás y no
acá.** Tres veces en dos días: el umbral de transición de la fase 09, que no se podía
afirmar porque el borde no es representable en punto flotante; el umbral del plate,
que era una constante sobre un fenómeno que no lo es; y el relato de ese mismo umbral,
que viajó aplicado a otra cosa. Los tres son **un número correcto para lo que se
midió y equivocado para aquello a lo que se aplicó**, y en los tres lo destapó
comparar el número contra el fenómeno en lugar de contra su propia calibración. No se
escribió ninguna regla: una regla la aprueba Nicolás con su texto exacto a la vista, y
lo que corresponde acá es dejar el caso servido.

**Un mensaje de commit bien escrito es una fuente de gobierno de primera calidad, y
este proyecto lo demostró.** Los seis ADR de esta fase se escribieron leyendo once
mensajes de commit y dos encabezados de script, sin entrevistar a nadie sobre lo que
había decidido. Lo que lo hizo posible es que esos mensajes traen el número, la
alternativa descartada y la razón, y no el diff en prosa. Es la práctica que hace que
una fase de registro se pueda escribir después y no sea arqueología.

**Y el registro después del hecho tiene un costo que conviene no repetir.** Escribir
gobierno sobre trabajo ajeno funcionó, pero costó dos rondas de corrección de cifras
y una pregunta por el canal para un dato que no existía en ningún archivo. Un ADR
escrito el día que la decisión se toma no paga nada de eso.

## 7. Correcciones post-ejecución

**Ninguna.** `grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase no devuelve nada.

Leído como medición, dice poco por una razón estructural y conviene decirla: **la
fase se abrió y se cerró en la misma pasada**, así que no hubo un intervalo en el que
una task declarada `done` pudiera volver corregida. Las dos correcciones que sí hubo
—las dos de cifras, sección 5— cayeron **adentro** de la T-01 y antes de que su
definición de done se cumpliera, que es donde una corrección cuesta menos.

## 8. Revisión de documentación

Superficie por superficie, con lo que se actualizó o por qué no necesitaba nada.

**El índice de fases de `PROJECT.md`** — escrito en este cierre. Su línea dice que la
fase es el registro de gobierno de once commits que no pertenecían a ninguna fase, cuál
resultó ser la lectura del día, y que trajo la primera generalización del proyecto.

**`docs/arc42/`** — no existe y esta fase no lo crea, por la misma razón que las dos
anteriores: los dos documentos de `docs/` cumplen ese papel para el único lector que
tienen.

**El resto de `docs/`** — **no necesitaba nada, y la razón es de alcance y no de
pereza.** `contrato-senalizacion-renderizado.md` describe la superficie entre las dos
capas de la librería y `integrating-the-library.md` describe cómo integrarla; los once
commits son de los assets y de la página de una demo, y ninguno de los dos documentos
dice nada sobre cómo se genera un creativo ni sobre cómo abre una página. Nada de lo
que afirman se volvió falso.

**El `README.md` de la raíz** — **no necesitaba nada.** Su tabla de `demo/` dice qué
argumenta cada demo, y lo que la del break de hidratación argumenta no cambió: el caso
de negocio, los cuatro avisos sobre la imagen viva y el lineal tercero. Lo que cambió
es cómo se ve, que esa tabla no describe. Y su fila sigue siendo cierta en lo que
afirma, incluida la frase sobre el recorrido que detiene la composición.

**El `README.md` de `demo/hydration-break/`** — **necesita una corrección y esta fase
no la puede hacer.** Es el hallazgo de la sección 4: dice qué esperar mientras la demo
corre y el día le cambió el principio. Queda reportado a la sesión dueña de esa
carpeta en lugar de arreglado, que es lo que el fuera de alcance manda.

**El `CLAUDE.md` del proyecto** — el proyecto no tiene uno.

**`.project/knowledge/`** — no existe, y esta fase no produjo nada que califique. Lo
más parecido es el cuerpo de lecciones de generación, y el ADR 0061 decidió a
propósito que viva **con el generador** y no en la capa de gobierno, porque se lee
justo antes de generar de nuevo.

**El `CLAUDE.md` y el `knowledge/` del repo padre** — **no se escribió nada, y no es
que no se haya mirado.** El candidato es el patrón de la sección 6, que ya tiene tres
casos. Una regla del repositorio la aprueba Nicolás con su texto a la vista, así que lo
que corresponde es proponerla y no escribirla, y eso está en la sección 6.

**El doc de instalación o runbook** — el proyecto no tiene uno separado: `./run.sh` con
el nombre de la demo es el punto de entrada y lo dice el `README.md`. Nada del día
agregó ni rompió un paso de setup.

**La carpeta `tasks/` de esta fase** — marcada como **registro**. Su único archivo
arranca diciendo "Registro de lo que se verificó el 2026-09-10. No es instrucción
vigente", escrito en la misma pasada que lo produjo.
