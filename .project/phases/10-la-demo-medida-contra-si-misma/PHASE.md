---
phase: 10-la-demo-medida-contra-si-misma
title: "La demo medida contra sí misma"
status: closed
started: 2026-09-10
closed: 2026-09-10
---

# Fase 10: la demo medida contra sí misma

**Esta fase es un registro y no un plan.** Se abrió y se cerró en la misma pasada,
después del trabajo, porque el trabajo ya estaba hecho: once commits que la sesión
`hls-demo` produjo el 2026-09-10 sobre `demo/hydration-break/`, más ocho archivos que
la sesión `hls-f08` dejó sin commitear al quedarse colgada y que Nicolás autorizó
adoptar. Lo que faltaba no era trabajo: era que las decisiones estuvieran donde
alguien las va a leer.

Así que el contrato de abajo describe **lo que el día resultó ser**, y no lo que
alguien se propuso hacer.

## Objetivo

**Cerrar la distancia entre lo que la demo afirmaba y lo que la demo era, y dejar los
instrumentos que la miden.**

La lectura fácil del día es que la demo se volvió presentable, y es cierta: la página
abre en negro con una frase que el scroll achica, la L pasó a la plantilla que Nicolás
eligió con el zapato entero y el QR, su fondo se mueve, y los dos avisos flotan con el
mismo aire. Pero esa lectura no explica los dos scripts de verificación nuevos, ni la
nota fechada sobre el README de una fase cerrada, ni por qué quedaron escritas cinco
lecciones de prompt.

Lo que explica los once es otra cosa, y apareció once veces seguidas: **algo afirmaba
lo que no era, y sobrevivía porque nada lo comparaba contra la cosa misma.** El
comentario que decía que `-sseof -1 -frames:v 1` daba el último cuadro y daba el 168 de
192 —y que el commit nombra como *la premisa que causó el bug*—. El README que decía de
dónde arrancaba cada eslabón, falso al medirlo. El chequeo que dice verificar la cadena
y mide continuidad, y por eso un fundido pasó con 1,9x igual que los buenos. El prompt
que pedía un resplandor tenue y trajo un resplandor. El prompt que pedía flotar y
quedarse quieto. El apóstrofo que mató el script y dejó medir el archivo del intento
anterior, con números idénticos hasta el decimal. El SVG que no parsea y devuelve un PNG
del tamaño pedido con la pantalla de error de Chrome adentro. El zapato que no estaba
tapado sino afuera. El QR que no lleva a ningún lado.

**Y los arreglos son todos de la misma forma**, que es lo que hace que el hilo no sea
una casualidad de redacción: en cada caso se reemplazó una afirmación por una medición
contra el fenómeno. La semilla contra el índice de cuadro. La cadena contra el acto 1.
El prompt contra su última frase. El velo contra el salto de alfa en píxeles. El QR
contra la URL guardada al lado. El SVG contra el parser antes de rasterizar. El banner
contra sus dos esquinas y su centro, para que un rectángulo negro no pueda salir a
pantalla diciendo ser una forma.

Lo presentable es consecuencia y no causa: la L se ve bien **porque** se midió que el
zapato estaba afuera y que el velo se sumaba en el codo.

## Alcance

**Sólo `.project/`.** Esta fase no escribe una línea fuera de ahí.

1. **La lectura del día**, sacada de los once mensajes de commit y de las dos fuentes
   de código que contienen las calibraciones, y no de un relato de segunda mano.
2. **Seis ADR nuevos, del 0057 al 0062**, uno por cada decisión que alguien rompería
   dentro de dos meses por no saber por qué es así.
3. **Una generalización**: el ADR 0062 generaliza al 0045, con la relación escrita en
   los dos lados y una nota fechada en el viejo. Es la primera del proyecto.
4. **El informe de cierre**, con lo que el día midió y lo que dejó abierto.

## Fuera de alcance

- **`demo/` y todo lo que no sea `.project/`.** La sesión `hls-demo` está trabajando
  ahí ahora mismo. Los commits van con paths explícitos porque el índice de git es
  compartido, y hoy eso ya salvó a dos sesiones.
- **No se revisa ni se corrige el trabajo de los once commits.** Está medido y
  verificado en pantalla por quien lo hizo; esta fase lo documenta y no lo audita. Si
  al leerlo hubiera aparecido un defecto, era un hallazgo para reportar.
- **No se reescribe el README de la T-03 de la fase 08.** Ya tiene su nota fechada, y
  la regla B de `knowledge/documentation-policy.md` dice por qué el bloque original
  queda en pie: es un registro de qué se corrió, no una instrucción viva.
- **No se decide nada sobre el trabajo que sigue.** El estado de la L animada y si su
  empaquetado a 24 quedó verificado son de la sesión que lo está haciendo.
- **Un ADR por commit.** Sería el nivel equivocado: no todo lo medido es una
  decisión. Cuatro cosas del día quedaron adentro de este documento o del informe en
  lugar de convertirse en ADR, y el diseño dice cuáles y por qué.

## Riesgos

**R1. Un ADR que afirma un número que no es.** Es el riesgo propio de esta fase y es
de la misma familia que todo lo que la fase documenta: una afirmación que nadie compara
contra la fuente. Un número equivocado en un ADR se lee como cierto durante meses.

*Mitigación, y se ejecutó:* cada cifra que entró en un ADR se trazó al mensaje de
commit o al script que la contiene, y no al relato con el que llegó. **Encontró una
diferencia real** — ver el informe, sección 5.

**R2. Escribir gobierno sobre trabajo ajeno y afirmar de más.** Casi todo lo del día lo
hizo otra sesión, así que el riesgo es documentar una intención que nadie tuvo.

*Mitigación:* lo que no estaba en un commit ni en el código se preguntó directo por el
canal a `hls-demo`, y lo que quedó sin respuesta quedó escrito como no verificado en
lugar de completado por inferencia.

**R3. El índice de git compartido.** Otra sesión trabajando en el mismo árbol.

*Mitigación:* `git commit -- .project/`, siempre, nunca `git add .`.

## Quién

- **`hls-demo`** hizo el trabajo de los once commits y midió todo lo que esta fase
  cita. Es la fuente.
- **`hls-f08`** dejó ocho archivos sin commitear y no volvió a responder. Nicolás
  autorizó adoptarlos, y el commit que los adopta lo dice en su primer párrafo en
  lugar de dejarlo en el diff.
- **Nicolás** eligió la plantilla de la L, pidió que los avisos floten y marcó la
  cuarta frase de la apertura.

## Arquitectura del producto

El proyecto no tiene `docs/arc42/` y esta fase no lo crea, por la misma razón que las
dos anteriores. Y **esta fase no toca `docs/`**: los dos documentos de ahí describen la
librería y su contrato, y los once commits son de la demo. Nada de lo que dicen se
volvió falso.
