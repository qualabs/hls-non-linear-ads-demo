---
id: "0023"
title: El código no lee .project/, la documentación sí lo cita
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

`.project/` es la capa de gestión del desarrollo: fases, tasks, decisiones,
evidencia. Y hoy hay código que la lee. Tres de los tests leen cinco JSON de ahí
—`m3-resultados.json` de la T-03 de la fase 01, y las mediciones de las T-02,
T-04 y T-05 de la fase 02 más la T-05 de la fase 03—, así que **si el registro se
reorganiza, `npm test` se rompe**.

Hay un segundo acoplamiento de la misma familia y de otra especie: dos tests leen
`signalling/` y uno **parsea** `scripts/senalizar-contenido.sh`. Hoy es inocuo
porque las dos carpetas están en la raíz y no son de nadie; en cuanto bajen a
`demo/<nombre>/` (ADR 0020), la suite de la sdk pasa a depender de una demo en
particular.

Y hay un tercer caso que **parece** el mismo y no lo es:
`docs/contrato-senalizacion-renderizado.md` cita un JSON de `.project/` para decir
dónde se midieron los dos defaults que la herramienta de SVTA omite. Nadie lo lee:
es la procedencia de una medición.

El origen de todo esto ya estaba diagnosticado: los tests que dependen de
`.project/` son la consecuencia de una task mal diseñada, y lo que se debería
haber hecho es que la task generara los tests con sus JSON adentro de `test/`.

## Decisión

**`test/` sólo lee `test/` y `lib/`.** La regla es una línea y no tiene
excepciones, porque una autosuficiencia "casi completa" es la forma que se
despega.

**Los fixtures se copian a `test/fixtures/`, y de ahí en adelante son del test.**
La evidencia de las fases queda intacta como registro. **No hay ningún chequeo que
compare las dos copias**: el dueño del fixture pasa a ser el test, y eso está
escrito en `test/fixtures/README.md` para que nadie agregue uno más adelante
creyendo que falta.

- `test/fixtures/mediciones/`: los cinco JSON, **con sus nombres originales**,
  porque el nombre es la procedencia. Unos 225 KB.
- `test/fixtures/asset-lists/`: los trece, completos. Se copian los trece y no un
  subconjunto porque el conjunto que los tests leen **se computa** —una función
  toma el nombre por parámetro y otra lo saca de la tabla de la corrida—, así que
  cualquier subconjunto es una adivinanza. Son unos 15 KB: filtrar cuesta más que
  copiar.
- `test/fixtures/run.json`: las cinco tandas de la corrida declaradas
  explícitamente. Reemplaza el parseo del script de señalización.

**Lo que habla de la demo se muda a la demo, y afirma sobre los archivos de la
demo.** Es un test y medio de los cuarenta y tres: `program-ranges-and-volume.test.js`
es hoy diez tests de funciones puras de la sdk, uno enteramente sobre
`senalizar-contenido.sh` y uno partido, con dos afirmaciones sobre el script y dos
sobre `kindOfClass`. Lo que habla del script baja a
`demo/<nombre>/test/` y afirma **sobre los archivos de la demo y no contra el
fixture**: que la tabla de la corrida tiene cinco filas, que el
`PLANNED-DURATION` se computa y no se tipea, que el script escribe las dos
`CLASS`, y que cada fila nombra un asset-list que existe en el `signalling/` de
la demo. No es una comparación entre las dos copias: es el chequeo de la corrida
viva, hecho con lo que la demo tiene adentro.

Ese chequeo vale la pena por evidencia propia: el `PLANNED-DURATION` escrito a
mano declaraba doce segundos de un break de cuarenta y ocho, y lo encontró la
fase 03.

**Y del otro lado de la línea: una cita a `.project/` se queda.** La diferencia
con los tests es concreta y no una distinción de vocabulario: **un test que lee
`.project/` se rompe si el registro se reorganiza, y un documento que lo cita no
se rompe con nada.** El argumento por el que los tests salen es que `.project/` es
la gestión del desarrollo y no algo de lo que dependa el código; una nota al pie
que dice dónde se hizo una medición no es código que dependa del registro, es
documentación apuntando al registro, que es para lo que el registro existe. Lo
único que se le agrega es una cláusula que diga que ese archivo es la evidencia de
una fase cerrada, para que quien siga el puntero sepa que va a un registro y no a
un archivo vivo.

Descartados:

| alternativa | por qué no |
| --- | --- |
| que `test/` lea `demo/<nombre>/` | es el cambio más chico —una ruta más larga— y clava la suite de la sdk a la primera demo: el día que llegue la segunda hay que decidir si también lee de ahí, y esa es una decisión que sale en el medio de la ejecución |
| copiar `senalizar-contenido.sh` a `test/fixtures/` | las dos afirmaciones sobre el script quedarían hablando de una copia congelada, o sea vacías |
| repuntar la cita de `docs/` a `test/fixtures/` | ese JSON no lo lee ningún test: habría que inventar un fixture para satisfacer una cita. Y la cita no quiere decir dónde hay una copia, quiere decir dónde se hizo la medición |
| un chequeo que compare el fixture con su original | es la mitad del costo aceptado abajo, y agregarlo devuelve el acoplamiento con otra forma |

## Consecuencias

**El fixture congelado deja de describir la corrida que la demo sirve el día que
la corrida cambie, y nada lo va a decir.** Es el costo y se acepta explícito, con
su compensación: lo que vigila la corrida viva es el test de la demo, que ahora
existe. Y hay una razón por la que congelar es lo correcto y no sólo lo barato:
las medidas de `test/fixtures/mediciones/` son lecturas fechadas de una corrida,
así que congelarlas junto con la corrida que describen es lo que corresponde. Una
medición separada de su corrida no significa nada.

**Cuatro asset-lists de repliegue existen dos veces**, en la demo y en
`test/fixtures/`, sin chequeo entre las copias. Residual aceptado.

**Nada de la raíz que no sea `lib/` se puede testear unitariamente desde
`test/`**, y hoy eso es `server.mjs` y los dos scripts de la sdk. Los tres se
chequean corriéndolos, que es lo que ya se hacía. Es una consecuencia real de la
regla y se acepta: la alternativa era una excepción, y una excepción es por dónde
esta regla se despegaría.

**Los comentarios de cabecera de los tres tests se quedan**, con la ruta
reescrita para que digan de dónde vino la copia. Eso es procedencia, y la política
de documentación lo llama registro.

**`npm test` no cambia.** `node --test` sin argumentos descubre recursivamente, y
está verificado en esta máquina (node v25.9.0) que una suite en `test/` y otra en
`demo/<nombre>/test/` corren las dos con un solo comando.

**La regla es de este proyecto y no del código de este repositorio nada más.** La
próxima task que mida algo y quiera un test sobre esa medición escribe el fixture
en `test/fixtures/` en la misma pasada, y guarda en `.project/` la evidencia. Es
la forma en que este acoplamiento no vuelve.
