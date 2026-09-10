# Traza de cada cifra a su fuente — T-01 de la fase 10

Registro de lo que se verificó el 2026-09-10. No es instrucción vigente.

Cada número que entró en un ADR de esta fase, con el archivo donde se puede señalar.
Es lo que el nivel `alto` pide y lo único que pide que acá aplique: contrastar contra
una fuente independiente del relato con el que el dato llegó.

| cifra | dónde vive | ADR |
| --- | --- | --- |
| cuadro 168 de 192 (la semilla) | commit `2cf1b6f` | referenciada, ADR 0044 |
| las siete costuras viejas: 24,17 / 32,37 / 27,21 / 25,59 / 32,04 / 25,67 / 35,15 | commit `2cf1b6f` | informe |
| paso interno 3,5 a 7,4 | `verificar-plate.sh`, encabezado | 0058 |
| ruido de costura medido solo: 3,6 a 6,9 | `verificar-plate.sh`, encabezado | 0058 |
| mediana 3,3 en la parada y 7 en el juego | `verificar-plate.sh`, encabezado | 0058 |
| costura sana ~1x; de 2x avisa (`<-- alta`), de 3x manda a mirar (`<== MIRALA`) | `verificar-plate.sh`, y confirmado por `hls-demo` | 0058 |
| las siete costuras entre 1,07x y 1,90x, con la cadena regenerada | commit `2cf1b6f` | informe |
| las siete costuras entre 1,00x y 1,84x, en el plate final | `hls-demo`, preguntado por el canal | 0058 |
| la L animada: 8 segmentos a 24 fps, y el zapato en rotación distinta en los segundos 33 y 45 | `hls-demo`, preguntado por el canal | 0059 |
| el primario reempaquetado: 91,70 s contra 92, o sea los siete cuadros | `hls-demo`, preguntado por el canal | 0059 |
| cadena sana: 22,7 / 23,4 / 23,8 / 25,8 / 27,9 / 30,8 | commit `9d7a1c5` y `verificar-cadena.sh` | 0058 |
| un umbral fijo en 28 habría marcado el sexto | `verificar-cadena.sh` línea 26 | 0058 |
| saltos sanos nunca sobre +3,3; fundido +29,3; el que se fue +51 | commit `9d7a1c5` y `verificar-cadena.sh` línea 30 | 0058 |
| el umbral es un salto de 10 | `verificar-cadena.sh` línea 30 | 0058 |
| el eslabón del fundido: 3,1 a 6,0 de punta a punta, costura 1,9x | commit `9d7a1c5` | 0057 |
| tres momentos por eslabón: 30,8 a los 2 s y 57,2 a los 4 s | commit `9d7a1c5` | 0057 |
| la L: paso interno 0,6 y costura 3,0 | commit `2c39061` | 0058 |
| 192 cuadros en 8,00 s, o sea 24 fps | commits `2cf1b6f` y `80cb698` | 0059 |
| el velo viejo: salto de alfa 180/255 en un píxel | commit `8cc2459` | 0060 |
| el codo en 231 contra 192 y 158 | commit `8cc2459` | 0060 |
| el velo nuevo: salto máximo 1/255 | commit `8cc2459` | 0060 |
| opacidad 0,55 | commit `8cc2459` | 0060 |
| el zapato: 20 px tapados de 458, 251 afuera, 41 % visible | commit `8cc2459` | informe |
| el resplandor: 57,2 a 79,6 de luz media | commit `2c39061` | 0061 |
| los cuatro intentos: 87 %, 68 %, 16 %, 8 % | commit `2c39061` | 0061 |
| movimiento medio entre cuadros 0,68 | commit `2c39061` | informe |
| las bandas: de 512 y 288 px a 333 y 187 px | commit `9c95bdf` | informe |
| el aviso de esquina: 265x149 px, relación 1,778 | commit `3424ce5` | informe |
| el salto de luminancia del borde de la foto: 2 a 5 / 255 | commit `8cc2459` | 0060 |


## La diferencia que el contraste encontró

El hallazgo de los umbrales llegó relatado así:

> el rango **3,5-6,0** que había sido calibrado sobre pasos internos no es la
> magnitud correcta para una costura entre dos generaciones, y se propuso **7,0**
> para costura.

**No es lo que quedó en el código**, y la diferencia no es de detalle:

| lo relatado | lo que dice `verificar-plate.sh` |
| --- | --- |
| paso interno 3,5 a **6,0** | paso interno 3,5 a **7,4** |
| — | el ruido de la costura **se mide solo**: último cuadro contra cuadro 0 del siguiente, el mismo instante dibujado dos veces, y da **3,6 a 6,9** |
| se propuso **7,0 para costura** | **no hay umbral de costura.** Lo que quedó es la **razón contra la mediana de los 24 cuadros vecinos**, que vuelve las dos calibraciones **una sola regla**: sana ~1x y hasta 2x, de 3x se mira con el ojo |

La versión real es mejor que la relatada, y por eso valía ir a buscarla: un segundo
umbral absoluto habría heredado el defecto del primero —un número que depende de
cuánto se mueve la escena— mientras que la razón lo elimina.

**Y la diferencia es del mismo hilo que la fase entera**: un número correcto para lo
que se midió, viajando aplicado a otra cosa. El relato ya había viajado una vez.


## Y una segunda corrección, ésta a la mía

Le mandé la corrección de arriba a `hls-demo` antes de escribir el ADR, para que la
revisara quien la había medido. Confirmó los tres puntos y **corrigió un cuarto número
que yo había tomado del encabezado del script y leído de menos**:

- El veredicto tiene **dos escalones y no uno**: de **2x** el script avisa
  (`<-- alta`) y de **3x** manda a mirarla con el ojo (`<== MIRALA`). Yo lo había
  escrito como un solo corte en 3x.
- Y el rango de las siete costuras internas **en el plate final** es **1,00x a 1,84x**.
  El 1,07x a 1,90x del commit `2cf1b6f` es de un momento anterior, con la cadena recién
  regenerada y antes del reempaquetado. Los dos son ciertos y son de momentos
  distintos, así que el ADR usa el final y acá quedan los dos con su fecha.

Vale anotarlo y no sólo arreglarlo: **la traza contra la fuente me sacó un error
ajeno y me dejó uno propio**, y el que lo encontró fue quien lo había medido. Es el
argumento entero de por qué esta task pregunta en lugar de deducir.
