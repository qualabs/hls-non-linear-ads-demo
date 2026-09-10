<?xml version="1.0" encoding="UTF-8"?>
<!--
  KALTO, LA CAPA PICTÓRICA de la L. Sin una letra: la tipografía va en
  l-tipografia.svg.tpl y se compone encima. La división es el ADR 0045 hecho
  estructura, y acá tiene una razón de más: este archivo es el CUADRO SEMILLA de la
  generación. Veo recibe esta imagen como primer cuadro y la anima, así que todo lo que
  esté dibujado acá el modelo lo va a re-dibujar cuadro a cuadro. Una tipografía adentro
  de la semilla vuelve deformada; afuera, queda exacta.

  ACÁ NO HAY MÁSCARA, Y ÉSA ES LA VERSIÓN QUE FUNCIONA. Durante un día entero esta capa
  desvaneció el borde de una foto 3:2 metida en un aviso 16:9, primero por un lado y
  después con una elipse. Toda máscara ahí era un parche sobre el problema de fondo: la
  foto traía su propio fondo de estudio, de otro tono que el campo del aviso, así que
  siempre había un borde que ocultar. La imagen de ahora se generó CON EL ENCUADRE DEL
  AVISO —el campo oscuro es parte de la imagen— y entonces no hay nada que desvanecer.
  Medido sobre el perímetro del cuadro, sin ninguna máscara: el salto de luminancia
  máximo es de 2 a 4 sobre 255, contra los 180 que llegó a tener el velo viejo.

  Y EL TAMAÑO DEL ZAPATO NO SE LE PIDE AL GENERADOR, SE CALCULA. Pedido al 25 % del
  ancho volvió al 44 %; pedido más fuerte, al 55 %. El modelo no obedece un número. La
  imagen se coloca a escala sobre un campo del MISMO negro que ella trae, así que el
  borde de la colocación no puede verse —es negro contra el mismo negro, medido en 0 y 1
  sobre 255— y el zapato queda exactamente en los 264 px que la plantilla pide. Es el
  reparto del ADR 0045 aplicado un paso más allá: al generador se le pide lo que sólo él
  puede hacer, y la geometría la hace un script.

    banda izquierda:  0 .. {{L}} px          banda inferior:  {{T}} .. 720 px

  Los dos números salen del asset list (la caja del primario vista del otro lado) y los
  sustituye `l-capas.sh`, nunca se escriben acá.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect x="0" y="0" width="1280" height="720" fill="{{CAMPO}}"/>
  <image href="{{FOTO}}" x="0" y="{{FY}}" width="{{FW}}" height="{{FH}}"
         preserveAspectRatio="xMidYMid meet"/>
</svg>
