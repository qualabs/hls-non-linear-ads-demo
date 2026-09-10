<?xml version="1.0" encoding="UTF-8"?>
<!-- MERIDIA, el banner inferior. Es una PLANTILLA y no un SVG: `creativos.sh` sustituye
     el tamano de la caja y la ruta de la foto, porque las dos salen del asset list y no
     de aca (el criterio del ADR 0044 aplicado a la geometria de un creativo).

     TRES COSAS QUE ESTE CREATIVO DEMUESTRA, y ninguna es estetica:

     1. ES UNA IMAGEN FIJA y no video (ADR 0046). El minuto dice que el mecanismo acepta
        las dos cosas.

     2. ES UN PNG CON ALFA REAL, y por eso su forma NO es su caja. El PNG llena la caja
        entera; lo opaco adentro es una placa inclinada, y por los bordes transparentes
        se ve el partido. Es lo que hace que un aviso pueda tener la forma que quiera y
        no la del rectangulo que se le asigno.

        JPEG NO TIENE CANAL ALFA, asi que el tipo del asset es `image/png`. Y el creativo
        NO pasa por ffmpeg: se rasteriza con Chrome directo al PNG final, porque el
        `overlay` de ffmpeg compone sobre un fondo opaco y aplana el alfa sin fallar:
        el sintoma seria un rectangulo negro donde tiene que verse la cancha.

     3. FLOTA. La caja tiene margen por los cuatro lados y no toca ningun borde, asi que
        se lee como un objeto puesto encima del partido y no como una franja pegada al
        cuadro. Lo que lo hace leer como que flota es el filete claro del contorno y la
        sombra: sin ellos, una placa oscura con aire alrededor queda flotando sin que se
        note que flota.

     LA CAJA: {{W}}x{{H}} px, que es `{{VIEWPORT}}` sobre 1280x720, con margenes de {{MX}} px
     a los costados y {{MY}} px abajo. La relacion es {{RATIO}} a 1 y el SVG se escribe a esa
     medida exacta, porque el ADR 0013 llena la caja con recorte centrado: otra relacion
     se recorta por los bordes, que es donde vive la tipografia.

     Y LA RESTRICCION DE LA BARRA DE PROGRESO YA NO APLICA. Cuando la caja llegaba al
     borde inferior, el cromo de la libreria se comia los ultimos ~44 px y nada podia
     bajar de y=170. Con la caja despegada {{MY}} px del borde, la barra queda por debajo
     del creativo: el margen resolvio de paso una restriccion que era de composicion. -->
<svg xmlns="http://www.w3.org/2000/svg" width="{{W}}" height="{{H}}" viewBox="0 0 {{W}} {{H}}">
  <defs>
    <!-- LA FORMA. Placa inclinada: el borde izquierdo y el derecho van en diagonal, asi
         que el contorno no es un rectangulo en ningun lado. La inclinacion es de {{LEAN}} px
         sobre {{H}} de alto, que a esta escala se ve de lejos; un corte de dos pixeles
         demostraria la capacidad para nadie. -->
    <clipPath id="placa">
      <path d="M {{LEAN}} 0 L {{W}} 0 L {{WL}} {{H}} L 0 {{H}} Z"/>
    </clipPath>
    <linearGradient id="velo" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"    stop-color="#0b1216" stop-opacity="0.97"/>
      <stop offset="0.46" stop-color="#0b1216" stop-opacity="0.93"/>
      <stop offset="0.80" stop-color="#0b1216" stop-opacity="0.35"/>
      <stop offset="1"    stop-color="#0b1216" stop-opacity="0.10"/>
    </linearGradient>
  </defs>

  <g clip-path="url(#placa)">
    <!-- La foto entra por la derecha y el velo la apaga hacia la izquierda, que es donde
         va la tipografia. Recortada por la misma forma que la placa. -->
    <image href="{{FOTO}}" x="{{FOTOX}}" y="-40" width="{{FOTOW}}" height="{{FOTOH}}"
           preserveAspectRatio="xMidYMid slice"/>
    <rect x="0" y="0" width="{{W}}" height="{{H}}" fill="url(#velo)"/>
    <!-- El filete de marca sobre el borde inclinado de la izquierda. -->
    <path d="M {{LEAN}} 0 L {{LEANR}} 0 L {{RULE}} {{H}} L 0 {{H}} Z" fill="#e8b04b"/>
  </g>

  <!-- EL CONTORNO, y es la mitad de por que se lee como que flota. Va con el trazo por
       adentro de la forma para que no se coma un pixel de la caja. -->
  <path d="M {{LEAN}} 0 L {{W}} 0 L {{WL}} {{H}} L 0 {{H}} Z"
        fill="none" stroke="#f6f8f9" stroke-opacity="0.62" stroke-width="3"
        clip-path="url(#placa)"/>

  <text x="{{TX}}" y="{{T1}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FS1}}"
        font-weight="700" letter-spacing="{{LS1}}" fill="#f6f8f9">MERIDIA</text>
  <text x="{{TX2}}" y="{{T2}}" font-family="Lato, DejaVu Sans, sans-serif" font-size="{{FS2}}"
        letter-spacing="{{LS2}}" fill="#e8b04b">SOMEWHERE ELSE, THIS WEEK</text>

  <g transform="translate({{BX}},{{BY}})">
    <rect x="0" y="0" width="{{BW}}" height="{{BH}}" rx="{{BR}}" fill="none" stroke="#f6f8f9"
          stroke-opacity="0.55" stroke-width="1.5"/>
    <text x="{{BWM}}" y="{{BTY}}" text-anchor="middle" font-family="Lato, DejaVu Sans, sans-serif"
          font-size="{{FS3}}" letter-spacing="2.4" fill="#f6f8f9">SEE THE FARES</text>
  </g>
</svg>
