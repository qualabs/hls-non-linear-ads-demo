# El audio de la demo

Cuatro archivos, y ninguno venía con el material. **Los clips del partido son mudos y el
spot generado también salió mudo**, así que todo lo que suena en esta demo se produjo
acá y llega al empaquetador como un archivo al lado del video.

| archivo | dónde suena | largo | nivel |
| --- | --- | --- | --- |
| `primario.m4a` | el programa, los 91,375 s | 91,375 s | −23,0 LUFS |
| `kalto.m4a` | la L, elemento `lBackplate` | 16 s | −20,0 LUFS |
| `meridia.m4a` | el overlay de esquina, elemento `overlay` | 24 s | −20,1 LUFS |
| `neonectar.m4a` | el lineal a cuadro entero | 8 s | −23,1 LUFS |

**El banner no lleva audio y eso es correcto**: es una imagen fija, y `applyAudio` ni
siquiera le pone volumen a un `<img>`.

## Por qué las dos camas concurrentes salen más calientes que el programa

Porque las atenúa el asset list. `lBackplate` declara `volume: 35` y `overlay` declara
`volume: 25`, así que salen a −29 y a −32 LUFS efectivos: **se oyen debajo del partido,
que es lo que un aviso concurrente tiene que hacer.** El lineal no lo atenúa nadie —va a
cuadro entero con el programa en 0— así que se entrega al mismo −23 del programa y no
salta al entrar.

**Sin el `volume` en el asset list no se oye ninguna**, porque un elemento del aviso sin
el campo está en silencio (ADR 0014). Un aviso necesita las dos cosas: el archivo acá y
el número allá.

## El programa: dos relatores sobre una cama de cancha

Las voces son de `gemini-2.5-flash-tts`, en `en-GB`: **Charon** hace el relato de lo que
pasa —el silbato, la entrada a la parada, la vuelta al juego, el marcador— y **Kore**
comenta —las estadísticas, por qué el partido está así—. El reparto es por función y no
por turnos: dos voces diciendo lo mismo suenan peor que una sola.

**Tres instantes atan la voz al gráfico** y no se mueven: el silbato cae 0,2 s antes de
que el marcador se convierta en HYDRATION BREAK, la vuelta al juego cae cuando el
marcador vuelve, y el marcador cantado coincide con el que está en pantalla. Los tiempos
de cada frase están en `guion.md`.

**Entre 46 y 56 s no habla nadie**, y no es un hueco: es la ventana del aviso lineal, que
declara volumen 100 contra 0 del programa. Lo que se dijera ahí no se oiría.

Las voces ocupan **52,0 s de 91,4, o sea el 57 %**. Cada línea se niveló por separado a
−20 LUFS porque las dos voces no vienen al mismo nivel: Kore sale unos 3 dB más fuerte
que Charon, y en una conversación eso no se lee como énfasis sino como que una está más
cerca del micrófono.

### El sintetizador tiene dos fallas y las dos son invisibles en el archivo

**Lee el prompt de estilo en voz alta** en lugar de tomarlo como instrucción, y **repite
una frase**. Las dos salen intermitentes: el mismo pedido sale bien al segundo intento.
Ninguna de las dos se ve en el tamaño del archivo y las dos se oyen al primer segundo.

**Por eso ninguna línea entra a la mezcla sin que una transcripción diga qué dijo.** Con
el prompt largo original, cinco de quince líneas salieron cuatro veces más largas de lo
pedido; acortarlo bajó la frecuencia pero no la eliminó. El portón atrapó una línea que
falló los cuatro intentos —se reescribió, y la nueva pasó al primero— y otra que repitió
media frase.

La duración sola no alcanza como chequeo: dice "raro", no dice qué se dijo.

### Y el nombre del equipo se escribe distinto de como se dice

Al sintetizador se le manda **"Norvick"** aunque el equipo se llame **Norvik**. Con la
`v` sola esta voz la convierte en `w` y el nombre sale sonando **Norwich**, que es un
club inglés de verdad: justo lo que un nombre inventado existe para evitar. Medido en
aislamiento, "Norvick" da *Nor-vick* y "Norwich" da */moʊ.rɪdʒ/*, que no se parecen en
nada. La sustitución vive en el generador, del lado del sintetizador, igual que el
juntador de palabras de `js/opening.js` vive del lado del navegador y no del copy.

### La cama de cancha

Una toma **grabada por Nicolás**. **Sólo 15,5 de sus 22 segundos sirven**: el archivo entra
en fundido durante los primeros 2 s y empieza a irse a los 17,5, y un bucle que incluya
un fundido lo repite en cada vuelta. Un bucle armado con los 22 s completos deja **dos
huecos de 15 dB** donde la tribuna desaparece durante dos segundos; armado sólo con el
tramo estable, el nivel se mueve **3,6 dB de punta a punta**.

Para cubrir 91 s con 15 se usan **dos capas de período distinto** —13,8 s y 11,6 s, la
segunda con los canales cambiados— más una deriva de nivel de ±1 dB muy lenta y de
período distinto en cada una. Una sola capa deja el período del bucle como **el tercer
pico más alto de toda la autocorrelación** de la energía, o sea audible; las dos capas
con deriva lo bajan a 0,20 y 0,01, y ninguno de los dos aparece entre los picos.

La cama va **12 dB debajo de las voces**. Una tribuna es fondo: si compite con el
relator, se pierden los dos.

**Es grabación propia y no hay licencia de terceros que respetar**, así que se puede
mostrar sin atribuir a nadie más.

## Las tres camas musicales

Generadas con **`lyria-002`**, que entrega 32,768 s por llamada; cada una se corta al
largo de su aviso, empezando unos segundos adentro para agarrar el tema ya armado, y
termina en un fundido de medio segundo porque un aviso se corta donde se le acaba el
tiempo y no donde la música cierra.

**Las tres son distintas a propósito.** Lo que la demo demuestra es que quien mira elige
qué escuchar, y para elegir hay que oír la diferencia: KALTO es electrónica a 126 pulsos
por minuto, MERIDIA es abierta y contemplativa a 110, NEONECTAR es corta y chispeante a
128. La primera versión de KALTO volvió *relaxed and groovy* a 108 y se descartó por eso,
no por ser mala: se parecía demasiado a MERIDIA.

**Ninguna tiene voz**, verificado pieza por pieza. Los prompts están en `guion.md`.
