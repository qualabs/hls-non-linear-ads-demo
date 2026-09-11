# Cómo se mide el material de audio, y dónde engaña cada medición

Tres chequeos que se usaron para decidir qué material entraba a esta demo, **con el caso
que mostró el límite de cada uno**. Están juntos porque son la misma familia: los tres
fallan de la misma manera, midiendo una propiedad y contestando otra pregunta.

Dos reglas de método valen para los tres:

- **Normalizar a −23 LUFS antes de medir.** Sin eso, el nivel al que se grabó decide el
  veredicto y no el contenido.
- **Restar la media antes de autocorrelar.** Sin eso todo sale periódico.

## 1. La sonoridad descarta, no acepta

Una toma demasiado baja no sirve de cama y eso se ve en un número. Pero pasar el piso no
dice **qué** es lo que suena. Cuatro clases de material completamente distintas:

| material | sonoridad integrada |
| --- | ---: |
| voz sintetizada | −18,3 LUFS |
| música generada | −23,6 a −24,8 LUFS |
| tribuna real | −26,8 LUFS |

Las tres pasan. **Un chequeo que aprueba a las tres no está eligiendo entre ellas**, y
usarlo como si lo hiciera es confundir "se oye" con "es lo que buscábamos".

## 2. El espectro no separa una tribuna de la música, y engaña al revés

La intuición dice que una multitud es de banda ancha y la música se cae en los agudos.
**Medido a igual sonoridad, es al revés.**

| material a −23 LUFS | 200 Hz – 2 kHz | 2 – 6 kHz | 6 – 16 kHz |
| --- | ---: | ---: | ---: |
| tribuna real | −31,6 | −34,5 | **−50,0** |
| música generada (KALTO) | −36,1 | −42,1 | **−40,9** |
| música generada (MERIDIA) | −31,5 | −48,9 | **−44,4** |
| voz sintetizada | −23,4 | −43,9 | −48,1 |

**La tribuna real tiene nueve decibeles MENOS de agudos que la música generada.** Una
multitud grabada desde las gradas está lejos y al aire libre: los agudos no llegan. Un
chequeo que exija agudos para aceptar una cama **rechaza un estadio de verdad**.

**La planitud espectral tampoco alcanza, y también apunta al revés.** Contra dos
controles —ruido blanco 0,846 y tono puro 0,004— la tribuna da **0,041** y la música
generada da **0,108 y 0,218**: la música mide *más* plana que la multitud.

**Lo que sí separa es contar picos tonales**, o sea parciales estables que sobresalen
diez decibeles de su vecindario:

| material | picos tonales |
| --- | ---: |
| CONTROL tono puro | 12 |
| CONTROL ruido blanco | **0** |
| tribuna real | **0** |
| voz sintetizada | 1 |
| música generada (KALTO) | 4 |
| música generada (MERIDIA) | 6 |

Una nota sostenida deja una parcial en el mismo lugar durante segundos. Una multitud no
tiene ninguna. **Ese conteo no depende de cuántos agudos tenga el material**, que es
exactamente lo que hacía inservibles a los otros dos.

## 3. Antes de creerle a un estadístico sobre una señal, mirá la señal

**El caso.** Una cama de 92 s armada con los 22 s completos del original pasó la prueba de
periodicidad: la autocorrelación de su energía no tenía un pico en el período del bucle.
El veredicto fue "el loop no se oye".

**Y tenía dos huecos de quince decibeles**, en el segundo 21 y en el 62, donde la tribuna
desaparece durante dos segundos. Son la entrada y la salida en fundido del archivo
original, metidas adentro del bucle.

La autocorrelación mide **si algo vuelve**. El defecto era que algo **faltaba**, y encima
duraba dos segundos de cuarenta y uno, así que casi no movió el coeficiente. El perfil de
energía segundo a segundo lo mostró de una: **15,7 dB de rango contra los 3,6 de la cama
armada sólo con el tramo estable.**

**Un resumen de noventa segundos en un número no puede distinguir "se repite" de "se
corta", y las dos se oyen.** Cuando un estadístico dice que está bien, mirar el perfil
cuesta un minuto.

---

Y esto vale para lo que está escrito acá arriba: **las tres tablas se midieron sobre el
material de esta demo**, y la segunda existe porque el criterio que reemplaza no
sobrevivió a que lo midieran de nuevo.
