# Fase 10: la demo medida contra sí misma

Esta fase es un **registro** y no un plan. El trabajo ya está hecho, verificado y
commiteado: once commits que la sesión `hls-demo` produjo el 2026-09-10 después de
que la fase 08 cerrara, más el trabajo que la sesión `hls-f08` dejó sin commitear y
que Nicolás autorizó adoptar. Lo que falta no es trabajo: es que las decisiones
estén donde alguien las va a leer.

El diseño, entonces, no explora qué hacer. Explora **qué fue el día**, cuáles de sus
decisiones merecen un ADR, y a qué nivel.

## Por qué una fase y no ADRs sueltos

Las nueve fases están cerradas y los once commits no pertenecen a ninguna. Había
tres formas de darle domicilio a sus decisiones:

| forma | por qué no |
| --- | --- |
| ADRs con `scope: project` y sin fase | Mienten sobre su alcance: deciden cómo se arma un creativo, no qué es este repositorio. Y el proyecto ya tiene la práctica contraria, dicha en el informe de la fase 07 |
| ADRs con `scope: phase-08`, colgados de la fase que cerró | Una fase cerrada es un registro de qué pasó. Meterle decisiones tomadas un día después reescribe lo que ese registro prueba |
| **una fase nueva que es el registro del día** | Elegida |

La tercera además le da a las decisiones el contexto que solas no tienen: un ADR
dice qué se decidió, y el `PHASE.md` de esta fase dice **qué estaba pasando** cuando
se decidió, que es la mitad que dentro de dos meses no se reconstruye.

## Qué fue el día, leído de los once commits

**La lectura que traía el pedido era "la demo se volvió presentable".** Es cierta y
es la mitad visible: la página abre en negro con una frase que el scroll achica, la
L pasó a la plantilla que Nicolás eligió con el zapato entero y el QR, el fondo de
la L se mueve, y los dos avisos flotan con el mismo aire en lugar de estar pegados
al borde. Alguien que mire la demo de ayer y la de hoy diría exactamente eso.

**Pero esa lectura no explica los dos scripts nuevos, ni la nota fechada sobre el
README de una fase cerrada, ni por qué cinco lecciones de prompt quedaron
escritas.** Y hay un hilo que sí explica los once.

**El día fue sobre la distancia entre lo que una cosa afirmaba y lo que era.** No
como tema elegido: como lo que apareció once veces seguidas.

- El comentario del script decía que `-sseof -1 -frames:v 1` daba el último cuadro.
  Daba el 168 de 192. Y el commit lo dice sin rodeos: **el comentario viejo era la
  premisa que causó el bug**, y por eso sobrevivió dos días.
- El README de la T-03 decía que cada eslabón arrancaba del último cuadro del
  anterior y que el octavo cerraba contra el primer cuadro del acto 3. Las dos cosas
  resultaron falsas al medirlas.
- El chequeo de costuras **afirma verificar la cadena** y mide continuidad. Un
  eslabón con un fundido encadenado adentro y otra escena del otro lado pasó con
  1,9x, igual que los buenos.
- El prompt pedía "a single faint warm amber glow" y volvió un resplandor que
  inundó la banda. **Pedir un resplandor tenue es pedir un resplandor.**
- El prompt pedía que el zapato flotara y, tres párrafos más abajo, que se quedara
  en su cuarto del cuadro. **Flotar es irse.**
- Un apóstrofo cerró la cadena de comillas, el script murió, y **lo que se midió
  después fue el archivo del intento anterior**, que devolvió números idénticos
  hasta el decimal. `bash -n` no lo ve.
- Un SVG que no parsea hace que Chrome rasterice su propia pantalla de error y
  devuelva un PNG del tamaño pedido, con contenido, sin código de error y sin una
  línea en consola.
- El zapato no estaba tapado: **estaba afuera**. Y el corte que se veía era el velo
  y no la foto.
- Un QR que no lleva a ningún lado es una mentira en una demo que se muestra a
  ingenieros, y alguien lo escanea.
- Los tres defectos de la L, y el commit lo dice en el título: **ninguno era el que
  parecía**.
- Y hasta la página: en `--t = 0` las tres frases estaban en opacidad 0, así que la
  página abría en negro absoluto y había que scrollear para que apareciera algo, que
  es lo contrario del pedido. Apareció mirándolo.

**Los arreglos también son todos de la misma forma**, y es lo que hace que el hilo
no sea una casualidad de redacción: en cada caso se reemplazó una afirmación por una
medición contra el fenómeno. La semilla contra el índice de cuadro. La cadena contra
el acto 1. El prompt contra su última frase. El velo contra el salto de alfa en
píxeles. El QR contra la URL guardada al lado. El SVG contra el parser antes de
rasterizar. El banner contra sus dos esquinas y su centro, para que un rectángulo
negro no pueda salir a pantalla diciendo ser una forma.

**Así que el objetivo de la fase, en una línea:** el día cerró la distancia entre lo
que la demo afirmaba y lo que la demo era, y dejó los instrumentos que la miden.

Lo presentable es consecuencia y no causa: la L se ve bien **porque** se midió que
el zapato estaba afuera y que el velo se sumaba en el codo.

## El inventario de decisiones

El filtro para decidir qué merece un ADR es el que trajo el pedido y es el correcto:
**¿alguien dentro de dos meses lo rompería por no saber por qué es así?** No todo lo
medido es una decisión, y un ADR por commit sería el nivel equivocado.

### Las seis que entran

| ADR | decisión | qué rompería alguien sin ella |
| --- | --- | --- |
| 0057 | La cadena generada se verifica con **dos** chequeos, porque el de costuras es ciego a un corte suave | Borraría el segundo por redundante |
| 0058 | Los umbrales son **relativos**, y cada uno contra su propia referencia | "Simplificaría" a un número fijo, que es de donde se viene |
| 0059 | Los creativos que nacen de video generado se empaquetan a la **cadencia de su fuente** | "Arreglaría" los 24 fps creyendo que es una inconsistencia |
| 0060 | El velo de la L es **un** velo con forma de L, y las rampas se combinan por el máximo | Refactorearía a dos rectángulos, que parece más simple |
| 0061 | La receta de generación vive con el generador, y las lecciones se parten entre las del contenido y las del prompt | Movería el README a un registro de fase, donde nadie lo busca |
| 0062 | El movimiento generado va **donde la tipografía vive en su propia capa** | Metería la tipografía o el QR adentro del cuadro que el modelo redibuja |

### La que no entra porque ya está decidida

**El cuadro semilla y el de salida se declaran en `plate.json`.** Es la decisión más
consecuente del día por lo que destapó, pero como decisión es el **ADR 0044 aplicado
a un dato nuevo**: un valor declarado una vez, que los dos scripts leen de ese lugar.
Escribirla de nuevo sería duplicar. Se referencia desde el `PHASE.md` y el hallazgo
que la produjo queda en el informe, que es donde vive lo que pasó.

### Las que no entran porque no son decisiones

- **La apertura de la página** —pantalla negra, una frase, el scroll que la achica—
  es diseño, y su alternativa rechazada (`animation-timeline: scroll()`) se rechazó
  **por soporte de navegador**. El día que el soporte llegue, sacar el JS será lo
  correcto: un ADR envejecería en un obstáculo. Va al `PHASE.md` como lo que el día
  produjo.
- **El disparador del recorrido y el botón con dos trabajos.** El umbral de 0,6 y
  que `app.js` sea el único dueño del botón son invariantes de código, y viven donde
  se van a leer: en el código. El defecto que los produjo —dos listeners, y el orden
  decidiendo el resultado— va al informe.
- **Los márgenes del aviso de esquina.** Es el mismo criterio del banner aplicado a
  la misma clase de elemento; lo que había que cuidar está dicho en el commit y es
  una consecuencia del ADR 0013, no una decisión nueva.
- **`research/` afuera de git.** Es higiene de repositorio y su razón está entera en
  el mensaje del commit.

### La única relación entre ADRs, y es una generalización

**El ADR 0045 dice que el movimiento se genera sólo donde la tipografía puede irse
de cuadro, "que hoy es un solo lugar: el spot lineal", y que los formatos no lineales
siguen siendo imagen fija con tipografía compuesta.** El día rompió esa
enumeración: el fondo de la L se mueve.

Pero **no rompió la regla**, y la diferencia decide si esto es un supersede o una
generalización. La regla del 0045 es que el movimiento generado va donde la
tipografía puede irse de cuadro. Lo que cambió es que **partir la L en dos capas
saca la tipografía del cuadro generado**, así que la L entró en el alcance de la
regla en lugar de contradecirla. Nada de lo que el 0045 dice dejó de ser cierto: sus
tres caminos siguen en pie y su chequeo humano de vestido comercial también.

Entonces es **`generalizes: ["0045"]`** en el 0062, `generalized_by` en el 0045, y
el 0045 se queda `accepted` con su `superseded_by` en `null`, más una nota fechada.
Es la primera generalización del proyecto y por eso conviene que la razón quede
escrita: el criterio no es cuánto cambió, es si algo dejó de ser verdad.

## Una corrección al relato de los umbrales

El hallazgo de los umbrales me llegó como *"el rango 3,5-6,0 calibrado sobre pasos
internos no es la magnitud correcta para una costura, y se propuso 7,0"*. Fui a
`verificar-plate.sh` y a los commits, y **no es lo que quedó**. La versión real es
mejor y es la que va al ADR:

- el paso interno es **3,5 a 7,4**, no 3,5 a 6,0;
- el ruido de la costura **se mide solo**, comparando el último cuadro de un eslabón
  contra el cuadro 0 del siguiente —el mismo instante dibujado dos veces— y da **3,6
  a 6,9**, o sea del tamaño de un paso;
- y la respuesta **no fue un umbral nuevo**. Fue la razón contra la mediana de los 24
  cuadros vecinos, que es lo que **vuelve las dos calibraciones una sola regla**: una
  costura sana da alrededor de 1x y hasta 2x, y de 3x para arriba hay algo que mirar
  con el ojo.

Que la corrección exista es del mismo hilo que el resto de la fase: un número
correcto para lo que se midió, aplicado a otra cosa. Vale anotarlo porque el relato
equivocado ya viajó una vez.

## Lo que esta fase NO hace

- **No toca `demo/` ni una línea**, ni ningún archivo fuera de `.project/`. La
  sesión `hls-demo` está trabajando ahí ahora mismo.
- **No revisa ni corrige el trabajo de los once commits.** Está medido y verificado
  en pantalla por quien lo hizo; esta fase lo documenta, no lo audita. Si al leerlo
  hubiera aparecido un defecto, era un hallazgo para reportar y no un arreglo para
  hacer acá.
- **No escribe tasks de ejecución.** No hay trabajo pendiente: las tasks de esta
  fase son los artefactos de gobierno que el registro produce.
- **No reescribe el README de la T-03 de la fase 08.** Ya tiene su nota fechada, y
  la regla B de la política de documentación dice por qué el bloque original queda
  en pie.
- **No decide nada sobre el trabajo que sigue.** El estado de la L animada, y si su
  empaquetado a 24 quedó verificado, es de la sesión que lo está haciendo.
