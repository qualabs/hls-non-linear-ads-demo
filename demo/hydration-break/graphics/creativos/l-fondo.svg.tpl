<?xml version="1.0" encoding="UTF-8"?>
<!--
  KALTO, LA CAPA PICTÓRICA de la L. Sin una letra: la tipografía va en
  l-tipografia.svg.tpl y se compone encima. La división es el ADR 0045 hecho
  estructura, y acá tiene una razón de más: este archivo es el CUADRO SEMILLA de la
  generación. Veo recibe esta imagen como primer cuadro y la anima, así que todo lo que
  esté dibujado acá el modelo lo va a re-dibujar cuadro a cuadro. Una tipografía adentro
  de la semilla vuelve deformada; afuera, queda exacta.

  LA L ES UNA SOLA IMAGEN QUE DOBLA LA ESQUINA. Un único degradé sobre el viewport
  completo, con la diagonal cruzando el codo: no hay ninguna línea, ningún cambio de
  tono y ninguna costura donde las dos bandas se juntan.

  EL ZAPATO VIVE EN EL CODO, y esa posición es una decisión medida. Antes se colocaba
  con constantes colgadas de `T` que no salían de ningún lado: con las bandas al 26 % el
  zapato quedaba con el **55 % de su alto fuera del cuadro** y sólo el 41 % visible, y no
  porque el partido lo tapara —el partido le cubría el 4 %— sino porque la foto,
  entera, medía más que la banda. El codo es el área contigua más grande que la L tiene,
  y es lo único que permite darle superficie al producto sin achicar el partido. Ahora
  la colocación se calcula desde la caja del zapato adentro de la foto, así que el
  zapato **entra entero** cualquiera sea el ancho de las bandas.

  LA MÁSCARA ES ELÍPTICA Y ESTÁ CENTRADA EN EL ZAPATO. La foto trae su propio fondo de
  estudio, de otro tono que el campo del aviso, y desvanecerla de un solo lado dejaba los
  bordes de los costados a la vista como un rectángulo más claro. La elipse llega al
  borde MÁS LEJANO de la foto en cada eje, así que la foto se apaga antes de terminar y
  no hay ningún borde recto. Medido: el salto de luminancia en los bordes de la foto
  queda entre 2 y 5 sobre 255, o sea invisible.

    banda izquierda:  0 .. {{L}} px          banda inferior:  {{T}} .. 720 px

  Los dos números salen del asset list (la caja del primario vista del otro lado) y los
  sustituye `l-capas.sh`, nunca se escriben acá.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="campo" x1="0" y1="0" x2="0.85" y2="1">
      <stop offset="0"    stop-color="#171d27"/>
      <stop offset="0.38" stop-color="#0e131a"/>
      <stop offset="0.72" stop-color="#0b0f15"/>
      <stop offset="1"    stop-color="#191f2a"/>
    </linearGradient>

    <!-- El halo tibio detrás del producto, centrado donde el producto está. -->
    <radialGradient id="halo" cx="{{HALOX}}" cy="{{HALOY}}" r="0.42">
      <stop offset="0"   stop-color="#ffb84d" stop-opacity="0.17"/>
      <stop offset="0.6" stop-color="#ffb84d" stop-opacity="0.05"/>
      <stop offset="1"   stop-color="#ffb84d" stop-opacity="0"/>
    </radialGradient>

    <!-- Blanco es opaco y negro transparente. La meseta cubre el zapato entero y el
         desvanecido termina justo en el borde más lejano de la foto. -->
    <radialGradient id="asentarG" gradientUnits="userSpaceOnUse"
      cx="{{ZCX}}" cy="{{ZCY}}" r="{{ZRX}}"
      gradientTransform="translate({{ZCX}} {{ZCY}}) scale(1 {{ZKY}}) translate(-{{ZCX}} -{{ZCY}})">
      <stop offset="0"          stop-color="#ffffff"/>
      <stop offset="{{ZMESETA}}" stop-color="#ffffff"/>
      <stop offset="1"          stop-color="#000000"/>
    </radialGradient>
    <mask id="asentar">
      <rect x="0" y="0" width="1280" height="720" fill="url(#asentarG)"/>
    </mask>
  </defs>

  <rect x="0" y="0" width="1280" height="720" fill="url(#campo)"/>
  <rect x="0" y="0" width="1280" height="720" fill="url(#halo)"/>

  <g mask="url(#asentar)">
    <image href="{{FOTO}}" x="{{FX}}" y="{{FY}}" width="{{FW}}" height="{{FH}}"
           preserveAspectRatio="xMidYMid slice"/>
  </g>
</svg>
