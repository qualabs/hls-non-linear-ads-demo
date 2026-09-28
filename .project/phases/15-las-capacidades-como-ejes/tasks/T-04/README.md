# T-04 — la verificación de las cuatro combinaciones

Medido el 2026-09-28 con el servidor de la tarea en el puerto 8093 y las mediciones de la fase 14
en el 8094 y el 8095, todas bajadas por su PID.

| archivo | qué prueba | resultado |
| --- | --- | --- |
| `inspect-verificar-capacidades.txt`, `index-verificar-capacidades.txt` | `test/verificar-capacidades.py`: los parámetros del pedido, el cuerpo idéntico en las cuatro combinaciones y la composición de cada una en A (sin default) y B (con default) | VERDE en las dos páginas. 4 queries distintas; un cuerpo por break, distinto entre breaks (control); 8/8 composiciones como manda el ADR 0085; 3 composiciones distintas en B (control) |
| `*-break-*-1907.png`, `*-400.png` | las capturas de cada combinación en A y en B | mirar |
| `tramo.txt` | `test/medir-tramo-invertido.py` sobre el banco, B y C | VERDE: <0,03 s; el control da 12 s |
| `medir-tramo-en-el-par.txt` | lo mismo sobre `index.html` | VERDE: <0,08 s; el control da 12 s |
| `verificar-inspect.txt` | lo que `inspect.html` muestra está leído y no transcripto | VERDE, con el control de mover la fuente |
| `medir-enlace-de-barras.txt` | las dos barras del par siguen atadas (casos de la trampa movidos de A a C, que ahora es el que tiene lineal) | VERDE, y el control sin enlace los deja separados |

Lo que se ve en las capturas, por combinación:

| declarado | break A (sin default) | break B (con default) |
| --- | --- | --- |
| 2 decodificadores, imágenes sí o no | la opción de video | la opción de video |
| 1 decodificador, imágenes sí | la opción de imagen | la opción de imagen |
| 1 decodificador, imágenes no | nada: el programa sigue | el lineal a cuadro entero |
