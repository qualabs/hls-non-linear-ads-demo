<?xml version="1.0" encoding="UTF-8"?>
<!--
  KALTO, LA CAPA DE TIPOGRAFIA de la L. Todo transparente menos las letras y el velo
  que las sostiene: se compone con ffmpeg encima del fondo pictorico, cuadro a cuadro.

  POR QUE ESTA SEPARADA DEL FONDO, y es el ADR 0045: el fondo se GENERA y la
  tipografia se COMPONE. El fondo pictorico entra a Veo como cuadro semilla y vuelve
  animado, o sea re,dibujado cuadro a cuadro; una tipografia adentro de la semilla
  vuelve con el texto chico deformado, que es exactamente lo que ya se midio en esta
  fase. Aca las letras nunca pasan por el modelo: se pegan despues y quedan exactas.

    banda izquierda:  0 .. {{L}} px          banda inferior:  {{T}} .. 720 px

  EL LIENZO ES MAS ANGOSTO QUE ANTES. La banda paso del 40 al {{PCT}} por ciento de
  cada eje, asi que la izquierda perdio {{PERDIDO}} px de ancho. Los cuerpos y los
  interlineados de abajo estan a la medida nueva y se miraron en pantalla; cambiar el
  viewport del primario sin volver a mirarlos deja el texto saliendose de su banda.

  EL VELO existe porque la tipografia se apoya sobre video en movimiento: sin el, una
  linea de texto sobre el zapato moviendose se lee a veces. Es un degrade y no un
  rectangulo, para no volver a dibujar el borde que esta version vino a sacar.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="veloIzq" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"   stop-color="#0b0f15" stop-opacity="0.80"/>
      <stop offset="0.5" stop-color="#0b0f15" stop-opacity="0.62"/>
      <stop offset="1"   stop-color="#0b0f15" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="veloPie" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0"   stop-color="#0b0f15" stop-opacity="0.72"/>
      <stop offset="0.7" stop-color="#0b0f15" stop-opacity="0.28"/>
      <stop offset="1"   stop-color="#0b0f15" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="{{VELOW}}" height="720" fill="url(#veloIzq)"/>
  <rect x="0" y="{{T}}" width="{{VELOPIEW}}" height="{{TH}}" fill="url(#veloPie)"/>

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

  <text x="{{MG}}" y="{{PIE}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FSP}}"
        letter-spacing="1" fill="#f6f8f9">Cushioning that is still there at the end.</text>
</svg>
