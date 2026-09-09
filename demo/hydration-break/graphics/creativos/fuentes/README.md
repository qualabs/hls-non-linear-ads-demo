# fuentes/ — lo pictórico generado, y está en git a propósito

Tres archivos, y son la mitad de cada creativo que el ADR 0045 manda generar: el fondo
pictórico. La otra mitad —la geometría y toda la tipografía— son los SVG de la carpeta de
arriba.

| archivo | qué es | cómo se generó |
| --- | --- | --- |
| `kalto-shoe.jpg` | la zapatilla de KALTO, 1264×848 | `agy` con `generate_image`, proporción 3:2 |
| `meridia-coast.jpg` | la costa de MERIDIA, 1376×768 | `agy` con `generate_image`, proporción 16:9 |
| `neonectar-8s.mp4` | el spot de NEONECTAR, 8 s, 1920×1080, 24 fps, sin audio | Veo `veo-3.1-fast-generate-001`, tomando una imagen fija como primer cuadro |

## Por qué están versionados, cuando todo `content/` no lo está

`content/` está gitignoreado porque **se puede reconstruir**: el plate se baja de Pexels y
el empaquetado es determinista. Esto no. **Una generación no se repite: el mismo prompt
devuelve otra imagen y otro video.** Un `.gitignore` sobre estos archivos convertiría la
demo en algo que sólo corre en la máquina donde se generaron, y la demo se graba y se
muestra desde otro lado.

Es el mismo criterio que `brand/README.md`: copias, no links. El costo son 25 MB de mp4 en
git, y se paga una vez.

## Las tres marcas son de fantasía

**NEONECTAR**, **KALTO**, **MERIDIA**. Ninguna imita el vestido comercial de una marca
real, y eso no se confía al prompt: **está medido que el generador deriva hacia marcas
reales incluso cuando se le prohíbe explícitamente.** El chequeo humano de cada pieza está
escrito en la evidencia de la T-05 de la fase 08.
