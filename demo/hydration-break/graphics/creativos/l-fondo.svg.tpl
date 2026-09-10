<?xml version="1.0" encoding="UTF-8"?>
<!--
  KALTO, LA CAPA PICTORICA de la L. Sin una letra: la tipografia va en
  l-tipografia.svg.tpl y se compone encima. La division es el ADR 0045 hecho
  estructura, y aca tiene una razon de mas: este archivo es el CUADRO SEMILLA de la
  generacion. Veo recibe esta imagen como primer cuadro y la anima, asi que todo lo
  que este dibujado aca el modelo lo va a re-dibujar cuadro a cuadro. Una tipografia
  adentro de la semilla vuelve deformada; afuera, queda exacta.

  LA L ES UNA SOLA IMAGEN QUE DOBLA LA ESQUINA, y esta version existe por eso. La
  anterior eran dos paneles con tratamientos distintos y un filete horizontal de lado
  a lado justo en el codo: el ojo leia "dos barras que se tocan" en lugar de "una L".
  Aca el campo es UNO, un solo degrade sobre el viewport completo , y no hay ninguna
  linea, ningun cambio de tono y ninguna costura en el codo.

  Y LA FOTO NO VA PEGADA. Antes era un rectangulo recortado a la banda inferior, y el
  borde del rectangulo se veia: la imagen no era continua con el fondo. Aca la foto
  entra con una mascara que la desvanece por arriba y por la izquierda, asi que se
  asienta en el campo en lugar de estar encima de el. Es la misma idea que el alfa del
  banner, aplicada adentro del creativo.

    banda izquierda:  0 .. {{L}} px          banda inferior:  {{T}} .. 720 px

  Los dos numeros salen del asset list (la caja del primario vista del otro lado) y
  los sustituye creativos.sh, nunca se escriben aca.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <!-- UN SOLO CAMPO para el viewport entero. La diagonal del degrade cruza el codo,
         que es lo que hace que la banda izquierda y la inferior sean la misma cosa. -->
    <linearGradient id="campo" x1="0" y1="0" x2="0.85" y2="1">
      <stop offset="0"    stop-color="#171d27"/>
      <stop offset="0.38" stop-color="#0e131a"/>
      <stop offset="0.72" stop-color="#0b0f15"/>
      <stop offset="1"    stop-color="#191f2a"/>
    </linearGradient>

    <!-- El halo tibio detras del producto, que es lo que da profundidad al codo sin
         dibujar un borde. -->
    <radialGradient id="halo" cx="0.62" cy="0.86" r="0.55">
      <stop offset="0"   stop-color="#ffb84d" stop-opacity="0.16"/>
      <stop offset="0.6" stop-color="#ffb84d" stop-opacity="0.04"/>
      <stop offset="1"   stop-color="#ffb84d" stop-opacity="0"/>
    </radialGradient>

    <!-- LA MASCARA DE LA FOTO. Blanco es opaco y negro transparente: la foto llega
         entera por abajo y por la derecha, y se desvanece hacia arriba y hacia la
         izquierda, donde vive la tipografia. Sin bordes rectos a la vista. -->
    <linearGradient id="desdeArriba" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="#000000"/>
      <stop offset="0.34" stop-color="#4a4a4a"/>
      <stop offset="0.62" stop-color="#ffffff"/>
      <stop offset="1"    stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="desdeIzquierda" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"    stop-color="#000000"/>
      <stop offset="0.30" stop-color="#000000"/>
      <stop offset="0.58" stop-color="#c8c8c8"/>
      <stop offset="0.85" stop-color="#ffffff"/>
    </linearGradient>
    <mask id="asentar">
      <rect x="0" y="0" width="1280" height="720" fill="url(#desdeArriba)"/>
      <rect x="0" y="0" width="1280" height="720" fill="url(#desdeIzquierda)"
            style="mix-blend-mode:multiply"/>
    </mask>
  </defs>

  <rect x="0" y="0" width="1280" height="720" fill="url(#campo)"/>
  <rect x="0" y="0" width="1280" height="720" fill="url(#halo)"/>

  <!-- El producto, asentado con la mascara. Grande y bajo: lo que se ve del aviso es
       la banda inferior y la izquierda, asi que el zapato vive ahi y no en el centro,
       que el partido va a tapar. -->
  <g mask="url(#asentar)">
    <image href="{{FOTO}}" x="{{FX}}" y="{{FY}}" width="{{FW}}" height="{{FH}}"
           preserveAspectRatio="xMidYMid slice"/>
  </g>
</svg>
