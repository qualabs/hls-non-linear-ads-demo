<?xml version="1.0" encoding="UTF-8"?>
<!--
  KALTO, el aviso de la L, Y ES UN SOLO VIDEO A CUADRO ENTERO.

  ASÍ ES COMO LA INDUSTRIA AUTORA UNA L, y no como dos tiras. El aviso ocupa el
  viewport completo y va AL FONDO; el contenido primario se encoge, mantiene su
  relación de aspecto, se ancla contra los bordes superior y derecho, y va ARRIBA.
  Lo que el espectador percibe es una banda en forma de L; lo que hay es un video
  entero con el partido encima tapándole el centro y la esquina.

  El contrato ya nombraba esta forma sin que hubiera que pedirle nada: su regla 2
  dice que en `squeezebackFrame` "el aviso está en zDepth 0 y el contenido
  primario en 1, o sea que el aviso es el fondo", y su regla 3 dice que el
  primario es un elemento del layout como cualquier otro, con su caja y su
  zDepth.

  ESTE ARCHIVO ES UNA PLANTILLA Y NO UN SVG, y ésa es la parte que importa. Los
  dos números de abajo —dónde termina la banda izquierda y dónde empieza la
  inferior— son la caja del primario vista del otro lado, así que **salen del
  asset list y no se escriben acá**: `scripts/creativos.sh` los sustituye. Si el
  viewport del primario cambia y estos números no, el creativo queda con
  tipografía debajo del partido o con una franja negra al costado, y no falla
  nada.

    banda izquierda:  0 .. {{L}} px          banda inferior:  {{T}} .. 720 px
-->
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0"   stop-color="#141922"/>
      <stop offset="0.6" stop-color="#0c1016"/>
      <stop offset="1"   stop-color="#161b24"/>
    </linearGradient>
    <!-- La foto vive en la banda inferior, que es la más ancha de las dos. -->
    <clipPath id="franjaInferior"><rect x="0" y="{{T}}" width="1280" height="{{TH}}"/></clipPath>
  </defs>

  <rect x="0" y="0" width="1280" height="720" fill="url(#fondo)"/>

  <!-- La zapatilla, recortada a la banda inferior y corrida a la derecha, para que
       no pelee con la tipografía de la esquina inferior izquierda. -->
  <g clip-path="url(#franjaInferior)">
    <image href="{{FOTO}}" x="470" y="{{FY}}" width="880" height="{{FH}}"
           preserveAspectRatio="xMidYMid slice" opacity="0.95"/>
  </g>

  <!-- El acento marca el codo de la L, que es lo que hace que se lea como una
       banda y no como dos rectángulos que se tocan. -->
  <rect x="0" y="{{T}}" width="1280" height="3" fill="#ffb84d"/>
  <rect x="{{LM3}}" y="0" width="3" height="{{T}}" fill="#ffb84d" opacity="0.55"/>

  <!-- La marca, arriba en la banda izquierda. -->
  <text x="44" y="86" font-family="Lato, DejaVu Sans, sans-serif" font-size="54"
        font-weight="700" letter-spacing="10" fill="#f6f8f9">KALTO</text>
  <text x="47" y="124" font-family="Lato, DejaVu Sans, sans-serif" font-size="18"
        letter-spacing="4.6" fill="#ffb84d">RUN LONGER</text>

  <!-- El argumento, abajo en la banda izquierda, donde queda aire de sobra. -->
  <text x="44" y="{{ARG1}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="30"
        font-weight="700" fill="#f6f8f9">The 41st</text>
  <text x="44" y="{{ARG2}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="30"
        font-weight="700" fill="#f6f8f9">kilometre</text>
  <text x="46" y="{{ARG3}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="17"
        letter-spacing="0.6" fill="#c3ccd6">is the one we built it for.</text>

  <!-- Y el cierre, en la banda inferior. -->
  <text x="44" y="{{PIE}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="21"
        letter-spacing="1.1" fill="#f6f8f9">Cushioning that is still there at the end.</text>
</svg>
