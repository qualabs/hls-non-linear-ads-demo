<?xml version="1.0" encoding="UTF-8"?>
<!--
  KALTO, LA CAPA DE TIPOGRAFÍA de la L: todo lo que tiene que quedar legible. Va encima
  del fondo y NO pasa por el generador, que es la razón entera de que las capas estén
  partidas (ADR 0045). El QR es el caso extremo de esa regla: pasado por Veo es un QR
  que no escanea, y eso es peor que no tener QR.

  UN SOLO VELO CON FORMA DE L, Y NO DOS RECTÁNGULOS. La versión anterior oscurecía con
  un rectángulo por banda, y eso tenía dos defectos que son de la forma y no de los
  valores. El de abajo terminaba de golpe donde se le acababa el ancho: medido sobre el
  creativo de producción, un salto de alfa de 180 sobre 255 en un solo píxel, que es el
  corte que se veía. Y donde los dos se pisaban las opacidades se componían, así que el
  codo quedaba en 231 contra 192 y 158 de cada banda por separado. Encima, del lado
  derecho la banda inferior se quedaba SIN VELO (alfa 0), o sea que ahí la tipografía no
  tenía nada que la despegara del fondo.

  Acá las dos rampas cubren el cuadro entero y se combinan con `lighten`, o sea con el
  MÁXIMO de las dos y no con la suma: no hay borde donde una termina ni oscurecimiento
  extra donde se cruzan. Medido: salto máximo 1 sobre 255, y el codo igual que las dos
  bandas.

  LA OPACIDAD DEL VELO ES UN EQUILIBRIO Y POR ESO ESTÁ ACÁ Y NO ESCONDIDA. Con el velo
  cubriendo el codo de verdad, el velo y el producto pelean, porque el zapato vive
  justo ahí. A 0,90 el zapato queda en 30 de luminancia; a 0,55 queda en 41 y la
  tipografía sigue despegada del fondo. Si hiciera falta más contraste, se sube acá.

  LOS TRES ELEMENTOS DE LA BANDA INFERIOR COMPARTEN UN EJE, y los centros se calculan en
  `l-capas.sh` desde el alto de la banda en lugar de escribirse a mano. Tres objetos a
  distinta altura se leen como tres cosas tiradas; sobre un eje se leen como una fila.
  El pie de página se centra en el hueco que le queda ENTRE el zapato y la leyenda, no
  en el cuadro: centrado en el cuadro, el zapato lo corre y queda pegado a la izquierda.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="rampaIzq" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"    stop-color="#ffffff"/>
      <stop offset="0.16" stop-color="#dcdcdc"/>
      <stop offset="0.30" stop-color="#6e6e6e"/>
      <stop offset="0.40" stop-color="#000000"/>
      <stop offset="1"    stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="rampaPie" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0"    stop-color="#ffffff"/>
      <stop offset="0.18" stop-color="#c8c8c8"/>
      <stop offset="0.32" stop-color="#5a5a5a"/>
      <stop offset="0.44" stop-color="#000000"/>
      <stop offset="1"    stop-color="#000000"/>
    </linearGradient>
    <mask id="veloL">
      <rect x="0" y="0" width="1280" height="720" fill="url(#rampaIzq)"/>
      <rect x="0" y="0" width="1280" height="720" fill="url(#rampaPie)" style="mix-blend-mode:lighten"/>
    </mask>
  </defs>

  <rect x="0" y="0" width="1280" height="720" fill="#0b0f15" opacity="{{VELO}}" mask="url(#veloL)"/>

  <text x="{{MG}}" y="{{M1}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSM}}"
        font-weight="700" letter-spacing="{{LSM}}" fill="#f6f8f9">KALTO</text>
  <text x="{{MG2}}" y="{{M2}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSS}}"
        letter-spacing="{{LSS}}" fill="#ffb84d">RUN LONGER</text>

  <rect x="{{MG}}" y="{{RY}}" width="{{RW}}" height="2" fill="#ffb84d" opacity="0.85"/>

  <text x="{{MG}}" y="{{A1}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSA}}"
        font-weight="700" fill="#f6f8f9">The 41st</text>
  <text x="{{MG}}" y="{{A2}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSA}}"
        font-weight="700" fill="#f6f8f9">kilometre</text>
  <text x="{{MG2}}" y="{{A3}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSC}}"
        letter-spacing="0.5" fill="#c3ccd6">is the one</text>
  <text x="{{MG2}}" y="{{A4}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSC}}"
        letter-spacing="0.5" fill="#c3ccd6">we built it for.</text>

  <!-- El descuento y no sólo el precio: un descuento explica por qué el aviso está ahí
       ahora, que es el argumento que esta demo existe para hacer. La marca es de
       fantasía y el número es redondo: no imita el precio de ningún producto real. -->
  <text x="{{MG2}}" y="{{P1}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSPK}}"
        letter-spacing="3.6" fill="#ffb84d">THIS WEEK</text>
  <text x="{{MG}}" y="{{P2}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSP}}"
        font-weight="700" fill="#f6f8f9">$149</text>
  <text x="{{MG2}}" y="{{P3}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSPV}}"
        fill="#8d97a6" text-decoration="line-through">$199</text>

  <text x="{{PIEX}}" y="{{PIEY}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSPIE}}"
        letter-spacing="1" text-anchor="middle" fill="#f6f8f9">Cushioning that is still there at the end.</text>

  <!-- El QR lleva al repositorio de este proyecto, que es una dirección real: un QR que
       no lleva a ningún lado es una mentira en una demo que se muestra a ingenieros. La
       leyenda lo dice en voz alta en vez de hacerlo pasar por una promesa de la marca
       inventada. La matriz vive en `qr-github.txt`, con la URL al lado. -->
  <text x="{{LEYX}}" y="{{LEY1}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSLEY}}"
        letter-spacing="3" text-anchor="end" fill="#8d97a6">HOW THIS AD WORKS</text>
  <text x="{{LEYX}}" y="{{LEY2}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSLEY}}"
        letter-spacing="1" text-anchor="end" fill="#8d97a6">github.com/qualabs</text>

  {{QR}}
</svg>
